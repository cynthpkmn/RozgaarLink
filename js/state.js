/**
 * RozgaarLink Reactive State Management & Navigation Router
 */

window.RozgaarState = (function() {
  const STORAGE_KEY = "ROZGAAR_APP_STATE_V3";

  // Default initial state
  let state = {
    currentScreen: "welcome", // 'welcome', 'language', 'userType', 'workerAuth', 'workerSignUp', 'workerSignIn', 'employerAuth', 'employerSignUp', 'employerSignIn', 'workerDashboard', 'employerDashboard', 'jobDetails', 'employerPostJob', 'employerActiveJobs', 'employerJobDetails', 'employerWorkerApplications', 'employerWorkerProfile', 'employerRecentPayments', 'transactionDetails', 'notifications', 'settings', 'ratingModal'
    screenParams: {},
    historyStack: [], // For back navigation
    language: "en", // 'en', 'hi', 'mr'
    userRole: null, // 'worker' | 'employer'
    activeWorkerTab: "home", // 'home', 'jobs', 'applications', 'payments', 'profile'
    jobsViewMode: "list", // 'list' | 'map'
    
    currentWorkerId: "w-1", // Logged in worker (Rajesh Kumar - Mason by default)
    currentEmployerId: "emp-1", // Logged in employer (ABC Construction by default)

    workers: [],
    employers: [],
    jobs: [],
    applications: [],
    transactions: [],
    notifications: [],

    // Temporary registration / auth state
    authForm: {
      step: 1,
      step1Completed: false,
      validationErrors: {},
      mobile: "",
      otp: "",
      generatedOtp: "1234",
      workerData: {
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
      },
      employerData: {
        name: "",
        mobile: "",
        companyName: "",
        businessAddress: "",
        locationName: "Kothrud, Pune",
        gstin: "",
        pan: "",
        aadhaar: "",
        businessVerified: false
      }
    },

    activeRatingTarget: null // { jobId, workerId, employerId, role }
  };

  const listeners = [];

  async function init() {
    loadFromStorage();
    if (!state.workers || state.workers.length === 0) {
      resetToDefaultData();
    }
    // Synchronize with SQLite backend if API server is running
    if (window.RozgaarApi) {
      try {
        const worker = getCurrentWorker();
        const coords = (worker && worker.coordinates) ? worker.coordinates : { lat: 18.5074, lng: 73.8077 };
        const res = await window.RozgaarApi.getGeoFencedJobs(coords.lat, coords.lng);
        if (res && (res.nearby !== undefined || res.extended !== undefined)) {
          state.jobs = [...(res.nearby || []), ...(res.extended || [])];
          notify();
        }
      } catch (e) {}
    }
  }

  function resetToDefaultData() {
    const initial = window.ROZGAAR_INITIAL_DATA || {};
    state.workers = JSON.parse(JSON.stringify(initial.workers || []));
    state.employers = JSON.parse(JSON.stringify(initial.employers || []));
    // Fixed: Jobs start empty by default until an employer actively posts a job
    state.jobs = [];
    state.applications = [];
    state.transactions = [];
    state.notifications = JSON.parse(JSON.stringify(initial.notifications || []));
    saveToStorage();
    if (window.RozgaarApi && window.RozgaarApi.clearAllJobs) {
      window.RozgaarApi.clearAllJobs();
    }
  }

  function loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state = Object.assign(state, parsed);
        // Ensure latest localized fields from initial data are merged into existing cached jobs
        if (window.ROZGAAR_INITIAL_DATA) {
          // Merge jobs
          if (window.ROZGAAR_INITIAL_DATA.jobs && state.jobs) {
            state.jobs.forEach(j => {
              const initJob = window.ROZGAAR_INITIAL_DATA.jobs.find(ij => ij.id === j.id);
              if (initJob) {
                for (const key of Object.keys(initJob)) {
                  if (key.includes('_hi') || key.includes('_mr') || key.includes('_te') || key.includes('_ta')) {
                    j[key] = initJob[key];
                  }
                }
              }
            });
          }
          // Merge applications
          if (window.ROZGAAR_INITIAL_DATA.applications && state.applications) {
            state.applications.forEach(a => {
              const initApp = window.ROZGAAR_INITIAL_DATA.applications.find(ia => ia.id === a.id);
              if (initApp) {
                for (const key of Object.keys(initApp)) {
                  if (key.includes('_hi') || key.includes('_mr') || key.includes('_te') || key.includes('_ta')) {
                    a[key] = initApp[key];
                  }
                }
              }
              // Also ensure job-based titles are linked
              const linkedJob = state.jobs && state.jobs.find(j => j.id === a.jobId);
              if (linkedJob) {
                a.jobTitle_hi = linkedJob.title_hi || a.jobTitle;
                a.jobTitle_mr = linkedJob.title_mr || a.jobTitle;
                a.jobTitle_te = linkedJob.title_te || a.jobTitle;
                a.jobTitle_ta = linkedJob.title_ta || a.jobTitle;
              }
            });
          }
          // Merge transactions
          if (window.ROZGAAR_INITIAL_DATA.transactions && state.transactions) {
            state.transactions.forEach(t => {
              const initTx = window.ROZGAAR_INITIAL_DATA.transactions.find(it => it.id === t.id);
              if (initTx) {
                for (const key of Object.keys(initTx)) {
                  if (key.includes('_hi') || key.includes('_mr') || key.includes('_te') || key.includes('_ta')) {
                    t[key] = initTx[key];
                  }
                }
              }
            });
          }
          // Merge notifications
          if (window.ROZGAAR_INITIAL_DATA.notifications && state.notifications) {
            state.notifications.forEach(n => {
              const initN = window.ROZGAAR_INITIAL_DATA.notifications.find(inItem => inItem.id === n.id);
              if (initN) {
                for (const key of Object.keys(initN)) {
                  if (key.includes('_hi') || key.includes('_mr') || key.includes('_te') || key.includes('_ta')) {
                    n[key] = initN[key];
                  }
                }
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn("Could not read from localStorage", e);
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        language: state.language,
        userRole: state.userRole,
        currentWorkerId: state.currentWorkerId,
        currentEmployerId: state.currentEmployerId,
        activeWorkerTab: state.activeWorkerTab,
        workers: state.workers,
        employers: state.employers,
        jobs: state.jobs,
        applications: state.applications,
        transactions: state.transactions,
        notifications: state.notifications
      }));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  }

  function subscribe(fn) {
    listeners.push(fn);
  }

  function notify() {
    saveToStorage();
    listeners.forEach(fn => fn(state));
  }

  function getState() {
    return state;
  }

  // Translation helper
  function t(key) {
    const lang = state.language || "en";
    const dict = (window.ROZGAAR_TRANSLATIONS && window.ROZGAAR_TRANSLATIONS[lang]) || {};
    if (dict[key] !== undefined) return dict[key];
    const fallback = (window.ROZGAAR_TRANSLATIONS && window.ROZGAAR_TRANSLATIONS["en"]) || {};
    return fallback[key] || key;
  }

  function setLanguage(lang) {
    state.language = lang;
    notify();
    if (window.RozgaarGemini && window.RozgaarGemini.warmupTranslations) {
      window.RozgaarGemini.warmupTranslations(state.jobs, lang);
    }
  }

  function getLanguage() {
    return state.language || "en";
  }

  // Form Validation & Gating
  function validateWorkerStep1(data) {
    const errors = {};
    const name = (data && data.name ? String(data.name).trim() : "");
    if (!name || name.length < 2) {
      errors.name = t("errNameRequired");
    }

    const mobile = (data && data.mobile ? String(data.mobile).trim() : "");
    const cleanMobile = mobile.replace(/[\s-]/g, "");
    if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      errors.mobile = t("errMobileRequired");
    }

    const age = Number(data && data.age);
    if (!age || isNaN(age) || age < 18 || age > 70) {
      errors.age = t("errAgeInvalid");
    }

    const address = (data && data.address ? String(data.address).trim() : "");
    if (!address || address.length < 3) {
      errors.address = t("errAddressRequired");
    }

    const loc = (data && data.locationName ? String(data.locationName).trim() : "");
    if (!loc) {
      errors.locationName = t("errLocationRequired");
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  function validateWorkerStep2(data) {
    const errors = {};
    const prof = (data && data.profession ? String(data.profession).trim() : "");
    if (!prof) {
      errors.profession = "Profession is required";
    }

    const skills = (data && data.skills ? String(data.skills).trim() : "");
    if (!skills || skills.length < 2) {
      errors.skills = t("errSkillsRequired");
    }

    const wage = Number(data && data.expectedWage);
    if (!wage || isNaN(wage) || wage < 200 || wage > 50000) {
      errors.expectedWage = t("errWageInvalid");
    }

    const exp = Number(data && data.yearsExp);
    if (isNaN(exp) || exp < 0 || exp > 50) {
      errors.yearsExp = "Experience must be between 0 and 50 years";
    }

    const aadhaar = (data && data.aadhaarNumber ? String(data.aadhaarNumber).trim().replace(/\s+/g, "") : "");
    if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
      errors.aadhaarNumber = t("errAadhaarInvalid");
    }

    const pan = (data && data.panNumber ? String(data.panNumber).trim().toUpperCase() : "");
    if (!pan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      errors.panNumber = t("errPanInvalid");
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  function checkRoutingGuards(screenName) {
    if (screenName === "workerSignUp") {
      if (state.authForm.step === 2) {
        const v1 = validateWorkerStep1(state.authForm.workerData);
        if (!v1.valid) {
          state.authForm.step = 1;
          state.authForm.step1Completed = false;
        }
      }
    }
  }

  // Navigation / Router
  function navigate(screenName, params = {}) {
    checkRoutingGuards(screenName);
    state.historyStack.push({ screen: state.currentScreen, params: state.screenParams });
    state.currentScreen = screenName;
    state.screenParams = params;
    notify();
  }

  function pushScreen(screenName, params = {}) {
    navigate(screenName, params);
  }

  function replaceScreen(screenName, params = {}) {
    checkRoutingGuards(screenName);
    state.currentScreen = screenName;
    state.screenParams = params;
    notify();
  }

  function goBack() {
    // If on employer child sub-screens, always safely return to employerDashboard
    if (state.currentScreen === "employerActiveJobs" ||
        state.currentScreen === "employerPostJob" ||
        state.currentScreen === "employerWorkerApplications" ||
        state.currentScreen === "employerRecentPayments") {
      state.currentScreen = "employerDashboard";
      state.screenParams = {};
      notify();
      return;
    }
    if (state.currentScreen === "employerJobDetails") {
      state.currentScreen = "employerActiveJobs";
      state.screenParams = {};
      notify();
      return;
    }
    if (state.currentScreen === "employerWorkerProfile") {
      state.currentScreen = "employerWorkerApplications";
      state.screenParams = {};
      notify();
      return;
    }

    if (state.historyStack.length > 0) {
      let prev = state.historyStack.pop();
      while (prev && prev.screen === state.currentScreen && state.historyStack.length > 0) {
        prev = state.historyStack.pop();
      }
      if (prev && prev.screen !== state.currentScreen) {
        state.currentScreen = prev.screen;
        state.screenParams = prev.params;
        notify();
        return;
      }
    }

    // Fallback based on active role
    if (state.userRole === "worker") {
      state.currentScreen = "workerDashboard";
    } else if (state.userRole === "employer") {
      state.currentScreen = "employerDashboard";
    } else {
      state.currentScreen = "welcome";
    }
    notify();
  }

  function setWorkerTab(tabName) {
    state.activeWorkerTab = tabName;
    if (state.currentScreen !== "workerDashboard") {
      state.currentScreen = "workerDashboard";
    }
    notify();
  }

  function setUserRole(role) {
    state.userRole = role;
    notify();
  }

  function setJobsViewMode(mode) {
    state.jobsViewMode = mode;
    notify();
  }

  function updateWorkerLocation(lat, lng, locationName) {
    const worker = getCurrentWorker();
    if (worker) {
      worker.coordinates = { lat, lng };
      if (locationName) {
        worker.locationName = locationName;
      }
    }
    // Dynamic distance calculation for all jobs using Haversine
    if (state.jobs && state.jobs.length > 0) {
      state.jobs.forEach((job, idx) => {
        if (job.coordinates) {
          const rawDist = window.RozgaarMap
            ? window.RozgaarMap.calculateDistance(lat, lng, job.coordinates.lat, job.coordinates.lng)
            : 0;
          if (rawDist > 50) {
            // Worker is located in another city (e.g. Delhi, Mumbai). Re-anchor sample jobs realistically within 5km radar
            const angle = (idx * (360 / state.jobs.length) + 25) * (Math.PI / 180);
            const radiusKm = 0.8 + ((idx * 0.7) % 3.6);
            const dLat = (radiusKm * Math.cos(angle)) / 111;
            const dLng = (radiusKm * Math.sin(angle)) / (111 * Math.cos(lat * Math.PI / 180));
            job.coordinates = { lat: lat + dLat, lng: lng + dLng };
          }
        }

        if (job.coordinates && typeof job.coordinates.lat === "number" && typeof job.coordinates.lng === "number") {
          if (window.RozgaarMap && window.RozgaarMap.calculateDistance) {
            job.distance = window.RozgaarMap.calculateDistance(lat, lng, job.coordinates.lat, job.coordinates.lng);
          } else {
            const R = 6371;
            const dLat = (job.coordinates.lat - lat) * Math.PI / 180;
            const dLon = (job.coordinates.lng - lng) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat * Math.PI / 180) * Math.cos(job.coordinates.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            job.distance = Math.round(R * c * 10) / 10;
          }
        }
      });
      state.jobs.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    notify();
  }

  // Worker Actions
  function getCurrentWorker() {
    return state.workers.find(w => w.id === state.currentWorkerId) || state.workers[0];
  }

  function toggleWorkerAvailability() {
    const worker = getCurrentWorker();
    if (worker) {
      worker.availability = worker.availability.includes("Available")
        ? "Currently Working"
        : "Available for Work ✓";
      toast(`Status updated: ${worker.availability}`, "info");
      notify();
    }
  }

  async function applyForJob(jobId) {
    const worker = getCurrentWorker();
    const job = state.jobs.find(j => j.id === jobId);
    if (!worker || !job) return;

    // Check if already applied
    const existing = state.applications.find(a => a.jobId === jobId && a.workerId === worker.id);
    if (existing) {
      toast("You have already applied for this job!", "info");
      return;
    }

    const newApp = {
      id: "app-" + Date.now(),
      jobId: job.id,
      jobTitle: job.title,
      jobTitle_hi: job.title_hi || job.title,
      jobTitle_mr: job.title_mr || job.title,
      jobTitle_te: job.title_te || job.title,
      jobTitle_ta: job.title_ta || job.title,
      employerName: job.employerName,
      employerId: job.employerId,
      workerId: worker.id,
      workerName: worker.name,
      profession: worker.profession,
      skills: worker.skills,
      experience: worker.yearsExp,
      rating: worker.rating,
      location: worker.locationName,
      appliedDate: "Just now",
      dateRequired: job.date,
      wage: job.wage,
      status: "Pending"
    };

    state.applications.unshift(newApp);

    // Sync to SQLite backend if API is connected
    if (window.RozgaarApi && window.RozgaarApi.applyForJob) {
      try {
        await window.RozgaarApi.applyForJob(newApp);
      } catch (err) {
        console.warn("Could not save application to backend DB:", err);
      }
    }

    // Create Notification for Employer
    state.notifications.unshift({
      id: "notif-" + Date.now(),
      target: "employer",
      employerId: job.employerId,
      title: "New Worker Application",
      title_hi: "नया मजदूर आवेदन",
      title_mr: "नवीन कामगार अर्ज",
      title_te: "కొత్త కార్మికుడి దరఖాస్తు",
      title_ta: "புதிய தொழிலாளர் விண்ணப்பம்",
      message: `${worker.name} (${worker.profession}, ${worker.yearsExp} yrs exp) applied for '${job.title}'.`,
      message_hi: `${worker.name} (${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession(worker.profession, 'hi') : worker.profession}) ने कार्य हेतु आवेदन किया।`,
      message_mr: `${worker.name} (${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession(worker.profession, 'mr') : worker.profession}) यांनी कामासाठी अर्ज केला.`,
      message_te: `${worker.name} (${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession(worker.profession, 'te') : worker.profession}) పనికి దరఖాస్తు చేసారు.`,
      message_ta: `${worker.name} (${window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession(worker.profession, 'ta') : worker.profession}) வேலைக்கு விண்ணப்பித்தார்.`,
      time: "Just now",
      read: false,
      type: "application"
    });

    toast(t("applicationSubmitted"), "success");
    notify();
  }

  // Employer Actions
  function getCurrentEmployer() {
    return state.employers.find(e => e.id === state.currentEmployerId) || state.employers[0];
  }

  function postJob(jobData) {
    const employer = getCurrentEmployer();
    const curWorker = getCurrentWorker();
    const workerCoords = (curWorker && curWorker.coordinates) ? curWorker.coordinates : { lat: 18.5074, lng: 73.8077 };
    
    // Determine coordinates (use provided or place within 1-3km of employer/worker)
    const jobLat = jobData.latitude || (jobData.coordinates && jobData.coordinates.lat) || (workerCoords.lat + (Math.random() - 0.5) * 0.03);
    const jobLng = jobData.longitude || (jobData.coordinates && jobData.coordinates.lng) || (workerCoords.lng + (Math.random() - 0.5) * 0.03);

    const calcDist = (window.RozgaarMap && window.RozgaarMap.calculateDistance)
      ? window.RozgaarMap.calculateDistance(workerCoords.lat, workerCoords.lng, jobLat, jobLng)
      : 1.5;

    const newJob = {
      id: "job-" + Date.now(),
      title: jobData.title || "Daily Construction Requirement",
      title_hi: jobData.title_hi || jobData.title,
      title_mr: jobData.title_mr || jobData.title,
      title_te: jobData.title_te || jobData.title,
      title_ta: jobData.title_ta || jobData.title,
      profession: jobData.profession || "Mason",
      employerId: employer.id,
      employerName: employer.companyName,
      employerVerified: employer.businessVerified,
      employerRating: employer.rating || 4.8,
      location: jobData.location || "Kothrud, Pune",
      location_hi: jobData.location_hi || jobData.location,
      location_mr: jobData.location_mr || jobData.location,
      location_te: jobData.location_te || jobData.location,
      location_ta: jobData.location_ta || jobData.location,
      distance: calcDist,
      coordinates: { lat: jobLat, lng: jobLng },
      wage: Number(jobData.wage) || 800,
      wageType: "per day",
      date: jobData.date || "Tomorrow",
      startTime: jobData.startTime || "8:30 AM",
      endTime: jobData.endTime || "5:30 PM",
      duration: jobData.duration || "3 Days",
      workersRequired: Number(jobData.workersRequired) || 2,
      workersAccepted: 0,
      workersRemaining: Number(jobData.workersRequired) || 2,
      requiredSkills: jobData.requiredSkills || "Standard craft experience",
      requiredExperience: jobData.requiredExperience || "2+ Years",
      description: jobData.description || "Daily work requirement.",
      paymentProtected: true,
      status: "Applications Open",
      assignedWorkers: []
    };

    state.jobs.unshift(newJob);

    // Persist to SQLite backend database
    if (window.RozgaarApi && window.RozgaarApi.postJob) {
      window.RozgaarApi.postJob(newJob);
    }

    // Create Escrow Transaction (Held)
    const totalEscrow = newJob.wage * newJob.workersRequired;
    state.transactions.unshift({
      id: "TXN-" + Math.floor(100000 + Math.random() * 900000),
      jobId: newJob.id,
      jobTitle: newJob.title,
      employerName: employer.companyName,
      employerId: employer.id,
      workerName: "Multiple Workers",
      workerId: null,
      date: "Today",
      amount: totalEscrow,
      status: "Held",
      timeline: {
        employerPaid: true,
        paymentHeld: true,
        jobCompleted: false,
        paymentReleased: false
      },
      notes: "Advance escrow locked. Funds held securely by RozgaarLink."
    });

    // Worker Notification
    state.notifications.unshift({
      id: "notif-" + Date.now(),
      target: "worker",
      workerId: null,
      title: "New Job Posted Nearby!",
      message: `${employer.companyName} posted '${newJob.title}' within 5 km. Daily wage ₹${newJob.wage}.`,
      time: "Just now",
      read: false,
      type: "job"
    });

    toast("Job Posted Successfully ✓", "success");
    notify();
  }

  async function acceptApplication(appId) {
    const app = state.applications.find(a => a.id === appId);
    if (!app) return;

    app.status = "Accepted";

    // Sync to SQLite backend if API is connected
    if (window.RozgaarApi && window.RozgaarApi.updateApplicationStatus) {
      try {
        await window.RozgaarApi.updateApplicationStatus(appId, "Accepted");
      } catch (err) {
        console.warn("Could not update application status on backend DB:", err);
      }
    }

    // Update job's accepted count and assigned workers
    const job = state.jobs.find(j => j.id === app.jobId);
    if (job) {
      if (job.workersAccepted < job.workersRequired) {
        job.workersAccepted += 1;
        job.workersRemaining = Math.max(0, job.workersRequired - job.workersAccepted);
      }
      if (job.workersRemaining === 0) {
        job.status = "Workers Assigned";
        if (window.RozgaarApi && window.RozgaarApi.updateJobStatus) {
          try {
            await window.RozgaarApi.updateJobStatus(job.id, "Workers Assigned");
          } catch (e) {}
        }
      }

      const worker = state.workers.find(w => w.id === app.workerId);
      if (worker && !job.assignedWorkers.some(aw => aw.workerId === worker.id)) {
        job.assignedWorkers.push({
          workerId: worker.id,
          name: worker.name,
          profession: worker.profession,
          experience: worker.yearsExp,
          rating: worker.rating,
          availability: worker.availability,
          workStatus: "Assigned"
        });
      }
    }

    // Worker notification
    state.notifications.unshift({
      id: "notif-" + Date.now(),
      target: "worker",
      workerId: app.workerId,
      title: "Application Accepted ✓",
      message: `Congratulations! Your application for '${app.jobTitle}' has been accepted.`,
      time: "Just now",
      read: false,
      type: "application"
    });

    toast("Worker Accepted & Assigned ✓", "success");
    notify();
  }

  async function rejectApplication(appId) {
    const app = state.applications.find(a => a.id === appId);
    if (!app) return;
    app.status = "Rejected";

    // Sync to SQLite backend if API is connected
    if (window.RozgaarApi && window.RozgaarApi.updateApplicationStatus) {
      try {
        await window.RozgaarApi.updateApplicationStatus(appId, "Rejected");
      } catch (err) {
        console.warn("Could not update application status on backend DB:", err);
      }
    }

    state.notifications.unshift({
      id: "notif-" + Date.now(),
      target: "worker",
      workerId: app.workerId,
      title: "Application Update",
      message: `Your application for '${app.jobTitle}' was not selected this time.`,
      time: "Just now",
      read: false,
      type: "application"
    });

    toast("Application Rejected", "info");
    notify();
  }

  async function advanceJobStatus(jobId, nextStatus) {
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;

    job.status = nextStatus;

    // Sync to SQLite backend if API is connected
    if (window.RozgaarApi && window.RozgaarApi.updateJobStatus) {
      try {
        await window.RozgaarApi.updateJobStatus(jobId, nextStatus);
      } catch (err) {
        console.warn("Could not update job status on backend DB:", err);
      }
    }

    if (nextStatus === "Completed") {
      // Release Escrow Payment
      const txn = state.transactions.find(t => t.jobId === jobId && t.status === "Held");
      if (txn) {
        txn.status = "Paid";
        txn.timeline.jobCompleted = true;
        txn.timeline.paymentReleased = true;
        txn.notes = "Job marked completed. Payment released to worker accounts.";
      }

      // Add to completed work history of all assigned workers
      job.assignedWorkers.forEach(aw => {
        const worker = state.workers.find(w => w.id === aw.workerId);
        if (worker) {
          worker.workHistory.unshift({
            id: "wh-" + Date.now(),
            jobTitle: job.title,
            employer: job.employerName,
            date: "Today",
            duration: job.duration,
            amountEarned: job.wage * parseInt(job.duration || "1"),
            paymentStatus: "Paid ✓",
            ratingReceived: 5,
            location: job.location
          });
        }
      });

      // Notify workers
      state.notifications.unshift({
        id: "notif-" + Date.now(),
        target: "worker",
        workerId: null,
        title: "Payment Released 💰",
        message: `Work for '${job.title}' completed! Payment has been credited to your account.`,
        time: "Just now",
        read: false,
        type: "payment"
      });

      toast("Job Completed & Payment Released 💰✓", "success");
    } else {
      toast(`Job status updated to: ${nextStatus}`, "info");
    }

    notify();
  }

  function submitRating(rating, review = "") {
    if (!state.activeRatingTarget) return;
    const { jobId, workerId, employerId, role } = state.activeRatingTarget;

    if (role === "employer" && workerId) {
      const worker = state.workers.find(w => w.id === workerId);
      if (worker) {
        worker.reviewsCount = (worker.reviewsCount || 10) + 1;
        worker.rating = Number(((worker.rating * 10 + rating) / 11).toFixed(1));
      }
    } else if (role === "worker" && employerId) {
      const employer = state.employers.find(e => e.id === employerId);
      if (employer) {
        employer.rating = Number(((employer.rating * 10 + rating) / 11).toFixed(1));
      }
    }

    state.activeRatingTarget = null;
    toast(t("ratingSubmitted"), "success");
    notify();
  }

  function openRatingModal(params) {
    state.activeRatingTarget = params;
    const modal = document.getElementById("rating-modal");
    if (modal) {
      modal.classList.remove("hidden");
      const lang = getLanguage();
      const titleEl = document.getElementById("rating-modal-title");
      const subEl = document.getElementById("rating-modal-subtitle");
      const revLabelEl = document.getElementById("rating-modal-review-label");
      const revInputEl = document.getElementById("rating-review-input");
      const subBtnEl = document.getElementById("rating-modal-submit-btn");

      if (titleEl) {
        titleEl.textContent = lang === 'hi' ? 'कार्य अनुभव को रेट करें' : lang === 'mr' ? 'कामाच्या अनुभवाला रेटिंग द्या' : lang === 'te' ? 'పని అనుభవాన్ని రేట్ చేయండి' : lang === 'ta' ? 'பணி அனுபவத்தை மதிப்பிடவும்' : 'Rate Work Experience';
      }
      if (subEl) {
        subEl.textContent = lang === 'hi' ? 'कार्य पूर्ण हुआ! काम की गुणवत्ता कैसी थी?' : lang === 'mr' ? 'काम पूर्ण झाले! कामाचा दर्जा कसा होता?' : lang === 'te' ? 'పని పూర్తయింది! పని నాణ్యత ఎలా ఉంది?' : lang === 'ta' ? 'வேலை முடிந்தது! வேலையின் தரம் எப்படி இருந்தது?' : 'Job marked completed! How was the work quality?';
      }
      if (revLabelEl) {
        revLabelEl.textContent = lang === 'hi' ? 'वैकल्पिक समीक्षा' : lang === 'mr' ? 'पर्यायी अभिप्राय' : lang === 'te' ? 'ఐచ్ఛిక సమీక్ష' : lang === 'ta' ? 'விருப்ப மதிப்பாய்வு' : 'Optional Review';
      }
      if (revInputEl) {
        revInputEl.placeholder = lang === 'hi' ? 'उदा. समय पर कार्य पूर्ण और उत्कृष्ट गुणवत्ता' : lang === 'mr' ? 'उदा. वेळेवर काम पूर्ण आणि उत्तम गुणवत्ता' : lang === 'te' ? 'ఉదా. సమయానికి పూర్తి మరియు అత్యుత్తమ నాణ్యత' : lang === 'ta' ? 'எ.கா. சரியான நேரத்தில் முடிந்தது மற்றும் உயர் தரம்' : 'e.g. Timely completion and high work quality';
      }
      if (subBtnEl) {
        subBtnEl.textContent = lang === 'hi' ? 'रेटिंग जमा करें और फ़ीडबैक दें ✓' : lang === 'mr' ? 'रेटिंग सबमिट करा आणि अभिप्राय नोंदवा ✓' : lang === 'te' ? 'రేటింగ్‌ను సమర్పించండి ✓' : lang === 'ta' ? 'மதிப்பீட்டைச் சமர்ப்பிக்கவும் ✓' : 'Submit Rating & Release Feedback ✓';
      }
      if (window.setRatingValue) {
        window.setRatingValue(5);
      }
    }
  }

  function closeRatingModal() {
    state.activeRatingTarget = null;
    const modal = document.getElementById("rating-modal");
    if (modal) modal.classList.add("hidden");
  }

  async function seedDemoJobs() {
    const worker = getCurrentWorker();
    const coords = (worker && worker.coordinates) ? worker.coordinates : { lat: 18.5074, lng: 73.8077 };
    if (window.RozgaarApi && window.RozgaarApi.seedDemoJobs) {
      try {
        const res = await window.RozgaarApi.seedDemoJobs(coords.lat, coords.lng);
        if (res && (res.nearby || res.extended)) {
          state.jobs = [...(res.nearby || []), ...(res.extended || [])];
          notify();
          toast("Sample Employer Jobs Seeded (Within 5 km & Extended)", "success");
          return;
        }
      } catch (e) {}
    }
    // Fallback if offline
    const seedSource = (window.ROZGAAR_INITIAL_DATA && (window.ROZGAAR_INITIAL_DATA.seedCatalogJobs || window.ROZGAAR_INITIAL_DATA.jobs)) || [];
    if (seedSource.length > 0) {
      state.jobs = JSON.parse(JSON.stringify(seedSource));
      updateWorkerLocation(coords.lat, coords.lng);
      toast("Sample Jobs Seeded", "success");
    }
  }

  async function clearAllJobs() {
    state.jobs = [];
    state.applications = [];
    saveToStorage();
    if (window.RozgaarApi && window.RozgaarApi.clearAllJobs) {
      try {
        await window.RozgaarApi.clearAllJobs();
      } catch (e) {}
    }
    notify();
    toast("All jobs cleared. Initial empty state restored.", "info");
  }

  // Toast System
  function toast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toastEl = document.createElement("div");
    toastEl.className = "toast-item";
    
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "⚠️";

    toastEl.innerHTML = `<span>${icon}</span><span class="flex-1">${message}</span>`;
    container.appendChild(toastEl);

    setTimeout(() => {
      toastEl.style.opacity = "0";
      toastEl.style.transform = "translateY(-10px)";
      toastEl.style.transition = "all 0.3s ease";
      setTimeout(() => toastEl.remove(), 300);
    }, 3200);
  }

  return {
    init,
    getState,
    subscribe,
    notify,
    t,
    setLanguage,
    getLanguage,
    navigate,
    pushScreen,
    replaceScreen,
    goBack,
    setWorkerTab,
    setUserRole,
    getCurrentWorker,
    toggleWorkerAvailability,
    applyForJob,
    getCurrentEmployer,
    postJob,
    acceptApplication,
    rejectApplication,
    advanceJobStatus,
    openRatingModal,
    closeRatingModal,
    submitRating,
    toast,
    setJobsViewMode,
    updateWorkerLocation,
    validateWorkerStep1,
    validateWorkerStep2,
    saveToStorage,
    seedDemoJobs,
    clearAllJobs,
    resetToDefaultData
  };
})();
