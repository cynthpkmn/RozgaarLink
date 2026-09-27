/**
 * RozgaarLink Voice-to-Text Module
 * Supports Hindi (hi-IN), Marathi (mr-IN), and English (en-IN)
 * Includes native Web Speech API and quick voice sample chips for testing in all environments.
 */

window.RozgaarVoice = (function() {
  let targetInputElement = null;
  let recognition = null;
  let isListening = false;
  let currentTranscript = "";

  const samplePresetsByField = {
    name: [
      { en: "Rajesh Kumar", hi: "राजेश कुमार", mr: "राजेश कुमार", te: "రాజేష్ కుమార్", ta: "ராஜேஷ் குமார்" },
      { en: "Amit Patil", hi: "अमित पाटिल", mr: "अमित पाटील", te: "అమిత్ పాటిల్", ta: "அமித் பாட்டீல்" },
      { en: "Suresh Shinde", hi: "सुरेश शिंदे", mr: "सुरेश शिंदे", te: "సురేష్ షిండే", ta: "சுரேஷ் ஷிண்டே" },
      { en: "Vikram Deshmukh", hi: "विक्रम देशमुख", mr: "विक्रम देशमुख", te: "విక్రమ్ దేశ్‌ముఖ్", ta: "விக்ரம் தேஷ்முக்" }
    ],
    location: [
      { en: "Kothrud, Pune", hi: "कोथरूड, पुणे", mr: "कोथरूड, पुणे", te: "కోత్రూడ్, పూణే", ta: "கோத்ருட், புனே" },
      { en: "Karve Nagar, Pune", hi: "कर्वे नगर, पुणे", mr: "कर्वे नगर, पुणे", te: "కర్వే నగర్, పూణే", ta: "கர்வே நகர், புனே" },
      { en: "Shivajinagar, Pune", hi: "शिवाजीनगर, पुणे", mr: "शिवाजीनगर, पुणे", te: "శివాజీనగర్, పూణే", ta: "சிவாஜிநகர், புனே" },
      { en: "Hadapsar, Pune", hi: "हडपसर, पुणे", mr: "हडपसर, पुणे", te: "హడప్సర్, పూణే", ta: "ஹடப்சர், புனே" }
    ],
    profession: [
      { en: "Mason (Rajmistri)", hi: "राजमिस्त्री (गवंडी)", mr: "गवंडी (मेसन)", te: "మేస్త్రీ (తాపీ మేస్త్రీ)", ta: "கொத்தனார்" },
      { en: "Electrician", hi: "इलेक्ट्रीशियन", mr: "इलेक्ट्रीशियन", te: "ఎలక్ట్రీషియన్", ta: "எலக்ட்ரீஷியன்" },
      { en: "Carpenter", hi: "बढ़ई", mr: "सुतार", te: "వడ్రంగి", ta: "தச்சர்" },
      { en: "Plumber", hi: "प्लंबर", mr: "प्लंबर (नळ कारागीर)", te: "ప్లంబర్", ta: "பிளம்பர்" },
      { en: "Painter", hi: "पेंटर", mr: "रंगारी (पेंटर)", te: "పెయింటర్", ta: "பெயிண்டர்" }
    ],
    skills: [
      { en: "Brickwork, Plastering, Concrete mixing", hi: "ईंट जोड़ाई, प्लास्टर, सीमेंट मिक्सिंग", mr: "वीटकाम, प्लास्टर, काँक्रीट मिक्स", te: "ఇటుక పని, ప్లాస్టరింగ్, కాంక్రీట్ మిక్సింగ్", ta: "செங்கல் வேலை, பூச்சு வேலை, கான்கிரீட் கலவை" },
      { en: "Concealed wiring, Switchboards, MCB", hi: "कंसील्ड वायरिंग, स्विचबोर्ड, एमसीबी", mr: "वायरिंग, स्विचबोर्ड, एमसीबी", te: "కన్సీల్డ్ వైరింగ్, స్విచ్‌బోర్డులు, ఎంసిబి", ta: "கன்சீல்டு வயரிங், சுவிட்ச்போர்டு, எம்சிபி" },
      { en: "Modular kitchen, Door fittings", hi: "मॉड्यूलर किचन, दरवाजा फिटिंग", mr: "मॉड्यूलर किचन, दरवाजा फिटिंग", te: "మాడ్యులర్ కిచెన్, డోర్ ఫిట్టింగ్స్", ta: "மாடுலர் கிச்சன், கதவு பொருத்துதல்" },
      { en: "CPVC pipes, Diverter, Leakage repair", hi: "सीपीवीसी पाइप, डायव्हर्टर, लीकेज दुरुस्ती", mr: "पाईप, डायव्हर्टर, गळती दुरुस्ती", te: "సిపివిసి పైపులు, డైవర్టర్, లీకేజీ మరమ్మతు", ta: "சிபிவிசி குழாய்கள், டைவர்ட்டர், கசிவு பழுதுபார்ப்பு" }
    ],
    experience: [
      { en: "8 Years", hi: "8 वर्ष", mr: "८ वर्षे", te: "8 సంవత్సరాలు", ta: "8 ஆண்டுகள்" },
      { en: "5 Years", hi: "5 वर्ष", mr: "५ वर्षे", te: "5 సంవత్సరాలు", ta: "5 ஆண்டுகள்" },
      { en: "10 Years", hi: "10 वर्ष", mr: "१० वर्षे", te: "10 సంవత్సరాలు", ta: "10 ஆண்டுகள்" }
    ],
    wage: [
      { en: "800", hi: "800", mr: "८००", te: "800", ta: "800" },
      { en: "750", hi: "750", mr: "७५०", te: "750", ta: "750" },
      { en: "950", hi: "950", mr: "९५०", te: "950", ta: "950" }
    ],
    title: [
      { en: "Brickwork & Masonry for Residential Villa", hi: "मकान निर्माण के लिए राजमिस्त्री कार्य", mr: "घराच्या बांधकामासाठी गवंडी काम", te: "నివాస విల్లా కోసం ఇటుక పని & మేస్త్రీ పని", ta: "குடியிருப்பு வில்லாவுக்கான செங்கல் & கொத்தனார் வேலை" },
      { en: "Apartment Electrical Wiring & Board Fitting", hi: "फ्लैट में संपूर्ण बिजली वायरिंग कार्य", mr: "फ्लॅटमध्ये इलेक्ट्रिकल वायरिंग", te: "అపార్ట్‌మెంట్ ఎలక్ట్రికల్ వైరింగ్ & బోర్డ్ ఫిట్టింగ్", ta: "அபார்ட்மெண்ட் மின்சார வயரிங் & போர்டு பொருத்துதல்" },
      { en: "Bathroom CPVC Plumbing & Drainage", hi: "बाथरूम प्लंबिंग एवं पाइपलाइन कार्य", mr: "बाथरूम प्लंबिंग व पाईप फिटिंग", te: "బాత్‌రూమ్ సిపివిసి ప్లంబింగ్ & డ్రైనేజీ", ta: "குளியலறை சிபிவிசி பிளம்பிங் & வடிகால்" }
    ],
    company: [
      { en: "ABC Construction Pune", hi: "एबीसी कंस्ट्रक्शन पुणे", mr: "एबीसी कन्स्ट्रक्शन पुणे", te: "ఏబిసి కన్‌స్ట్రక్షన్ పూణే", ta: "ஏபிசி கன்ஸ்ட்ரக்ஷன் புனே" },
      { en: "Sharma Builders & Contractors", hi: "शर्मा बिल्डर्स एंड कॉन्ट्रैक्टर्स", mr: "शर्मा बिल्डर्स", te: "శర్మ బిల్డర్స్ & కాంట్రాక్టర్స్", ta: "சர்மா பில்டர்ஸ் & ஒப்பந்ததாரர்கள்" },
      { en: "Pune Home Repair Services", hi: "पुणे होम रिपेयर सर्विसेज", mr: "पुणे होम सर्व्हिसेस", te: "పూణే హోమ్ రిపేర్ సర్వీసెస్", ta: "புனே ஹோம் ரிப்பேர் சர்வீசஸ்" }
    ],
    id: [
      { en: "7845 9012 3456", hi: "7845 9012 3456", mr: "7845 9012 3456", te: "7845 9012 3456", ta: "7845 9012 3456" },
      { en: "ABCDE1234F", hi: "ABCDE1234F", mr: "ABCDE1234F", te: "ABCDE1234F", ta: "ABCDE1234F" },
      { en: "27AABCA1234F1Z5", hi: "27AABCA1234F1Z5", mr: "27AABCA1234F1Z5", te: "27AABCA1234F1Z5", ta: "27AABCA1234F1Z5" },
      { en: "5544 3322 1100", hi: "5544 3322 1100", mr: "5544 3322 1100", te: "5544 3322 1100", ta: "5544 3322 1100" }
    ],
    default: [
      { en: "Work Nearby. Earn Better.", hi: "पास काम। बेहतर दाम।", mr: "जवळ काम। जास्त दाम।", te: "సమీపంలో పని. మెరుగైన సంపాదన.", ta: "அருகில் வேலை. சிறந்த வருமானம்." },
      { en: "Available immediately for work", hi: "काम के लिए तुरंत उपलब्ध", mr: "कामासाठी तात्काळ उपलब्ध", te: "పని కోసం వెంటనే అందుబాటులో ఉన్నారు", ta: "வேலைக்கு உடனடியாக கிடைக்கக்கூடியவர்" },
      { en: "High quality daily construction work", hi: "उच्च गुणवत्ता का दैनिक निर्माण कार्य", mr: "उत्कृष्ट दर्जाचे बांधकाम काम", te: "అధిక నాణ్యత గల రోజువారీ నిర్మాణ పని", ta: "உயர்தர தினசரி கட்டுமான வேலை" }
    ]
  };

  function init() {
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechClass) {
      recognition = new SpeechClass();
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = function() {
        isListening = true;
        updateUIState(true);
      };

      recognition.onresult = function(event) {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentTranscript = event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const textToDisplay = currentTranscript || interim;
        const previewEl = document.getElementById("voice-transcript-preview");
        if (previewEl) previewEl.textContent = textToDisplay || "...";
      };

      recognition.onerror = function(event) {
        console.warn("Speech recognition notice/error:", event.error);
        isListening = false;
        updateUIState(false);
      };

      recognition.onend = function() {
        isListening = false;
        updateUIState(false);
      };
    }
  }

  function open(targetInput, fieldCategory = "default") {
    targetInputElement = targetInput;
    currentTranscript = "";

    const modal = document.getElementById("voice-modal");
    if (!modal) return;

    const currentLang = (window.RozgaarState && window.RozgaarState.getLanguage()) || "en";

    // Localize modal static UI elements
    const titleEl = document.getElementById("voice-modal-title");
    const samplesLabelEl = document.getElementById("voice-modal-samples-label");
    const cancelBtnEl = document.getElementById("voice-modal-cancel-btn");
    const insertBtnEl = document.getElementById("voice-modal-insert-btn");

    if (titleEl) {
      titleEl.textContent = currentLang === 'hi' ? 'आवाज़ से टाइप करें' : currentLang === 'mr' ? 'आवाजाने टाइप करा' : currentLang === 'te' ? 'వాయిస్-టు-టెక్స్ట్ ఇన్‌పుట్' : currentLang === 'ta' ? 'குரல் மூலம் தட்டச்சு' : 'Voice-to-Text Input';
    }
    if (samplesLabelEl) {
      samplesLabelEl.textContent = currentLang === 'hi' ? 'त्वरित ध्वनि नमूने (बोलने के लिए टैप करें):' : currentLang === 'mr' ? 'झटपट व्हॉइस नमुने (बोलण्यासाठी टॅप करा):' : currentLang === 'te' ? 'శీఘ్ర వాయిస్ నమూనాలు:' : currentLang === 'ta' ? 'விரைவான குரல் மாதிரிகள்:' : 'Quick Voice Samples (Tap to dictate):';
    }
    if (cancelBtnEl) {
      cancelBtnEl.textContent = currentLang === 'hi' ? 'रद्द करें' : currentLang === 'mr' ? 'रद्द करा' : currentLang === 'te' ? 'రద్దు చేయి' : currentLang === 'ta' ? 'ரத்துசெய்' : 'Cancel';
    }
    if (insertBtnEl) {
      insertBtnEl.textContent = currentLang === 'hi' ? 'टेक्स्ट दर्ज करें ✓' : currentLang === 'mr' ? 'मजकूर जोडा ✓' : currentLang === 'te' ? 'వచనాన్ని చొప్పించు ✓' : currentLang === 'ta' ? 'உரையைச் செருகவும் ✓' : 'Insert Text ✓';
    }

    modal.classList.remove("hidden");
    const previewEl = document.getElementById("voice-transcript-preview");
    if (previewEl) {
      previewEl.textContent = window.RozgaarState ? window.RozgaarState.t("listening") : "Listening...";
    }

    // Populate quick presets based on category and current app language
    const presetsContainer = document.getElementById("voice-presets-list");
    if (presetsContainer) {
      presetsContainer.innerHTML = "";
      const presets = samplePresetsByField[fieldCategory] || samplePresetsByField["default"];
      presets.forEach(item => {
        const text = item[currentLang] || item["en"];
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800 hover:bg-indigo-900 border border-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1.5";
        chip.innerHTML = `<span>🎤</span> <span>"${text}"</span>`;
        chip.onclick = function() {
          setTranscript(text);
          applyTranscript();
        };
        presetsContainer.appendChild(chip);
      });
    }

    startListening();
  }

  function startListening() {
    const currentLang = (window.RozgaarState && window.RozgaarState.getLanguage()) || "en";
    const langCodes = {
      en: "en-IN",
      hi: "hi-IN",
      mr: "mr-IN",
      te: "te-IN",
      ta: "ta-IN"
    };

    if (recognition) {
      try {
        recognition.lang = langCodes[currentLang] || "en-IN";
        recognition.start();
      } catch (err) {
        console.warn("Recognition already started or error:", err);
      }
    } else {
      updateUIState(true);
    }
  }

  function stopListening() {
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (e) {}
    }
    isListening = false;
    updateUIState(false);
  }

  function updateUIState(listening) {
    const micIcon = document.getElementById("voice-modal-mic-icon");
    const waveBars = document.getElementById("voice-wave-bars");
    const statusText = document.getElementById("voice-status-text");

    if (micIcon) {
      if (listening) {
        micIcon.classList.add("listening-pulse", "bg-indigo-600", "text-white");
        micIcon.classList.remove("bg-slate-800", "text-indigo-400");
      } else {
        micIcon.classList.remove("listening-pulse", "bg-indigo-600", "text-white");
        micIcon.classList.add("bg-slate-800", "text-indigo-400");
      }
    }

    if (waveBars) {
      waveBars.style.display = listening ? "flex" : "none";
    }

    if (statusText) {
      statusText.textContent = listening
        ? (window.RozgaarState ? window.RozgaarState.t("listening") : "Listening...")
        : (window.RozgaarState ? window.RozgaarState.t("speakNow") : "Tap mic to speak or select a preset:");
    }
  }

  function setTranscript(text) {
    currentTranscript = text;
    const previewEl = document.getElementById("voice-transcript-preview");
    if (previewEl) previewEl.textContent = text;
  }

  function applyTranscript() {
    if (targetInputElement && currentTranscript) {
      targetInputElement.value = currentTranscript;
      targetInputElement.dispatchEvent(new Event("input", { bubbles: true }));
      targetInputElement.dispatchEvent(new Event("change", { bubbles: true }));

      if (window.RozgaarState) {
        window.RozgaarState.toast(`🎤 Voice Input: "${currentTranscript}"`, "info");
      }
    }
    close();
  }

  function close() {
    stopListening();
    const modal = document.getElementById("voice-modal");
    if (modal) modal.classList.add("hidden");
    targetInputElement = null;
    currentTranscript = "";
  }

  return {
    init,
    open,
    close,
    startListening,
    stopListening,
    applyTranscript,
    setTranscript
  };
})();
