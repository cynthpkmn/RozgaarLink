/**
 * RozgaarLink Main UI Application Renderer
 * Renders all screens with strict scrolling architecture, complete navigation flows,
 * trilingual localization, accessible touch targets, and voice-to-text integration.
 */

window.RozgaarApp = (function() {
  const containerId = "app-viewport-content";

  // -------------------------------------------------------------
  // PRODUCTION FIREBASE CLIENT CONFIGURATION
  // Project: rozgaarlink-60d5a
  // -------------------------------------------------------------
  const firebaseConfig = {
    apiKey: "AIzaSyC2mCojL-ppoRCriZbTAiYfbzh5488A_1E",
    authDomain: "rozgaarlink-60d5a.firebaseapp.com",
    projectId: "rozgaarlink-60d5a",
    storageBucket: "rozgaarlink-60d5a.firebasestorage.app",
    messagingSenderId: "184863534521",
    appId: "1:184863534521:web:4a94dc154e719705885a68",
    measurementId: "G-DV5F442P90"
  };

  // Initialize Firebase (Compat) if loaded and not yet initialized
  if (typeof firebase !== "undefined" && firebase.apps && !firebase.apps.length) {
    try {
      firebase.initializeApp(firebaseConfig);
    } catch (e) {
      console.warn("Firebase initialization warning:", e);
    }
  }

  // Recaptcha verifier instance and confirmation results for Phone Auth
  let recaptchaVerifier = null;
  let workerConfirmationResult = null;
  let employerConfirmationResult = null;

  function getRecaptchaVerifier() {
    if (typeof firebase === "undefined" || !firebase.auth) return null;
    if (!recaptchaVerifier) {
      try {
        recaptchaVerifier = new firebase.auth.RecaptchaVerifier("recaptcha-container", {
          size: "invisible",
          callback: () => {
            // Invisible reCAPTCHA solved automatically
          },
          "expired-callback": () => {
            if (recaptchaVerifier) {
              try { recaptchaVerifier.clear(); } catch (e) {}
              recaptchaVerifier = null;
            }
          }
        });
      } catch (e) {
        console.warn("RecaptchaVerifier init error:", e);
      }
    }
    return recaptchaVerifier;
  }

  function init() {
    window.RozgaarState.init();
    window.RozgaarVoice.init();

    // Subscribe to state changes to re-render screen
    window.RozgaarState.subscribe(renderCurrentScreen);

    // Initial render
    renderCurrentScreen(window.RozgaarState.getState());

    // Setup live clock in phone island
    updateClock();
    setInterval(updateClock, 30000);
  }

  function updateClock() {
    const el = document.getElementById("phone-status-time");
    if (el) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      el.textContent = `${hours}:${minutes}`;
    }
  }

  function renderCurrentScreen(state) {
    const root = document.getElementById(containerId);
    if (!root) return;

    const screen = state.currentScreen;
    const params = state.screenParams || {};

    switch (screen) {
      case "welcome":
        root.innerHTML = renderWelcome(state);
        break;
      case "language":
        root.innerHTML = renderLanguageSelection(state);
        break;
      case "userType":
        root.innerHTML = renderUserTypeSelection(state);
        break;

      // Worker Flow
      case "workerAuth":
        root.innerHTML = renderWorkerAuth(state);
        break;
      case "workerSignUp":
        root.innerHTML = renderWorkerSignUp(state);
        break;
      case "workerSignIn":
        root.innerHTML = renderWorkerSignIn(state);
        break;
      case "workerDashboard":
        root.innerHTML = renderWorkerDashboard(state);
        postRenderWorkerDashboard(state);
        break;
      case "jobDetails":
        root.innerHTML = renderWorkerJobDetails(state, params);
        postRenderJobDetails(state, params);
        break;

      // Employer Flow
      case "employerAuth":
        root.innerHTML = renderEmployerAuth(state);
        break;
      case "employerSignUp":
        root.innerHTML = renderEmployerSignUp(state);
        break;
      case "employerSignIn":
        root.innerHTML = renderEmployerSignIn(state);
        break;
      case "employerDashboard":
        root.innerHTML = renderEmployerDashboard(state);
        break;
      case "employerPostJob":
        root.innerHTML = renderEmployerPostJob(state);
        break;
      case "employerActiveJobs":
        root.innerHTML = renderEmployerActiveJobs(state);
        break;
      case "employerJobDetails":
        root.innerHTML = renderEmployerJobDetails(state, params);
        break;
      case "employerWorkerApplications":
        root.innerHTML = renderEmployerWorkerApplications(state, params);
        break;
      case "employerWorkerProfile":
        root.innerHTML = renderEmployerWorkerProfile(state, params);
        break;
      case "employerRecentPayments":
        root.innerHTML = renderEmployerRecentPayments(state);
        break;

      // Global Common Screens
      case "transactionDetails":
        root.innerHTML = renderTransactionDetails(state, params);
        break;
      case "notifications":
        root.innerHTML = renderNotifications(state);
        break;
      case "settings":
        root.innerHTML = renderSettings(state);
        break;

      default:
        root.innerHTML = renderWelcome(state);
        break;
    }
  }

  // ==========================================
  // 1. ONBOARDING & LANGUAGE & USER TYPE
  // ==========================================

  function renderWelcome(state) {
    const t = window.RozgaarState.t;
    return `
      <div class="screen-scroll-container without-bottom-nav flex flex-col justify-between items-center text-center min-h-full py-6">
        <div class="w-full flex justify-end">
          <button onclick="window.RozgaarState.pushScreen('language')" class="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <span>🌐</span>
            <span>${state.language === 'hi' ? 'हिंदी' : state.language === 'mr' ? 'मराठी' : 'English'}</span>
          </button>
        </div>

        <div class="my-auto flex flex-col items-center px-4">
          <!-- Logo & Branding -->
          <div class="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-400 p-0.5 shadow-2xl shadow-indigo-500/30 mb-6 flex items-center justify-center">
            <div class="w-full h-full bg-[#090D16] rounded-[22px] flex flex-col items-center justify-center">
              <span class="text-3xl">🤝</span>
              <span class="text-xs font-bold text-indigo-400 mt-1 tracking-wider uppercase">ROZGAAR</span>
            </div>
          </div>

          <h1 class="text-3xl font-extrabold text-white tracking-tight mb-2">
            ${t("appName")}
          </h1>
          <p class="text-indigo-300 font-semibold text-base mb-6 tracking-wide">
            ${t("tagline")}
          </p>

          <p class="text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
            ${t("workerRoleDesc")}
          </p>

          <!-- 5 KM Radius & Escrow Feature Highlights -->
          <div class="grid grid-cols-2 gap-3 w-full max-w-xs text-left mb-6">
            <div class="rl-card p-3 border-indigo-500/30 bg-slate-900/60">
              <div class="text-indigo-400 text-lg mb-1">📍 5 KM</div>
              <div class="text-xs font-medium text-slate-300">Nearby Local Work</div>
              <div class="text-[10px] text-slate-500">Quick daily commute</div>
            </div>
            <div class="rl-card p-3 border-blue-500/30 bg-slate-900/60">
              <div class="text-blue-400 text-lg mb-1">🔒 Escrow</div>
              <div class="text-xs font-medium text-slate-300">Guaranteed Pay</div>
              <div class="text-[10px] text-slate-500">Held until work done</div>
            </div>
          </div>
        </div>

        <div class="w-full px-4">
          <button onclick="window.RozgaarState.pushScreen('language')" class="rl-btn rl-btn-primary w-full text-base py-3.5 shadow-lg">
            <span>${t("getStarted")}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderLanguageSelection(state) {
    const t = window.RozgaarState.t;
    return `
      <div class="screen-scroll-container without-bottom-nav flex flex-col justify-between min-h-full py-4">
        <div>
          <div class="flex items-center gap-3 mb-6">
            <button onclick="window.RozgaarState.goBack()" class="back-btn">←</button>
            <h2 class="text-xl font-bold text-white">${t("chooseLanguage")}</h2>
          </div>

          <p class="text-slate-400 text-sm mb-6">
            Select your preferred language. You can change this anytime from Settings.
          </p>

          <div class="space-y-3.5">
            <!-- Hindi -->
            <button onclick="window.RozgaarState.setLanguage('hi')" class="w-full p-4 rounded-2xl text-left border transition flex items-center justify-between ${state.language === 'hi' ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-950/50' : 'bg-slate-900/70 border-slate-800'}">
              <div class="flex items-center gap-3.5">
                <span class="text-2xl">🇮🇳</span>
                <div>
                  <div class="text-base font-bold text-white">हिंदी (Hindi)</div>
                  <div class="text-xs text-slate-400">पास काम। बेहतर दाम।</div>
                </div>
              </div>
              <span class="w-6 h-6 rounded-full border flex items-center justify-center ${state.language === 'hi' ? 'border-indigo-500 bg-indigo-600 text-white text-xs' : 'border-slate-700'}">
                ${state.language === 'hi' ? '✓' : ''}
              </span>
            </button>

            <!-- Marathi -->
            <button onclick="window.RozgaarState.setLanguage('mr')" class="w-full p-4 rounded-2xl text-left border transition flex items-center justify-between ${state.language === 'mr' ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-950/50' : 'bg-slate-900/70 border-slate-800'}">
              <div class="flex items-center gap-3.5">
                <span class="text-2xl">🚩</span>
                <div>
                  <div class="text-base font-bold text-white">मराठी (Marathi)</div>
                  <div class="text-xs text-slate-400">जवळ काम। जास्त दाम।</div>
                </div>
              </div>
              <span class="w-6 h-6 rounded-full border flex items-center justify-center ${state.language === 'mr' ? 'border-indigo-500 bg-indigo-600 text-white text-xs' : 'border-slate-700'}">
                ${state.language === 'mr' ? '✓' : ''}
              </span>
            </button>

            <!-- Telugu -->
            <button onclick="window.RozgaarState.setLanguage('te')" class="w-full p-4 rounded-2xl text-left border transition flex items-center justify-between ${state.language === 'te' ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-950/50' : 'bg-slate-900/70 border-slate-800'}">
              <div class="flex items-center gap-3.5">
                <span class="text-2xl">🏛️</span>
                <div>
                  <div class="text-base font-bold text-white">తెలుగు (Telugu)</div>
                  <div class="text-xs text-slate-400">దగ్గర పని. మంచి సంపాదన.</div>
                </div>
              </div>
              <span class="w-6 h-6 rounded-full border flex items-center justify-center ${state.language === 'te' ? 'border-indigo-500 bg-indigo-600 text-white text-xs' : 'border-slate-700'}">
                ${state.language === 'te' ? '✓' : ''}
              </span>
            </button>

            <!-- Tamil -->
            <button onclick="window.RozgaarState.setLanguage('ta')" class="w-full p-4 rounded-2xl text-left border transition flex items-center justify-between ${state.language === 'ta' ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-950/50' : 'bg-slate-900/70 border-slate-800'}">
              <div class="flex items-center gap-3.5">
                <span class="text-2xl">🛕</span>
                <div>
                  <div class="text-base font-bold text-white">தமிழ் (Tamil)</div>
                  <div class="text-xs text-slate-400">அருகில் வேலை. சிறந்த வருமானம்.</div>
                </div>
              </div>
              <span class="w-6 h-6 rounded-full border flex items-center justify-center ${state.language === 'ta' ? 'border-indigo-500 bg-indigo-600 text-white text-xs' : 'border-slate-700'}">
                ${state.language === 'ta' ? '✓' : ''}
              </span>
            </button>

            <!-- English -->
            <button onclick="window.RozgaarState.setLanguage('en')" class="w-full p-4 rounded-2xl text-left border transition flex items-center justify-between ${state.language === 'en' ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-950/50' : 'bg-slate-900/70 border-slate-800'}">
              <div class="flex items-center gap-3.5">
                <span class="text-2xl">🇬🇧</span>
                <div>
                  <div class="text-base font-bold text-white">English</div>
                  <div class="text-xs text-slate-400">Work Nearby. Earn Better.</div>
                </div>
              </div>
              <span class="w-6 h-6 rounded-full border flex items-center justify-center ${state.language === 'en' ? 'border-indigo-500 bg-indigo-600 text-white text-xs' : 'border-slate-700'}">
                ${state.language === 'en' ? '✓' : ''}
              </span>
            </button>
          </div>
        </div>

        <div class="pt-6">
          <button onclick="window.RozgaarState.pushScreen('userType')" class="rl-btn rl-btn-primary w-full text-base py-3.5">
            <span>${t("continueBtn")}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderUserTypeSelection(state) {
    const t = window.RozgaarState.t;
    return `
      <div class="screen-scroll-container without-bottom-nav flex flex-col justify-between min-h-full py-4">
        <div>
          <div class="flex items-center gap-3 mb-6">
            <button onclick="window.RozgaarState.goBack()" class="back-btn">←</button>
            <h2 class="text-xl font-bold text-white">RozgaarLink</h2>
          </div>

          <h3 class="text-lg font-bold text-white mb-2">
            ${t("selectUserType")}
          </h3>
          <p class="text-slate-400 text-xs mb-6 leading-relaxed">
            Choose your account type to proceed with tailored services.
          </p>

          <div class="space-y-4">
            <!-- Option 1: Worker -->
            <div onclick="window.RozgaarApp.selectRoleAndNavigate('worker')" class="rl-card p-5 cursor-pointer hover:border-indigo-500 border border-slate-800 group transition">
              <div class="flex items-start gap-4">
                <div class="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-3xl group-hover:scale-105 transition">
                  👷‍♂️
                </div>
                <div class="flex-1">
                  <div class="text-base font-bold text-white flex items-center justify-between">
                    <span>${t("workerRole")}</span>
                    <span class="text-indigo-400 text-sm">→</span>
                  </div>
                  <p class="text-xs text-slate-400 mt-1 leading-normal">
                    ${t("workerRoleDesc")}
                  </p>
                  <div class="flex flex-wrap gap-1.5 mt-3">
                    <span class="text-[10px] px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">Mason</span>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">Electrician</span>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">Carpenter</span>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">Plumber</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Option 2: Employer -->
            <div onclick="window.RozgaarApp.selectRoleAndNavigate('employer')" class="rl-card p-5 cursor-pointer hover:border-blue-500 border border-slate-800 group transition">
              <div class="flex items-start gap-4">
                <div class="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-3xl group-hover:scale-105 transition">
                  🏗️
                </div>
                <div class="flex-1">
                  <div class="text-base font-bold text-white flex items-center justify-between">
                    <span>${t("employerRole")}</span>
                    <span class="text-blue-400 text-sm">→</span>
                  </div>
                  <p class="text-xs text-slate-400 mt-1 leading-normal">
                    ${t("employerRoleDesc")}
                  </p>
                  <div class="flex flex-wrap gap-1.5 mt-3">
                    <span class="text-[10px] px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40">Contractors</span>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40">Builders</span>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40">Homeowners</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center pt-4">
          <span class="text-xs text-slate-500">RozgaarLink Platform • Pune Region</span>
        </div>
      </div>
    `;
  }

  function selectRoleAndNavigate(role) {
    window.RozgaarState.setUserRole(role);
    if (role === "worker") {
      window.RozgaarState.pushScreen("workerAuth");
    } else {
      window.RozgaarState.pushScreen("employerAuth");
    }
  }

  // ==========================================
  // 2. WORKER AUTH (Sign Up & Sign In)
  // ==========================================

  function renderWorkerAuth(state) {
    const t = window.RozgaarState.t;
    return `
      <div class="screen-scroll-container without-bottom-nav flex flex-col justify-between min-h-full py-4">
        <div>
          <div class="flex items-center gap-3 mb-6">
            <button onclick="window.RozgaarState.goBack()" class="back-btn">←</button>
            <h2 class="text-xl font-bold text-white">${t("workerRole")}</h2>
          </div>

          <div class="text-center my-6">
            <div class="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-3xl mx-auto mb-3">
              👷‍♂️
            </div>
            <h3 class="text-xl font-bold text-white">Daily Worker Portal</h3>
            <p class="text-xs text-slate-400 mt-1">Get jobs near you within 5 km and guaranteed daily pay.</p>
          </div>

          <div class="space-y-3.5 max-w-sm mx-auto">
            <button onclick="window.RozgaarState.pushScreen('workerSignUp')" class="rl-btn rl-btn-primary w-full py-3.5 text-base">
              <span>${t("newUser")}</span>
              <span>→</span>
            </button>

            <button onclick="window.RozgaarState.pushScreen('workerSignIn')" class="rl-btn rl-btn-secondary w-full py-3.5 text-base border-slate-700">
              <span>${t("alreadyRegistered")}</span>
            </button>
          </div>
        </div>

        <div class="text-center pt-4">
          <div class="flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>🛡️ Verified Profiles</span>
            <span>•</span>
            <span>💰 Escrow Protection</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderWorkerSignUp(state) {
    const t = window.RozgaarState.t;
    // Routing Guard: Prevent landing on Step 2 if Step 1 is invalid
    if (state.authForm.step === 2) {
      const v1 = window.RozgaarState.validateWorkerStep1(state.authForm.workerData);
      if (!v1.valid) {
        state.authForm.step = 1;
        state.authForm.step1Completed = false;
      }
    }
    const step = state.authForm.step || 1;
    const data = state.authForm.workerData;
    const errors = state.authForm.validationErrors || {};

    return `
      <div class="screen-scroll-container without-bottom-nav min-h-full py-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <button onclick="window.RozgaarApp.handleWorkerRegBack()" class="back-btn">←</button>
            <h2 class="text-lg font-bold text-white">${t("signUp")} (${step}/2)</h2>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">Worker</span>
        </div>

        <!-- Progress Steps Indicator -->
        <div class="flex items-center gap-2 mb-6">
          <div class="flex-1 h-2 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-slate-800'}"></div>
          <div class="flex-1 h-2 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-800'}"></div>
        </div>

        ${step === 1 ? renderWorkerSignUpStep1(state, data, errors) : ''}
        ${step === 2 ? renderWorkerSignUpStep2(state, data, errors) : ''}
      </div>
    `;
  }

  function renderWorkerSignUpStep1(state, data, errors) {
    const t = window.RozgaarState.t;
    return `
      <div class="space-y-4">
        <div class="mb-2">
          <h3 class="text-base font-bold text-white">${t("step1Title")}</h3>
          <p class="text-xs text-slate-400">Please enter your basic information. Tap 🎤 for voice typing.</p>
        </div>

        <!-- Full Name -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("fullName")} <span class="text-rose-400">*</span></label>
          <div class="rl-input-group ${errors.name ? 'border border-rose-500 rounded-xl' : ''}">
            <input type="text" id="w-reg-name" value="${data.name || ''}" placeholder="e.g. Rajesh Kumar" class="rl-input ${errors.name ? '!bg-rose-950/20' : ''}" oninput="window.RozgaarApp.updateWorkerData('name', this.value); window.RozgaarApp.clearFieldError('name')" onchange="window.RozgaarApp.updateWorkerData('name', this.value)" />
            <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('w-reg-name'), 'name')">🎤</button>
          </div>
          ${errors.name ? `<p id="err-name" class="text-[11px] text-rose-400 mt-1 flex items-center gap-1"><span>⚠️</span> <span>${errors.name}</span></p>` : ''}
        </div>

        <!-- Mobile Number -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("mobileNumber")} <span class="text-rose-400">*</span></label>
          <div class="rl-input-group ${errors.mobile ? 'border border-rose-500 rounded-xl' : ''}">
            <input type="tel" id="w-reg-mobile" value="${data.mobile || ''}" placeholder="e.g. 9822145670" maxlength="10" class="rl-input ${errors.mobile ? '!bg-rose-950/20' : ''}" oninput="window.RozgaarApp.updateWorkerData('mobile', this.value); window.RozgaarApp.clearFieldError('mobile')" onchange="window.RozgaarApp.updateWorkerData('mobile', this.value)" />
            <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('w-reg-mobile'), 'default')">🎤</button>
          </div>
          ${errors.mobile ? `<p id="err-mobile" class="text-[11px] text-rose-400 mt-1 flex items-center gap-1"><span>⚠️</span> <span>${errors.mobile}</span></p>` : ''}
        </div>

        <!-- Age & Gender -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("age")} <span class="text-rose-400">*</span></label>
            <input type="number" id="w-reg-age" value="${data.age || 30}" min="18" max="70" class="rl-input !pr-3 ${errors.age ? 'border-rose-500 bg-rose-950/20' : ''}" oninput="window.RozgaarApp.updateWorkerData('age', this.value); window.RozgaarApp.clearFieldError('age')" onchange="window.RozgaarApp.updateWorkerData('age', this.value)" />
            ${errors.age ? `<p id="err-age" class="text-[11px] text-rose-400 mt-1 flex items-center gap-1"><span>⚠️</span> <span>${errors.age}</span></p>` : ''}
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("gender")}</label>
            <select id="w-reg-gender" class="rl-input !pr-3 bg-slate-900 text-white" onchange="window.RozgaarApp.updateWorkerData('gender', this.value)">
              <option value="Male" ${data.gender === 'Male' ? 'selected' : ''}>${t("male")}</option>
              <option value="Female" ${data.gender === 'Female' ? 'selected' : ''}>${t("female")}</option>
              <option value="Other" ${data.gender === 'Other' ? 'selected' : ''}>${t("otherGender")}</option>
            </select>
          </div>
        </div>

        <!-- Address -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("address")} <span class="text-rose-400">*</span></label>
          <div class="rl-input-group ${errors.address ? 'border border-rose-500 rounded-xl' : ''}">
            <input type="text" id="w-reg-address" value="${data.address || ''}" placeholder="e.g. Near Maruti Mandir, Kothrud" class="rl-input ${errors.address ? '!bg-rose-950/20' : ''}" oninput="window.RozgaarApp.updateWorkerData('address', this.value); window.RozgaarApp.clearFieldError('address')" onchange="window.RozgaarApp.updateWorkerData('address', this.value)" />
            <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('w-reg-address'), 'location')">🎤</button>
          </div>
          ${errors.address ? `<p id="err-address" class="text-[11px] text-rose-400 mt-1 flex items-center gap-1"><span>⚠️</span> <span>${errors.address}</span></p>` : ''}
        </div>

        <!-- City & Current Location -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("currentLocation")} <span class="text-rose-400">*</span></label>
          <div class="rl-input-group ${errors.locationName ? 'border border-rose-500 rounded-xl' : ''}">
            <input type="text" id="w-reg-location" value="${data.locationName || 'Kothrud, Pune'}" class="rl-input ${errors.locationName ? '!bg-rose-950/20' : ''}" oninput="window.RozgaarApp.updateWorkerData('locationName', this.value); window.RozgaarApp.clearFieldError('locationName')" onchange="window.RozgaarApp.updateWorkerData('locationName', this.value)" />
            <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('w-reg-location'), 'location')">🎤</button>
          </div>
          ${errors.locationName ? `<p id="err-locationName" class="text-[11px] text-rose-400 mt-1 flex items-center gap-1"><span>⚠️</span> <span>${errors.locationName}</span></p>` : ''}
          <span class="text-[10px] text-slate-500 mt-1 block">📍 GPS coordinates will be used to show jobs within 5 km.</span>
        </div>

        <!-- Action Button -->
        <div class="pt-4">
          <button onclick="window.RozgaarApp.proceedWorkerStep(2)" class="rl-btn rl-btn-primary w-full py-3.5">
            <span>${t("continueBtn")}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderWorkerSignUpStep2(state, data, errors) {
    const t = window.RozgaarState.t;
    return `
      <div class="space-y-4">
        <div class="mb-2">
          <h3 class="text-base font-bold text-white">${t("step2Title")}</h3>
          <p class="text-xs text-slate-400">Define your trade and daily wage expectations. Voice typing supported.</p>
        </div>

        <!-- Profession Selection -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("profession")} <span class="text-rose-400">*</span></label>
          <select id="w-reg-prof" class="rl-input !pr-3 bg-slate-900 text-white" onchange="window.RozgaarApp.updateWorkerData('profession', this.value)">
            <option value="Mason" ${data.profession === 'Mason' ? 'selected' : ''}>${t("profMason")} (Mason)</option>
            <option value="Electrician" ${data.profession === 'Electrician' ? 'selected' : ''}>${t("profElectrician")} (Electrician)</option>
            <option value="Carpenter" ${data.profession === 'Carpenter' ? 'selected' : ''}>${t("profCarpenter")} (Carpenter)</option>
            <option value="Plumber" ${data.profession === 'Plumber' ? 'selected' : ''}>${t("profPlumber")} (Plumber)</option>
            <option value="Painter" ${data.profession === 'Painter' ? 'selected' : ''}>${t("profPainter")} (Painter)</option>
            <option value="Construction Worker" ${data.profession === 'Construction Worker' ? 'selected' : ''}>${t("profConstruction")} (Construction)</option>
            <option value="Helper" ${data.profession === 'Helper' ? 'selected' : ''}>${t("profHelper")} (Helper)</option>
            <option value="Other" ${data.profession === 'Other' ? 'selected' : ''}>${t("profOther")} (Other)</option>
          </select>
        </div>

        <!-- Skills -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("skills")} <span class="text-rose-400">*</span></label>
          <div class="rl-input-group ${errors.skills ? 'border border-rose-500 rounded-xl' : ''}">
            <input type="text" id="w-reg-skills" value="${data.skills || ''}" placeholder="e.g. Red brickwork, Plastering, Tiles" class="rl-input ${errors.skills ? '!bg-rose-950/20' : ''}" oninput="window.RozgaarApp.updateWorkerData('skills', this.value); window.RozgaarApp.clearFieldError('skills')" onchange="window.RozgaarApp.updateWorkerData('skills', this.value)" />
            <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('w-reg-skills'), 'skills')">🎤</button>
          </div>
          ${errors.skills ? `<p id="err-skills" class="text-[11px] text-rose-400 mt-1 flex items-center gap-1"><span>⚠️</span> <span>${errors.skills}</span></p>` : ''}
        </div>

        <!-- Experience & Expected Wage -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("yearsExp")}</label>
            <div class="rl-input-group">
              <input type="number" id="w-reg-exp" value="${data.yearsExp || 5}" min="0" max="45" class="rl-input" oninput="window.RozgaarApp.updateWorkerData('yearsExp', this.value)" onchange="window.RozgaarApp.updateWorkerData('yearsExp', this.value)" />
              <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('w-reg-exp'), 'experience')">🎤</button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("expectedWage")} <span class="text-rose-400">*</span></label>
            <div class="rl-input-group ${errors.expectedWage ? 'border border-rose-500 rounded-xl' : ''}">
              <input type="number" id="w-reg-wage" value="${data.expectedWage || 750}" step="50" min="200" class="rl-input ${errors.expectedWage ? '!bg-rose-950/20' : ''}" oninput="window.RozgaarApp.updateWorkerData('expectedWage', this.value); window.RozgaarApp.clearFieldError('expectedWage')" onchange="window.RozgaarApp.updateWorkerData('expectedWage', this.value)" />
              <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('w-reg-wage'), 'wage')">🎤</button>
            </div>
            ${errors.expectedWage ? `<p id="err-expectedWage" class="text-[11px] text-rose-400 mt-1 flex items-center gap-1"><span>⚠️</span> <span>${errors.expectedWage}</span></p>` : ''}
          </div>
        </div>

        <!-- Preferred Hours -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("preferredHours")}</label>
          <div class="rl-input-group">
            <input type="text" id="w-reg-hours" value="${data.preferredHours || '8:00 AM - 5:30 PM'}" class="rl-input" oninput="window.RozgaarApp.updateWorkerData('preferredHours', this.value)" onchange="window.RozgaarApp.updateWorkerData('preferredHours', this.value)" />
            <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('w-reg-hours'), 'default')">🎤</button>
          </div>
        </div>

        <!-- Aadhaar Number Input -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("aadhaarNumber")} <span class="text-rose-400">*</span></label>
          <div class="rl-input-group ${errors.aadhaarNumber ? 'border border-rose-500 rounded-xl' : ''}">
            <input type="text" id="w-reg-aadhaar" value="${data.aadhaarNumber || ''}" placeholder="e.g. 7845 9012 3456" maxlength="14" class="rl-input ${errors.aadhaarNumber ? '!bg-rose-950/20' : ''}" oninput="window.RozgaarApp.updateWorkerData('aadhaarNumber', this.value); window.RozgaarApp.clearFieldError('aadhaarNumber')" onchange="window.RozgaarApp.updateWorkerData('aadhaarNumber', this.value)" />
            <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('w-reg-aadhaar'), 'id')">🎤</button>
          </div>
          ${errors.aadhaarNumber ? `<p id="err-aadhaarNumber" class="text-[11px] text-rose-400 mt-1 flex items-center gap-1"><span>⚠️</span> <span>${errors.aadhaarNumber}</span></p>` : ''}
        </div>

        <!-- PAN Number Input -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("panNumber")} <span class="text-rose-400">*</span></label>
          <div class="rl-input-group ${errors.panNumber ? 'border border-rose-500 rounded-xl' : ''}">
            <input type="text" id="w-reg-pan" value="${data.panNumber || ''}" placeholder="e.g. ABCDE1234F" maxlength="10" class="rl-input uppercase ${errors.panNumber ? '!bg-rose-950/20' : ''}" oninput="window.RozgaarApp.updateWorkerData('panNumber', this.value); window.RozgaarApp.clearFieldError('panNumber')" onchange="window.RozgaarApp.updateWorkerData('panNumber', this.value)" />
            <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('w-reg-pan'), 'id')">🎤</button>
          </div>
          ${errors.panNumber ? `<p id="err-panNumber" class="text-[11px] text-rose-400 mt-1 flex items-center gap-1"><span>⚠️</span> <span>${errors.panNumber}</span></p>` : ''}
        </div>

        <!-- Action Button -->
        <div class="pt-4">
          <button onclick="window.RozgaarApp.completeWorkerRegistration()" class="rl-btn rl-btn-primary w-full py-3.5">
            <span>${t("completeReg")}</span>
            <span>✓</span>
          </button>
        </div>
      </div>
    `;
  }

  function handleWorkerRegBack() {
    const state = window.RozgaarState.getState();
    const step = state.authForm.step;
    if (step > 1) {
      state.authForm.step -= 1;
      state.authForm.validationErrors = {};
      window.RozgaarState.notify();
    } else {
      window.RozgaarState.goBack();
    }
  }

  function proceedWorkerStep(nextStep) {
    const state = window.RozgaarState.getState();
    const data = state.authForm.workerData;

    // Gating check for Step 1
    if (nextStep === 2) {
      const v1 = window.RozgaarState.validateWorkerStep1(data);
      if (!v1.valid) {
        state.authForm.validationErrors = v1.errors;
        state.authForm.step = 1;
        state.authForm.step1Completed = false;
        const firstErr = Object.values(v1.errors)[0] || "Please fill in all required fields";
        window.RozgaarState.toast(firstErr, "error");
        window.RozgaarState.notify();
        return;
      }
      state.authForm.validationErrors = {};
      state.authForm.step1Completed = true;
      state.authForm.step = 2;
      window.RozgaarState.notify();
      return;
    }

    state.authForm.step = nextStep;
    window.RozgaarState.notify();
  }

  function clearFieldError(field) {
    const state = window.RozgaarState.getState();
    if (state.authForm.validationErrors && state.authForm.validationErrors[field]) {
      delete state.authForm.validationErrors[field];
      const errEl = document.getElementById(`err-${field}`);
      if (errEl) errEl.remove();
    }
  }

  function updateWorkerData(field, val) {
    const data = window.RozgaarState.getState().authForm.workerData;
    data[field] = val;
  }

  async function completeWorkerRegistration() {
    const state = window.RozgaarState.getState();
    const data = state.authForm.workerData;
    const t = window.RozgaarState.t;

    // 1. Verify Step 1 gating
    const v1 = window.RozgaarState.validateWorkerStep1(data);
    if (!v1.valid) {
      state.authForm.step = 1;
      state.authForm.step1Completed = false;
      state.authForm.validationErrors = v1.errors;
      const firstErr = Object.values(v1.errors)[0] || "Please complete Step 1";
      window.RozgaarState.toast(firstErr, "error");
      window.RozgaarState.notify();
      return;
    }

    // 2. Verify Step 2 validation
    const v2 = window.RozgaarState.validateWorkerStep2(data);
    if (!v2.valid) {
      state.authForm.step = 2;
      state.authForm.validationErrors = v2.errors;
      const firstErr = Object.values(v2.errors)[0] || "Please complete all fields";
      window.RozgaarState.toast(firstErr, "error");
      window.RozgaarState.notify();
      return;
    }

    // Clear validation errors
    state.authForm.validationErrors = {};

    // Get active Firebase UID
    const activeUser = (typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser) || null;
    const activeUid = (activeUser && activeUser.uid) || localStorage.getItem("rozgaar_user_uid") || data.id;

    if (!activeUid) {
      window.RozgaarState.toast("Authentication required. Please sign in first.", "error");
      window.RozgaarState.replaceScreen("workerSignIn");
      return;
    }

    // 3. Construct new worker profile
    const newWorker = {
      id: activeUid,
      name: String(data.name).trim(),
      phone: String(data.mobile).trim(),
      age: Number(data.age) || 30,
      gender: data.gender || "Male",
      address: String(data.address).trim(),
      city: "Pune",
      locationName: String(data.locationName).trim() || "Kothrud, Pune",
      coordinates: { lat: 18.5074, lng: 73.8077 },
      profession: data.profession || "Mason",
      skills: String(data.skills).trim(),
      yearsExp: Number(data.yearsExp) || 3,
      expectedWage: Number(data.expectedWage) || 750,
      preferredHours: data.preferredHours || "8:00 AM - 5:30 PM",
      aadhaarNumber: String(data.aadhaarNumber).trim(),
      panNumber: String(data.panNumber).trim().toUpperCase(),
      verifiedWorker: true,
      availability: "Available for Work ✓",
      rating: 5.0,
      reviewsCount: 0,
      photoUrl: (activeUser && activeUser.photoURL) || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      workHistory: []
    };

    // 4. Persist to SQLite backend if API is connected
    if (window.RozgaarApi && window.RozgaarApi.registerWorker) {
      try {
        const apiRes = await window.RozgaarApi.registerWorker(newWorker);
        if (apiRes && apiRes.error) {
          const errMsg = apiRes.detail || apiRes.error || "Failed to register worker profile on server";
          console.warn("Backend worker registration error:", errMsg);
          window.RozgaarState.toast(errMsg, "error");
          return;
        }
      } catch (err) {
        console.warn("Could not register worker to backend DB", err);
      }
    }

    // 5. Save to state & establish active worker session
    state.workers = state.workers.filter(w => w.id !== newWorker.id);
    state.workers.unshift(newWorker);
    state.currentWorkerId = newWorker.id;
    state.userRole = "worker";
    state.activeWorkerTab = "home";

    // 6. Reset authForm state
    state.authForm.step = 1;
    state.authForm.step1Completed = false;
    state.authForm.validationErrors = {};
    state.authForm.workerData = {
      name: "",
      mobile: "",
      age: 30,
      gender: "Male",
      address: "",
      city: "Pune",
      locationName: "Kothrud, Pune",
      profession: "Mason",
      skills: "",
      yearsExp: 5,
      expectedWage: 800,
      preferredHours: "8:00 AM - 5:30 PM",
      aadhaarNumber: "",
      panNumber: "",
      verifiedWorker: true
    };

    // 7. Persist to localStorage
    window.RozgaarState.saveToStorage();

    // 8. Toast success and transition directly to Worker Dashboard
    window.RozgaarState.toast(t("registrationSuccess") || "Registration Complete! Welcome to RozgaarLink 👋", "success");
    window.RozgaarState.replaceScreen("workerDashboard");
  }

  function renderWorkerSignIn(state) {
    const t = window.RozgaarState.t;
    const otpSent = state.authForm.otpSent || false;

    return `
      <div class="screen-scroll-container without-bottom-nav flex flex-col justify-between min-h-full py-4">
        <div>
          <div class="flex items-center gap-3 mb-6">
            <button onclick="window.RozgaarState.goBack()" class="back-btn">←</button>
            <h2 class="text-xl font-bold text-white">${t("signIn")}</h2>
          </div>

          <p class="text-xs text-slate-400 mb-6">
            Quick Sign In with Registered Mobile Number & OTP. No passwords needed.
          </p>

          <div class="space-y-4 max-w-sm mx-auto">
            <!-- Mobile Number -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("mobileNumber")}</label>
              <div class="rl-input-group">
                <input type="tel" id="w-signin-mobile" value="${state.authForm.mobile || '9822145670'}" placeholder="${t('enterMobile')}" class="rl-input" onchange="window.RozgaarState.getState().authForm.mobile = this.value" />
                <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('w-signin-mobile'), 'default')">🎤</button>
              </div>
            </div>

            <!-- Send OTP Button -->
            ${!otpSent ? `
              <button onclick="window.RozgaarApp.sendWorkerOTP()" class="rl-btn rl-btn-primary w-full py-3.5">
                <span>${t("sendOtp")}</span>
                <span>📲</span>
              </button>
            ` : `
              <!-- OTP Input -->
              <div class="p-4 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-semibold text-indigo-300">${t("enterOtp")}</label>
                  <span class="text-[10px] text-emerald-400 font-mono">SMS Verification Code</span>
                </div>
                <input type="text" id="w-signin-otp" maxlength="6" value="" placeholder="Enter 6-digit OTP" class="rl-input text-center text-xl font-bold tracking-widest" />
                
                <button onclick="window.RozgaarApp.verifyWorkerOTP()" class="rl-btn rl-btn-primary w-full py-3">
                  <span>${t("verifyOtp")}</span>
                  <span>✓</span>
                </button>
              </div>
            `}

            <!-- Divider -->
            <div class="flex items-center gap-3 my-3">
              <div class="h-px bg-slate-800 flex-1"></div>
              <span class="text-[10px] text-slate-500 uppercase font-semibold">Or with Email</span>
              <div class="h-px bg-slate-800 flex-1"></div>
            </div>

            <!-- Email & Password Authentication Form -->
            <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <div class="rl-input-group">
                  <input type="email" id="email-input" placeholder="worker@example.com" class="rl-input" autocomplete="email" />
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-semibold text-slate-300">Password</label>
                  <button type="button" onclick="window.RozgaarApp.forgotPassword('worker')" class="text-[11px] text-indigo-400 hover:underline">Forgot Password?</button>
                </div>
                <div class="rl-input-group">
                  <input type="password" id="password-input" placeholder="Min. 6 characters" class="rl-input" autocomplete="current-password" onkeydown="if(event.key==='Enter') window.RozgaarApp.signInWithPassword('worker')" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-1">
                <button type="button" onclick="window.RozgaarApp.signInWithPassword('worker')" class="rl-btn rl-btn-primary py-2.5 text-xs font-bold">
                  <span>Sign In with Email</span>
                </button>
                <button type="button" onclick="window.RozgaarApp.registerWithPassword('worker')" class="rl-btn rl-btn-secondary py-2.5 text-xs font-bold border-indigo-500/50 text-indigo-300 hover:bg-indigo-950/40">
                  <span>Sign Up with Email</span>
                </button>
              </div>
            </div>

            <!-- Divider -->
            <div class="flex items-center gap-3 my-3">
              <div class="h-px bg-slate-800 flex-1"></div>
              <span class="text-[10px] text-slate-500 uppercase font-semibold">Or with Google</span>
              <div class="h-px bg-slate-800 flex-1"></div>
            </div>

            <!-- Clean Continue with Google Button -->
            <button type="button" onclick="window.RozgaarApp.signInWithGoogle('worker')" class="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2.5 shadow-md">
              <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.43 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.57 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </div>

        <div class="text-center pt-4">
          <button onclick="window.RozgaarState.pushScreen('workerSignUp')" class="text-xs text-indigo-400 hover:underline">
            ${t("newUser")}
          </button>
        </div>
      </div>
    `;
  }

  // -------------------------------------------------------------
  // FIREBASE AUTHENTICATION LOGIC: GOOGLE SIGN-IN & PHONE OTP
  // -------------------------------------------------------------

  async function completeLoginFlow(user, token, role = "worker") {
    if (!user || !user.uid) {
      window.RozgaarState.toast("Invalid user session. Please sign in again.", "error");
      return;
    }

    if (token) {
      localStorage.setItem("rozgaar_auth_token", token);
    }
    localStorage.setItem("rozgaar_user_uid", user.uid);

    const state = window.RozgaarState.getState();
    const cleanPhone = user.phoneNumber
      ? user.phoneNumber.replace(/^\+91/, "").replace(/\D/g, "")
      : (state.authForm.mobile || "").replace(/^\+91/, "").replace(/\D/g, "");

    window.RozgaarState.toast("Checking account profile...", "info");

    if (role === "worker") {
      let workerProfile = null;
      if (window.RozgaarApi && window.RozgaarApi.getWorker) {
        try {
          workerProfile = await window.RozgaarApi.getWorker(user.uid);
        } catch (e) {
          console.warn("Backend getWorker check failed:", e);
        }
      }

      if (!workerProfile) {
        workerProfile = state.workers.find(w => w.id === user.uid);
      }

      if (workerProfile) {
        // Returning Worker: Load profile into state & establish session
        const existingIdx = state.workers.findIndex(w => w.id === user.uid);
        if (existingIdx >= 0) {
          state.workers[existingIdx] = { ...state.workers[existingIdx], ...workerProfile };
        } else {
          state.workers.unshift(workerProfile);
        }
        state.currentWorkerId = user.uid;
        state.userRole = "worker";
        state.activeWorkerTab = "home";
        window.RozgaarState.saveToStorage();
        window.RozgaarState.toast(`Welcome back, ${workerProfile.name || "Worker"}! 👋`, "success");
        window.RozgaarState.replaceScreen("workerDashboard");
      } else {
        // New Worker: Pre-fill registration forms and route to Sign Up
        state.authForm.step = 1;
        state.authForm.step1Completed = false;
        state.authForm.validationErrors = {};
        const derivedName = user.displayName || (user.email ? user.email.split('@')[0] : "") || (state.authForm.workerData && state.authForm.workerData.name) || "";
        state.authForm.workerData = {
          ...(state.authForm.workerData || {}),
          id: user.uid,
          name: derivedName,
          mobile: cleanPhone || (state.authForm.workerData && state.authForm.workerData.mobile) || ""
        };
        window.RozgaarState.toast("Authentication verified! Please complete your worker profile.", "info");
        window.RozgaarState.replaceScreen("workerSignUp");
      }
    } else {
      let employerProfile = null;
      if (window.RozgaarApi && window.RozgaarApi.getEmployer) {
        try {
          employerProfile = await window.RozgaarApi.getEmployer(user.uid);
        } catch (e) {
          console.warn("Backend getEmployer check failed:", e);
        }
      }

      if (!employerProfile) {
        employerProfile = state.employers.find(e => e.id === user.uid);
      }

      if (employerProfile) {
        // Returning Employer: Load profile into state & establish session
        const existingIdx = state.employers.findIndex(e => e.id === user.uid);
        if (existingIdx >= 0) {
          state.employers[existingIdx] = { ...state.employers[existingIdx], ...employerProfile };
        } else {
          state.employers.unshift(employerProfile);
        }
        state.currentEmployerId = user.uid;
        state.userRole = "employer";
        window.RozgaarState.saveToStorage();
        window.RozgaarState.toast(`Welcome back, ${employerProfile.name || employerProfile.companyName || "Employer"}! 👋`, "success");
        window.RozgaarState.replaceScreen('employerDashboard');
      } else {
        // New Employer: Pre-fill registration forms and route to Sign Up
        const derivedEmpName = user.displayName || (user.email ? user.email.split('@')[0] : "") || (state.authForm.employerData && state.authForm.employerData.name) || "";
        const derivedCompany = user.displayName ? `${user.displayName} Construction` : (user.email ? `${user.email.split('@')[0]} Enterprises` : ((state.authForm.employerData && state.authForm.employerData.companyName) || ""));
        state.authForm.employerData = {
          ...(state.authForm.employerData || {}),
          id: user.uid,
          name: derivedEmpName,
          mobile: cleanPhone || (state.authForm.employerData && state.authForm.employerData.mobile) || "",
          companyName: derivedCompany
        };
        window.RozgaarState.toast("Authentication verified! Please complete your employer profile.", "info");
        window.RozgaarState.replaceScreen("employerSignUp");
      }
    }

    window.RozgaarState.notify();
  }

  async function registerWithPassword(role = "worker") {
    const emailEl = document.getElementById("email-input");
    const passEl = document.getElementById("password-input");

    const email = emailEl ? emailEl.value.trim() : "";
    const password = passEl ? passEl.value : "";

    if (!email || !email.includes("@")) {
      window.RozgaarState.toast("Please enter a valid email address", "error");
      if (emailEl) emailEl.focus();
      return;
    }

    if (!password || password.length < 6) {
      window.RozgaarState.toast("Password must be at least 6 characters", "error");
      if (passEl) passEl.focus();
      return;
    }

    try {
      if (typeof firebase === "undefined" || !firebase.auth) {
        window.RozgaarState.toast("Firebase Auth SDK not loaded. Check CDN scripts.", "error");
        return;
      }

      window.RozgaarState.toast("Creating account with Email...", "info");
      const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = result.user;
      const token = await user.getIdToken();

      await completeLoginFlow(user, token, role);
    } catch (err) {
      console.error("Email Registration Error:", err);
      let msg = err.message || "Failed to create account";
      if (err.code === "auth/email-already-in-use") {
        msg = "This email is already in use. Please sign in instead.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password is too weak. Please use at least 6 characters.";
      }
      window.RozgaarState.toast(msg, "error");
    }
  }

  async function signInWithPassword(role = "worker") {
    const emailEl = document.getElementById("email-input");
    const passEl = document.getElementById("password-input");

    const email = emailEl ? emailEl.value.trim() : "";
    const password = passEl ? passEl.value : "";

    if (!email || !email.includes("@")) {
      window.RozgaarState.toast("Please enter a valid email address", "error");
      if (emailEl) emailEl.focus();
      return;
    }

    if (!password || password.length < 6) {
      window.RozgaarState.toast("Password must be at least 6 characters", "error");
      if (passEl) passEl.focus();
      return;
    }

    try {
      if (typeof firebase === "undefined" || !firebase.auth) {
        window.RozgaarState.toast("Firebase Auth SDK not loaded. Check CDN scripts.", "error");
        return;
      }

      window.RozgaarState.toast("Signing in with Email...", "info");
      const result = await firebase.auth().signInWithEmailAndPassword(email, password);
      const user = result.user;
      const token = await user.getIdToken();

      await completeLoginFlow(user, token, role);
    } catch (err) {
      console.error("Email Sign-In Error:", err);
      let msg = err.message || "Invalid email or password";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        msg = "Invalid email or password. Please try again or sign up.";
      }
      window.RozgaarState.toast(msg, "error");
    }
  }

  async function forgotPassword(role = "worker") {
    const emailEl = document.getElementById("email-input");
    const email = emailEl ? emailEl.value.trim() : "";

    if (!email || !email.includes("@")) {
      window.RozgaarState.toast("Please enter your registered email address first", "error");
      if (emailEl) emailEl.focus();
      return;
    }

    try {
      if (typeof firebase === "undefined" || !firebase.auth) {
        window.RozgaarState.toast("Firebase Auth SDK not loaded. Check CDN scripts.", "error");
        return;
      }

      window.RozgaarState.toast("Sending password reset email...", "info");
      await firebase.auth().sendPasswordResetEmail(email);
      window.RozgaarState.toast("Password reset link sent! Check your inbox 📬", "success");
    } catch (err) {
      console.error("Password Reset Error:", err);
      window.RozgaarState.toast(err.message || "Failed to send password reset email", "error");
    }
  }

  const sendPasswordReset = forgotPassword;

  async function signInWithGoogle(role = "worker") {
    try {
      if (typeof firebase === "undefined" || !firebase.auth) {
        window.RozgaarState.toast("Firebase Auth SDK not loaded. Check CDN scripts.", "error");
        return;
      }

      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope("profile");
      provider.addScope("email");

      window.RozgaarState.toast("Connecting to Google Sign-In...", "info");
      const result = await firebase.auth().signInWithPopup(provider);
      const user = result.user;
      const token = await user.getIdToken();

      await completeLoginFlow(user, token, role);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      window.RozgaarState.toast(error.message || "Google Sign-In failed", "error");
    }
  }

  async function sendWorkerOTP() {
    const state = window.RozgaarState.getState();
    const inputEl = document.getElementById("w-signin-mobile");
    const rawMobile = inputEl ? inputEl.value.trim() : (state.authForm.mobile || "");

    if (!rawMobile || rawMobile.length < 10) {
      window.RozgaarState.toast(window.RozgaarState.t("errMobileRequired") || "Please enter a valid 10-digit mobile number", "error");
      return;
    }
    state.authForm.mobile = rawMobile;

    try {
      window.RozgaarState.toast("Sending SMS OTP via Firebase...", "info");
      const verifier = getRecaptchaVerifier();
      const cleanDigits = rawMobile.replace(/[^\d+]/g, "");
      const formattedPhone = cleanDigits.startsWith("+") ? cleanDigits : `+91${cleanDigits.replace(/^0+/, "")}`;

      workerConfirmationResult = await firebase.auth().signInWithPhoneNumber(formattedPhone, verifier);
      state.authForm.otpSent = true;
      window.RozgaarState.toast(window.RozgaarState.t("otpSentSuccess"), "success");
      window.RozgaarState.notify();
    } catch (err) {
      console.error("Firebase sendWorkerOTP error:", err);
      if (recaptchaVerifier) {
        try { recaptchaVerifier.render().then(widgetId => grecaptcha.reset(widgetId)); } catch(e) {}
      }
      window.RozgaarState.toast(err.message || "Failed to send OTP", "error");
    }
  }

  async function verifyWorkerOTP() {
    const state = window.RozgaarState.getState();
    const otpInput = document.getElementById("w-signin-otp");
    const otpCode = otpInput ? otpInput.value.trim() : "";

    if (!otpCode || otpCode.length < 4) {
      window.RozgaarState.toast("Please enter the 4-6 digit OTP code", "error");
      return;
    }

    if (!workerConfirmationResult) {
      window.RozgaarState.toast("No active OTP request found. Please request a new OTP.", "error");
      return;
    }

    try {
      window.RozgaarState.toast("Verifying OTP...", "info");
      const result = await workerConfirmationResult.confirm(otpCode);
      const user = result.user;
      const token = await user.getIdToken();

      await completeLoginFlow(user, token, "worker");
    } catch (err) {
      console.error("Firebase verifyWorkerOTP error:", err);
      window.RozgaarState.toast(err.message || "Invalid OTP code", "error");
    }
  }

  // ==========================================
  // 3. WORKER DASHBOARD & TABS
  // ==========================================

  function renderWorkerDashboard(state) {
    const activeTab = state.activeWorkerTab || "home";
    let tabContent = "";

    switch (activeTab) {
      case "home":
        tabContent = renderWorkerHomeTab(state);
        break;
      case "jobs":
        tabContent = renderWorkerJobsTab(state);
        break;
      case "applications":
        tabContent = renderWorkerApplicationsTab(state);
        break;
      case "payments":
        tabContent = renderWorkerPaymentsTab(state);
        break;
      case "profile":
        tabContent = renderWorkerProfileTab(state);
        break;
      default:
        tabContent = renderWorkerHomeTab(state);
        break;
    }

    return `
      <div class="relative w-full h-full flex flex-col overflow-hidden">
        <!-- Main Scrollable Content Area with bottom clearance -->
        <div class="screen-scroll-container with-bottom-nav">
          ${tabContent}
        </div>

        <!-- Mandatory Fixed Bottom Navigation -->
        ${renderWorkerBottomNav(activeTab)}
      </div>
    `;
  }

  function renderWorkerBottomNav(activeTab) {
    const t = window.RozgaarState.t;
    return `
      <div class="fixed-bottom-nav">
        <button onclick="window.RozgaarState.setWorkerTab('home')" class="nav-item ${activeTab === 'home' ? 'active' : ''}">
          <span class="text-lg">🏠</span>
          <span>${t("tabHome")}</span>
        </button>

        <button onclick="window.RozgaarState.setWorkerTab('jobs')" class="nav-item ${activeTab === 'jobs' ? 'active' : ''}">
          <span class="text-lg">🔨</span>
          <span>${t("tabJobs")}</span>
        </button>

        <button onclick="window.RozgaarState.setWorkerTab('applications')" class="nav-item ${activeTab === 'applications' ? 'active' : ''}">
          <span class="text-lg">📋</span>
          <span>${t("tabApplications")}</span>
        </button>

        <button onclick="window.RozgaarState.setWorkerTab('payments')" class="nav-item ${activeTab === 'payments' ? 'active' : ''}">
          <span class="text-lg">💰</span>
          <span>${t("tabPayments")}</span>
        </button>

        <button onclick="window.RozgaarState.setWorkerTab('profile')" class="nav-item ${activeTab === 'profile' ? 'active' : ''}">
          <span class="text-lg">👤</span>
          <span>${t("tabProfile")}</span>
        </button>
      </div>
    `;
  }

  function postRenderWorkerDashboard(state) {
    const worker = window.RozgaarState.getCurrentWorker();
    if (state.activeWorkerTab === "home") {
      const nearbyJobs = getJobsForWorker(worker).slice(0, 6);
      if (window.RozgaarMap) {
        window.RozgaarMap.render("home-radar-map-container", nearbyJobs, worker, (jobId) => {
          window.RozgaarState.pushScreen("jobDetails", { jobId });
        });
      }
    } else if (state.activeWorkerTab === "jobs" && state.jobsViewMode === "map") {
      const activeProfFilter = state.activeProfFilter || "All";
      const searchQuery = state.searchQuery || "";
      const matchedJobs = getJobsForWorker(worker, searchQuery, activeProfFilter);
      if (window.RozgaarMap) {
        window.RozgaarMap.render("jobs-full-map-container", matchedJobs, worker, (jobId) => {
          window.RozgaarState.pushScreen("jobDetails", { jobId });
        }, { zoom: 13 });
      }
    }
  }

  function postRenderJobDetails(state, params) {
    const jobId = params?.jobId;
    const job = (state.jobs || []).find(j => j.id === jobId);
    const worker = window.RozgaarState.getCurrentWorker();
    if (job && document.getElementById("job-detail-mini-map") && window.RozgaarMap) {
      window.RozgaarMap.render("job-detail-mini-map", [job], worker, null, { zoom: 14 });
    }
  }

  // Job matching priority algorithm
  function getJobsForWorker(worker, filterText = "", professionFilter = "All") {
    const allJobs = window.RozgaarState.getState().jobs || [];
    const workerProf = worker?.profession || "Mason";

    return allJobs
      .filter(job => {
        if (professionFilter !== "All" && job.profession !== professionFilter) return false;
        if (filterText) {
          const q = filterText.toLowerCase();
          return (
            job.title.toLowerCase().includes(q) ||
            job.location.toLowerCase().includes(q) ||
            job.profession.toLowerCase().includes(q) ||
            job.requiredSkills.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        // Strict Job Matching Rule: Matching worker profession appears first!
        const aMatches = a.profession.toLowerCase() === workerProf.toLowerCase() ? 1 : 0;
        const bMatches = b.profession.toLowerCase() === workerProf.toLowerCase() ? 1 : 0;
        if (aMatches !== bMatches) return bMatches - aMatches;

        // Then prioritize distance within 5km
        return a.distance - b.distance;
      });
  }

  // TAB 1: WORKER HOME
  function renderWorkerHomeTab(state) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const worker = window.RozgaarState.getCurrentWorker() || {
      id: "w-fallback",
      name: "Rajesh Kumar",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      locationName: "Kothrud, Pune",
      profession: "Mason"
    };
    const allJobs = getJobsForWorker(worker);
    const nearbyJobs = allJobs.filter(j => (typeof j.distance === 'number' ? j.distance : 0) <= 5.0).slice(0, 5);
    const extendedCount = allJobs.filter(j => (typeof j.distance === 'number' ? j.distance : 0) > 5.0).length;

    return `
      <div class="space-y-4">
        <!-- Top Bar with Greeting and Settings/Notifications -->
        <div class="flex items-center justify-between pt-1">
          <div class="flex items-center gap-3">
            <img src="${worker.photoUrl}" class="w-11 h-11 rounded-full object-cover border-2 border-indigo-500 shadow" alt="${worker.name}" />
            <div>
              <div class="text-xs text-slate-400 font-medium">${t("greetingMorning")},</div>
              <h2 class="text-base font-bold text-white flex items-center gap-1.5">
                <span>${worker.name.split(' ')[0]}</span>
                <span class="text-sm">👋</span>
              </h2>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.RozgaarState.pushScreen('notifications')" class="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 relative">
              <span>🔔</span>
              <span class="w-2 h-2 rounded-full bg-indigo-500 absolute top-1.5 right-1.5"></span>
            </button>
            <button onclick="window.RozgaarState.pushScreen('settings')" class="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
              <span>⚙️</span>
            </button>
          </div>
        </div>

        <!-- 📍 Current Location Banner -->
        <div class="p-3 rounded-2xl bg-gradient-to-r from-indigo-950/70 to-blue-950/70 border border-indigo-500/30 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base">📍</span>
            <div>
              <div class="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">${t("locationPin")}</div>
              <div class="text-xs font-bold text-white">${worker.locationName}</div>
            </div>
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
            ${t("radiusText")}
          </span>
        </div>

        <!-- Interactive 5 KM Radar Map -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300">${t("nearbyJobsMap")}</h3>
            <span class="text-[10px] text-indigo-400">${currentLang === 'hi' ? 'लाइव जीपीएस रडार' : currentLang === 'mr' ? 'थेट जीपीएस रडार' : currentLang === 'te' ? 'లైవ్ జీపీఎస్ రాడార్' : currentLang === 'ta' ? 'நேரலை ஜிபிஎஸ் ரேடார்' : 'Live GPS Radar'}</span>
          </div>
          <div id="home-radar-map-container"></div>
        </div>

        <!-- Protected Payment Banner -->
        <div class="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xl">
            🔒
          </div>
          <div class="flex-1">
            <div class="text-xs font-bold text-white">${t("escrowGuaranteed")}</div>
            <div class="text-[11px] text-slate-400">${t("heldNote")}</div>
          </div>
        </div>

        <!-- Nearby Jobs List (Strictly within 5 km) -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <h3 class="text-sm font-bold text-white">${t("sectionNearbyJobs")} (${nearbyJobs.length})</h3>
            </div>
            <button onclick="window.RozgaarState.setWorkerTab('jobs')" class="text-xs text-indigo-400 font-semibold hover:underline">
              ${currentLang === 'hi' ? 'सभी देखें →' : currentLang === 'mr' ? 'सर्व पहा →' : currentLang === 'te' ? 'అన్నీ చూడండి →' : currentLang === 'ta' ? 'அனைத்தையும் காண்க →' : 'View All →'}
            </button>
          </div>

          ${nearbyJobs.length > 0 ? `
            <div class="space-y-3">
              ${nearbyJobs.map(job => renderWorkerJobCard(job, worker)).join("")}
            </div>
          ` : `
            <div class="rl-card p-5 text-center border border-slate-800 space-y-2 bg-[#0B1120]/80">
              <div class="text-xs font-semibold text-slate-300">⭕ ${t("noNearbyJobs")}</div>
              <p class="text-[11px] text-slate-500">${t("noJobsPostedYet")}</p>
            </div>
          `}

          ${extendedCount > 0 ? `
            <div onclick="window.RozgaarState.setWorkerTab('jobs')" class="mt-3 p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-center justify-between cursor-pointer hover:bg-amber-950/50 transition">
              <div class="flex items-center gap-2 text-xs text-amber-200">
                <span>🚗</span>
                <span><strong>${extendedCount}</strong> ${currentLang === 'hi' ? 'नौकरियां 5 किमी से अधिक दूरी पर उपलब्ध हैं' : currentLang === 'mr' ? 'कामे ५ किमी पलीकडे उपलब्ध आहेत' : currentLang === 'te' ? 'పనులు 5 కిమీ దాటి అందుబాటులో ఉన్నాయి' : currentLang === 'ta' ? 'வேலைகள் 5 கி.மீ தாண்டி கிடைக்கின்றன' : 'jobs available beyond 5 km radius'}</span>
              </div>
              <span class="text-xs text-amber-400 font-bold">→</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // TAB 2: WORKER JOBS (Profession Filtered)
  function renderWorkerJobsTab(state) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const worker = window.RozgaarState.getCurrentWorker();
    const activeProfFilter = state.activeProfFilter || "All";
    const searchQuery = state.searchQuery || "";
    const jobsViewMode = state.jobsViewMode || "list";

    const matchedJobs = getJobsForWorker(worker, searchQuery, activeProfFilter);
    const nearbyJobs = matchedJobs.filter(j => (typeof j.distance === "number" ? j.distance : 0) <= 5.0);
    const extendedJobs = matchedJobs.filter(j => (typeof j.distance === "number" ? j.distance : 0) > 5.0);

    const myTradeText = currentLang === 'hi' ? 'मेरा व्यवसाय' : currentLang === 'mr' ? 'माझा व्यवसाय' : currentLang === 'te' ? 'నా వృత్తి' : currentLang === 'ta' ? 'எனது தொழில்' : 'My Trade';
    const nearbyLabel = currentLang === 'hi' ? '5 किमी के भीतर' : currentLang === 'mr' ? '५ किमी आत' : currentLang === 'te' ? '5 కిమీ పరిధిలో' : currentLang === 'ta' ? '5 கி.மீக்குள்' : 'Within 5 km';
    const extendedLabel = currentLang === 'hi' ? '5 किमी से बाहर' : currentLang === 'mr' ? '५ किमी पलीकडे' : currentLang === 'te' ? '5 కిమీ దాటి' : currentLang === 'ta' ? '5 கி.மீ தாண்டி' : 'Beyond 5 km';
    const countText = `${nearbyJobs.length} ${nearbyLabel} • ${extendedJobs.length} ${extendedLabel}`;
    const sortedText = currentLang === 'hi' ? 'कौशल और दूरी अनुसार' : currentLang === 'mr' ? 'कौशल्य आणि अंतरानुसार' : currentLang === 'te' ? 'నైపుణ్యం & దూరం ప్రకారం' : currentLang === 'ta' ? 'திறன் & தூரம் வரிசை' : 'Sorted by Skill & Distance';

    return `
      <div class="space-y-4">
        <!-- Top Bar with Title and List / Map Segmented Switcher -->
        <div class="pt-1 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-white">${t("tabJobs")}</h2>
            <p class="text-xs text-indigo-300 font-medium mt-0.5">
              🎯 ${t("matchedForYou")}: <span class="text-white font-bold">${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession(worker.profession, currentLang) : worker.profession}</span>
            </p>
          </div>

          <!-- Segmented Toggle: 📋 List | 🗺️ Map -->
          <div class="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 shadow-sm">
            <button onclick="window.RozgaarState.setJobsViewMode('list')" class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${jobsViewMode === 'list' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}">
              <span>📋</span><span>${t("viewList")}</span>
            </button>
            <button onclick="window.RozgaarState.setJobsViewMode('map')" class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${jobsViewMode === 'map' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}">
              <span>🗺️</span><span>${t("viewMap")}</span>
            </button>
          </div>
        </div>

        <!-- Search Bar with 🎤 Voice Input -->
        <div class="rl-input-group">
          <input type="text" id="jobs-search-input" value="${searchQuery}" placeholder="${t('searchJobs')}" class="rl-input" oninput="window.RozgaarApp.handleJobsSearch(this.value)" />
          <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('jobs-search-input'), 'skills')">🎤</button>
        </div>

        <!-- Filter Pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button onclick="window.RozgaarApp.setProfessionFilter('All')" class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${activeProfFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}">
            ${t("filterAll")}
          </button>
          <button onclick="window.RozgaarApp.setProfessionFilter('${worker.profession}')" class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${activeProfFilter === worker.profession ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-indigo-300 border border-indigo-900/60'}">
            ⭐ ${myTradeText} (${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession(worker.profession, currentLang) : worker.profession})
          </button>
          <button onclick="window.RozgaarApp.setProfessionFilter('Mason')" class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${activeProfFilter === 'Mason' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}">
            ${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession('Mason', currentLang) : 'Mason'}
          </button>
          <button onclick="window.RozgaarApp.setProfessionFilter('Electrician')" class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${activeProfFilter === 'Electrician' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}">
            ${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession('Electrician', currentLang) : 'Electrician'}
          </button>
          <button onclick="window.RozgaarApp.setProfessionFilter('Carpenter')" class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${activeProfFilter === 'Carpenter' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}">
            ${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession('Carpenter', currentLang) : 'Carpenter'}
          </button>
          <button onclick="window.RozgaarApp.setProfessionFilter('Plumber')" class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${activeProfFilter === 'Plumber' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}">
            ${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession('Plumber', currentLang) : 'Plumber'}
          </button>
        </div>

        <!-- Filter Count -->
        <div class="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>${countText}</span>
          <span>${sortedText}</span>
        </div>

        <!-- Dynamic Content: List View or Map View -->
        ${jobsViewMode === 'map' ? `
          <div class="space-y-4">
            <div id="jobs-full-map-container" class="h-[360px] w-full"></div>

            <!-- Map View Section 1: Nearby -->
            <div class="space-y-2">
              <div class="flex items-center justify-between px-1">
                <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <span>📍</span><span>${t("sectionNearbyJobs")} (${nearbyJobs.length})</span>
                </span>
              </div>
              ${nearbyJobs.length > 0
                ? nearbyJobs.slice(0, 3).map(job => renderWorkerJobCard(job, worker)).join("")
                : `<div class="p-3 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">⭕ ${t("noNearbyJobs")}</div>`
              }
            </div>

            <!-- Map View Section 2: Extended -->
            <div class="space-y-2 pt-2 border-t border-slate-800">
              <div class="flex items-center justify-between px-1">
                <span class="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <span>🚗</span><span>${t("sectionExtendedJobs")} (${extendedJobs.length})</span>
                </span>
              </div>
              ${extendedJobs.length > 0
                ? extendedJobs.slice(0, 3).map(job => renderWorkerJobCard(job, worker)).join("")
                : `<div class="p-3 text-center text-xs text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800">${t("noExtendedJobs")}</div>`
              }
            </div>
          </div>
        ` : `
          <!-- List View: Two Distinct Geo-Fenced Sections -->
          ${matchedJobs.length === 0 ? `
            <div class="rl-card p-7 text-center border border-slate-800 space-y-3 bg-[#0B1120]/90">
              <div class="w-14 h-14 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-2xl mx-auto">
                📭
              </div>
              <div class="text-sm font-bold text-white">${t("noJobsPostedYet")}</div>
              <p class="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                ${currentLang === 'hi' ? 'जैसे ही नियोक्ता इस क्षेत्र में काम पोस्ट करेंगे, नौकरियां यहां तुरंत दिखाई देंगी।' : currentLang === 'mr' ? 'नियोक्त्यांनी काम पोस्ट करताच कामे येथे लगेच दिसतील.' : currentLang === 'te' ? 'యజమానులు పనిని పోస్ట్ చేసిన వెంటనే పనులు ఇక్కడ కనిపిస్తాయి.' : currentLang === 'ta' ? 'முதலாளிகள் வேலையை இடுகையிட்டவுடன் வேலைகள் இங்கே தோன்றும்.' : 'Jobs will only appear here when an employer actively posts work in your vicinity.'}
              </p>
              <div class="pt-2 flex justify-center gap-2">
                <button onclick="window.RozgaarState.seedDemoJobs()" class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow">
                  <span>⚡</span><span>Seed Demo Jobs Nearby</span>
                </button>
              </div>
            </div>
          ` : `
            <div class="space-y-5">
              <!-- SECTION 1: NEARBY JOBS (<= 5 KM) -->
              <div class="space-y-2.5">
                <div class="flex items-center justify-between px-1">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                      <span>📍</span><span>${t("sectionNearbyJobs")}</span>
                    </h3>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                    ${nearbyJobs.length} ${currentLang === 'hi' ? 'नौकरियां' : currentLang === 'mr' ? 'कामे' : currentLang === 'te' ? 'పనులు' : currentLang === 'ta' ? 'வேலைகள்' : 'Jobs'}
                  </span>
                </div>

                ${nearbyJobs.length > 0 ? `
                  <div class="space-y-3">
                    ${nearbyJobs.map(job => renderWorkerJobCard(job, worker)).join("")}
                  </div>
                ` : `
                  <div class="rl-card p-4 text-center border border-slate-800 text-xs text-slate-400 bg-[#0B1120]/60">
                    ⭕ ${t("noNearbyJobs")}
                  </div>
                `}
              </div>

              <!-- SECTION 2: EXTENDED DISTANCE JOBS (> 5 KM) -->
              <div class="space-y-2.5 pt-1 border-t border-slate-800/80">
                <div class="flex items-center justify-between px-1 pt-2">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <h3 class="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <span>🚗</span><span>${t("sectionExtendedJobs")}</span>
                    </h3>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/80">
                    ${extendedJobs.length} ${currentLang === 'hi' ? 'नौकरियां' : currentLang === 'mr' ? 'कामे' : currentLang === 'te' ? 'పనులు' : currentLang === 'ta' ? 'வேலைகள்' : 'Jobs'}
                  </span>
                </div>

                ${extendedJobs.length > 0 ? `
                  <div class="space-y-3">
                    ${extendedJobs.map(job => renderWorkerJobCard(job, worker)).join("")}
                  </div>
                ` : `
                  <div class="rl-card p-4 text-center border border-slate-800 text-xs text-slate-500 bg-[#0B1120]/40">
                    ${t("noExtendedJobs")}
                  </div>
                `}
              </div>
            </div>
          `}
        `}
      </div>
    `;
  }

  function handleJobsSearch(val) {
    window.RozgaarState.getState().searchQuery = val;
    window.RozgaarState.notify();
  }

  function setProfessionFilter(prof) {
    window.RozgaarState.getState().activeProfFilter = prof;
    window.RozgaarState.notify();
  }

  // Common Job Card for Worker
  function renderWorkerJobCard(job, worker) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const existingApp = window.RozgaarState.getState().applications.find(a => a.jobId === job.id && a.workerId === worker.id);
    const hasApplied = !!existingApp;
    const isMatchingSkill = job.profession.toLowerCase() === worker.profession.toLowerCase();

    const displayTitle = window.RozgaarGemini ? window.RozgaarGemini.getJobField(job, 'title') : job.title;
    const displayLocation = window.RozgaarGemini ? window.RozgaarGemini.getJobField(job, 'location') : job.location;
    const displayProfession = window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession(job.profession, currentLang) : job.profession;
    const displayDate = window.RozgaarGemini ? window.RozgaarGemini.formatJobDate(job.date, currentLang) : job.date;
    const displayTime = window.RozgaarGemini ? window.RozgaarGemini.formatJobTime(job.startTime + " - " + job.endTime, currentLang) : `${job.startTime} - ${job.endTime}`;
    const displayWageType = currentLang === 'hi' ? 'प्रति दिन' : currentLang === 'mr' ? 'दररोज' : currentLang === 'te' ? 'రోజుకు' : currentLang === 'ta' ? 'ஒரு நாளைக்கு' : job.wageType;
    const skillMatchText = currentLang === 'hi' ? '★ कौशल मेल' : currentLang === 'mr' ? '★ कौशल जुळणी' : currentLang === 'te' ? '★ నైపుణ్యం సరిపోలింది' : currentLang === 'ta' ? '★ திறன் பொருத்தம்' : '★ Skill Match';
    const verifiedText = currentLang === 'en' ? '✓ Verified' : currentLang === 'te' ? '✓ ధృవీకరించబడింది' : currentLang === 'ta' ? '✓ சரிபார்க்கப்பட்டது' : '✓ सत्यापित';
    const distanceUnit = currentLang === 'en' ? 'km' : currentLang === 'te' ? 'కిమీ' : currentLang === 'ta' ? 'கி.மீ' : 'किमी';

    return `
      <div class="rl-card p-4 border transition ${isMatchingSkill ? 'border-indigo-500/40 bg-[#0E1527]' : 'border-slate-800'}">
        <!-- Top Row: Profession pill, Matching badge, Distance -->
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-1.5">
            <span class="rl-badge badge-profession">${displayProfession}</span>
            ${isMatchingSkill ? `
              <span class="rl-badge bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 text-[10px]">
                ${skillMatchText}
              </span>
            ` : ''}
          </div>
          <span class="rl-badge badge-distance">📍 ${job.distance} ${distanceUnit}</span>
        </div>

        <!-- Job Title -->
        <div class="flex items-start justify-between gap-1.5 mb-1.5">
          <h4 class="text-sm font-bold text-white line-clamp-1 flex-1">${displayTitle}</h4>
          ${currentLang !== 'en' ? `
            <span class="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50 font-medium flex-shrink-0" title="Translated by Gemini AI">✨ AI</span>
          ` : ''}
        </div>

        <!-- Employer & Verification -->
        <div class="flex items-center gap-2 text-xs text-slate-400 mb-2.5">
          <span class="text-slate-200 font-semibold">${job.employerName}</span>
          <span class="rl-badge badge-verified text-[10px] py-0">${verifiedText}</span>
          <span>• ★ ${job.employerRating}</span>
        </div>

        <!-- Timing & Location Info -->
        <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mb-3 bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
          <div>🗓️ ${displayDate}</div>
          <div>⏰ ${displayTime}</div>
          <div class="col-span-2 truncate">📍 ${displayLocation}</div>
        </div>

        <!-- Wage & Actions -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-800">
          <div>
            <span class="text-base font-extrabold text-emerald-400">₹${job.wage}</span>
            <span class="text-[11px] text-slate-400">/${displayWageType}</span>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="window.RozgaarState.pushScreen('jobDetails', { jobId: '${job.id}' })" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200">
              ${t("viewDetails")}
            </button>

            ${hasApplied ? `
              <button disabled class="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold cursor-not-allowed">
                ${t("applied")}
              </button>
            ` : `
              <button onclick="window.RozgaarState.applyForJob('${job.id}')" class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow">
                ${t("applyNow")}
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // TAB 3: WORKER APPLICATIONS
  function renderWorkerApplicationsTab(state) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const worker = window.RozgaarState.getCurrentWorker();
    const apps = state.applications.filter(a => a.workerId === worker.id);

    const subTitle = currentLang === 'hi' ? 'अपने जमा किए गए आवेदनों और चयन की स्थिति देखें।'
                   : currentLang === 'mr' ? 'तुमचे सबमिट केलेले अर्ज आणि निवड स्थिती पहा.'
                   : currentLang === 'te' ? 'మీ సమర్పించిన దరఖాస్తులు మరియు ఎంపిక స్థితిని ట్రాక్ చేయండి.'
                   : currentLang === 'ta' ? 'உங்கள் சமர்ப்பிக்கப்பட்ட விண்ணப்பங்கள் மற்றும் தேர்வு நிலையை கண்காணிக்கவும்.'
                   : 'Track your submitted applications and hiring status.';

    const workLabel = currentLang === 'hi' ? 'काम:' : currentLang === 'mr' ? 'काम:' : currentLang === 'te' ? 'పని:' : currentLang === 'ta' ? 'வேலை:' : 'Work:';
    const wageUnit = currentLang === 'hi' ? 'दिन' : currentLang === 'mr' ? 'दिवस' : currentLang === 'te' ? 'రోజు' : currentLang === 'ta' ? 'நாள்' : 'day';
    const appliedPrefix = currentLang === 'hi' ? 'आवेदन किया:' : currentLang === 'mr' ? 'अर्ज केला:' : currentLang === 'te' ? 'దరఖాస్తు చేసారు:' : currentLang === 'ta' ? 'விண்ணப்பிக்கப்பட்டது:' : 'Applied:';
    const emptyText = currentLang === 'hi' ? 'अभी तक कोई आवेदन जमा नहीं किया गया है।'
                    : currentLang === 'mr' ? 'अद्याप कोणतेही अर्ज सबमिट केलेले नाहीत.'
                    : currentLang === 'te' ? 'ఇంకా ఎటువంటి దరఖాస్తులు సమర్పించబడలేదు.'
                    : currentLang === 'ta' ? 'இதுவரை எந்த விண்ணப்பமும் சமர்ப்பிக்கப்படவில்லை.'
                    : 'No applications submitted yet.';

    return `
      <div class="space-y-4">
        <div class="pt-1">
          <h2 class="text-lg font-bold text-white">${t("myApplications")}</h2>
          <p class="text-xs text-slate-400 mt-0.5">${subTitle}</p>
        </div>

        <div class="space-y-3">
          ${apps.length > 0 ? apps.map(app => {
            const statusColors = {
              "Pending": "badge-held",
              "Accepted": "badge-verified",
              "Rejected": "bg-red-950 text-red-400 border border-red-800",
              "Completed": "bg-blue-950 text-blue-400 border border-blue-800"
            };
            const badgeClass = statusColors[app.status] || "badge-held";

            // Resolve job from state.jobs for best localization
            const job = state.jobs.find(j => j.id === app.jobId);
            const displayTitle = job
              ? (window.RozgaarGemini ? window.RozgaarGemini.getJobField(job, 'title') : job.title)
              : (window.RozgaarGemini ? window.RozgaarGemini.getJobField(app, 'jobTitle') || app.jobTitle : app.jobTitle);

            const displayDateStr = job ? job.date : app.dateRequired;
            const displayDate = window.RozgaarGemini ? window.RozgaarGemini.formatJobDate(displayDateStr, currentLang) : displayDateStr;
            const displayEmployer = window.RozgaarGemini ? window.RozgaarGemini.getLocalizedEmployerName(app.employerName, currentLang) : app.employerName;
            const displayStatus = window.RozgaarGemini ? window.RozgaarGemini.formatStatus(app.status, currentLang) : app.status;
            const displayApplied = window.RozgaarGemini ? window.RozgaarGemini.formatJobDate(app.appliedDate, currentLang) : app.appliedDate;

            return `
              <div onclick="window.RozgaarState.pushScreen('jobDetails', { jobId: '${app.jobId}' })" class="rl-card p-4 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold text-indigo-300">${displayEmployer}</span>
                  <span class="rl-badge ${badgeClass}">${displayStatus}</span>
                </div>
                <div class="flex items-start justify-between gap-1.5 mb-2">
                  <h4 class="text-sm font-bold text-white line-clamp-2 flex-1">${displayTitle}</h4>
                  ${currentLang !== 'en' ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50 font-medium flex-shrink-0">✨ AI</span>` : ''}
                </div>
                <div class="flex items-center justify-between text-xs text-slate-400">
                  <span>🗓️ ${workLabel} ${displayDate}</span>
                  <span class="text-emerald-400 font-bold">₹${app.wage}/${wageUnit}</span>
                </div>
                <div class="text-[10px] text-slate-500 mt-2">${appliedPrefix} ${displayApplied}</div>
              </div>
            `;
          }).join("") : `
            <div class="p-8 text-center text-slate-500 text-sm">${emptyText}</div>
          `}
        </div>
      </div>
    `;
  }

  // TAB 4: WORKER PAYMENTS & ESCROW
  function renderWorkerPaymentsTab(state) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const worker = window.RozgaarState.getCurrentWorker();
    const txns = state.transactions.filter(t => t.workerId === worker.id || t.workerId === null);

    const totalEarned = txns.filter(t => t.status === "Paid").reduce((acc, curr) => acc + curr.amount, 0);
    const heldAmount = txns.filter(t => t.status === "Held").reduce((acc, curr) => acc + curr.amount, 0);

    const subTitle = currentLang === 'hi' ? 'रोज़गारलिंक एस्क्रो के साथ सुरक्षित भुगतान ट्रैकिंग।'
                   : currentLang === 'mr' ? 'रोजगारलिंक एस्क्रो सह सुरक्षित पेमेंट ट्रॅकिंग.'
                   : currentLang === 'te' ? 'రోజ్గార్లింక్ ఎస్క్రోతో సురక్షిత చెల్లింపు ట్రాకింగ్.'
                   : currentLang === 'ta' ? 'ரோஸ்கார்லிங்க் எஸ்க்ரோவுடன் பாதுகாப்பான கட்டண கண்காணிப்பு.'
                   : 'Secure payment tracking with RozgaarLink Escrow.';

    const creditedText = currentLang === 'hi' ? '✓ बैंक खाते में जमा'
                       : currentLang === 'mr' ? '✓ बँक खात्यात जमा'
                       : currentLang === 'te' ? '✓ బ్యాంక్ ఖాతాలో జమ అయింది'
                       : currentLang === 'ta' ? '✓ வங்கிக் கணக்கில் வரவு வைக்கப்பட்டது'
                       : '✓ Credited to Bank';

    const lockedText = currentLang === 'hi' ? '🔒 एस्क्रो में सुरक्षित लॉक'
                     : currentLang === 'mr' ? '🔒 एस्क्रोमध्ये सुरक्षित लॉक'
                     : currentLang === 'te' ? '🔒 ఎస్క్రోలో భద్రంగా లాక్ చేయబడింది'
                     : currentLang === 'ta' ? '🔒 எஸ்க்ரோவில் பாதுகாப்பாக பூட்டப்பட்டுள்ளது'
                     : '🔒 Locked in Escrow';

    return `
      <div class="space-y-4">
        <div class="pt-1">
          <h2 class="text-lg font-bold text-white">${t("tabPayments")}</h2>
          <p class="text-xs text-slate-400 mt-0.5">${subTitle}</p>
        </div>

        <!-- Balance Statistics Cards -->
        <div class="grid grid-cols-2 gap-3">
          <div class="rl-card p-3.5 bg-gradient-to-br from-indigo-950/70 to-slate-900 border-indigo-500/30">
            <div class="text-[10px] uppercase font-bold text-indigo-300 tracking-wider mb-1">${t("totalEarnings")}</div>
            <div class="text-xl font-black text-white">₹${totalEarned.toLocaleString()}</div>
            <div class="text-[10px] text-emerald-400 mt-1">${creditedText}</div>
          </div>

          <div class="rl-card p-3.5 bg-gradient-to-br from-blue-950/70 to-slate-900 border-blue-500/30">
            <div class="text-[10px] uppercase font-bold text-blue-300 tracking-wider mb-1">${t("paymentsHeld")}</div>
            <div class="text-xl font-black text-amber-400">₹${heldAmount.toLocaleString()}</div>
            <div class="text-[10px] text-amber-300 mt-1">${lockedText}</div>
          </div>
        </div>

        <!-- Protected Payment Flow Explainer (Mandatory Visual Concept) -->
        <div class="rl-card p-4 border border-indigo-500/30 bg-[#0E1527]">
          <h3 class="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3">
            ${t("escrowTimelineTitle")}
          </h3>

          <div class="grid grid-cols-4 gap-1 text-center py-2">
            <div class="flex flex-col items-center">
              <span class="w-8 h-8 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center text-sm font-bold border border-slate-700">1</span>
              <span class="text-[10px] font-semibold text-slate-300 mt-1.5">${t("stepEmployerPays")}</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="w-8 h-8 rounded-full bg-indigo-950 text-amber-400 flex items-center justify-center text-sm font-bold border border-amber-500/40">2</span>
              <span class="text-[10px] font-semibold text-amber-300 mt-1.5">${t("stepPaymentHeld")}</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="w-8 h-8 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center text-sm font-bold border border-slate-700">3</span>
              <span class="text-[10px] font-semibold text-slate-300 mt-1.5">${t("stepJobCompleted")}</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="w-8 h-8 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center text-sm font-bold border border-emerald-500/40">4</span>
              <span class="text-[10px] font-semibold text-emerald-300 mt-1.5">${t("stepPaymentReleased")}</span>
            </div>
          </div>

          <p class="text-[11px] text-slate-400 mt-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            ℹ️ ${t("escrowExplainer")}
          </p>
        </div>

        <!-- Transaction History -->
        <div>
          <h3 class="text-sm font-bold text-white mb-2.5">${t("transactionHistory")}</h3>
          <div class="space-y-2.5">
            ${txns.map(tx => {
              const job = state.jobs.find(j => j.id === tx.jobId);
              const displayTitle = job
                ? (window.RozgaarGemini ? window.RozgaarGemini.getJobField(job, 'title') : job.title)
                : (window.RozgaarGemini ? window.RozgaarGemini.getJobField(tx, 'jobTitle') || tx.jobTitle : tx.jobTitle);
              const displayEmployer = window.RozgaarGemini ? window.RozgaarGemini.getLocalizedEmployerName(tx.employerName, currentLang) : tx.employerName;
              const displayDate = window.RozgaarGemini ? window.RozgaarGemini.formatJobDate(tx.date, currentLang) : tx.date;
              const displayStatus = window.RozgaarGemini ? window.RozgaarGemini.formatStatus(tx.status, currentLang) : (tx.status === 'Paid' ? 'Paid ✓' : 'Held 🔒');

              return `
                <div onclick="window.RozgaarState.pushScreen('transactionDetails', { txId: '${tx.id}' })" class="rl-card p-3.5 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between">
                  <div>
                    <div class="text-xs font-bold text-white">${displayTitle}</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">${displayEmployer} • ${displayDate}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-extrabold text-white">₹${tx.amount.toLocaleString()}</div>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${tx.status === 'Paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}">
                      ${displayStatus}
                    </span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;
  }

  // TAB 5: WORKER PROFILE & MANDATORY COMPLETE WORK HISTORY
  function renderWorkerProfileTab(state) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const worker = window.RozgaarState.getCurrentWorker();

    const reviewsLabel = currentLang === 'hi' ? 'समीक्षाएं' : currentLang === 'mr' ? 'अभिप्राय' : currentLang === 'te' ? 'సమీక్షలు' : currentLang === 'ta' ? 'மதிப்பாய்வுகள்' : 'reviews';
    const availabilityText = worker.availability.includes('Available') 
      ? (currentLang === 'hi' ? 'काम के लिए उपलब्ध ✓' : currentLang === 'mr' ? 'कामासाठी उपलब्ध ✓' : currentLang === 'te' ? 'పనికి అందుబాటులో ఉన్నారు ✓' : currentLang === 'ta' ? 'வேலைக்கு கிடைக்கக்கூடியவர் ✓' : 'Available for Work')
      : (currentLang === 'hi' ? 'अनुपलब्ध' : currentLang === 'mr' ? 'अनुपलब्ध' : currentLang === 'te' ? 'అందుబాటులో లేరు' : currentLang === 'ta' ? 'கிடைக்கவில்லை' : 'Unavailable');
    const wageUnit = currentLang === 'hi' ? 'दिन' : currentLang === 'mr' ? 'दिवस' : currentLang === 'te' ? 'రోజు' : currentLang === 'ta' ? 'நாள்' : 'day';
    const pastJobsSubtitle = currentLang === 'hi' ? 'सभी पिछले पूर्ण कार्य' : currentLang === 'mr' ? 'सर्व मागील पूर्ण झालेली कामे' : currentLang === 'te' ? 'గతంలో పూర్తయిన అన్ని పనులు' : currentLang === 'ta' ? 'முன்பு முடிவடைந்த அனைத்து வேலைகள்' : 'All Past Completed Jobs';
    const employerLabel = currentLang === 'hi' ? 'नियोक्ता:' : currentLang === 'mr' ? 'नियोक्ता:' : currentLang === 'te' ? 'యజమాని:' : currentLang === 'ta' ? 'முதலாளி:' : 'Employer:';
    const durationLabel = currentLang === 'hi' ? 'अवधि:' : currentLang === 'mr' ? 'कालावधी:' : currentLang === 'te' ? 'వ్యవధి:' : currentLang === 'ta' ? 'கால அளவு:' : 'Duration:';
    const dateLabel = currentLang === 'hi' ? 'दिनांक:' : currentLang === 'mr' ? 'तारीख:' : currentLang === 'te' ? 'తేదీ:' : currentLang === 'ta' ? 'தேதி:' : 'Date:';
    const earnedLabel = currentLang === 'hi' ? 'कमाई:' : currentLang === 'mr' ? 'कमावले:' : currentLang === 'te' ? 'సంపాదించినది:' : currentLang === 'ta' ? 'சம்பாதித்தது:' : 'Earned:';

    return `
      <div class="space-y-4">
        <!-- Profile Header Card -->
        <div class="rl-card p-4 border border-slate-800 bg-gradient-to-b from-[#111A2E] to-[#0D1322]">
          <div class="flex items-start gap-3.5 mb-3">
            <img src="${worker.photoUrl}" class="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md" alt="${worker.name}" />
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-white">${worker.name}</h3>
                <span class="rl-badge badge-verified text-[10px]">${t("verifiedWorker")}</span>
              </div>
              <div class="text-xs text-indigo-300 font-semibold mt-0.5">${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession(worker.profession, currentLang) : worker.profession} • ${worker.yearsExp} ${currentLang === 'hi' ? 'वर्ष अनुभव' : currentLang === 'mr' ? 'वर्षे अनुभव' : currentLang === 'te' ? 'సంవత్సరాల అనుభవం' : currentLang === 'ta' ? 'ஆண்டுகள் அனுபவம்' : 'Years Exp'}</div>
              <div class="text-[11px] text-slate-400 mt-1">📞 ${worker.phone} • ${currentLang === 'hi' ? 'उम्र' : currentLang === 'mr' ? 'वय' : currentLang === 'te' ? 'వయస్సు' : currentLang === 'ta' ? 'வயது' : 'Age'} ${worker.age}</div>
              <div class="text-[11px] text-slate-400">📍 ${worker.locationName}</div>
              <div class="text-[10px] text-slate-500 mt-1 font-mono">ID: Aadhaar ${worker.aadhaarNumber || '7845 XXXX 3456'} • PAN ${worker.panNumber || 'ABCDE1234F'}</div>
            </div>
          </div>

          <!-- Availability & Rating Bar -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-800">
            <div class="flex items-center gap-1.5">
              <span class="text-amber-400 text-sm">★</span>
              <span class="text-xs font-bold text-white">${worker.rating}</span>
              <span class="text-[10px] text-slate-500">(${worker.reviewsCount || 20} ${reviewsLabel})</span>
            </div>

            <!-- Availability Toggle -->
            <button onclick="window.RozgaarState.toggleWorkerAvailability()" class="px-3 py-1 rounded-full text-xs font-bold border transition ${worker.availability.includes('Available') ? 'bg-emerald-950 text-emerald-300 border-emerald-600' : 'bg-amber-950 text-amber-300 border-amber-600'}">
              ${availabilityText}
            </button>
          </div>
        </div>

        <!-- Work Details Summary -->
        <div class="rl-card p-3.5 border border-slate-800 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400">${t("expectedWage")}:</span>
            <span class="font-bold text-emerald-400">₹${worker.expectedWage} / ${wageUnit}</span>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400">${t("preferredHours")}:</span>
            <span class="font-bold text-slate-200">${worker.preferredHours}</span>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400">${t("skills")}:</span>
            <span class="font-semibold text-indigo-300 text-right text-[11px] max-w-[200px] truncate">${worker.skills}</span>
          </div>
        </div>

        <!-- MANDATORY COMPLETE WORK HISTORY (Must be scrollable) -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-bold text-white">${t("workHistory")} (${worker.workHistory.length})</h3>
            <span class="text-[10px] text-slate-400">${pastJobsSubtitle}</span>
          </div>

          <div class="space-y-2.5">
            ${worker.workHistory.map(item => `
              <div class="rl-card p-3.5 border border-slate-800/80 bg-slate-900/60">
                <div class="flex items-center justify-between mb-1">
                  <h4 class="text-xs font-bold text-white">${window.RozgaarGemini ? window.RozgaarGemini.smartFallbackTranslate(item.jobTitle, currentLang) : item.jobTitle}</h4>
                  <span class="rl-badge badge-verified text-[9px] py-0">${window.RozgaarGemini ? window.RozgaarGemini.formatStatus(item.paymentStatus, currentLang) : item.paymentStatus}</span>
                </div>
                <div class="text-[11px] text-slate-400">${employerLabel} <span class="text-slate-200 font-semibold">${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedEmployerName(item.employer, currentLang) : item.employer}</span></div>
                <div class="grid grid-cols-2 gap-1 text-[10px] text-slate-500 mt-2">
                  <div>⏳ ${durationLabel} ${window.RozgaarGemini ? window.RozgaarGemini.formatJobDate(item.duration, currentLang) : item.duration}</div>
                  <div>🗓️ ${dateLabel} ${window.RozgaarGemini ? window.RozgaarGemini.formatJobDate(item.date, currentLang) : item.date}</div>
                  <div>📍 ${window.RozgaarGemini ? window.RozgaarGemini.getJobField({location: item.location}, 'location') : item.location}</div>
                  <div class="text-emerald-400 font-bold">💰 ${earnedLabel} ₹${item.amountEarned.toLocaleString()}</div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Sign Out Button -->
        <div class="pt-2">
          <button onclick="window.RozgaarState.replaceScreen('welcome')" class="rl-btn rl-btn-danger w-full py-3 text-xs font-bold">
            🚪 ${t("logout")}
          </button>
        </div>
      </div>
    `;
  }

  // WORKER JOB DETAILS SCREEN
  function renderWorkerJobDetails(state, params) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const worker = window.RozgaarState.getCurrentWorker();
    const job = state.jobs.find(j => j.id === params.jobId) || state.jobs[0];

    const existingApp = state.applications.find(a => a.jobId === job.id && a.workerId === worker.id);
    const hasApplied = !!existingApp;

    const displayTitle = window.RozgaarGemini ? window.RozgaarGemini.getJobField(job, 'title') : job.title;
    const displayLocation = window.RozgaarGemini ? window.RozgaarGemini.getJobField(job, 'location') : job.location;
    const displayDuration = window.RozgaarGemini ? window.RozgaarGemini.getJobField(job, 'duration') : job.duration;
    const displaySkills = window.RozgaarGemini ? window.RozgaarGemini.getJobField(job, 'requiredSkills') : job.requiredSkills;
    const displayDesc = window.RozgaarGemini ? window.RozgaarGemini.getJobField(job, 'description') : job.description;

    const displayProfession = window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession(job.profession, currentLang) : job.profession;
    const displayDate = window.RozgaarGemini ? window.RozgaarGemini.formatJobDate(job.date, currentLang) : job.date;
    const displayTime = window.RozgaarGemini ? window.RozgaarGemini.formatJobTime(job.startTime + " - " + job.endTime, currentLang) : `${job.startTime} - ${job.endTime}`;
    const distanceUnit = currentLang === 'en' ? 'km' : currentLang === 'te' ? 'కిమీ' : currentLang === 'ta' ? 'கி.மீ' : 'किमी';
    const bizVerifiedText = currentLang === 'en' ? 'Business Verified ✓' : currentLang === 'te' ? 'వ్యాపారం ధృవీకరించబడింది ✓' : currentLang === 'ta' ? 'வணிகம் சரிபார்க்கப்பட்டது ✓' : currentLang === 'hi' ? 'व्यवसाय सत्यापित ✓' : 'व्यवसाय पडताळणी ✓';
    const dailyWageLabel = currentLang === 'hi' ? 'दैनिक मजदूरी' : currentLang === 'mr' ? 'दैनिक मजुरी' : currentLang === 'te' ? 'రోజువారీ వేతనం' : currentLang === 'ta' ? 'தினசரி கூலி' : 'Daily Wage';
    const wageUnitLabel = currentLang === 'hi' ? 'दिन' : currentLang === 'mr' ? 'दिवस' : currentLang === 'te' ? 'రోజు' : currentLang === 'ta' ? 'நாள்' : 'day';
    const durationLabel = currentLang === 'hi' ? 'अवधि' : currentLang === 'mr' ? 'कालावधी' : currentLang === 'te' ? 'వ్యవధి' : currentLang === 'ta' ? 'கால அளவு' : 'Duration';
    const workDateLabel = currentLang === 'hi' ? 'काम की तिथि' : currentLang === 'mr' ? 'कामाची तारीख' : currentLang === 'te' ? 'పని తేదీ' : currentLang === 'ta' ? 'வேலை தேதி' : 'Work Date';
    const timingLabel = currentLang === 'hi' ? 'समय' : currentLang === 'mr' ? 'वेळ' : currentLang === 'te' ? 'సమయం' : currentLang === 'ta' ? 'நேரம்' : 'Timing';
    const capacityLabel = currentLang === 'hi' ? 'मजदूर क्षमता:' : currentLang === 'mr' ? 'कामगार क्षमता:' : currentLang === 'te' ? 'కార్మికుల సామర్థ్యం:' : currentLang === 'ta' ? 'தொழிலாளர்கள் திறன்:' : 'Workers Capacity:';
    const filledText = currentLang === 'hi' ? 'भरे गए' : currentLang === 'mr' ? 'भरले' : currentLang === 'te' ? 'భర్తీ చేయబడ్డాయి' : currentLang === 'ta' ? 'நிரப்பப்பட்டது' : 'Filled';
    const siteLocationLabel = currentLang === 'hi' ? 'साइट स्थान' : currentLang === 'mr' ? 'कामाचे ठिकाण' : currentLang === 'te' ? 'సైట్ స్థానం' : currentLang === 'ta' ? 'தள இருப்பிடம்' : 'Site Location';
    const displayExp = currentLang === 'hi' ? job.requiredExperience.replace(/Years/gi, 'वर्ष') : currentLang === 'mr' ? job.requiredExperience.replace(/Years/gi, 'वर्षे') : currentLang === 'te' ? job.requiredExperience.replace(/Years/gi, 'సంవత్సరాలు') : currentLang === 'ta' ? job.requiredExperience.replace(/Years/gi, 'ஆண்டுகள்') : job.requiredExperience;

    return `
      <div class="screen-scroll-container without-bottom-nav min-h-full py-4 space-y-4">
        <!-- Header with Back -->
        <div class="flex items-center gap-3">
          <button onclick="window.RozgaarState.goBack()" class="back-btn">←</button>
          <h2 class="text-lg font-bold text-white">${t("jobDetailsTitle")}</h2>
        </div>

        <!-- Main Card -->
        <div class="rl-card p-4 border border-indigo-500/30 bg-[#0E1527]">
          <div class="flex items-center justify-between mb-2">
            <span class="rl-badge badge-profession">${displayProfession}</span>
            <span class="rl-badge badge-distance">📍 ${job.distance} ${distanceUnit}</span>
          </div>

          <div class="flex items-start justify-between gap-2 mb-2">
            <h3 class="text-base font-bold text-white flex-1">${displayTitle}</h3>
            ${currentLang !== 'en' ? `
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-medium flex-shrink-0 flex items-center gap-1">
                <span>✨</span><span>Gemini AI</span>
              </span>
            ` : ''}
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-300 pb-3 border-b border-slate-800">
            <span class="font-semibold">${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedEmployerName(job.employerName, currentLang) : job.employerName}</span>
            <span class="rl-badge badge-verified text-[10px] py-0">${bizVerifiedText}</span>
            <span>• ★ ${job.employerRating}</span>
          </div>

          <!-- Key Stats Grid -->
          <div class="grid grid-cols-2 gap-3 py-3 border-b border-slate-800 text-xs">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase">${dailyWageLabel}</span>
              <span class="text-emerald-400 font-extrabold text-base">₹${job.wage}</span>
              <span class="text-slate-500 text-[10px]">/${wageUnitLabel}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase">${durationLabel}</span>
              <span class="text-white font-bold text-base">${displayDuration}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase">${workDateLabel}</span>
              <span class="text-slate-200 font-semibold">${displayDate}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px] uppercase">${timingLabel}</span>
              <span class="text-slate-200 font-semibold">${displayTime}</span>
            </div>
          </div>

          <!-- Workers Required Status -->
          <div class="py-3 border-b border-slate-800">
            <div class="flex items-center justify-between text-xs mb-1.5">
              <span class="text-slate-400">${capacityLabel}</span>
              <span class="text-slate-200 font-bold">${job.workersAccepted} / ${job.workersRequired} ${filledText}</span>
            </div>
            <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
              <div class="bg-indigo-500 h-full" style="width: ${(job.workersAccepted / job.workersRequired) * 100}%"></div>
            </div>
          </div>

          <!-- Location & Site Mini Map -->
          <div class="py-2.5 text-xs text-slate-300">
            <span class="text-slate-400 block text-[10px] uppercase mb-0.5">${siteLocationLabel}</span>
            <div class="font-semibold mb-2">📍 ${displayLocation}</div>
            <div id="job-detail-mini-map" class="w-full h-[180px] rounded-xl overflow-hidden border border-slate-800 shadow"></div>
          </div>
        </div>

        <!-- Required Skills & Experience -->
        <div class="rl-card p-4 border border-slate-800 space-y-3">
          <div>
            <h4 class="text-xs font-bold text-indigo-300 uppercase mb-1">${t("requiredSkills")}</h4>
            <p class="text-xs text-slate-200">${displaySkills}</p>
          </div>
          <div>
            <h4 class="text-xs font-bold text-indigo-300 uppercase mb-1">${t("requiredExp")}</h4>
            <p class="text-xs text-slate-200">${displayExp}</p>
          </div>
          <div>
            <h4 class="text-xs font-bold text-indigo-300 uppercase mb-1">${t("jobDesc")}</h4>
            <p class="text-xs text-slate-300 leading-relaxed">${displayDesc}</p>
          </div>
        </div>

        <!-- Payment Escrow Protection Badge -->
        <div class="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-start gap-3">
          <span class="text-xl">🔒</span>
          <div>
            <div class="text-xs font-bold text-white">${t("escrowGuaranteed")}</div>
            <div class="text-[11px] text-slate-400 mt-0.5">${t("escrowExplainer")}</div>
          </div>
        </div>

        <!-- Bottom Action Button -->
        <div class="pt-2">
          ${hasApplied ? `
            <button disabled class="rl-btn w-full bg-emerald-950 text-emerald-300 border border-emerald-700 py-3.5 font-bold cursor-not-allowed">
              ${t("alreadyApplied")}
            </button>
          ` : `
            <button onclick="window.RozgaarState.applyForJob('${job.id}')" class="rl-btn rl-btn-primary w-full py-3.5 text-base">
              <span>${t("applyForJob")}</span>
              <span>→</span>
            </button>
          `}
        </div>
      </div>
    `;
  }

  // ==========================================
  // 4. EMPLOYER AUTH (Sign Up & Sign In)
  // ==========================================

  function renderEmployerAuth(state) {
    const t = window.RozgaarState.t;
    return `
      <div class="screen-scroll-container without-bottom-nav flex flex-col justify-between min-h-full py-4">
        <div>
          <div class="flex items-center gap-3 mb-6">
            <button onclick="window.RozgaarState.goBack()" class="back-btn">←</button>
            <h2 class="text-xl font-bold text-white">${t("employerRole")}</h2>
          </div>

          <div class="text-center my-6">
            <div class="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-3xl mx-auto mb-3">
              🏗️
            </div>
            <h3 class="text-xl font-bold text-white">Employer Portal</h3>
            <p class="text-xs text-slate-400 mt-1">Hire verified daily workers within 5 km and manage secure escrow.</p>
          </div>

          <div class="space-y-3.5 max-w-sm mx-auto">
            <button onclick="window.RozgaarState.pushScreen('employerSignUp')" class="rl-btn rl-btn-primary w-full py-3.5 text-base">
              <span>${t("newUser")}</span>
              <span>→</span>
            </button>

            <button onclick="window.RozgaarState.pushScreen('employerSignIn')" class="rl-btn rl-btn-secondary w-full py-3.5 text-base border-slate-700">
              <span>${t("alreadyRegistered")}</span>
            </button>
          </div>
        </div>

        <div class="text-center pt-4">
          <div class="flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>🛡️ Business Verified</span>
            <span>•</span>
            <span>⚡ Instant Worker Matching</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderEmployerSignUp(state) {
    const t = window.RozgaarState.t;
    const data = state.authForm.employerData;

    return `
      <div class="screen-scroll-container without-bottom-nav min-h-full py-4 space-y-4">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-3">
            <button onclick="window.RozgaarState.goBack()" class="back-btn">←</button>
            <h2 class="text-lg font-bold text-white">${t("employerRegTitle")}</h2>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-800">Employer</span>
        </div>

        <p class="text-xs text-slate-400">Register your business or contractor profile. Tap 🎤 for voice typing.</p>

        <!-- Contact Name -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("fullName")}</label>
          <div class="rl-input-group">
            <input type="text" id="emp-reg-name" value="${data.name || ''}" placeholder="e.g. Vikram Deshmukh" class="rl-input" onchange="window.RozgaarApp.updateEmployerData('name', this.value)" />
            <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('emp-reg-name'), 'name')">🎤</button>
          </div>
        </div>

        <!-- Mobile Number -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("mobileNumber")}</label>
          <div class="rl-input-group">
            <input type="tel" id="emp-reg-mobile" value="${data.mobile || ''}" placeholder="e.g. 9822001122" class="rl-input" onchange="window.RozgaarApp.updateEmployerData('mobile', this.value)" />
            <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('emp-reg-mobile'), 'default')">🎤</button>
          </div>
        </div>

        <!-- Company / Business Name -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("companyName")}</label>
          <div class="rl-input-group">
            <input type="text" id="emp-reg-company" value="${data.companyName || ''}" placeholder="e.g. ABC Construction" class="rl-input" onchange="window.RozgaarApp.updateEmployerData('companyName', this.value)" />
            <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('emp-reg-company'), 'company')">🎤</button>
          </div>
        </div>

        <!-- Business Address -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("businessAddress")}</label>
          <div class="rl-input-group">
            <input type="text" id="emp-reg-addr" value="${data.businessAddress || ''}" placeholder="e.g. Shop 12, Rahul Complex, Kothrud" class="rl-input" onchange="window.RozgaarApp.updateEmployerData('businessAddress', this.value)" />
            <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('emp-reg-addr'), 'location')">🎤</button>
          </div>
        </div>

        <!-- GSTIN Number Input -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("gstinNumber")}</label>
          <div class="rl-input-group">
            <input type="text" id="emp-reg-gst" value="${data.gstin || ''}" placeholder="e.g. 27AABCA1234F1Z5" class="rl-input uppercase" onchange="window.RozgaarApp.updateEmployerData('gstin', this.value)" />
            <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('emp-reg-gst'), 'id')">🎤</button>
          </div>
        </div>

        <!-- PAN Number Input -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("employerPan")}</label>
          <div class="rl-input-group">
            <input type="text" id="emp-reg-pan" value="${data.pan || ''}" placeholder="e.g. AABCA1234F" class="rl-input uppercase" onchange="window.RozgaarApp.updateEmployerData('pan', this.value)" />
            <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('emp-reg-pan'), 'id')">🎤</button>
          </div>
        </div>

        <!-- Aadhaar Number Input -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("employerAadhaar")}</label>
          <div class="rl-input-group">
            <input type="text" id="emp-reg-aadhaar" value="${data.aadhaar || ''}" placeholder="e.g. 5544 3322 1100" maxlength="14" class="rl-input" onchange="window.RozgaarApp.updateEmployerData('aadhaar', this.value)" />
            <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('emp-reg-aadhaar'), 'id')">🎤</button>
          </div>
        </div>

        <!-- Action Button -->
        <div class="pt-2">
          <button onclick="window.RozgaarApp.completeEmployerRegistration()" class="rl-btn rl-btn-primary w-full py-3.5">
            <span>${t("completeReg")}</span>
            <span>✓</span>
          </button>
        </div>
      </div>
    `;
  }

  function updateEmployerData(field, val) {
    window.RozgaarState.getState().authForm.employerData[field] = val;
  }

  function simulateBusinessVerify() {
    window.RozgaarState.getState().authForm.employerData.businessVerified = true;
    window.RozgaarState.toast("Business Documents Verified ✓", "success");
    window.RozgaarState.notify();
  }

  async function completeEmployerRegistration() {
    const state = window.RozgaarState.getState();
    const data = state.authForm.employerData;

    // Get active Firebase UID
    const activeUser = (typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser) || null;
    const activeUid = (activeUser && activeUser.uid) || localStorage.getItem("rozgaar_user_uid") || data.id;

    if (!activeUid) {
      window.RozgaarState.toast("Authentication required. Please sign in first.", "error");
      window.RozgaarState.replaceScreen("employerSignIn");
      return;
    }

    const newEmployer = {
      id: activeUid,
      name: data.name || "Vikram Deshmukh",
      companyName: data.companyName || "ABC Construction",
      phone: data.mobile || "9822001122",
      businessAddress: data.businessAddress || "Paud Road, Kothrud",
      city: "Pune",
      locationName: data.locationName || "Kothrud, Pune",
      gstin: data.gstin || "27AABCA1234F1Z5",
      pan: data.pan || "AABCA1234F",
      aadhaar: data.aadhaar || "5544 3322 1100",
      businessVerified: true,
      rating: 4.8,
      jobsPostedCount: 0
    };

    // Persist to SQLite backend if API is connected
    if (window.RozgaarApi && window.RozgaarApi.registerEmployer) {
      try {
        const apiRes = await window.RozgaarApi.registerEmployer(newEmployer);
        if (apiRes && apiRes.error) {
          const errMsg = apiRes.detail || apiRes.error || "Failed to register employer profile on server";
          console.warn("Backend employer registration error:", errMsg);
          window.RozgaarState.toast(errMsg, "error");
          return;
        }
      } catch (err) {
        console.warn("Could not register employer to backend DB", err);
      }
    }

    state.employers = state.employers.filter(e => e.id !== newEmployer.id);
    state.employers.unshift(newEmployer);
    state.currentEmployerId = newEmployer.id;
    state.userRole = "employer";
    window.RozgaarState.saveToStorage();

    window.RozgaarState.toast("Registration Complete! Employer Verified ✓", "success");
    window.RozgaarState.replaceScreen('employerDashboard');
  }

  function renderEmployerSignIn(state) {
    const t = window.RozgaarState.t;
    const otpSent = state.authForm.empOtpSent || false;

    return `
      <div class="screen-scroll-container without-bottom-nav flex flex-col justify-between min-h-full py-4">
        <div>
          <div class="flex items-center gap-3 mb-6">
            <button onclick="window.RozgaarState.goBack()" class="back-btn">←</button>
            <h2 class="text-xl font-bold text-white">${t("signIn")} (Employer)</h2>
          </div>

          <p class="text-xs text-slate-400 mb-6">
            Quick Sign In with Registered Mobile Number & OTP.
          </p>

          <div class="space-y-4 max-w-sm mx-auto">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("mobileNumber")}</label>
              <div class="rl-input-group">
                <input type="tel" id="emp-signin-mobile" value="${state.authForm.mobile || '9822001122'}" placeholder="${t('enterMobile')}" class="rl-input" onchange="window.RozgaarState.getState().authForm.mobile = this.value" />
                <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('emp-signin-mobile'), 'default')">🎤</button>
              </div>
            </div>

            ${!otpSent ? `
              <button onclick="window.RozgaarApp.sendEmployerOTP()" class="rl-btn rl-btn-primary w-full py-3.5">
                <span>${t("sendOtp")}</span>
                <span>📲</span>
              </button>
            ` : `
              <div class="p-4 rounded-2xl bg-slate-900 border border-blue-500/40 space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-semibold text-blue-300">${t("enterOtp")}</label>
                  <span class="text-[10px] text-emerald-400 font-mono">SMS Verification Code</span>
                </div>
                <input type="text" id="emp-signin-otp" maxlength="6" value="" placeholder="Enter 6-digit OTP" class="rl-input text-center text-xl font-bold tracking-widest" />
                
                <button onclick="window.RozgaarApp.verifyEmployerOTP()" class="rl-btn rl-btn-primary w-full py-3">
                  <span>${t("verifyOtp")}</span>
                  <span>✓</span>
                </button>
              </div>
            `}

            <!-- Divider -->
            <div class="flex items-center gap-3 my-3">
              <div class="h-px bg-slate-800 flex-1"></div>
              <span class="text-[10px] text-slate-500 uppercase font-semibold">Or with Email</span>
              <div class="h-px bg-slate-800 flex-1"></div>
            </div>

            <!-- Email & Password Authentication Form -->
            <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <div class="rl-input-group">
                  <input type="email" id="email-input" placeholder="employer@example.com" class="rl-input" autocomplete="email" />
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-semibold text-slate-300">Password</label>
                  <button type="button" onclick="window.RozgaarApp.forgotPassword('employer')" class="text-[11px] text-blue-400 hover:underline">Forgot Password?</button>
                </div>
                <div class="rl-input-group">
                  <input type="password" id="password-input" placeholder="Min. 6 characters" class="rl-input" autocomplete="current-password" onkeydown="if(event.key==='Enter') window.RozgaarApp.signInWithPassword('employer')" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-1">
                <button type="button" onclick="window.RozgaarApp.signInWithPassword('employer')" class="rl-btn rl-btn-primary py-2.5 text-xs font-bold">
                  <span>Sign In with Email</span>
                </button>
                <button type="button" onclick="window.RozgaarApp.registerWithPassword('employer')" class="rl-btn rl-btn-secondary py-2.5 text-xs font-bold border-blue-500/50 text-blue-300 hover:bg-blue-950/40">
                  <span>Sign Up with Email</span>
                </button>
              </div>
            </div>

            <!-- Divider -->
            <div class="flex items-center gap-3 my-3">
              <div class="h-px bg-slate-800 flex-1"></div>
              <span class="text-[10px] text-slate-500 uppercase font-semibold">Or with Google</span>
              <div class="h-px bg-slate-800 flex-1"></div>
            </div>

            <!-- Clean Continue with Google Button -->
            <button type="button" onclick="window.RozgaarApp.signInWithGoogle('employer')" class="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2.5 shadow-md">
              <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.43 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.57 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </div>

        <div class="text-center pt-4">
          <button onclick="window.RozgaarState.pushScreen('employerSignUp')" class="text-xs text-blue-400 hover:underline">
            ${t("newUser")}
          </button>
        </div>
      </div>
    `;
  }

  async function sendEmployerOTP() {
    const state = window.RozgaarState.getState();
    const inputEl = document.getElementById("emp-signin-mobile");
    const rawMobile = inputEl ? inputEl.value.trim() : (state.authForm.mobile || "");

    if (!rawMobile || rawMobile.length < 10) {
      window.RozgaarState.toast(window.RozgaarState.t("errMobileRequired") || "Please enter a valid 10-digit mobile number", "error");
      return;
    }
    state.authForm.mobile = rawMobile;

    try {
      window.RozgaarState.toast("Sending SMS OTP via Firebase...", "info");
      const verifier = getRecaptchaVerifier();
      const cleanDigits = rawMobile.replace(/[^\d+]/g, "");
      const formattedPhone = cleanDigits.startsWith("+") ? cleanDigits : `+91${cleanDigits.replace(/^0+/, "")}`;

      employerConfirmationResult = await firebase.auth().signInWithPhoneNumber(formattedPhone, verifier);
      state.authForm.empOtpSent = true;
      window.RozgaarState.toast(window.RozgaarState.t("otpSentSuccess"), "success");
      window.RozgaarState.notify();
    } catch (err) {
      console.error("Firebase sendEmployerOTP error:", err);
      if (recaptchaVerifier) {
        try { recaptchaVerifier.render().then(widgetId => grecaptcha.reset(widgetId)); } catch(e) {}
      }
      window.RozgaarState.toast(err.message || "Failed to send OTP", "error");
    }
  }

  async function verifyEmployerOTP() {
    const state = window.RozgaarState.getState();
    const otpInput = document.getElementById("emp-signin-otp");
    const otpCode = otpInput ? otpInput.value.trim() : "";

    if (!otpCode || otpCode.length < 4) {
      window.RozgaarState.toast("Please enter the 4-6 digit OTP code", "error");
      return;
    }

    if (!employerConfirmationResult) {
      window.RozgaarState.toast("No active OTP request found. Please request a new OTP.", "error");
      return;
    }

    try {
      window.RozgaarState.toast("Verifying OTP...", "info");
      const result = await employerConfirmationResult.confirm(otpCode);
      const user = result.user;
      const token = await user.getIdToken();

      await completeLoginFlow(user, token, "employer");
    } catch (err) {
      console.error("Firebase verifyEmployerOTP error:", err);
      window.RozgaarState.toast(err.message || "Invalid OTP code", "error");
    }
  }

  // ==========================================
  // 5. EMPLOYER DASHBOARD (Mandatory 2x2 Grid)
  // ==========================================

  function renderEmployerDashboard(state) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const employer = window.RozgaarState.getCurrentEmployer();
    const activeJobs = state.jobs.filter(j => j.employerId === employer.id);
    const applications = state.applications.filter(a => a.employerId === employer.id);

    const displayCompany = window.RozgaarGemini ? window.RozgaarGemini.getLocalizedEmployerName(employer.companyName, currentLang) : employer.companyName;

    return `
      <div class="screen-scroll-container without-bottom-nav min-h-full py-4 space-y-4">
        <!-- Top Bar with Employer Info & Settings -->
        <div class="flex items-center justify-between pt-1">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-2xl">
              🏢
            </div>
            <div>
              <div class="text-xs text-slate-400 font-medium">${t("greetingMorning")},</div>
              <h2 class="text-base font-bold text-white">${displayCompany}</h2>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="window.RozgaarState.pushScreen('notifications')" class="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 relative">
              <span>🔔</span>
              <span class="w-2 h-2 rounded-full bg-blue-500 absolute top-1.5 right-1.5"></span>
            </button>
            <button onclick="window.RozgaarState.pushScreen('settings')" class="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
              <span>⚙️</span>
            </button>
          </div>
        </div>

        <!-- Verification Badge & Location Strip -->
        <div class="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="rl-badge badge-verified text-[10px]">${currentLang === 'hi' ? 'व्यवसाय सत्यापित ✓' : currentLang === 'mr' ? 'व्यवसाय पडताळणी ✓' : currentLang === 'te' ? 'వ్యాపారం ధృవీకరించబడింది ✓' : currentLang === 'ta' ? 'வணிகம் சரிபார்க்கப்பட்டது ✓' : 'Business Verified ✓'}</span>
            <span class="text-xs text-slate-400">★ ${employer.rating}</span>
          </div>
          <span class="text-xs text-slate-400">📍 ${employer.locationName}</span>
        </div>

        <!-- CRITICAL REQUIREMENT 23: EXACT FOUR MAJOR OPTIONS IN 2 x 2 LAYOUT -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
            ${currentLang === 'hi' ? 'मुख्य कार्य' : currentLang === 'mr' ? 'मुख्य कामे' : currentLang === 'te' ? 'ప్రధాన కార్యకలాపాలు' : currentLang === 'ta' ? 'முக்கிய செயல்பாடுகள்' : 'Core Operations'}
          </h3>

          <div class="grid grid-cols-2 gap-3.5">
            <!-- 1. Post a Job -->
            <div onclick="window.RozgaarState.pushScreen('employerPostJob')" class="rl-card p-4 border border-indigo-500/40 bg-gradient-to-br from-[#121A30] to-[#0A0E18] hover:border-indigo-400 cursor-pointer transition flex flex-col justify-between h-36">
              <div class="flex items-center justify-between">
                <span class="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center text-xl">
                  ➕
                </span>
                <span class="text-xs text-indigo-400 font-bold">${currentLang === 'hi' ? 'नया' : currentLang === 'mr' ? 'नवीन' : currentLang === 'te' ? 'కొత్తది' : currentLang === 'ta' ? 'புதியது' : 'New'}</span>
              </div>
              <div>
                <h4 class="text-sm font-bold text-white mb-0.5">${t("postJobTitle")}</h4>
                <p class="text-[11px] text-slate-400">${t("postJobSub")}</p>
              </div>
            </div>

            <!-- 2. My Active Jobs -->
            <div onclick="window.RozgaarState.pushScreen('employerActiveJobs')" class="rl-card p-4 border border-blue-500/40 bg-gradient-to-br from-[#101E36] to-[#0A0E18] hover:border-blue-400 cursor-pointer transition flex flex-col justify-between h-36">
              <div class="flex items-center justify-between">
                <span class="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center text-xl">
                  📋
                </span>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">${activeJobs.length}</span>
              </div>
              <div>
                <h4 class="text-sm font-bold text-white mb-0.5">${t("myActiveJobsTitle")}</h4>
                <p class="text-[11px] text-slate-400">${t("myActiveJobsSub")}</p>
              </div>
            </div>

            <!-- 3. Worker Applications -->
            <div onclick="window.RozgaarState.pushScreen('employerWorkerApplications')" class="rl-card p-4 border border-slate-700 hover:border-slate-500 cursor-pointer transition flex flex-col justify-between h-36">
              <div class="flex items-center justify-between">
                <span class="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/40 flex items-center justify-center text-xl">
                  👥
                </span>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">${applications.length}</span>
              </div>
              <div>
                <h4 class="text-sm font-bold text-white mb-0.5">${t("workerAppsTitle")}</h4>
                <p class="text-[11px] text-slate-400">${t("workerAppsSub")}</p>
              </div>
            </div>

            <!-- 4. Recent Payments -->
            <div onclick="window.RozgaarState.pushScreen('employerRecentPayments')" class="rl-card p-4 border border-slate-700 hover:border-slate-500 cursor-pointer transition flex flex-col justify-between h-36">
              <div class="flex items-center justify-between">
                <span class="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xl">
                  💰
                </span>
                <span class="text-xs text-emerald-400 font-bold">${currentLang === 'hi' ? 'एस्क्रो' : currentLang === 'mr' ? 'एस्क्रो' : currentLang === 'te' ? 'ఎస్క్రో' : currentLang === 'ta' ? 'எஸ்க்ரோ' : 'Escrow'}</span>
              </div>
              <div>
                <h4 class="text-sm font-bold text-white mb-0.5">${t("recentPaymentsTitle")}</h4>
                <p class="text-[11px] text-slate-400">${t("recentPaymentsSub")}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Switch Role / Log Out -->
        <div class="pt-2">
          <button onclick="window.RozgaarState.replaceScreen('welcome')" class="rl-btn rl-btn-secondary w-full py-3 text-xs border-slate-800">
            ${currentLang === 'hi' ? 'उपयोगकर्ता मोड बदलें / लॉग आउट' : currentLang === 'mr' ? 'वापरकर्ता मोड बदला / लॉग आउट' : currentLang === 'te' ? 'వినియోగదారు మోడ్ మార్చండి / సైన్ అవుట్' : currentLang === 'ta' ? 'பயனர் பயன்முறையை மாற்றவும் / வெளியேறு' : 'Switch User Mode / Sign Out'}
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // 6. EMPLOYER SECONDARY PAGES
  // ==========================================

  // SCREEN 1: POST A JOB
  function renderEmployerPostJob(state) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const postJobSubtitle = currentLang === 'hi'
      ? 'पुणे 5 किमी के दायरे में कार्य पोस्ट करें। सभी फ़ील्ड में 🎤 वॉइस इनपुट उपलब्ध है।'
      : currentLang === 'mr'
      ? 'पुणे ५ किमी परिसरात काम पोस्ट करा. सर्व फील्डमध्ये 🎤 व्हॉइस इनपुट उपलब्ध आहे.'
      : currentLang === 'te'
      ? 'పూణే 5 కి.మీ పరిధిలో పనిని పోస్ట్ చేయండి. అన్ని ఫీల్డ్‌లలో 🎤 వాయిస్ ఇన్‌పుట్ అందుబాటులో ఉంది.'
      : currentLang === 'ta'
      ? 'புனே 5 கி.மீ சுற்றளவில் வேலையைப் பதிவிடவும். அனைத்து புலங்களிலும் 🎤 குரல் உள்ளீடு உள்ளது.'
      : 'Post work within Pune 5 km radius. All fields have 🎤 voice input.';
    const escrowNote = currentLang === 'hi' 
      ? '🔒 पोस्ट करके, आप रोजगार लिंक एस्क्रो सुरक्षा से सहमत होते हैं। कुल अनुमानित भुगतान सुरक्षित रहेगा और आपकी स्वीकृति पर जारी होगा।'
      : currentLang === 'mr'
      ? '🔒 पोस्ट करून, तुम्ही रोजगार लिंक एस्क्रो संरक्षणास सहमती देता. एकूण अंदाजे रक्कम सुरक्षित ठेवली जाईल आणि तुमच्या मंजुरीनंतर दिली जाईल.'
      : currentLang === 'te'
      ? '🔒 పోస్ట్ చేయడం ద్వారా, మీరు రోజ్‌గార్ లింక్ ఎస్క్రో రక్షణకు అంగీకరిస్తున్నారు. అంచనా మొత్తం లాక్ చేయబడుతుంది మరియు మీ ఆమోదం తర్వాత విడుదల చేయబడుతుంది.'
      : currentLang === 'ta'
      ? '🔒 பதிவிடுவதன் மூலம், நீங்கள் ரோஸ்கார் லிங்க் எஸ்க்ரோ பாதுகாப்பை ஏற்றுக்கொள்கிறீர்கள். உங்கள் ஒப்புதலின் பேரில் பணம் விடுவிக்கப்படும்.'
      : '🔒 By posting, you agree to RozgaarLink Escrow protection. Total estimated payout will be locked and released upon your approval.';

    return `
      <div class="screen-scroll-container without-bottom-nav min-h-full py-4 space-y-4">
        <div class="flex items-center gap-3">
          <button onclick="window.RozgaarState.replaceScreen('employerDashboard')" class="back-btn">←</button>
          <h2 class="text-lg font-bold text-white">${t("postJobHeading")}</h2>
        </div>

        <p class="text-xs text-slate-400">${postJobSubtitle}</p>

        <!-- Form -->
        <div class="space-y-3.5">
          <!-- Job Title -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("jobTitleInput")}</label>
            <div class="rl-input-group">
              <input type="text" id="post-job-title" placeholder="e.g. Masonry & Red Brickwork for Bungalow" class="rl-input" />
              <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('post-job-title'), 'title')">🎤</button>
            </div>
          </div>

          <!-- Profession Category -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("profession")}</label>
            <select id="post-job-prof" class="rl-input !pr-3 bg-slate-900 text-white">
              <option value="Mason">${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession("Mason", currentLang) : "Mason"} (Rajmistri / Gavandi)</option>
              <option value="Electrician">${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession("Electrician", currentLang) : "Electrician"}</option>
              <option value="Carpenter">${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession("Carpenter", currentLang) : "Carpenter"} (Sutar)</option>
              <option value="Plumber">${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession("Plumber", currentLang) : "Plumber"}</option>
              <option value="Painter">${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession("Painter", currentLang) : "Painter"}</option>
              <option value="Construction Worker">${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession("Construction Worker", currentLang) : "Construction Worker"}</option>
              <option value="Helper">${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession("Helper", currentLang) : "Helper"}</option>
            </select>
          </div>

          <!-- Multiple Workers Required & Wage -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("numWorkersNeeded")}</label>
              <input type="number" id="post-job-workers" value="3" min="1" max="25" class="rl-input !pr-2" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("wageOffered")}</label>
              <div class="rl-input-group">
                <input type="number" id="post-job-wage" value="800" step="50" class="rl-input" />
                <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('post-job-wage'), 'wage')">🎤</button>
              </div>
            </div>
          </div>

          <!-- Work Location -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("workLocation")}</label>
            <div class="rl-input-group">
              <input type="text" id="post-job-location" value="Paud Road, Kothrud, Pune" class="rl-input" />
              <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('post-job-location'), 'location')">🎤</button>
            </div>
          </div>

          <!-- Date & Timing -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("workDate")}</label>
              <input type="text" id="post-job-date" value="Tomorrow, 21 Sep" class="rl-input !pr-2" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("duration")}</label>
              <input type="text" id="post-job-duration" value="3 Days" class="rl-input !pr-2" />
            </div>
          </div>

          <!-- Required Skills -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("requiredSkills")}</label>
            <div class="rl-input-group">
              <input type="text" id="post-job-skills" placeholder="e.g. Red brickwork, Cement mortar mixing" class="rl-input" />
              <button type="button" class="rl-mic-btn" onclick="window.RozgaarVoice.open(document.getElementById('post-job-skills'), 'skills')">🎤</button>
            </div>
          </div>

          <!-- Job Description -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">${t("jobDesc")}</label>
            <div class="rl-input-group">
              <textarea id="post-job-desc" rows="3" placeholder="Describe work requirements and tools provided on site..." class="rl-input !h-20 py-2"></textarea>
              <button type="button" class="rl-mic-btn !top-2" onclick="window.RozgaarVoice.open(document.getElementById('post-job-desc'), 'title')">🎤</button>
            </div>
          </div>

          <!-- Escrow Guarantee Note -->
          <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            ${escrowNote}
          </div>

          <!-- Submit Button -->
          <div class="pt-2">
            <button onclick="window.RozgaarApp.submitPostJob()" class="rl-btn rl-btn-primary w-full py-3.5 text-base">
              <span>${t("postJobSubmit")}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async function submitPostJob() {
    const titleEl = document.getElementById("post-job-title");
    const profEl = document.getElementById("post-job-prof");
    const workersEl = document.getElementById("post-job-workers");
    const wageEl = document.getElementById("post-job-wage");
    const locEl = document.getElementById("post-job-location");
    const dateEl = document.getElementById("post-job-date");
    const durEl = document.getElementById("post-job-duration");
    const skillsEl = document.getElementById("post-job-skills");
    const descEl = document.getElementById("post-job-desc");

    const jobData = {
      title: (titleEl && titleEl.value) || "Daily Masonry Requirement",
      profession: (profEl && profEl.value) || "Mason",
      workersRequired: (workersEl && workersEl.value) ? parseInt(workersEl.value, 10) : 3,
      wage: (wageEl && wageEl.value) ? parseInt(wageEl.value, 10) : 800,
      location: (locEl && locEl.value) || "Kothrud, Pune",
      date: (dateEl && dateEl.value) || "Tomorrow",
      duration: (durEl && durEl.value) || "3 Days",
      requiredSkills: (skillsEl && skillsEl.value) || "Standard skill experience",
      description: (descEl && descEl.value) || "Site work requirement."
    };

    // Auto-translate newly posted job into Hindi and Marathi via Gemini AI / Semantic Engine
    if (window.RozgaarGemini && window.RozgaarGemini.autoTranslateNewJob) {
      try {
        await window.RozgaarGemini.autoTranslateNewJob(jobData);
      } catch (e) {
        console.warn("Auto-translate error:", e);
      }
    }

    window.RozgaarState.postJob(jobData);
    window.RozgaarState.replaceScreen("employerActiveJobs");
  }

  // SCREEN 2: MY ACTIVE JOBS
  function renderEmployerActiveJobs(state) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const employer = window.RozgaarState.getCurrentEmployer();
    const activeJobs = state.jobs.filter(j => j.employerId === employer.id);
    const activeJobsSubtitle = currentLang === 'hi'
      ? 'श्रमिक आवश्यकताएं, नियुक्त दल और कार्य स्थिति ट्रैक करें।'
      : currentLang === 'mr'
      ? 'कामगारांच्या गरजा, नियुक्त चमू आणि कामाची स्थिती ट्रॅक करा.'
      : currentLang === 'te'
      ? 'కార్మికుల అవసరాలు, కేటాయించిన బృందం మరియు పని స్థితిని ట్రాక్ చేయండి.'
      : currentLang === 'ta'
      ? 'தொழிலாளர் தேவைகள், ஒதுக்கப்பட்ட குழு மற்றும் பணி நிலையை கண்காணிக்கவும்.'
      : 'Track worker requirements, assigned crew, and job statuses.';
    const emptyJobsMsg = currentLang === 'hi'
      ? 'अभी तक कोई सक्रिय कार्य पोस्ट नहीं किया गया है।'
      : currentLang === 'mr'
      ? 'अद्याप कोणतेही सक्रिय काम पोस्ट केलेले नाही.'
      : currentLang === 'te'
      ? 'ఇంకా ఎటువంటి క్రియాశీల పనులు పోస్ట్ చేయబడలేదు.'
      : currentLang === 'ta'
      ? 'இதுவரை செயலில் உள்ள வேலைகள் எதுவும் வெளியிடப்படவில்லை.'
      : 'No active jobs posted yet.';

    return `
      <div class="screen-scroll-container without-bottom-nav min-h-full py-4 space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button onclick="window.RozgaarState.replaceScreen('employerDashboard')" class="back-btn">←</button>
            <h2 class="text-lg font-bold text-white">${t("myActiveJobsTitle")}</h2>
          </div>
          <button onclick="window.RozgaarState.pushScreen('employerPostJob')" class="px-3 py-1.5 rounded-xl bg-indigo-600 text-xs font-bold text-white">
            + ${t("postJob")}
          </button>
        </div>

        <p class="text-xs text-slate-400">${activeJobsSubtitle}</p>

        <!-- Active Jobs List (Scrollable) -->
        <div class="space-y-3">
          ${activeJobs.length > 0 ? activeJobs.map(job => {
            const statusClass = {
              "Posted": "badge-held",
              "Applications Open": "badge-profession",
              "Workers Assigned": "badge-distance",
              "In Progress": "badge-held",
              "Completed": "badge-verified"
            }[job.status] || "badge-profession";

            const displayTitle = window.RozgaarGemini ? window.RozgaarGemini.getJobField(job, 'title') : job.title;
            const displayLocation = window.RozgaarGemini ? window.RozgaarGemini.getJobField(job, 'location') : job.location;
            const displayProfession = window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession(job.profession, currentLang) : job.profession;
            const displayDate = window.RozgaarGemini ? window.RozgaarGemini.formatJobDate(job.date, currentLang) : job.date;
            const wageUnit = currentLang === 'hi' ? 'दिन' : currentLang === 'mr' ? 'दिवस' : currentLang === 'te' ? 'రోజు' : currentLang === 'ta' ? 'நாள்' : 'day';
            const reqLabel = currentLang === 'hi' ? 'आवश्यक:' : currentLang === 'mr' ? 'आवश्यक:' : currentLang === 'te' ? 'అవసరం:' : currentLang === 'ta' ? 'தேவை:' : 'Required:';
            const accLabel = currentLang === 'hi' ? 'स्वीकृत:' : currentLang === 'mr' ? 'स्वीकृत:' : currentLang === 'te' ? 'అంగీకరించబడింది:' : currentLang === 'ta' ? 'ஏற்றுக்கொள்ளப்பட்டது:' : 'Accepted:';
            const remLabel = currentLang === 'hi' ? 'शेष:' : currentLang === 'mr' ? 'शिल्लक:' : currentLang === 'te' ? 'మిగిలినవి:' : currentLang === 'ta' ? 'மீதமுள்ளவை:' : 'Remaining:';

            return `
              <div onclick="window.RozgaarState.pushScreen('employerJobDetails', { jobId: '${job.id}' })" class="rl-card p-4 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                <div class="flex items-center justify-between mb-2">
                  <span class="rl-badge badge-profession text-[10px]">${displayProfession}</span>
                  <span class="rl-badge ${statusClass} text-[10px]">${window.RozgaarGemini ? window.RozgaarGemini.formatStatus(job.status, currentLang) : job.status}</span>
                </div>

                <div class="flex items-start justify-between gap-1.5 mb-2">
                  <h4 class="text-sm font-bold text-white line-clamp-1 flex-1">${displayTitle}</h4>
                  ${currentLang !== 'en' ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50 font-medium flex-shrink-0">✨ AI</span>` : ''}
                </div>

                <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mb-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <div>🗓️ ${displayDate}</div>
                  <div>💰 ₹${job.wage}/${wageUnit}</div>
                  <div class="col-span-2 truncate">📍 ${displayLocation}</div>
                </div>

                <!-- Multiple Workers Breakdown (Requirement 26) -->
                <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span class="text-slate-400">${reqLabel}</span>
                    <span class="font-bold text-white">${job.workersRequired}</span>
                  </div>
                  <div>
                    <span class="text-slate-400">${accLabel}</span>
                    <span class="font-bold text-emerald-400">${job.workersAccepted}</span>
                  </div>
                  <div>
                    <span class="text-slate-400">${remLabel}</span>
                    <span class="font-bold text-amber-400">${job.workersRemaining}</span>
                  </div>
                </div>
              </div>
            `;
          }).join("") : `
            <div class="p-8 text-center text-slate-500 text-sm">${emptyJobsMsg}</div>
          `}
        </div>
      </div>
    `;
  }

  // SCREEN 3: EMPLOYER JOB DETAILS & ASSIGNED WORKERS
  function renderEmployerJobDetails(state, params) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const job = state.jobs.find(j => j.id === params.jobId) || state.jobs[0];

    const displayTitle = window.RozgaarGemini ? window.RozgaarGemini.getJobField(job, 'title') : job.title;
    const displayLocation = window.RozgaarGemini ? window.RozgaarGemini.getJobField(job, 'location') : job.location;
    const displayProfession = window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession(job.profession, currentLang) : job.profession;
    const displayDate = window.RozgaarGemini ? window.RozgaarGemini.formatJobDate(job.date, currentLang) : job.date;
    const workersNeededLabel = currentLang === 'hi' ? 'आवश्यक मजदूर' : currentLang === 'mr' ? 'आवश्यक कामगार' : currentLang === 'te' ? 'అవసరమైన కార్మికులు' : currentLang === 'ta' ? 'தேவையான தொழிலாளர்கள்' : 'Workers Needed';
    const accLabel = currentLang === 'hi' ? 'स्वीकृत' : currentLang === 'mr' ? 'स्वीकृत' : currentLang === 'te' ? 'అంగీకరించబడింది' : currentLang === 'ta' ? 'ஏற்றுக்கொள்ளப்பட்டது' : 'Accepted';
    const remLabel = currentLang === 'hi' ? 'शेष' : currentLang === 'mr' ? 'शिल्लक' : currentLang === 'te' ? 'మిగిలినవి' : currentLang === 'ta' ? 'மீதமுள்ளவை' : 'Remaining';

    return `
      <div class="screen-scroll-container without-bottom-nav min-h-full py-4 space-y-4">
        <div class="flex items-center gap-3">
          <button onclick="window.RozgaarState.goBack()" class="back-btn">←</button>
          <h2 class="text-lg font-bold text-white">${t("jobDetailsTitle")}</h2>
        </div>

        <!-- Job Card -->
        <div class="rl-card p-4 border border-blue-500/30 bg-[#0C1527]">
          <div class="flex items-center justify-between mb-2">
            <span class="rl-badge badge-profession">${displayProfession}</span>
            <span class="rl-badge badge-held">${window.RozgaarGemini ? window.RozgaarGemini.formatStatus(job.status, currentLang) : job.status}</span>
          </div>
          <div class="flex items-start justify-between gap-2 mb-2">
            <h3 class="text-base font-bold text-white flex-1">${displayTitle}</h3>
            ${currentLang !== 'en' ? `
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-medium flex-shrink-0 flex items-center gap-1">
                <span>✨</span><span>Gemini AI</span>
              </span>
            ` : ''}
          </div>
          <div class="text-xs text-slate-400 mb-3">📍 ${displayLocation} • 🗓️ ${displayDate}</div>

          <!-- Multiple Workers Capacity Meter -->
          <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs mb-3">
            <div>
              <span class="text-slate-400 block text-[10px]">${workersNeededLabel}</span>
              <span class="font-bold text-white text-sm">${job.workersRequired}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">${accLabel}</span>
              <span class="font-bold text-emerald-400 text-sm">${job.workersAccepted}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">${remLabel}</span>
              <span class="font-bold text-amber-400 text-sm">${job.workersRemaining}</span>
            </div>
          </div>

          <!-- Status Progression Actions (Requirement 33) -->
          <div class="pt-2 flex items-center gap-2">
            ${job.status !== "Completed" ? `
              <button onclick="window.RozgaarState.advanceJobStatus('${job.id}', 'In Progress')" class="rl-btn rl-btn-secondary flex-1 py-2 text-xs">
                ${t("markInProgress")}
              </button>
              <button onclick="window.RozgaarApp.handleCompleteJob('${job.id}')" class="rl-btn rl-btn-primary flex-1 py-2 text-xs">
                ${t("markCompleted")}
              </button>
            ` : `
              <div class="w-full text-center p-2 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold">
                ${currentLang === 'hi' ? '✓ कार्य पूर्ण और भुगतान जारी' : currentLang === 'mr' ? '✓ काम पूर्ण आणि पेमेंट जमा झाले' : currentLang === 'te' ? '✓ పని పూర్తయింది మరియు చెల్లింపు విడుదల చేయబడింది' : currentLang === 'ta' ? '✓ வேலை முடிந்தது & பணம் விடுவிக்கப்பட்டது' : '✓ Job Completed & Payment Released'}
              </div>
            `}
          </div>
        </div>

        <!-- Assigned Workers List (Requirement 28) -->
        <div>
          <h3 class="text-sm font-bold text-white mb-2.5">${t("workersAssignedList")} (${job.assignedWorkers.length})</h3>
          <div class="space-y-2.5">
            ${job.assignedWorkers.length > 0 ? job.assignedWorkers.map(w => `
              <div onclick="window.RozgaarState.pushScreen('employerWorkerProfile', { workerId: '${w.workerId}', jobId: '${job.id}' })" class="rl-card p-3.5 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between">
                <div>
                  <div class="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>${w.name}</span>
                    <span class="rl-badge badge-verified text-[9px] py-0">✓</span>
                  </div>
                  <div class="text-[11px] text-slate-400 mt-0.5">${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession(w.profession, currentLang) : w.profession} • ${w.experience} ${currentLang === 'hi' ? 'वर्ष अनुभव' : currentLang === 'mr' ? 'वर्षे अनुभव' : currentLang === 'te' ? 'సంవత్సరాల అనుభవం' : currentLang === 'ta' ? 'ஆண்டுகள் அனுபவம்' : 'yrs exp'} • ★ ${w.rating}</div>
                </div>
                <div class="text-right">
                  <span class="text-[10px] font-bold text-emerald-400 block">${currentLang === 'hi' ? 'नियुक्त' : currentLang === 'mr' ? 'नियुक्त' : currentLang === 'te' ? 'కేటాయించబడింది' : currentLang === 'ta' ? 'ஒதுக்கப்பட்டது' : 'Assigned'}</span>
                  <span class="text-xs text-indigo-400">${currentLang === 'hi' ? 'प्रोफ़ाइल देखें →' : currentLang === 'mr' ? 'प्रोफाइल पहा →' : currentLang === 'te' ? 'ప్రొఫైల్ చూడండి →' : currentLang === 'ta' ? 'சுயவிவரத்தைக் காண்க →' : 'View Profile →'}</span>
                </div>
              </div>
            `).join("") : `
              <div class="p-6 text-center text-slate-500 text-xs bg-slate-900/60 rounded-2xl border border-slate-800">
                ${t("noAssignedWorkers")}
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function handleCompleteJob(jobId) {
    window.RozgaarState.advanceJobStatus(jobId, "Completed");
    // Open rating modal for employer to rate workers
    window.RozgaarState.openRatingModal({ jobId, role: "employer", workerId: "w-1" });
  }

  // SCREEN 4: WORKER APPLICATIONS (EMPLOYER)
  function renderEmployerWorkerApplications(state, params) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const employer = window.RozgaarState.getCurrentEmployer();
    const apps = state.applications.filter(a => a.employerId === employer.id);
    const workerAppsSubtitle = currentLang === 'hi' 
      ? 'आवेदकों की समीक्षा करें, सत्यापित क्रेडेंशियल्स जांचें और श्रमिकों को नियुक्त करें।'
      : currentLang === 'mr'
      ? 'अर्जदारांचे पुनरावलोकन करा, सत्यापित ओळखपत्रे तपासा आणि कामगारांना कामावर घ्या.'
      : currentLang === 'te'
      ? 'దరఖాస్తుదారులను సమీక్షించండి, ధృవీకరించబడిన ఆధారాలను తనిఖీ చేయండి మరియు సిబ్బందిని నియమించుకోండి.'
      : currentLang === 'ta'
      ? 'விண்ணப்பதாரர்களை மதிப்பாய்வு செய்யவும், சரிபார்க்கப்பட்ட சான்றுகளை ஆய்வு செய்யவும் மற்றும் குழுவை நியமிக்கவும்.'
      : 'Review applicants, inspect verified credentials, and hire crew.';
    const emptyMsg = currentLang === 'hi'
      ? 'अभी तक कोई आवेदन प्राप्त नहीं हुआ।'
      : currentLang === 'mr'
      ? 'अद्याप कोणतेही अर्ज प्राप्त झाले नाहीत.'
      : currentLang === 'te'
      ? 'ఇంకా ఎటువంటి దరఖాస్తులు రాలేదు.'
      : currentLang === 'ta'
      ? 'இதுவரை விண்ணப்பங்கள் எதுவும் வரவில்லை.'
      : 'No applications received yet.';
    const verifiedBadge = currentLang === 'hi' ? '✓ सत्यापित' : currentLang === 'mr' ? '✓ सत्यापित' : currentLang === 'te' ? '✓ ధృవీకరించబడింది' : currentLang === 'ta' ? '✓ சரிபார்க்கப்பட்டது' : '✓ Verified';
    const yrsExpLabel = currentLang === 'hi' ? 'वर्ष अनुभव' : currentLang === 'mr' ? 'वर्षे अनुभव' : currentLang === 'te' ? 'సంవత్సరాల అనుభవం' : currentLang === 'ta' ? 'ஆண்டுகள் அனுபவம்' : 'yrs exp';
    const appliedForLabel = currentLang === 'hi' ? 'आवेदन किया:' : currentLang === 'mr' ? 'अर्ज केला:' : currentLang === 'te' ? 'దరఖాస్తు చేసారు:' : currentLang === 'ta' ? 'விண்ணப்பித்தது:' : 'Applied for:';

    return `
      <div class="screen-scroll-container without-bottom-nav min-h-full py-4 space-y-4">
        <div class="flex items-center gap-3">
          <button onclick="window.RozgaarState.replaceScreen('employerDashboard')" class="back-btn">←</button>
          <h2 class="text-lg font-bold text-white">${t("workerAppsTitle")} (${apps.length})</h2>
        </div>

        <p class="text-xs text-slate-400">${workerAppsSubtitle}</p>

        <!-- Applications List (Scrollable) -->
        <div class="space-y-3">
          ${apps.length > 0 ? apps.map(app => {
            const job = state.jobs.find(j => j.id === app.jobId);
            const displayJobTitle = job ? (window.RozgaarGemini ? window.RozgaarGemini.getJobField(job, 'title') : job.title) : (window.RozgaarGemini ? window.RozgaarGemini.getJobField(app, 'jobTitle') : app.jobTitle);
            const displayProfession = window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession(app.profession, currentLang) : app.profession;
            const displayStatus = window.RozgaarGemini ? window.RozgaarGemini.formatStatus(app.status, currentLang) : app.status;

            return `
              <div class="rl-card p-4 border border-slate-800">
                <div class="flex items-start justify-between mb-2">
                  <div onclick="window.RozgaarState.pushScreen('employerWorkerProfile', { workerId: '${app.workerId}', appId: '${app.id}' })" class="cursor-pointer">
                    <h4 class="text-sm font-bold text-white flex items-center gap-1.5 hover:text-indigo-300">
                      <span>${app.workerName}</span>
                      <span class="rl-badge badge-verified text-[9px] py-0">${verifiedBadge}</span>
                    </h4>
                    <div class="text-xs text-indigo-300 font-semibold mt-0.5">${displayProfession} • ${app.experience} ${yrsExpLabel} • ★ ${app.rating}</div>
                  </div>
                  <span class="rl-badge ${app.status === 'Accepted' ? 'badge-verified' : app.status === 'Rejected' ? 'bg-red-950 text-red-300' : 'badge-held'} text-[10px]">
                    ${displayStatus}
                  </span>
                </div>

                <div class="text-xs text-slate-400 mb-3">
                  ${appliedForLabel} <span class="text-slate-200 font-semibold">${displayJobTitle}</span>
                </div>

                <!-- Accept / Reject Actions (Requirement 30) -->
                ${app.status === 'Pending' ? `
                  <div class="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button onclick="window.RozgaarState.rejectApplication('${app.id}')" class="rl-btn rl-btn-danger flex-1 py-2 text-xs">
                      ${t("rejectWorker")}
                    </button>
                    <button onclick="window.RozgaarState.acceptApplication('${app.id}')" class="rl-btn rl-btn-primary flex-1 py-2 text-xs">
                      ${t("acceptWorker")} ✓
                    </button>
                  </div>
                ` : ''}
              </div>
            `;
          }).join("") : `
            <div class="p-8 text-center text-slate-500 text-sm">${emptyMsg}</div>
          `}
        </div>
      </div>
    `;
  }

  // SCREEN 5: WORKER PROFILE (EMPLOYER VIEW)
  function renderEmployerWorkerProfile(state, params) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const worker = state.workers.find(w => w.id === params.workerId) || state.workers[0];
    const app = state.applications.find(a => a.id === params.appId || (a.workerId === worker.id && a.jobId === params.jobId));
    const profileHeading = currentLang === 'hi' ? 'श्रमिक प्रोफ़ाइल' : currentLang === 'mr' ? 'कामगार प्रोफाइल' : currentLang === 'te' ? 'కార్మికుని ప్రొఫైల్' : currentLang === 'ta' ? 'தொழிலாளர் சுயவிவரம்' : 'Worker Profile';
    const availabilityLabel = currentLang === 'hi' ? 'उपलब्धता:' : currentLang === 'mr' ? 'उपलब्धता:' : currentLang === 'te' ? 'లభ్యత:' : currentLang === 'ta' ? 'கிடைக்கும் தன்மை:' : 'Availability:';
    const availabilityText = currentLang === 'hi' ? (worker.availability === 'Immediate' ? 'तुरंत उपलब्ध' : worker.availability) : currentLang === 'mr' ? (worker.availability === 'Immediate' ? 'तात्काळ उपलब्ध' : worker.availability) : currentLang === 'te' ? (worker.availability === 'Immediate' ? 'వెంటనే లభ్యం' : worker.availability) : currentLang === 'ta' ? (worker.availability === 'Immediate' ? 'உடனடியாக கிடைக்கும்' : worker.availability) : worker.availability;
    const workHistoryHeading = currentLang === 'hi' ? 'पिछला सत्यापित कार्य इतिहास' : currentLang === 'mr' ? 'मागील सत्यापित कामाचा इतिहास' : currentLang === 'te' ? 'మునుపటి ధృవీకరించబడిన పని చరిత్ర' : currentLang === 'ta' ? 'முந்தைய சரிபார்க்கப்பட்ட பணி வரலாறு' : 'Previous Verified Work History';
    const employerLabel = currentLang === 'hi' ? 'नियोक्ता:' : currentLang === 'mr' ? 'नियोक्ता:' : currentLang === 'te' ? 'యజమాని:' : currentLang === 'ta' ? 'முதலாளி:' : 'Employer:';
    const earnedLabel = currentLang === 'hi' ? 'कमाई:' : currentLang === 'mr' ? 'कमावले:' : currentLang === 'te' ? 'సంపాదించినది:' : currentLang === 'ta' ? 'சம்பாதித்தது:' : 'Earned:';

    return `
      <div class="screen-scroll-container without-bottom-nav min-h-full py-4 space-y-4">
        <div class="flex items-center gap-3">
          <button onclick="window.RozgaarState.goBack()" class="back-btn">←</button>
          <h2 class="text-lg font-bold text-white">${profileHeading}</h2>
        </div>

        <!-- Profile Details -->
        <div class="rl-card p-4 border border-slate-800 bg-[#0F172A]">
          <div class="flex items-start gap-3.5 mb-3">
            <img src="${worker.photoUrl}" class="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow" alt="${worker.name}" />
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-white">${worker.name}</h3>
                <span class="rl-badge badge-verified text-[10px]">${t("verifiedWorker")}</span>
              </div>
              <div class="text-xs text-indigo-300 font-bold mt-0.5">${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession(worker.profession, currentLang) : worker.profession} • ${worker.yearsExp} ${currentLang === 'hi' ? 'वर्ष अनुभव' : currentLang === 'mr' ? 'वर्षे अनुभव' : currentLang === 'te' ? 'సంవత్సరాల అనుభవం' : currentLang === 'ta' ? 'ஆண்டுகள் அனுபவம்' : 'Years Exp'}</div>
              <div class="text-[11px] text-slate-400 mt-1">📍 ${worker.locationName}</div>
              <div class="text-[11px] text-emerald-400 font-semibold mt-0.5">${currentLang === 'hi' ? 'अपेक्षित मजदूरी' : currentLang === 'mr' ? 'अपेक्षित मजुरी' : currentLang === 'te' ? 'ఆశించిన వేతనం' : currentLang === 'ta' ? 'எதிர்பார்க்கப்படும் கூலி' : 'Expected Wage'}: ₹${worker.expectedWage}/${currentLang === 'hi' ? 'दिन' : currentLang === 'mr' ? 'दिवस' : currentLang === 'te' ? 'రోజు' : currentLang === 'ta' ? 'நாள்' : 'day'}</div>
              <div class="text-[10px] text-slate-400 mt-1 font-mono">🆔 Aadhaar: ${worker.aadhaarNumber || '7845 XXXX 3456'} • PAN: ${worker.panNumber || 'ABCDE1234F'}</div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
            <span class="text-slate-400">${availabilityLabel}</span>
            <span class="font-bold text-emerald-400">${availabilityText}</span>
          </div>
        </div>

        <!-- Skills & Past Work History -->
        <div class="rl-card p-4 border border-slate-800 space-y-2">
          <h4 class="text-xs font-bold text-indigo-300 uppercase">${t("skills")}</h4>
          <p class="text-xs text-slate-200">${worker.skills}</p>
        </div>

        <div>
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">${workHistoryHeading}</h4>
          <div class="space-y-2">
            ${worker.workHistory.map(wh => `
              <div class="rl-card p-3 border border-slate-800/80 bg-slate-900/60 text-xs">
                <div class="font-bold text-white">${window.RozgaarGemini ? window.RozgaarGemini.smartFallbackTranslate(wh.jobTitle, currentLang) : wh.jobTitle}</div>
                <div class="text-slate-400 text-[11px] mt-0.5">${employerLabel} ${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedEmployerName(wh.employer, currentLang) : wh.employer} • ${wh.duration}</div>
                <div class="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                  <span>${earnedLabel} ₹${wh.amountEarned}</span>
                  <span class="text-emerald-400">✓ ${window.RozgaarGemini ? window.RozgaarGemini.formatStatus(wh.paymentStatus, currentLang) : wh.paymentStatus}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Accept / Reject Actions (If viewing application) -->
        ${app && app.status === 'Pending' ? `
          <div class="pt-2 flex items-center gap-2">
            <button onclick="window.RozgaarState.rejectApplication('${app.id}'); window.RozgaarState.goBack();" class="rl-btn rl-btn-danger flex-1 py-3 text-xs">
              ${t("rejectWorker")}
            </button>
            <button onclick="window.RozgaarState.acceptApplication('${app.id}'); window.RozgaarState.goBack();" class="rl-btn rl-btn-primary flex-1 py-3 text-xs">
              ${t("acceptWorker")} ✓
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  // SCREEN 6: EMPLOYER RECENT PAYMENTS
  function renderEmployerRecentPayments(state) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const employer = window.RozgaarState.getCurrentEmployer();
    const txns = state.transactions.filter(t => t.employerId === employer.id);

    const heldTotal = txns.filter(t => t.status === "Held").reduce((a, c) => a + c.amount, 0);
    const paidTotal = txns.filter(t => t.status === "Paid").reduce((a, c) => a + c.amount, 0);

    const lockedLabel = currentLang === 'hi' ? 'एस्क्रो में सुरक्षित' : currentLang === 'mr' ? 'एस्क्रोमध्ये सुरक्षित' : currentLang === 'te' ? 'ఎస్క్రోలో సురక్షితం' : currentLang === 'ta' ? 'எஸ்க்ரோவில் பாதுகாப்பானது' : 'Locked in Escrow';
    const protectedLabel = currentLang === 'hi' ? '🔒 धनराशि सुरक्षित' : currentLang === 'mr' ? '🔒 निधी सुरक्षित' : currentLang === 'te' ? '🔒 నిధులు సురక్షితం' : currentLang === 'ta' ? '🔒 நிதி பாதுகாப்பானது' : '🔒 Funds Protected';
    const totalReleasedLabel = currentLang === 'hi' ? 'कुल जारी राशि' : currentLang === 'mr' ? 'एकूण जमा रक्कम' : currentLang === 'te' ? 'మొత్తం విడుదలైనది' : currentLang === 'ta' ? 'மொத்தம் விடுவிக்கப்பட்டது' : 'Total Released';
    const paidWorkersLabel = currentLang === 'hi' ? '✓ श्रमिकों को भुगतान' : currentLang === 'mr' ? '✓ कामगारांना दिले' : currentLang === 'te' ? '✓ కార్మికులకు చెల్లించబడింది' : currentLang === 'ta' ? '✓ தொழிலாளர்களுக்கு வழங்கப்பட்டது' : '✓ Paid to Workers';
    const paymentRecordsLabel = currentLang === 'hi' ? 'भुगतान रिकॉर्ड' : currentLang === 'mr' ? 'पेमेंट नोंदी' : currentLang === 'te' ? 'చెల్లింపు రికార్డులు' : currentLang === 'ta' ? 'பணம் செலுத்திய பதிவுகள்' : 'Payment Records';
    const workerCrewLabel = currentLang === 'hi' ? 'श्रमिक दल' : currentLang === 'mr' ? 'कामगार चमू' : currentLang === 'te' ? 'కార్మిక బృందం' : currentLang === 'ta' ? 'தொழிலாளர் குழு' : 'Worker Crew';

    return `
      <div class="screen-scroll-container without-bottom-nav min-h-full py-4 space-y-4">
        <div class="flex items-center gap-3">
          <button onclick="window.RozgaarState.replaceScreen('employerDashboard')" class="back-btn">←</button>
          <h2 class="text-lg font-bold text-white">${t("recentPaymentsTitle")}</h2>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="rl-card p-3.5 bg-gradient-to-br from-indigo-950/70 to-slate-900 border-indigo-500/30">
            <div class="text-[10px] uppercase font-bold text-indigo-300 mb-1">${lockedLabel}</div>
            <div class="text-xl font-black text-amber-400">₹${heldTotal.toLocaleString()}</div>
            <div class="text-[10px] text-amber-300 mt-1">${protectedLabel}</div>
          </div>
          <div class="rl-card p-3.5 bg-gradient-to-br from-blue-950/70 to-slate-900 border-blue-500/30">
            <div class="text-[10px] uppercase font-bold text-blue-300 mb-1">${totalReleasedLabel}</div>
            <div class="text-xl font-black text-white">₹${paidTotal.toLocaleString()}</div>
            <div class="text-[10px] text-emerald-400 mt-1">${paidWorkersLabel}</div>
          </div>
        </div>

        <!-- Transactions List -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">${paymentRecordsLabel}</h3>
          <div class="space-y-2.5">
            ${txns.map(tx => `
              <div onclick="window.RozgaarState.pushScreen('transactionDetails', { txId: '${tx.id}' })" class="rl-card p-3.5 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between">
                <div>
                  <div class="text-xs font-bold text-white">${window.RozgaarGemini ? window.RozgaarGemini.getJobField(tx, 'jobTitle') : tx.jobTitle}</div>
                  <div class="text-[11px] text-slate-400 mt-0.5">${tx.workerName || workerCrewLabel} • ${window.RozgaarGemini ? window.RozgaarGemini.formatJobDate(tx.date, currentLang) : tx.date}</div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-extrabold text-white">₹${tx.amount.toLocaleString()}</div>
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${tx.status === 'Paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}">
                    ${window.RozgaarGemini ? window.RozgaarGemini.formatStatus(tx.status, currentLang) : tx.status}
                  </span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // 7. TRANSACTION DETAILS & TIMELINE
  // ==========================================

  function renderTransactionDetails(state, params) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const tx = state.transactions.find(x => x.id === params.txId) || state.transactions[0];

    const isPaid = tx.status === "Paid";
    const badgeText = isPaid
      ? (currentLang === 'hi' ? 'भुगतान जारी ✓' : currentLang === 'mr' ? 'पेमेंट जमा झाले ✓' : currentLang === 'te' ? 'చెల్లింపు విడుదలైనది ✓' : currentLang === 'ta' ? 'பணம் விடுவிக்கப்பட்டது ✓' : 'Payment Released ✓')
      : (currentLang === 'hi' ? 'धनराशि एस्क्रो में सुरक्षित 🔒' : currentLang === 'mr' ? 'निधी एस्क्रोमध्ये सुरक्षित 🔒' : currentLang === 'te' ? 'నిధులు ఎస్క్రోలో భద్రపరచబడ్డాయి 🔒' : currentLang === 'ta' ? 'நிதி எஸ்க்ரோவில் பாதுகாப்பாக உள்ளது 🔒' : 'Funds Held in Escrow 🔒');

    const jobReqLabel = currentLang === 'hi' ? 'कार्य विवरण:' : currentLang === 'mr' ? 'कामाचे विवरण:' : currentLang === 'te' ? 'పని వివరాలు:' : currentLang === 'ta' ? 'வேலை தேவை:' : 'Job Requirement:';
    const assignedCrewLabel = currentLang === 'hi' ? 'नियुक्त दल' : currentLang === 'mr' ? 'नियुक्त चमू' : currentLang === 'te' ? 'కేటాయించిన బృందం' : currentLang === 'ta' ? 'ஒதுக்கப்பட்ட குழு' : 'Assigned Crew';
    const timelineHeading = currentLang === 'hi' ? 'भुगतान सुरक्षा समयरेखा' : currentLang === 'mr' ? 'पेमेंट सुरक्षा टाइमलाइन' : currentLang === 'te' ? 'చెల్లింపు రక్షణ టైమ్‌లైన్' : currentLang === 'ta' ? 'பணம் செலுத்துதல் பாதுகாப்பு காலவரிசை' : 'Payment Protection Timeline';
    const step1Desc = currentLang === 'hi' ? 'रोजगार लिंक एस्क्रो में धनराशि स्थानांतरित' : currentLang === 'mr' ? 'रोजगार लिंक एस्क्रोमध्ये निधी वर्ग केला' : currentLang === 'te' ? 'రోజ్‌గార్ లింక్ ఎస్క్రోలోకి నిధులు బదిలీ చేయబడ్డాయి' : currentLang === 'ta' ? 'ரோஸ்கார் லிங்க் எஸ்க்ரோவுக்கு நிதி மாற்றப்பட்டது' : 'Funds transferred into RozgaarLink escrow';
    const step2Desc = currentLang === 'hi' ? 'भुगतान सुरक्षित लॉक, कार्य शुरू हुआ' : currentLang === 'mr' ? 'पेमेंट सुरक्षित लॉक, काम सुरू झाले' : currentLang === 'te' ? 'చెల్లింపు సురక్షితంగా లాక్ చేయబడింది, పని ప్రారంభమైంది' : currentLang === 'ta' ? 'பணம் பாதுகாப்பாக பூட்டப்பட்டது, வேலை தொடங்கியது' : 'Payment locked safely, work commenced';
    const step3Desc = isPaid
      ? (currentLang === 'hi' ? 'नियोक्ता द्वारा सत्यापित' : currentLang === 'mr' ? 'नियोक्त्याद्वारे सत्यापित' : currentLang === 'te' ? 'యజమాని ద్వారా ధృవీకరించబడింది' : currentLang === 'ta' ? 'முதலாளியால் சரிபார்க்கப்பட்டது' : 'Verified by employer')
      : (currentLang === 'hi' ? 'श्रमिक द्वारा कार्य प्रगति पर' : currentLang === 'mr' ? 'कामगाराद्वारे काम सुरू आहे' : currentLang === 'te' ? 'కార్మికుడు పనిని కొనసాగిస్తున్నారు' : currentLang === 'ta' ? 'தொழிலாளரால் வேலை நடைபெறுகிறது' : 'In progress by worker');
    const step4Desc = isPaid
      ? (currentLang === 'hi' ? 'श्रमिक के खाते में जमा' : currentLang === 'mr' ? 'कामगाराच्या खात्यात जमा' : currentLang === 'te' ? 'కార్మికుని ఖాతాలో జమ చేయబడింది' : currentLang === 'ta' ? 'தொழிலாளர் கணக்கில் வரவு வைக்கப்பட்டது' : 'Deposited into worker account')
      : (currentLang === 'hi' ? 'कार्य पूर्ण होने की प्रतीक्षा' : currentLang === 'mr' ? 'काम पूर्ण होण्याची प्रतीक्षा' : currentLang === 'te' ? 'పని పూర్తి కావాల్సి ఉంది' : currentLang === 'ta' ? 'வேலை முடிவடையும் வரை நிலுவையில்' : 'Pending completion');

    return `
      <div class="screen-scroll-container without-bottom-nav min-h-full py-4 space-y-4">
        <div class="flex items-center gap-3">
          <button onclick="window.RozgaarState.goBack()" class="back-btn">←</button>
          <h2 class="text-lg font-bold text-white">${t("txDetailsTitle")}</h2>
        </div>

        <!-- Amount Card -->
        <div class="rl-card p-5 border border-indigo-500/40 bg-gradient-to-b from-[#121A2E] to-[#0A0E18] text-center">
          <div class="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">${t("txId")}: ${tx.id}</div>
          <div class="text-3xl font-black text-white mb-2">₹${tx.amount.toLocaleString()}</div>
          <span class="rl-badge ${isPaid ? 'badge-verified' : 'badge-held'} text-xs px-3 py-1">
            ${badgeText}
          </span>
        </div>

        <!-- Details Grid -->
        <div class="rl-card p-4 border border-slate-800 space-y-2.5 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-slate-400">${t("paidBy")}:</span>
            <span class="text-white font-bold">${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedEmployerName(tx.employerName, currentLang) : tx.employerName}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400">${t("paidTo")}:</span>
            <span class="text-white font-bold">${tx.workerName || assignedCrewLabel}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400">${jobReqLabel}</span>
            <span class="text-indigo-300 font-semibold truncate max-w-[200px]">${window.RozgaarGemini ? window.RozgaarGemini.getJobField(tx, 'jobTitle') : tx.jobTitle}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-400">${t("txDate")}:</span>
            <span class="text-slate-300">${window.RozgaarGemini ? window.RozgaarGemini.formatJobDate(tx.date, currentLang) : tx.date}</span>
          </div>
        </div>

        <!-- MANDATORY 4-STEP ESCROW TIMELINE (Requirement 32) -->
        <div class="rl-card p-4 border border-slate-800">
          <h4 class="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-4">
            ${timelineHeading}
          </h4>

          <div class="space-y-4">
            <!-- Step 1 -->
            <div class="timeline-step completed">
              <div class="timeline-dot">✓</div>
              <div>
                <div class="text-xs font-bold text-white">1. ${t("stepEmployerPays")}</div>
                <div class="text-[11px] text-slate-400">${step1Desc}</div>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="timeline-step completed">
              <div class="timeline-dot">🔒</div>
              <div>
                <div class="text-xs font-bold text-white">2. ${t("stepPaymentHeld")}</div>
                <div class="text-[11px] text-slate-400">${step2Desc}</div>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="timeline-step ${isPaid ? 'completed' : 'active'}">
              <div class="timeline-dot">${isPaid ? '✓' : '3'}</div>
              <div>
                <div class="text-xs font-bold text-white">3. ${t("stepJobCompleted")}</div>
                <div class="text-[11px] text-slate-400">${step3Desc}</div>
              </div>
            </div>

            <!-- Step 4 -->
            <div class="timeline-step ${isPaid ? 'completed' : ''}">
              <div class="timeline-dot">${isPaid ? '💰' : '4'}</div>
              <div>
                <div class="text-xs font-bold text-white">4. ${t("stepPaymentReleased")}</div>
                <div class="text-[11px] text-slate-400">${step4Desc}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // 8. NOTIFICATIONS & SETTINGS
  // ==========================================

  function renderNotifications(state) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const notifs = state.notifications || [];
    const emptyNotifsMsg = currentLang === 'hi' ? 'कोई नई सूचनाएं नहीं हैं।' : currentLang === 'mr' ? 'कोणत्याही नवीन सूचना नाहीत.' : currentLang === 'te' ? 'కొత్త నోటిఫికేషన్‌లు లేవు.' : currentLang === 'ta' ? 'புதிய அறிவிப்புகள் எதுவும் இல்லை.' : 'No notifications yet.';

    return `
      <div class="screen-scroll-container without-bottom-nav min-h-full py-4 space-y-4">
        <div class="flex items-center gap-3">
          <button onclick="window.RozgaarState.goBack()" class="back-btn">←</button>
          <h2 class="text-lg font-bold text-white">${t("notifications")}</h2>
        </div>

        <div class="space-y-2.5">
          ${notifs.length > 0 ? notifs.map(n => `
            <div class="rl-card p-3.5 border border-slate-800 flex items-start gap-3">
              <span class="text-xl mt-0.5">${n.type === 'payment' ? '💰' : n.type === 'job' ? '🔨' : '📋'}</span>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-bold text-white">${window.RozgaarGemini ? window.RozgaarGemini.getJobField(n, 'title') : n.title}</h4>
                  <span class="text-[10px] text-slate-500">${window.RozgaarGemini ? window.RozgaarGemini.formatJobDate(n.time, currentLang) : n.time}</span>
                </div>
                <p class="text-xs text-slate-300 mt-1 leading-normal">${window.RozgaarGemini ? window.RozgaarGemini.getJobField(n, 'message') : n.message}</p>
              </div>
            </div>
          `).join("") : `
            <div class="p-8 text-center text-slate-500 text-sm">${emptyNotifsMsg}</div>
          `}
        </div>
      </div>
    `;
  }

  function renderSettings(state) {
    const t = window.RozgaarState.t;
    const currentLang = (window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";

    const helplineText = currentLang === 'hi' ? '24x7 रोज़गारलिंक श्रमिक हेल्पलाइन:' : currentLang === 'mr' ? '२४x७ रोजगारलिंक कामगार हेल्पलाइन:' : currentLang === 'te' ? '24x7 రోజ్‌గార్ లింక్ కార్మిక హెల్ప్‌లైన్:' : currentLang === 'ta' ? '24x7 ரோஸ்கார் லிங்க் தொழிலாளர் உதவி எண்:' : '24x7 RozgaarLink Worker Helpline:';
    const callSupportBtn = currentLang === 'hi' ? '📞 सहायता कॉल करें' : currentLang === 'mr' ? '📞 सपोर्टला कॉल करा' : currentLang === 'te' ? '📞 సపోర్ట్‌కి కాల్ చేయండి' : currentLang === 'ta' ? '📞 உதவிக்கு அழைக்கவும்' : '📞 Call Support';
    const versionText = currentLang === 'hi' ? 'संस्करण 2.0 • प्रोटोटाइप' : currentLang === 'mr' ? 'आवृत्ती २.० • प्रोटोटाइप' : currentLang === 'te' ? 'వెర్షన్ 2.0 • ప్రోటోటైప్' : currentLang === 'ta' ? 'பதிப்பு 2.0 • முன்மாதிரி' : 'Version 2.0 • Prototype';
    const aboutDesc = currentLang === 'hi' ? '5 किमी के दायरे में दैनिक वेतनभोगी श्रमिकों को नजदीकी नियोक्ताओं से जोड़ना, सुरक्षित एस्क्रो भुगतान के साथ।' : currentLang === 'mr' ? '५ किमी परिसरात दैनंदिन वेतन कामगारांना जवळच्या नियोक्त्यांशी जोडणे, सुरक्षित एस्क्रो पेमेंटसह.' : currentLang === 'te' ? '5 కిమీ పరిధిలో రోజువారీ వేతన కార్మికులను సమీప యజమానులతో కనెక్ట్ చేయడం, రక్షిత ఎస్క్రో చెల్లింపుతో.' : currentLang === 'ta' ? '5 கி.மீ சுற்றளவில் தினசரி கூலித் தொழிலாளர்களை அருகிலுள்ள முதலாளிகளுடன் இணைத்தல், பாதுகாக்கப்பட்ட எஸ்க்ரோ கட்டணத்துடன்.' : 'Connecting daily-wage workers with nearby employers within 5 km with protected payment escrow.';

    return `
      <div class="screen-scroll-container without-bottom-nav min-h-full py-4 space-y-4">
        <div class="flex items-center gap-3">
          <button onclick="window.RozgaarState.goBack()" class="back-btn">←</button>
          <h2 class="text-lg font-bold text-white">${t("settings")}</h2>
        </div>

        <!-- Language Preference -->
        <div class="rl-card p-4 border border-slate-800 space-y-2.5">
          <h4 class="text-xs font-bold text-indigo-300 uppercase">${t("languageSetting")}</h4>
          <div class="grid grid-cols-3 gap-2">
            <button onclick="window.RozgaarState.setLanguage('en')" class="p-2.5 rounded-xl border text-xs font-bold transition ${state.language === 'en' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800'}">
              English
            </button>
            <button onclick="window.RozgaarState.setLanguage('hi')" class="p-2.5 rounded-xl border text-xs font-bold transition ${state.language === 'hi' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800'}">
              हिंदी
            </button>
            <button onclick="window.RozgaarState.setLanguage('mr')" class="p-2.5 rounded-xl border text-xs font-bold transition ${state.language === 'mr' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800'}">
              मराठी
            </button>
            <button onclick="window.RozgaarState.setLanguage('te')" class="p-2.5 rounded-xl border text-xs font-bold transition ${state.language === 'te' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800'}">
              తెలుగు
            </button>
            <button onclick="window.RozgaarState.setLanguage('ta')" class="p-2.5 rounded-xl border text-xs font-bold transition ${state.language === 'ta' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800'}">
              தமிழ்
            </button>
          </div>
        </div>

        <!-- Support & Helpline -->
        <div class="rl-card p-4 border border-slate-800 space-y-2">
          <h4 class="text-xs font-bold text-white">${t("helpSupport")}</h4>
          <p class="text-xs text-slate-400">${helplineText} <span class="text-indigo-400 font-bold">1800-ROZGAAR (7694227)</span></p>
          <div class="pt-1">
            <button onclick="window.RozgaarState.toast('Helpline call connected: 1800-7694227', 'info')" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200">
              ${callSupportBtn}
            </button>
          </div>
        </div>

        <!-- About RozgaarLink -->
        <div class="rl-card p-4 border border-slate-800 space-y-1.5">
          <h4 class="text-xs font-bold text-white">${t("aboutRozgaarLink")}</h4>
          <p class="text-xs text-slate-400">${versionText}</p>
          <p class="text-[11px] text-slate-500">${aboutDesc}</p>
        </div>

        <!-- Sign Out -->
        <div class="pt-4">
          <button onclick="window.RozgaarState.replaceScreen('welcome')" class="rl-btn rl-btn-danger w-full py-3.5 text-xs font-bold">
            🚪 ${t("logout")}
          </button>
        </div>
      </div>
    `;
  }

  function saveGeminiApiKey() {
    const input = document.getElementById("gemini-api-key-input");
    const key = input ? input.value.trim() : "";
    if (window.RozgaarGemini) {
      window.RozgaarGemini.setApiKey(key);
      if (key) {
        window.RozgaarState.toast("Google Gemini API Key saved successfully! ✨", "success");
      } else {
        window.RozgaarState.toast("Reverted to built-in construction trade engine.", "info");
      }
      window.RozgaarState.notify();
    }
  }

  function clearGeminiApiKey() {
    if (window.RozgaarGemini) {
      window.RozgaarGemini.setApiKey("");
      window.RozgaarState.toast("Gemini API key cleared. Using built-in engine.", "info");
      window.RozgaarState.notify();
    }
  }

  async function testGeminiTranslation() {
    const sample = "Concealed electrical wiring & switchboard fitting";
    window.RozgaarState.toast("Translating test job with Gemini AI...", "info");
    if (window.RozgaarGemini) {
      const hi = await window.RozgaarGemini.translate(sample, "hi");
      const mr = await window.RozgaarGemini.translate(sample, "mr");
      window.RozgaarState.toast(`Hindi: "${hi}" | Marathi: "${mr}"`, "success");
    }
  }

  return {
    init,
    selectRoleAndNavigate,
    handleWorkerRegBack,
    proceedWorkerStep,
    updateWorkerData,
    clearFieldError,
    completeWorkerRegistration,
    sendWorkerOTP,
    verifyWorkerOTP,
    completeLoginFlow,
    signInWithGoogle,
    signInWithPassword,
    registerWithPassword,
    forgotPassword,
    sendPasswordReset,
    handleJobsSearch,
    setProfessionFilter,
    updateEmployerData,
    simulateBusinessVerify,
    completeEmployerRegistration,
    sendEmployerOTP,
    verifyEmployerOTP,
    submitPostJob,
    handleCompleteJob,
    saveGeminiApiKey,
    clearGeminiApiKey,
    testGeminiTranslation
  };
})();
