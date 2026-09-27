/**
 * RozgaarLink Real-Time Interactive Map Engine
 * Powered by Leaflet.js & OpenStreetMap (CartoDB Dark Matter)
 * Features live GPS geolocation, 5 km radius perimeter, interactive trade job pins, and popups.
 */

window.RozgaarMap = (function() {
  let mapInstances = {}; // containerId -> Leaflet map instance
  let userGpsPosition = null; // { lat, lng }
  let currentCircle5km = null;
  let currentCircle2_5km = null;
  let userMarker = null;

  const tradeColors = {
    "Mason": "#F59E0B",               // Amber
    "Electrician": "#38BDF8",         // Cyan
    "Carpenter": "#F97316",           // Orange
    "Plumber": "#3B82F6",             // Blue
    "Painter": "#EC4899",             // Pink
    "Construction Worker": "#10B981", // Emerald
    "Helper": "#8B5CF6"               // Purple
  };

  const tradeIcons = {
    "Mason": "🔨",
    "Electrician": "⚡",
    "Carpenter": "🪚",
    "Plumber": "🔧",
    "Painter": "🎨",
    "Construction Worker": "🏗️",
    "Helper": "👷"
  };

  // Haversine distance calculator in KM
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  function getUserPosition(worker) {
    if (userGpsPosition) {
      return userGpsPosition;
    }
    if (worker && worker.coordinates) {
      return worker.coordinates;
    }
    // Default: Kothrud, Pune
    return { lat: 18.5074, lng: 73.8077 };
  }

  function render(containerId, jobs = [], currentWorker = null, onSelectJob = null, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Check if Leaflet is loaded
    if (typeof L === "undefined") {
      console.warn("Leaflet library not loaded, falling back to static view.");
      container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">Loading map library...</div>`;
      return;
    }

    const currentLang = (window.RozgaarState && window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const workerPos = getUserPosition(currentWorker);
    const workerLocName = currentWorker ? currentWorker.locationName : "Kothrud, Pune";

    // Clean up previous Leaflet instance if it exists
    if (mapInstances[containerId]) {
      try {
        mapInstances[containerId].remove();
      } catch (e) {
        console.warn("Error cleaning up previous map:", e);
      }
      delete mapInstances[containerId];
    }

    const isMiniMap = containerId === "job-detail-mini-map" || options.isMiniMap;
    const minHeight = isMiniMap ? "min-h-[175px]" : "min-h-[240px]";
    const badgeText = isMiniMap
      ? (currentLang === 'hi' ? 'कार्य स्थल नक्शा' : currentLang === 'mr' ? 'कामाचे ठिकाण नकाशा' : currentLang === 'te' ? 'పని ప్రదేశం మ్యాప్' : currentLang === 'ta' ? 'வேலை தள வரைபடம்' : 'Job Site Location')
      : (userGpsPosition ? (currentLang === 'hi' ? 'लाइव जीपीएस सक्रिय' : currentLang === 'mr' ? 'थेट जीपीएस सक्रिय' : currentLang === 'te' ? 'లైవ్ జీపీఎస్ యాక్టివ్' : currentLang === 'ta' ? 'நேரலை ஜிபிஎஸ் செயலில்' : 'Live GPS Active') : '5 KM Radar • ' + jobs.length + ' Jobs');

    // Set container HTML with wrapper, locate button, and status badges
    container.innerHTML = `
      <div class="relative w-full h-full ${minHeight} rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-[#070B14]">
        <div id="${containerId}-leaflet" class="w-full h-full ${minHeight}"></div>

        <!-- Top-Left Floating Badge: Radar Status -->
        <div class="absolute top-2.5 left-2.5 z-[1000] pointer-events-none flex items-center gap-2">
          <div class="px-2.5 py-1 bg-slate-900/90 backdrop-blur-md rounded-full border border-indigo-500/40 text-[10px] font-bold text-indigo-200 flex items-center gap-1.5 shadow-lg">
            <span class="w-2 h-2 rounded-full ${userGpsPosition ? 'bg-emerald-400' : 'bg-blue-400'} animate-ping"></span>
            <span>${badgeText}</span>
          </div>
        </div>

        <!-- Top-Right Floating Action Button: Locate Me -->
        <div class="absolute top-2.5 right-2.5 z-[1000] flex flex-col gap-1.5 items-end">
          <button id="${containerId}-locate-btn" onclick="window.RozgaarMap.locateMe('${containerId}')" title="Locate My Real GPS Position" class="px-2.5 py-1.5 bg-slate-900/95 hover:bg-indigo-900/90 backdrop-blur-md text-slate-100 hover:text-white rounded-xl border border-indigo-500/40 text-[11px] font-bold shadow-lg transition flex items-center gap-1.5 cursor-pointer">
            <span class="text-sm">🎯</span>
            <span>${currentLang === 'hi' ? 'मेरा स्थान' : currentLang === 'mr' ? 'माझे स्थान' : currentLang === 'te' ? 'నా స్థానం' : currentLang === 'ta' ? 'என் இருப்பிடம்' : 'Locate Me'}</span>
          </button>
        </div>

        ${!isMiniMap ? `
          <!-- Bottom-Left Legend: 5 KM Radius Info -->
          <div class="absolute bottom-2.5 left-2.5 z-[1000] pointer-events-none">
            <span class="text-[9px] font-semibold text-slate-300 bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-800 shadow">
              ⭕ ${currentLang === 'hi' ? 'नीली परिधि = 5 किमी' : currentLang === 'mr' ? 'निळी परिमिती = ५ किमी' : currentLang === 'te' ? 'నీలి పరిధి = 5 కిమీ' : currentLang === 'ta' ? 'நீல வட்டம் = 5 கி.மீ' : 'Blue ring = 5 km radius'}
            </span>
          </div>
        ` : ''}
      </div>
    `;

    // Initialize Leaflet Map
    const leafletDiv = document.getElementById(`${containerId}-leaflet`);
    const initialCenter = (isMiniMap && jobs.length === 1 && jobs[0].coordinates?.lat)
      ? [jobs[0].coordinates.lat, jobs[0].coordinates.lng]
      : [workerPos.lat, workerPos.lng];

    const map = L.map(leafletDiv, {
      center: initialCenter,
      zoom: options.zoom || 13,
      zoomControl: !isMiniMap,
      attributionControl: false
    });

    // High-Detail OpenStreetMap with Dark Theme (Zero watermark, No API key required)
    // Or CartoDB Dark Matter if user provides an API key
    const cartoKey = window.ROZGAAR_CARTO_KEY || (window.RozgaarState && window.RozgaarState.getState && window.RozgaarState.getState().cartoKey);
    let tileUrl, tileOptions;

    if (cartoKey) {
      tileUrl = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`;
      tileOptions = { maxZoom: 19, subdomains: "abcd" };
    } else {
      tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
      tileOptions = {
        maxZoom: 19,
        className: "dark-map-tiles",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      };
    }

    L.tileLayer(tileUrl, tileOptions).addTo(map);

    // Save map instance
    mapInstances[containerId] = map;
    window.RozgaarMap._activeContainerId = containerId;
    window.RozgaarMap._onSelectJob = onSelectJob;
    window.RozgaarMap._currentJobs = jobs;
    window.RozgaarMap._currentWorker = currentWorker;

    // Draw 5 KM & 2.5 KM Circles around User
    drawPerimeterCircles(map, workerPos.lat, workerPos.lng);

    // Draw User Location Marker
    drawUserMarker(map, workerPos.lat, workerPos.lng, workerLocName, currentLang);

    // Plot Nearby Job Markers
    plotJobMarkers(map, jobs, workerPos, currentLang);

    // If mini-map with 1 job, fit bounds to show both user and destination
    if (isMiniMap && jobs.length === 1 && jobs[0].coordinates?.lat) {
      try {
        const bounds = L.latLngBounds([
          [workerPos.lat, workerPos.lng],
          [jobs[0].coordinates.lat, jobs[0].coordinates.lng]
        ]);
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
      } catch (e) {}
    }

    // Invalidate size after layout settles to guarantee no grey tiles
    setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (e) {}
    }, 200);
  }

  function drawPerimeterCircles(map, lat, lng) {
    if (currentCircle5km) map.removeLayer(currentCircle5km);
    if (currentCircle2_5km) map.removeLayer(currentCircle2_5km);

    // 5 KM Perimeter (Outer)
    currentCircle5km = L.circle([lat, lng], {
      radius: 5000,
      color: "#6366F1",
      weight: 1.8,
      dashArray: "6, 6",
      fillColor: "#4F46E5",
      fillOpacity: 0.10
    }).addTo(map);

    // 2.5 KM Perimeter (Inner Guide)
    currentCircle2_5km = L.circle([lat, lng], {
      radius: 2500,
      color: "#38BDF8",
      weight: 1,
      dashArray: "3, 5",
      fillColor: "#38BDF8",
      fillOpacity: 0.04
    }).addTo(map);
  }

  function drawUserMarker(map, lat, lng, locationName, currentLang) {
    if (userMarker) map.removeLayer(userMarker);

    const userIcon = L.divIcon({
      className: "custom-gps-marker",
      html: `
        <div class="gps-pulse-ring"></div>
        <div class="gps-dot"></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const youLabel = currentLang === 'hi' ? 'आप यहां हैं' : currentLang === 'mr' ? 'तुम्ही येथे आहात' : currentLang === 'te' ? 'మీరు ఇక్కడ ఉన్నారు' : currentLang === 'ta' ? 'நீங்கள் இங்கே உள்ளீர்கள்' : 'You are here';

    userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
    userMarker.bindPopup(`
      <div class="text-xs font-bold text-white text-center">
        <span class="text-indigo-400">📍</span> ${locationName}
        <div class="text-[10px] text-slate-400 font-normal mt-0.5">${youLabel}</div>
      </div>
    `);
  }

  function plotJobMarkers(map, jobs, workerPos, currentLang) {
    jobs.forEach(job => {
      let jLat = job.coordinates?.lat;
      let jLng = job.coordinates?.lng;

      // Ensure valid coordinates or fallback offset around worker
      if (!jLat || !jLng) {
        jLat = workerPos.lat + (Math.random() - 0.5) * 0.04;
        jLng = workerPos.lng + (Math.random() - 0.5) * 0.04;
      }

      // Calculate dynamic distance from current worker GPS
      const distance = calculateDistance(workerPos.lat, workerPos.lng, jLat, jLng);
      const color = tradeColors[job.profession] || "#6366F1";
      const icon = tradeIcons[job.profession] || "🔨";

      const pinIcon = L.divIcon({
        className: "job-map-marker",
        html: `
          <div class="job-marker-bubble" style="background: ${color}; border-color: ${color};">
            <span>${icon}</span>
            <span>₹${job.wage}</span>
          </div>
          <div class="job-marker-point" style="border-top-color: ${color};"></div>
        `,
        iconSize: [60, 26],
        iconAnchor: [30, 26],
        popupAnchor: [0, -26]
      });

      const displayTitle = window.RozgaarGemini ? window.RozgaarGemini.getJobField(job, 'title') : job.title;
      const displayLocation = window.RozgaarGemini ? window.RozgaarGemini.getJobField(job, 'location') : job.location;
      const displayProfession = window.RozgaarGemini ? window.RozgaarGemini.getLocalizedProfession(job.profession, currentLang) : job.profession;
      const employerName = window.RozgaarGemini ? window.RozgaarGemini.getLocalizedEmployerName(job.employerName, currentLang) : job.employerName;
      const wageUnit = currentLang === 'hi' ? 'दिन' : currentLang === 'mr' ? 'दिवस' : currentLang === 'te' ? 'రోజు' : currentLang === 'ta' ? 'நாள்' : 'day';
      const viewDetailsText = currentLang === 'hi' ? 'कार्य विवरण देखें' : currentLang === 'mr' ? 'कामाचे तपशील पहा' : currentLang === 'te' ? 'పని వివరాలు చూడండి' : currentLang === 'ta' ? 'வேலை விவரங்களைக் காண்க' : 'View Job Details';
      const distUnit = currentLang === 'te' ? 'కిమీ' : currentLang === 'ta' ? 'கி.மீ' : currentLang === 'en' ? 'km' : 'किमी';

      const marker = L.marker([jLat, jLng], { icon: pinIcon }).addTo(map);

      // Popup Content
      const popupHtml = `
        <div class="space-y-1.5 p-1 max-w-[210px] text-xs">
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="px-2 py-0.5 rounded-full text-[9px] font-bold" style="background: ${color}25; color: ${color}; border: 1px solid ${color}50;">
              ${icon} ${displayProfession}
            </span>
            <span class="text-[10px] font-semibold text-emerald-400">
              📍 ${distance} ${distUnit}
            </span>
          </div>
          <h4 class="font-bold text-white text-xs leading-snug line-clamp-2">${displayTitle}</h4>
          <div class="text-[11px] text-slate-300">🏢 ${employerName}</div>
          <div class="text-[11px] text-emerald-400 font-extrabold">💰 ₹${job.wage} / ${wageUnit}</div>
          <div class="text-[10px] text-slate-400 truncate">📍 ${displayLocation}</div>
          <button onclick="window.RozgaarMap.selectJob('${job.id}')" class="w-full mt-2 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 shadow">
            <span>${viewDetailsText}</span>
            <span>→</span>
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 240 });
    });
  }

  // Handle Locate Me button click with HTML5 Geolocation API
  function locateMe(containerId) {
    if (!navigator.geolocation) {
      if (window.RozgaarState) {
        window.RozgaarState.toast("Geolocation not supported by this browser.", "error");
      }
      return;
    }

    const currentLang = (window.RozgaarState && window.RozgaarState.getLanguage && window.RozgaarState.getLanguage()) || "en";
    const locatingMsg = currentLang === 'hi' ? 'स्थान खोजा जा रहा है...' : currentLang === 'mr' ? 'स्थान शोधत आहे...' : currentLang === 'te' ? 'లొకేషన్ శోధిస్తోంది...' : currentLang === 'ta' ? 'இருப்பிடம் கண்டறியப்படுகிறது...' : 'Locating your GPS position...';
    
    if (window.RozgaarState) {
      window.RozgaarState.toast(locatingMsg, "info");
    }

    const btn = document.getElementById(`${containerId}-locate-btn`);
    if (btn) {
      btn.classList.add("animate-pulse");
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (btn) btn.classList.remove("animate-pulse");

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        userGpsPosition = { lat, lng };

        const map = mapInstances[containerId];
        if (map) {
          map.setView([lat, lng], 14, { animate: true });
          drawPerimeterCircles(map, lat, lng);
          drawUserMarker(map, lat, lng, "Current GPS Location", currentLang);

          // Update state with user coordinates and trigger distance re-calculation
          if (window.RozgaarState && window.RozgaarState.updateWorkerLocation) {
            window.RozgaarState.updateWorkerLocation(lat, lng, "Current Location (GPS)");
          }

          const successMsg = currentLang === 'hi' ? 'जीपीएस स्थान सफलतापूर्वक मिला! ✓' : currentLang === 'mr' ? 'जीपीएस स्थान यशस्वीरित्या मिळाले! ✓' : currentLang === 'te' ? 'జీపీఎస్ స్థానం విజయవంతంగా లభించింది! ✓' : currentLang === 'ta' ? 'ஜிபிஎஸ் இருப்பிடம் வெற்றிகரமாக கண்டறியப்பட்டது! ✓' : 'GPS Location updated successfully! ✓';
          if (window.RozgaarState) {
            window.RozgaarState.toast(successMsg, "success");
          }

          // Re-plot jobs with new distances
          if (window.RozgaarMap._currentJobs) {
            plotJobMarkers(map, window.RozgaarMap._currentJobs, { lat, lng }, currentLang);
          }
        }
      },
      (error) => {
        if (btn) btn.classList.remove("animate-pulse");
        console.warn("Geolocation error:", error);
        const errMsg = currentLang === 'hi' ? 'स्थान अनुमति अस्वीकृत। पुणे कोथरूड का उपयोग किया जा रहा है।' : currentLang === 'mr' ? 'स्थान परवानगी नाकारली. पुणे कोथरूड वापरले जात आहे.' : currentLang === 'te' ? 'లొకేషన్ అనుమతి నిరాకరించబడింది. పూణే కోత్రూడ్ ఉపయోగించబడుతోంది.' : currentLang === 'ta' ? 'இருப்பிட அனுமதி மறுக்கப்பட்டது. புனே கோத்ருட் பயன்படுத்தப்படுகிறது.' : 'Location permission denied. Using Pune Kothrud.';
        if (window.RozgaarState) {
          window.RozgaarState.toast(errMsg, "info");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }

  function selectJob(jobId) {
    if (window.RozgaarMap._onSelectJob) {
      window.RozgaarMap._onSelectJob(jobId);
    } else if (window.RozgaarState) {
      window.RozgaarState.pushScreen("jobDetails", { jobId });
    }
  }

  function setSimulatedLocation(lat, lng, name) {
    userGpsPosition = { lat, lng };
    if (window.RozgaarState && window.RozgaarState.updateWorkerLocation) {
      window.RozgaarState.updateWorkerLocation(lat, lng, name);
    }
    const activeId = window.RozgaarMap._activeContainerId;
    if (activeId && mapInstances[activeId]) {
      render(activeId, window.RozgaarMap._currentJobs, window.RozgaarMap._currentWorker, window.RozgaarMap._onSelectJob);
    }
  }

  return {
    render,
    locateMe,
    selectJob,
    calculateDistance,
    setSimulatedLocation,
    getUserPosition
  };
})();
