import json
import urllib.request
from backend import db

print("=== VERIFYING ZERO PRE-FEEDED JOBS & EMPLOYER POSTING FLOW ===")

# 1. Verify DB is 100% clean with 0 jobs
jobs_res = db.get_geo_fenced_jobs(18.5074, 73.8077)
assert jobs_res['total_count'] == 0, f"Expected 0 pre-feeded jobs, found {jobs_res['total_count']}"
assert len(jobs_res['nearby']) == 0, "Nearby section should be empty"
assert len(jobs_res['extended']) == 0, "Extended section should be empty"
print("[OK] Confirmed: Database has 0 pre-feeded jobs. Worker discovery is completely empty by default.")

# 2. Verify data.js has empty jobs array
with open('js/data.js', 'r', encoding='utf-8') as f:
    data_text = f.read()
assert 'jobs: [],' in data_text or 'jobs: []' in data_text, "data.js jobs must be initialized to empty array"
print("[OK] Confirmed: js/data.js has jobs initialized to empty array.")

# 3. Simulate Employer posting a job
employer_job = {
    "title": "Boundary Wall Red Brick Masonry",
    "profession": "Mason",
    "wage": 850,
    "wageType": "per day",
    "latitude": 18.5090,
    "longitude": 73.8100,
    "locationName": "Paud Road, Kothrud",
    "employerId": "emp-1",
    "employerName": "ABC Construction",
    "workersRequired": 3,
    "requiredSkills": "Brick laying, Mortar mixing",
    "description": "Boundary wall construction for commercial site"
}
posted = db.insert_job(employer_job)
assert posted is not None, "Failed to post job"
print(f"[OK] Employer successfully posted active job: '{posted['title']}' at ({posted['latitude']}, {posted['longitude']})")

# 4. Now Worker discovers the job
worker_discovery = db.get_geo_fenced_jobs(18.5074, 73.8077)
assert worker_discovery['total_count'] == 1, f"Expected 1 job after posting, got {worker_discovery['total_count']}"
assert len(worker_discovery['nearby']) == 1, "The posted job should be in nearby section"
assert worker_discovery['nearby'][0]['title'] == "Boundary Wall Red Brick Masonry"
print(f"[OK] Worker now sees the actively posted job in Section 1 (distance {worker_discovery['nearby'][0]['distance']} km).")

# 5. Clean up so database remains in clean zero-job state
db.clear_all_jobs()
assert db.get_geo_fenced_jobs(18.5074, 73.8077)['total_count'] == 0
print("[OK] Database restored to clean zero-job state after test.")

# 6. Verify back button in app.js for employerActiveJobs
with open('js/app.js', 'r', encoding='utf-8') as f:
    app_text = f.read()

assert 'replaceScreen(\'employerDashboard\')' in app_text, "replaceScreen('employerDashboard') missing in app.js"
assert 'myActiveJobsTitle' in app_text
print("[OK] Employer back button navigation to employerDashboard verified.")

print("\n>>> ALL CHECKS PASSED PERFECTLY! <<<")
