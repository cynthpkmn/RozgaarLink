/**
 * RozgaarLink - Google Gemini AI Multilingual Job Translation Service
 * Dynamically translates job titles, skills, descriptions, and locations into
 * Hindi (हिंदी), Marathi (मराठी), Telugu (తెలుగు), and Tamil (தமிழ்).
 * Supports direct Google Gemini API (gemini-3.8-flash / gemini-flash-latest)
 * with intelligent offline semantic trade glossary fallback.
 */

window.RozgaarGemini = (function() {
  const API_KEY_STORAGE = "ROZGAAR_GEMINI_API_KEY";
  const CACHE_STORAGE = "ROZGAAR_GEMINI_CACHE_V3";

  // Trade & Location Glossary for zero-latency, 100% reliable translations across 5 languages
  const tradeGlossary = {
    // Pune Localities & Landmarks
    "near vanaz metro, paud road, kothrud": {
      hi: "वनाझ मेट्रो के पास, पौड रोड, कोथरूड",
      mr: "वनाझ मेट्रो जवळ, पौड रस्ता, कोथरूड",
      te: "వనాజ్ మెట్రో సమీపంలో, పౌడ్ రోడ్, కోత్రుడ్",
      ta: "வனாஸ் மெட்ரோ அருகில், பவுட் சாலை, கோத்ருட்"
    },
    "vanaz metro": { hi: "वनाझ मेट्रो", mr: "वनाझ मेट्रो", te: "వనాజ్ మెట్రో", ta: "வனாஸ் மெட்ரோ" },
    "paud road": { hi: "पौड रोड", mr: "पौड रस्ता", te: "పౌడ్ రోడ్", ta: "பவுட் சாலை" },
    "dahanukar colony, kothrud": {
      hi: "डहाणूकर कॉलोनी, कोथरूड",
      mr: "डहाणूकर कॉलनी, कोथरूड",
      te: "దహానుకర్ కాలనీ, కోత్రుడ్",
      ta: "தஹானுகர் காலனி, கோத்ருட்"
    },
    "dahanukar colony": { hi: "डहाणूकर कॉलोनी", mr: "डहाणूकर कॉलनी", te: "దహానుకర్ కాలనీ", ta: "தஹானுகர் காலனி" },
    "near cummins college, karve nagar": {
      hi: "कमिंस कॉलेज के पास, कर्वे नगर",
      mr: "कमिन्स कॉलेज जवळ, कर्वे नगर",
      te: "కమిన్స్ కాలేజ్ సమీపంలో, కార్వే నగర్",
      ta: "கம்மின்ஸ் கல்லூரி அருகில், கார்வே நகர்"
    },
    "cummins college": { hi: "कमिंस कॉलेज", mr: "कमिन्स कॉलेज", te: "కమిన్స్ కాలేజ్", ta: "கம்மின்ஸ் கல்லூரி" },
    "deccan gymkhana, pune": {
      hi: "डेक्कन जिमखाना, पुणे",
      mr: "डेक्कन जिमखाना, पुणे",
      te: "డెక్కన్ జింఖానా, పూణే",
      ta: "டெக்கான் ஜிம்கானா, புனே"
    },
    "deccan gymkhana": { hi: "डेक्कन जिमखाना", mr: "डेक्कन जिमखाना", te: "డెక్కన్ జింఖానా", ta: "டெக்கான் ஜிம்கானா" },
    "mayur colony, kothrud": {
      hi: "मयूर कॉलोनी, कोथरूड",
      mr: "मयूर कॉलनी, कोथरूड",
      te: "మయూర్ కాలనీ, కోత్రుడ్",
      ta: "மயூர் காலனி, கோத்ருட்"
    },
    "mayur colony": { hi: "मयूर कॉलोनी", mr: "मयूर कॉलनी", te: "మయూర్ కాలనీ", ta: "மயூர் காலனி" },
    "near shivaji statue, kothrud": {
      hi: "शिवाजी पुतले के पास, कोथरूड",
      mr: "शिवाजी पुतळ्याजवळ, कोथरूड",
      te: "శివాజీ విగ్రహం సమీపంలో, కోత్రుడ్",
      ta: "சிவாஜி சிலை அருகில், கோத்ருட்"
    },
    "shivaji statue": { hi: "शिवाजी पुतला", mr: "शिवाजी पुतळा", te: "శివాజీ విగ్రహం", ta: "சிவாஜி சிலை" },
    "warje malwadi, pune": {
      hi: "वारजे मालवाड़ी, पुणे",
      mr: "वारजे माळवाडी, पुणे",
      te: "వార్జే మాల్వాడి, పూణే",
      ta: "வார்ஜே மால்வாடி, புனே"
    },
    "warje malwadi": { hi: "वारजे मालवाड़ी", mr: "वारजे माळवाडी", te: "వార్జే మాల్వాడి", ta: "வார்ஜே மால்வாடி" },
    "bavdhan, pune": { hi: "बावधन, पुणे", mr: "बावधन, पुणे", te: "బావ్‌ధాన్, పూణే", ta: "பாவ்தன், புனே" },
    "bavdhan": { hi: "बावधन", mr: "बावधन", te: "బావ్‌ధాన్", ta: "பாவ்தன்" },
    "karve nagar": { hi: "कर्वे नगर", mr: "कर्वे नगर", te: "కార్వే నగర్", ta: "கார்வே நகர்" },
    "kothrud": { hi: "कोथरूड", mr: "कोथरूड", te: "కోత్రుడ్", ta: "கோத்ருட்" },
    "shivajinagar": { hi: "शिवाजीनगर", mr: "शिवाजीनगर", te: "శివాజీనగర్", ta: "சிவாஜிநகர்" },
    "hadapsar": { hi: "हडपसर", mr: "हडपसर", te: "హడప్సర్", ta: "ஹடப்சர்" },
    "baner": { hi: "बाणेर", mr: "बाणेर", te: "బానేర్", ta: "பானேர்" },
    "swargate": { hi: "स्वारगेट", mr: "स्वारगेट", te: "స్వర్గేట్", ta: "ஸ்வார்கேட்" },
    "warje": { hi: "वारजे", mr: "वारजे", te: "వార్జే", ta: "வார்ஜே" },
    "pune": { hi: "पुणे", mr: "पुणे", te: "పూణే", ta: "புனே" },

    // Professions & Trades
    "mason": { hi: "राजमिस्त्री", mr: "गवंडी", te: "మేస్త్రీ (తాపీ పని)", ta: "கொத்தனார்" },
    "masonry": { hi: "राजमिस्त्री व चिनाई कार्य", mr: "गवंडी काम", te: "తాపీ మేస్త్రీ పని", ta: "கொத்து வேலை" },
    "brickwork": { hi: "ईंट जोड़ाई", mr: "वीटकाम", te: "ఇటుక పని", ta: "செங்கல் வேலை" },
    "brickwork & masonry": { hi: "ईंट जोड़ाई व राजमिस्त्री कार्य", mr: "वीटकाम व गवंडी काम", te: "ఇటుక పని & మేస్త్రీ పని", ta: "செங்கல் வேலை & கொத்து வேலை" },
    "plastering": { hi: "प्लास्टरिंग कार्य", mr: "प्लास्टर काम", te: "ప్లాస్టరింగ్ పని", ta: "பூச்சு வேலை" },
    "electrician": { hi: "इलेक्ट्रीशियन", mr: "इलेक्ट्रीशियन", te: "ఎలక్ట్రీషియన్", ta: "எலக்ட்ரீஷியன்" },
    "electrical wiring": { hi: "बिजली वायरिंग कार्य", mr: "इलेक्ट्रिक वायरिंग काम", te: "ఎలక్ట్రికల్ వైరింగ్ పని", ta: "எலக்ட்ரிக்கல் வயரிங் வேலை" },
    "wiring": { hi: "बिजली वायरिंग", mr: "वायरिंग काम", te: "వైరింగ్ పని", ta: "வயரிங் வேலை" },
    "carpenter": { hi: "बढ़ई", mr: "सुतार", te: "వడ్రంగి (కార్పెంటర్)", ta: "தச்சர் (கார்பெண்டர்)" },
    "furniture": { hi: "फर्नीचर का काम", mr: "फर्निचर काम", te: "ఫర్నిచర్ పని", ta: "மரச்சாமான்கள் வேலை" },
    "plumber": { hi: "प्लंबर", mr: "प्लंबर (नळ कारागीर)", te: "ప్లంబర్ (పైపుల పని)", ta: "பிளம்பர்" },
    "plumbing": { hi: "प्लंबिंग कार्य", mr: "प्लंबिंग काम", te: "ప్లంబింగ్ పని", ta: "பிளம்பிங் வேலை" },
    "piping": { hi: "पाइप फिटिंग", mr: "पाईप फिटिंग", te: "పైప్ ఫిట్టింగ్", ta: "குழாய் பொருத்துதல்" },
    "painter": { hi: "पेंटर", mr: "रंगारी (पेंटर)", te: "పెయింటర్ (రంగుల పని)", ta: "பெயிண்டர்" },
    "painting": { hi: "रंगाई व पुट्टी कार्य", mr: "रंगकाम", te: "పెయింటింగ్ & పుట్టీ పని", ta: "வர்ணம் பூசுதல்" },
    "construction worker": { hi: "निर्माण मजदूर", mr: "बांधकाम मजूर", te: "భవన నిర్మాణ కార్మికుడు", ta: "கட்டுமானத் தொழிலாளி" },
    "helper": { hi: "हेल्पर / सहायक", mr: "मदतनीस (हेल्पर)", te: "హెల్పర్ / సహాయకుడు", ta: "உதவியாளர் (ஹெல்ப்பர்)" },
    "excavation": { hi: "नींव खुदाई कार्य", mr: "पाया खोदकाम", te: "పునాది తవ్వకం పని", ta: "அடித்தள தோண்டுதல்" },
    "tile": { hi: "टाइल लगाना", mr: "लादी बसवणे", te: "టైల్స్ వేయడం", ta: "டைல்ஸ் பதித்தல்" },
    "tile laying": { hi: "टाइल लगाना", mr: "लादी बसवणे", te: "టైల్స్ వేయడం", ta: "டைல்ஸ் பதித்தல்" },
    "flooring": { hi: "फर्श कार्य", mr: "फरशी काम", te: "ఫ్లోరింగ్ పని", ta: "தரை வேலை" },

    // Technical Details & Work Terms
    "bungalow": { hi: "बंगला निर्माण", mr: "बंगला बांधकाम", te: "బంగ్లా నిర్మాణం", ta: "பங்களா கட்டுதல்" },
    "apartment": { hi: "अपार्टमेंट", mr: "अपार्टमेंट / फ्लॅट", te: "అపార్ట్‌మెంట్", ta: "அடுக்குமாடி குடியிருப்பு" },
    "flat": { hi: "फ्लैट", mr: "फ्लॅट", te: "ఫ్లాట్", ta: "பிளாட்" },
    "villa": { hi: "विला", mr: "व्हिला", te: "విల్లా", ta: "வில்லா" },
    "residential villa": { hi: "आवासीय विला", mr: "निवासी व्हिला", te: "రెసిడెన్షియల్ విల్లా", ta: "குடியிருப்பு வில்லா" },
    "wall": { hi: "दीवार", mr: "भिंत", te: "గోడ", ta: "சுவர்" },
    "boundary": { hi: "चारदीवारी", mr: "संरक्षक भिंत", te: "కాంపౌండ్ గోడ", ta: "காம்பவுண்ட் சுவர்" },
    "boundary wall": { hi: "चारदीवारी निर्माण", mr: "संरक्षक भिंत बांधकाम", te: "సరిహద్దు గోడ నిర్మాణం", ta: "எல்லைச் சுவர் கட்டுதல்" },
    "concrete": { hi: "सीमेंट कंक्रीट", mr: "सिमेंट काँक्रीट", te: "సిమెంట్ కాంక్రీట్", ta: "சிமெண்ட் கான்கிரீட்" },
    "mixing": { hi: "मसाला मिश्रण", mr: "मिश्रण तयार करणे", te: "మిశ్రమం కలపడం", ta: "கலவை தயாரித்தல்" },
    "modular kitchen": { hi: "मॉड्यूलर किचन", mr: "मॉड्यूलर किचन", te: "మాడ్యులర్ కిచెన్", ta: "மாடுலர் கிச்சன்" },
    "door": { hi: "दरवाजा फिटिंग", mr: "दरवाजा बसवणे", te: "డోర్ ఫిట్టింగ్", ta: "கதவு பொருத்துதல்" },
    "leakage": { hi: "लीकेज मरम्मत", mr: "गळती दुरुस्ती", te: "లీకేజీ మరమ్మతు", ta: "கசிவு சரிசெய்தல்" },
    "drainage": { hi: "जल निकासी पाइप", mr: "ड्रेनेज पाईप", te: "డ్రైనేజీ పైపులు", ta: "வடிகால் குழாய்" },
    "waterproofing": { hi: "वाटरप्रूफिंग", mr: "वॉटरप्रूफिंग", te: "వాటర్‌ప్రూఫింగ్", ta: "நீர் புகா வேலை" },
    "terrace": { hi: "छत", mr: "गच्ची", te: "మేడ", ta: "மொட்டை மாடி" },
    "trench": { hi: "नींव खुदाई", mr: "पाया खोदकाम", te: "పునాది కందకం", ta: "அடித்தள குழி" },
    "foundation": { hi: "नींव कार्य", mr: "पाया काम", te: "పునాది పని", ta: "அடித்தள வேலை" },
    "residential": { hi: "आवासीय", mr: "निवासी", te: "రెసిడెన్షియల్", ta: "குடியிருப்பு" },
    "commercial": { hi: "व्यावसायिक", mr: "व्यावसायिक", te: "కమర్షియల్", ta: "வணிக" },
    "skill match": { hi: "कौशल मेल", mr: "कौशल जुळणी", te: "నైపుణ్య సరిపోలిక", ta: "திறமைப் பொருத்தம்" },
    "verified": { hi: "सत्यापित", mr: "सत्यापित", te: "ధృవీకరించబడింది", ta: "சரிபார்க்கப்பட்டது" },
    "business verified": { hi: "व्यवसाय सत्यापित", mr: "व्यवसाय पडताळणी", te: "వ్యాపారం ధృవీకరించబడింది", ta: "நிறுவனம் சரிபார்க்கப்பட்டது" },
    "per day": { hi: "प्रति दिन", mr: "दररोज", te: "రోజుకు", ta: "ஒரு நாளைக்கு" },
    "urgent": { hi: "तत्काल", mr: "तात्काळ", te: "తక్షణం", ta: "உடனடி" },
    "tomorrow": { hi: "कल", mr: "उद्या", te: "రేపు", ta: "நாளை" },
    "today": { hi: "आज", mr: "आज", te: "ఈరోజు", ta: "இன்று" },
    "days": { hi: "दिन", mr: "दिवस", te: "రోజులు", ta: "நாட்கள்" },
    "day": { hi: "दिन", mr: "दिवस", te: "రోజు", ta: "நாள்" },

    // Exact Sample Job Titles & History
    "brickwork & masonry for residential villa": {
      hi: "आवासीय विला के लिए ईंट जोड़ाई व राजमिस्त्री कार्य",
      mr: "घराच्या बांधकामासाठी विटकाम आणि गवंडी काम",
      te: "రెసిడెన్షియల్ విల్లా కోసం ఇటుక పని & తాపీ మేస్త్రీ పని",
      ta: "குடியிருப்பு வில்லாவிற்கான செங்கல் வேலை & கொத்தனார் வேலை"
    },
    "plastering & cement boundary wall construction": {
      hi: "प्लास्टर एवं सीमेंट बाउंड्री वॉल निर्माण कार्य",
      mr: "प्लास्टर आणि सिमेंट संरक्षण भिंत बांधकाम",
      te: "ప్లాస్టరింగ్ & సిమెంట్ బౌండరీ వాల్ నిర్మాణం",
      ta: "பூச்சு வேலை & சிமென்ட் எல்லை சுவர் கட்டுமானம்"
    },
    "plastering & cement boundary wall": {
      hi: "प्लास्टर एवं सीमेंट बाउंड्री वॉल",
      mr: "प्लास्टर आणि सिमेंट संरक्षण भिंत",
      te: "ప్లాస్టరింగ్ & సిమెంట్ బౌండరీ వాల్",
      ta: "பூச்சு வேலை & சிமென்ட் எல்லை சுவர்"
    },
    "complete apartment electrical wiring": {
      hi: "फ्लैट में संपूर्ण बिजली वायरिंग कार्य",
      mr: "फ्लॅटमध्ये संपूर्ण इलेक्ट्रिकल वायरिंग",
      te: "అపార్ట్‌మెంట్‌లో పూర్తి ఎలక్ట్రికల్ వైరింగ్",
      ta: "அபார்ட்மெண்ட் முழுமையான மின்சார வயரிங்"
    },
    "modular kitchen plywood & door fitting": {
      hi: "मॉड्यूलर किचन प्लाईवुड फिटिंग एवं वार्डरोब",
      mr: "मॉड्यूलर किचन प्लायवूड व दरवाजा फिटिंग",
      te: "మాడ్యులర్ కిచెన్ ప్లైవుడ్ & డోర్ ఫిట్టింగ్",
      ta: "மாடுலர் கிச்சன் ப்ளைவுட் & கதவு பொருத்துதல்"
    },
    "house construction brickwork": {
      hi: "मकान निर्माण ईंट जोड़ाई कार्य",
      mr: "घराचे बांधकाम वीटकाम",
      te: "ఇంటి నిర్మాణం ఇటుక పని",
      ta: "வீடு கட்டும் செங்கல் வேலை"
    },
    "compound wall & plastering work": {
      hi: "बाउंड्री वॉल एवं प्लास्टर कार्य",
      mr: "कम्पाउंड वॉल आणि प्लास्टर काम",
      te: "కాంపౌండ్ వాల్ & ప్లాస్టరింగ్ పని",
      ta: "காம்பவுண்ட் சுவர் & பூச்சு வேலை"
    },
    "terrace waterproofing & brick bat coba": {
      hi: "छत वॉटरप्रूफिंग एवं ईंट कोबा कार्य",
      mr: "टेरेस वॉटरप्रूफिंग आणि वीट कोबा काम",
      te: "టెర్రేస్ వాటర్‌ప్రూఫింగ్ & బ్రిక్ బ్యాట్ కోబా",
      ta: "மொட்டை மாடி நீர்ப்புகாப்பு & செங்கல் கோபா வேலை"
    }
  };

  let translationCache = {};

  function init() {
    try {
      localStorage.removeItem("ROZGAAR_GEMINI_CACHE_V1");
      localStorage.removeItem("ROZGAAR_GEMINI_CACHE_V2");

      const saved = localStorage.getItem(CACHE_STORAGE);
      if (saved) {
        translationCache = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not load translation cache", e);
    }
  }

  function saveCache() {
    try {
      localStorage.setItem(CACHE_STORAGE, JSON.stringify(translationCache));
    } catch (e) {}
  }

  function getApiKey() {
    const stored = localStorage.getItem(API_KEY_STORAGE);
    if (stored !== null && stored !== undefined && stored.trim() !== "") {
      return stored.trim();
    }
    return "";
  }

  function setApiKey(key) {
    if (key && key.trim()) {
      localStorage.setItem(API_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
    }
  }

  // Smart Semantic Rule-Based Translator (Zero-latency fallback)
  function smartFallbackTranslate(text, targetLang) {
    if (!text || typeof text !== "string") return text;
    if (targetLang === "en") return text;

    let translated = text;

    // Direct match check
    const cleanLower = text.trim().toLowerCase();
    if (tradeGlossary[cleanLower] && tradeGlossary[cleanLower][targetLang]) {
      return tradeGlossary[cleanLower][targetLang];
    }

    // Replace terms (longest phrases first)
    const sortedKeys = Object.keys(tradeGlossary).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      const regex = new RegExp(`\\b${key}\\b`, "gi");
      if (regex.test(translated)) {
        const replacement = (tradeGlossary[key] && tradeGlossary[key][targetLang]) || key;
        translated = translated.replace(regex, replacement);
      }
    }

    // Connectors & Common Prepositions
    if (targetLang === "hi") {
      translated = translated
        .replace(/&/g, "और")
        .replace(/\bfor\b/gi, "के लिए")
        .replace(/\band\b/gi, "और")
        .replace(/\bwith\b/gi, "सहित")
        .replace(/\bin\b/gi, "में")
        .replace(/\bnear\b/gi, "के पास")
        .replace(/\bwork\b/gi, "काम")
        .replace(/\brequired\b/gi, "आवश्यक")
        .replace(/\bneeded\b/gi, "चाहिए")
        .replace(/\bnew\b/gi, "नया")
        .replace(/\bdays\b/gi, "दिन")
        .replace(/\bday\b/gi, "दिन")
        .replace(/\byears\b/gi, "वर्ष");
    } else if (targetLang === "mr") {
      translated = translated
        .replace(/&/g, "आणि")
        .replace(/\bfor\b/gi, "साठी")
        .replace(/\band\b/gi, "आणि")
        .replace(/\bwith\b/gi, "सह")
        .replace(/\bin\b/gi, "मध्ये")
        .replace(/\bnear\b/gi, "जवळ")
        .replace(/\bwork\b/gi, "काम")
        .replace(/\brequired\b/gi, "आवश्यक")
        .replace(/\bneeded\b/gi, "पाहिजे")
        .replace(/\bnew\b/gi, "नवीन")
        .replace(/\bdays\b/gi, "दिवस")
        .replace(/\bday\b/gi, "दिवस")
        .replace(/\byears\b/gi, "वर्षे");
    } else if (targetLang === "te") {
      translated = translated
        .replace(/&/g, "మరియు")
        .replace(/\bfor\b/gi, "కోసం")
        .replace(/\band\b/gi, "మరియు")
        .replace(/\bwith\b/gi, "తో")
        .replace(/\bin\b/gi, "లో")
        .replace(/\bnear\b/gi, "సమీపంలో")
        .replace(/\bwork\b/gi, "పని")
        .replace(/\brequired\b/gi, "అవసరం")
        .replace(/\bneeded\b/gi, "కావాలి")
        .replace(/\bnew\b/gi, "కొత్త")
        .replace(/\bdays\b/gi, "రోజులు")
        .replace(/\bday\b/gi, "రోజు")
        .replace(/\byears\b/gi, "సంవత్సరాలు");
    } else if (targetLang === "ta") {
      translated = translated
        .replace(/&/g, "மற்றும்")
        .replace(/\bfor\b/gi, "க்கு")
        .replace(/\band\b/gi, "மற்றும்")
        .replace(/\bwith\b/gi, "உடன்")
        .replace(/\bin\b/gi, "இல்")
        .replace(/\bnear\b/gi, "அருகில்")
        .replace(/\bwork\b/gi, "வேலை")
        .replace(/\brequired\b/gi, "தேவை")
        .replace(/\bneeded\b/gi, "வேண்டும்")
        .replace(/\bnew\b/gi, "புதிய")
        .replace(/\bdays\b/gi, "நாட்கள்")
        .replace(/\bday\b/gi, "நாள்")
        .replace(/\byears\b/gi, "ஆண்டுகள்");
    }

    return translated;
  }

  // Live Backend /api/generate AI Translation Call
  async function callGeminiApi(text, targetLang) {
    if (!text || typeof text !== "string") return null;

    const langMap = {
      "hi": "Hindi (हिंदी)",
      "mr": "Marathi (मराठी)",
      "te": "Telugu (తెలుగు)",
      "ta": "Tamil (தமிழ்)"
    };
    const langName = langMap[targetLang] || targetLang;
    const scriptHint = targetLang === "te" ? "in Telugu script" : targetLang === "ta" ? "in Tamil script" : "in Devanagari script";
    const prompt = `You are a professional multilingual translator for an Indian blue-collar daily-wage job portal. Translate the following text into natural, authentic ${langName} ${scriptHint}. Translate ALL proper nouns, localities, and construction words cleanly (for example: "Near Vanaz Metro, Paud Road, Kothrud"). Output strictly and ONLY the direct translated phrase without markdown bold, explanations, prefixes, or quotes:\n${text}`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: prompt,
          text: text,
          targetLang: targetLang
        })
      });

      if (!response.ok) {
        console.warn("Backend /api/generate status:", response.status);
        return null;
      }

      const data = await response.json();
      const raw = data?.text || data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (raw) {
        let cleaned = raw.trim()
          .replace(/^["']|["']$/g, "")
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/^.*?:/s, "")
          .trim();
        if (cleaned) {
          return cleaned;
        }
      }
    } catch (e) {
      console.warn("Backend /api/generate translation error:", e);
    }
    return null;
  }

  // Main Translation Function with caching
  async function translate(text, targetLang) {
    if (!text || targetLang === "en") return text;

    const cacheKey = `${targetLang}_${text.trim()}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    // Try Google Gemini API with configured key
    let translated = await callGeminiApi(text, targetLang);

    // Fallback to intelligent local trade dictionary if API call fails
    if (!translated) {
      translated = smartFallbackTranslate(text, targetLang);
    }

    if (translated) {
      translationCache[cacheKey] = translated;
      saveCache();
      return translated;
    }

    return text;
  }

  // Synchronous accessor for instantaneous UI rendering with background AI enhancement
  function getJobField(job, field) {
    if (!job) return "";
    const currentLang = (window.RozgaarState && window.RozgaarState.getLanguage()) || "en";
    if (currentLang === "en") return job[field] || "";

    // 1. Direct explicit localized field on job
    const localizedKey = `${field}_${currentLang}`;
    if (job[localizedKey]) {
      return job[localizedKey];
    }

    // 2. Cache lookup
    const originalText = job[field] || "";
    const cacheKey = `${currentLang}_${originalText.trim()}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    // 3. Instant semantic fallback translation
    const fallback = smartFallbackTranslate(originalText, currentLang);
    translationCache[cacheKey] = fallback;
    saveCache();

    // 4. Background trigger for Gemini API
    if (originalText && originalText.length > 3) {
      callGeminiApi(originalText, currentLang).then(aiText => {
        if (aiText && aiText !== fallback) {
          translationCache[cacheKey] = aiText;
          job[localizedKey] = aiText;
          saveCache();
          if (window.RozgaarState) window.RozgaarState.notify();
        }
      });
    }

    return fallback || originalText;
  }

  // Auto-translate new job on employer posting into all languages
  async function autoTranslateNewJob(jobData) {
    const fieldsToTranslate = ["title", "description", "requiredSkills", "location", "duration"];
    
    for (const lang of ["hi", "mr", "te", "ta"]) {
      for (const f of fieldsToTranslate) {
        if (jobData[f]) {
          const trans = await translate(jobData[f], lang);
          jobData[`${f}_${lang}`] = trans;
        }
      }
    }
    return jobData;
  }

  // Pre-translate jobs when switching language
  function warmupTranslations(jobs, lang) {
    if (!jobs || !Array.isArray(jobs) || lang === "en") return;
    const fields = ["title", "location", "requiredSkills", "description", "duration"];
    jobs.forEach(job => {
      fields.forEach(field => {
        const localizedKey = `${field}_${lang}`;
        if (!job[localizedKey] && job[field]) {
          translate(job[field], lang).then(translated => {
            if (translated && translated !== job[field]) {
              job[localizedKey] = translated;
              if (window.RozgaarState) window.RozgaarState.notify();
            }
          });
        }
      });
    });
  }

  // Helper: Localize Profession
  function getLocalizedProfession(prof, lang) {
    if (!prof || !lang || lang === "en") return prof || "";
    const p = prof.toLowerCase().trim();
    const map = {
      "mason": { hi: "राजमिस्त्री", mr: "गवंडी", te: "మేస్త్రీ (తాపీ పని)", ta: "கொத்தனார் (மேசன்)" },
      "carpenter": { hi: "बढ़ई", mr: "सुतार", te: "వడ్రంగి (కార్పెంటర్)", ta: "தச்சர் (கார்பெண்டர்)" },
      "electrician": { hi: "इलेक्ट्रीशियन", mr: "इलेक्ट्रीशियन", te: "ఎలక్ట్రీషియన్", ta: "எலக்ட்ரீஷியன்" },
      "plumber": { hi: "प्लंबर", mr: "प्लंबर (नळ कारागीर)", te: "ప్లంబర్ (పైపుల పని)", ta: "பிளம்பர் (குழாய் வேலை)" },
      "painter": { hi: "पेंटर", mr: "रंगारी (पेंटर)", te: "పెయింటర్ (రంగుల పని)", ta: "பெயிண்டர்" },
      "construction worker": { hi: "निर्माण मजदूर", mr: "बांधकाम मजूर", te: "భవన నిర్మాణ కార్మికుడు", ta: "கட்டுமானத் தொழிலாளி" },
      "helper": { hi: "हेल्पर / सहायक", mr: "मदतनीस (हेल्पर)", te: "హెల్పర్ / సహాయకుడు", ta: "உதவியாளர் (ஹெல்ப்பர்)" }
    };
    return (map[p] && map[p][lang]) || prof;
  }

  // Helper: Localize Job Date
  function formatJobDate(dateStr, lang) {
    if (!dateStr || !lang || lang === "en") return dateStr || "";
    let res = dateStr;
    if (lang === "hi") {
      res = res.replace(/Tomorrow/gi, "कल")
               .replace(/Today/gi, "आज")
               .replace(/Yesterday/gi, "कल")
               .replace(/Just now/gi, "अभी-अभी")
               .replace(/10 mins ago/gi, "10 मिनट पहले")
               .replace(/1 hour ago/gi, "1 घंटा पहले")
               .replace(/2 hours ago/gi, "2 घंटे पहले")
               .replace(/Aug/gi, "अगस्त")
               .replace(/Sep/gi, "सितंबर")
               .replace(/Oct/gi, "अक्टूबर")
               .replace(/Nov/gi, "नवंबर")
               .replace(/Dec/gi, "दिसंबर")
               .replace(/Jan/gi, "जनवरी");
    } else if (lang === "mr") {
      res = res.replace(/Tomorrow/gi, "उद्या")
               .replace(/Today/gi, "आज")
               .replace(/Yesterday/gi, "काल")
               .replace(/Just now/gi, "आत्ताच")
               .replace(/10 mins ago/gi, "10 मिनिटांपूर्वी")
               .replace(/1 hour ago/gi, "1 तासापूर्वी")
               .replace(/2 hours ago/gi, "2 तासांपूर्वी")
               .replace(/Aug/gi, "ऑगस्ट")
               .replace(/Sep/gi, "सप्टेंबर")
               .replace(/Oct/gi, "ऑक्टोबर")
               .replace(/Nov/gi, "नोव्हेंबर")
               .replace(/Dec/gi, "डिसेंबर")
               .replace(/Jan/gi, "जानेवारी");
    } else if (lang === "te") {
      res = res.replace(/Tomorrow/gi, "రేపు")
               .replace(/Today/gi, "ఈరోజు")
               .replace(/Yesterday/gi, "నిన్న")
               .replace(/Just now/gi, "ఇప్పుడే")
               .replace(/10 mins ago/gi, "10 నిమిషాల క్రితం")
               .replace(/1 hour ago/gi, "1 గంట క్రితం")
               .replace(/2 hours ago/gi, "2 గంటల క్రితం")
               .replace(/Aug/gi, "ఆగస్టు")
               .replace(/Sep/gi, "సెప్టెంబర్")
               .replace(/Oct/gi, "అక్టోబర్")
               .replace(/Nov/gi, "నవంబర్")
               .replace(/Dec/gi, "డిసెంబర్")
               .replace(/Jan/gi, "జనవరి");
    } else if (lang === "ta") {
      res = res.replace(/Tomorrow/gi, "நாளை")
               .replace(/Today/gi, "இன்று")
               .replace(/Yesterday/gi, "நேற்று")
               .replace(/Just now/gi, "சற்று முன்")
               .replace(/10 mins ago/gi, "10 நிமிடங்களுக்கு முன்")
               .replace(/1 hour ago/gi, "1 மணி நேரத்திற்கு முன்")
               .replace(/2 hours ago/gi, "2 மணி நேரத்திற்கு முன்")
               .replace(/Aug/gi, "ஆகஸ்ட்")
               .replace(/Sep/gi, "செப்டம்பர்")
               .replace(/Oct/gi, "அக்டோபர்")
               .replace(/Nov/gi, "நவம்பர்")
               .replace(/Dec/gi, "டிசம்பர்")
               .replace(/Jan/gi, "ஜனவரி");
    }
    return res;
  }

  // Helper: Localize Job Time
  function formatJobTime(timeStr, lang) {
    if (!timeStr || !lang || lang === "en") return timeStr || "";
    if (lang === "hi") {
      return timeStr.replace(/AM/gi, "सुबह").replace(/PM/gi, "शाम");
    } else if (lang === "mr") {
      return timeStr.replace(/AM/gi, "सकाळी").replace(/PM/gi, "संध्याकाळी");
    } else if (lang === "te") {
      return timeStr.replace(/AM/gi, "ఉదయం").replace(/PM/gi, "సాయంత్రం");
    } else if (lang === "ta") {
      return timeStr.replace(/AM/gi, "காலை").replace(/PM/gi, "மாலை");
    }
    return timeStr;
  }

  // Helper: Localize Employer Company Names
  function getLocalizedEmployerName(name, lang) {
    if (!name || !lang || lang === "en") return name || "";
    const clean = name.trim().toLowerCase();
    const map = {
      "sharma builders": {
        hi: "शर्मा बिल्डर्स",
        mr: "शर्मा बिल्डर्स",
        te: "శర్మ బిల్డర్స్",
        ta: "சர்மா பில்டர்ஸ்"
      },
      "sharma builders & contractors": {
        hi: "शर्मा बिल्डर्स एंड कॉन्ट्रैक्टर्स",
        mr: "शर्मा बिल्डर्स आणि कॉन्ट्रॅक्टर्स",
        te: "శర్మ బిల్డర్స్ & కాంట్రాక్టర్స్",
        ta: "சர்மா பில்டர்ஸ் & ஒப்பந்ததாரர்கள்"
      },
      "abc construction": {
        hi: "एबीसी कंस्ट्रक्शन",
        mr: "एबीसी कन्स्ट्रक्शन",
        te: "ఎబిసి కన్‌స్ట్రక్షన్",
        ta: "ஏபிசி கன்ஸ்ட்ரக்ஷன்"
      },
      "pune home services": {
        hi: "पुणे होम सर्विसेज",
        mr: "पुणे होम सर्व्हिसेस",
        te: "పుణే హోమ్ సర్వీసెస్",
        ta: "புனே ஹோம் சர்வீசஸ்"
      },
      "pune home repair services": {
        hi: "पुणे होम रिपेयर सर्विसेज",
        mr: "पुणे होम दुरुस्ती सेवा",
        te: "పూణే హోమ్ రిపేర్ సర్వీసెస్",
        ta: "புனே ஹோம் பழுதுபார்க்கும் சேவைகள்"
      },
      "kothrud infrastructures": {
        hi: "कोथरूड इंफ्रास्ट्रक्चर्स",
        mr: "कोथरूड इन्फ्रास्ट्रक्चर्स",
        te: "కోత్రుడ్ ఇన్‌ఫ్రాస్ట్రక్చర్స్",
        ta: "கோத்ருட் உள்கட்டமைப்புகள்"
      }
    };
    return (map[clean] && map[clean][lang]) || name;
  }

  // Helper: Localize Status Badges (Pending, Accepted, Rejected, Completed, Paid, Held)
  function formatStatus(status, lang) {
    if (!status || !lang || lang === "en") return status || "";
    const map = {
      "pending": {
        hi: "लंबित",
        mr: "प्रलंबित",
        te: "పెండింగ్‌లో ఉంది",
        ta: "நிலுவையில் உள்ளது"
      },
      "accepted": {
        hi: "स्वीकृत",
        mr: "स्वीकृत",
        te: "అంగీకరించబడింది",
        ta: "ஏற்றுக்கொள்ளப்பட்டது"
      },
      "rejected": {
        hi: "अस्वीकृत",
        mr: "नाकारले",
        te: "తిరస్కరించబడింది",
        ta: "நிராகரிக்கப்பட்டது"
      },
      "completed": {
        hi: "पूर्ण",
        mr: "पूर्ण",
        te: "పూర్తయింది",
        ta: "முடிந்தது"
      },
      "paid": {
        hi: "भुगतान हुआ ✓",
        mr: "जमा झाले ✓",
        te: "చెల్లించబడింది ✓",
        ta: "செலுத்தப்பட்டது ✓"
      },
      "held": {
        hi: "एस्क्रो में लॉक 🔒",
        mr: "एस्क्रोमध्ये लॉक 🔒",
        te: "లాక్ చేయబడింది 🔒",
        ta: "பூட்டப்பட்டுள்ளது 🔒"
      },
      "in progress": {
        hi: "प्रगति पर",
        mr: "काम सुरू",
        te: "పురోగతిలో ఉంది",
        ta: "செயல்பாட்டில் உள்ளது"
      },
      "posted": {
        hi: "प्रकाशित",
        mr: "पोस्ट केले",
        te: "పోస్ట్ చేయబడింది",
        ta: "வெளியிடப்பட்டது"
      },
      "applications open": {
        hi: "आवेदन खुले हैं",
        mr: "अर्ज खुले आहेत",
        te: "దరఖాస్తులు ప్రారంభమయ్యాయి",
        ta: "விண்ணப்பங்கள் திறக்கப்பட்டுள்ளன"
      },
      "workers assigned": {
        hi: "मजदूर नियुक्त",
        mr: "कामगार नेमले",
        te: "కార్మికులు కేటాయించబడ్డారు",
        ta: "தொழிலாளர்கள் நியமிக்கப்பட்டுள்ளனர்"
      }
    };
    const key = status.trim().toLowerCase();
    return (map[key] && map[key][lang]) || status;
  }

  return {
    init,
    getApiKey,
    setApiKey,
    translate,
    getJobField,
    autoTranslateNewJob,
    smartFallbackTranslate,
    warmupTranslations,
    getLocalizedProfession,
    formatJobDate,
    formatJobTime,
    getLocalizedEmployerName,
    formatStatus
  };
})();
