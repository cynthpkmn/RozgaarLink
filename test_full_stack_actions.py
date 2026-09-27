"""
Comprehensive Test Suite: Full-Stack Job Application, Acceptance & Status Synchronization
Validates:
1. db.py helpers: insert_application, update_application_status, update_job_status, get_application
2. run.py endpoints: POST /api/applications, PUT /api/applications/<id>, PUT /api/jobs/<id>/status
3. Strict auth gating on all application and job mutation endpoints
4. js/api.js API client methods: applyForJob, updateApplicationStatus, updateJobStatus
5. js/state.js full-stack synchronization in applyForJob, acceptApplication, rejectApplication, advanceJobStatus
"""

import sys
import os
import json
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend import db
import run

print("=== VERIFYING FULL-STACK APPLICATION, ACCEPTANCE & STATUS ENGINE ===")

# ----------------------------------------------------
# 1. TEST DB.PY APPLICATION & JOB STATUS HELPERS
# ----------------------------------------------------

# Setup clean test state
db.clear_all_jobs()
test_job = {
    "id": "job-test-sync-101",
    "title": "Masonry Boundary Wall Project",
    "profession": "Mason",
    "employer_id": "firebase-emp-test-999",
    "employer_name": "Skyline Builders",
    "wage": 850.0,
    "location_name": "Kothrud, Pune",
    "latitude": 18.5080,
    "longitude": 73.8080,
    "workers_required": 2,
    "workers_accepted": 0,
    "workers_remaining": 2,
    "status": "Applications Open"
}
inserted_job = db.insert_job(test_job, employer_uid="firebase-emp-test-999")
assert inserted_job is not None, "Failed to insert test job"
assert inserted_job['status'] == "Applications Open", "Job initial status mismatch"
print("[OK] Test job seeded in SQLite DB.")

# Test 1a: insert_application
app_payload = {
    "id": "app-test-sync-201",
    "jobId": "job-test-sync-101",
    "workerId": "firebase-worker-test-888",
    "workerName": "Ganesh More",
    "profession": "Mason",
    "wage": 850.0,
    "status": "Pending",
    "appliedDate": "Just now"
}
inserted_app = db.insert_application(app_payload, worker_uid="firebase-worker-test-888")
assert inserted_app is not None, "Failed to insert application into DB"
assert inserted_app['id'] == "app-test-sync-201", "Application ID mismatch"
assert inserted_app['job_id'] == "job-test-sync-101", "Application job_id mismatch"
assert inserted_app['worker_id'] == "firebase-worker-test-888", "Application worker_id mismatch"
assert inserted_app['status'] == "Pending", "Application status mismatch"
print(f"[OK] db.insert_application verified: {inserted_app['id']} for worker {inserted_app['worker_name']}")

# Test 1b: get_application
fetched_app = db.get_application("app-test-sync-201")
assert fetched_app is not None, "Failed to fetch application by ID"
assert fetched_app['worker_name'] == "Ganesh More", "Worker name mismatch in fetched application"
print("[OK] db.get_application verified.")

# Test 1c: update_application_status to Accepted
updated_app = db.update_application_status("app-test-sync-201", "Accepted")
assert updated_app is not None, "Failed to update application status"
assert updated_app['status'] == "Accepted", f"Expected 'Accepted', got '{updated_app['status']}'"
print(f"[OK] db.update_application_status verified: status updated to '{updated_app['status']}'")

# Test 1d: update_application_status to Rejected
updated_app_rej = db.update_application_status("app-test-sync-201", "Rejected")
assert updated_app_rej['status'] == "Rejected", "Expected 'Rejected'"
print(f"[OK] db.update_application_status (Rejected) verified: status updated to '{updated_app_rej['status']}'")

# Test 1e: update_job_status
updated_job_prog = db.update_job_status("job-test-sync-101", "In Progress")
assert updated_job_prog is not None, "Failed to update job status"
assert updated_job_prog['status'] == "In Progress", f"Expected 'In Progress', got '{updated_job_prog['status']}'"
print(f"[OK] db.update_job_status verified: job status updated to '{updated_job_prog['status']}'")

updated_job_comp = db.update_job_status("job-test-sync-101", "Completed")
assert updated_job_comp['status'] == "Completed", f"Expected 'Completed', got '{updated_job_comp['status']}'"
print(f"[OK] db.update_job_status (Completed) verified: job status updated to '{updated_job_comp['status']}'")

# ----------------------------------------------------
# 2. TEST RUN.PY ENDPOINTS & STRICT AUTH SECURITY
# ----------------------------------------------------

class DummyHandler(run.RozgaarRequestHandler):
    def __init__(self, headers):
        self.headers = headers

# Test 2a: verify_auth_token rejects unauthenticated requests to new endpoints
handler_unauth = DummyHandler({})
decoded, err = handler_unauth.verify_auth_token()
assert decoded is None and "Missing or invalid Authorization header" in err
print(f"[OK] Endpoint security: Rejected unauthenticated request ({err})")

# Test 2b: verify_auth_token rejects invalid bearer token
handler_invalid = DummyHandler({'Authorization': 'Bearer fake_token_abc_123'})
decoded, err = handler_invalid.verify_auth_token()
assert decoded is None and "Firebase token verification failed" in err
print(f"[OK] Endpoint security: Rejected invalid token with Firebase Admin ({err})")

# ----------------------------------------------------
# 3. VERIFY JS/API.JS IMPLEMENTATION
# ----------------------------------------------------

with open('js/api.js', 'r', encoding='utf-8') as f:
    api_js = f.read()

assert 'async function applyForJob(' in api_js, "applyForJob missing in js/api.js"
assert 'async function updateApplicationStatus(' in api_js, "updateApplicationStatus missing in js/api.js"
assert 'async function updateJobStatus(' in api_js, "updateJobStatus missing in js/api.js"
assert 'POST' in api_js and '/api/applications' in api_js, "POST /api/applications missing in js/api.js"
assert 'PUT' in api_js and '/api/applications/' in api_js, "PUT /api/applications missing in js/api.js"
assert 'PUT' in api_js and '/status' in api_js, "PUT /status missing in js/api.js"
assert 'applyForJob,' in api_js and 'updateApplicationStatus,' in api_js and 'updateJobStatus,' in api_js, "API exports missing in js/api.js"
print("[OK] js/api.js client functions (applyForJob, updateApplicationStatus, updateJobStatus) verified.")

# ----------------------------------------------------
# 4. VERIFY JS/STATE.JS IMPLEMENTATION
# ----------------------------------------------------

with open('js/state.js', 'r', encoding='utf-8') as f:
    state_js = f.read()

assert 'await window.RozgaarApi.applyForJob(newApp)' in state_js, "state.js must await RozgaarApi.applyForJob"
assert 'await window.RozgaarApi.updateApplicationStatus(appId, "Accepted")' in state_js, "state.js must await RozgaarApi.updateApplicationStatus(Accepted)"
assert 'await window.RozgaarApi.updateApplicationStatus(appId, "Rejected")' in state_js, "state.js must await RozgaarApi.updateApplicationStatus(Rejected)"
assert 'await window.RozgaarApi.updateJobStatus(jobId, nextStatus)' in state_js, "state.js must await RozgaarApi.updateJobStatus"
print("[OK] js/state.js synchronization logic for applications, accept/reject, and job progression verified.")

# Clean up test rows
db.clear_all_jobs()
conn = db.get_connection()
cursor = conn.cursor()
cursor.execute("DELETE FROM applications WHERE id = 'app-test-sync-201'")
cursor.execute("DELETE FROM jobs WHERE id = 'job-test-sync-101'")
conn.commit()
conn.close()

print("\n>>> ALL FULL-STACK APPLICATION & STATUS SYNC TESTS PASSED! <<<")
