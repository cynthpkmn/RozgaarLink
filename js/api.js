/**
 * RozgaarLink REST API Client
 * Interfaces with backend SQLite database for Workers, Jobs, Applications, and Geo-fenced Discovery.
 * Features seamless offline-resilient local cache fallback.
 */

window.RozgaarApi = (function() {
  const API_BASE = ""; // Relative URL points to origin (e.g. http://localhost:8080)

  // Retrieve Firebase ID token from localStorage
  function getAuthHeaders() {
    const token = localStorage.getItem("rozgaar_auth_token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  async function checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  }

  async function getGeoFencedJobs(lat, lng, profession = "All", search = "") {
    try {
      const url = `${API_BASE}/api/jobs?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&profession=${encodeURIComponent(profession)}&q=${encodeURIComponent(search)}`;
      const res = await fetch(url, {
        headers: {
          ...getAuthHeaders()
        },
        cache: "no-store"
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("API getGeoFencedJobs failed, using local geo-partitioning fallback", e);
    }
    return null;
  }

  async function postJob(jobData) {
    try {
      const res = await fetch(`${API_BASE}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(jobData)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("API postJob failed", e);
    }
    return null;
  }

  async function updateWorkerLocation(workerId, lat, lng, locationName) {
    try {
      const res = await fetch(`${API_BASE}/api/workers/${encodeURIComponent(workerId)}/location`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({ lat, lng, locationName })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return null;
  }

  async function registerWorker(workerData) {
    try {
      const res = await fetch(`${API_BASE}/api/workers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(workerData)
      });
      if (res.ok) {
        return await res.json();
      }
      const errData = await res.json().catch(() => ({}));
      return { error: errData.error || `HTTP ${res.status}`, detail: errData.detail };
    } catch (e) {
      console.warn("API registerWorker failed, local state will still persist", e);
      return { error: "NetworkError", detail: e.message };
    }
  }

  async function seedDemoJobs(lat = 18.5074, lng = 73.8077) {
    try {
      const res = await fetch(`${API_BASE}/api/jobs/seed-demo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({ lat, lng })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return null;
  }

  async function clearAllJobs() {
    try {
      const res = await fetch(`${API_BASE}/api/jobs/clear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({})
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return null;
  }

  async function getWorker(workerId) {
    try {
      const res = await fetch(`${API_BASE}/api/workers/${encodeURIComponent(workerId)}`, {
        headers: {
          ...getAuthHeaders()
        },
        cache: "no-store"
      });
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 404) {
        return null;
      }
    } catch (e) {
      console.warn("API getWorker failed:", e);
    }
    return null;
  }

  async function getEmployer(employerId) {
    try {
      const res = await fetch(`${API_BASE}/api/employers/${encodeURIComponent(employerId)}`, {
        headers: {
          ...getAuthHeaders()
        },
        cache: "no-store"
      });
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 404) {
        return null;
      }
    } catch (e) {
      console.warn("API getEmployer failed:", e);
    }
    return null;
  }

  async function registerEmployer(employerData) {
    try {
      const res = await fetch(`${API_BASE}/api/employers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(employerData)
      });
      if (res.ok) {
        return await res.json();
      }
      const errData = await res.json().catch(() => ({}));
      return { error: errData.error || `HTTP ${res.status}`, detail: errData.detail };
    } catch (e) {
      console.warn("API registerEmployer failed:", e);
      return { error: "NetworkError", detail: e.message };
    }
  }

  async function applyForJob(applicationData) {
    try {
      const res = await fetch(`${API_BASE}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(applicationData)
      });
      if (res.ok) {
        return await res.json();
      }
      const errData = await res.json().catch(() => ({}));
      return { error: errData.error || `HTTP ${res.status}`, detail: errData.detail };
    } catch (e) {
      console.warn("API applyForJob failed:", e);
      return { error: "NetworkError", detail: e.message };
    }
  }

  async function updateApplicationStatus(appId, status) {
    try {
      const res = await fetch(`${API_BASE}/api/applications/${encodeURIComponent(appId)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        return await res.json();
      }
      const errData = await res.json().catch(() => ({}));
      return { error: errData.error || `HTTP ${res.status}`, detail: errData.detail };
    } catch (e) {
      console.warn("API updateApplicationStatus failed:", e);
      return { error: "NetworkError", detail: e.message };
    }
  }

  async function updateJobStatus(jobId, status) {
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${encodeURIComponent(jobId)}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        return await res.json();
      }
      const errData = await res.json().catch(() => ({}));
      return { error: errData.error || `HTTP ${res.status}`, detail: errData.detail };
    } catch (e) {
      console.warn("API updateJobStatus failed:", e);
      return { error: "NetworkError", detail: e.message };
    }
  }

  async function generate(payload) {
    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
      const errData = await res.json().catch(() => ({}));
      return { error: errData.error || `HTTP ${res.status}`, fallback: true };
    } catch (e) {
      console.warn("API generate failed:", e);
      return { error: "NetworkError", fallback: true };
    }
  }

  return {
    checkHealth,
    generate,
    getGeoFencedJobs,
    postJob,
    updateJobStatus,
    updateWorkerLocation,
    registerWorker,
    getWorker,
    getEmployer,
    registerEmployer,
    applyForJob,
    updateApplicationStatus,
    seedDemoJobs,
    clearAllJobs,
    getAuthHeaders
  };
})();
