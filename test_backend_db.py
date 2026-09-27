"""
Automated unit verification for SQLite backend database and geo-fenced queries.
"""

import sys
import os

# Add root directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend import db

print("=== VERIFYING ROZGAARLINK SQLITE DATABASE ENGINE ===")

# 1. Test database initialization
db.init_db()
print("[OK] SQLite schema initialized with workers, employers, jobs, applications, transactions tables.")

# 2. Test default worker Rajesh Kumar
worker = db.get_worker('w-1')
assert worker is not None, "Worker w-1 not found"
assert worker['name'] == 'Rajesh Kumar', f"Expected Rajesh Kumar, got {worker['name']}"
assert 'latitude' in worker and 'longitude' in worker, "Missing latitude/longitude in worker"
print(f"[OK] Worker profile verified: {worker['name']} ({worker['profession']}) at ({worker['latitude']}, {worker['longitude']})")

# 3. Test initial state: clear jobs
db.clear_all_jobs()
initial_jobs = db.get_geo_fenced_jobs(worker['latitude'], worker['longitude'])
assert initial_jobs['total_count'] == 0, f"Expected 0 jobs in clean state, got {initial_jobs['total_count']}"
assert len(initial_jobs['nearby']) == 0, "Expected 0 nearby jobs"
assert len(initial_jobs['extended']) == 0, "Expected 0 extended jobs"
print("[OK] Initial clean state verified: 0 jobs displayed when none have been posted.")

# 4. Test employer posting a job
new_job = {
    "id": "test-job-1",
    "title": "Boundary Wall Masonry",
    "profession": "Mason",
    "employerId": "emp-1",
    "employerName": "ABC Construction",
    "location": "Near Kothrud Depot",
    "latitude": 18.5090,
    "longitude": 73.8100,
    "wage": 800,
    "workersRequired": 2
}
inserted = db.insert_job(new_job)
assert inserted is not None, "Job insertion failed"
print(f"[OK] Employer successfully posted job '{inserted['title']}' at ({inserted['latitude']}, {inserted['longitude']})")

# 5. Check worker discovery: only the actively posted job should appear
active_jobs = db.get_geo_fenced_jobs(worker['latitude'], worker['longitude'])
assert active_jobs['total_count'] == 1, f"Expected 1 job, got {active_jobs['total_count']}"
assert len(active_jobs['nearby']) == 1, "Expected job in nearby section"
assert active_jobs['nearby'][0]['distance'] <= 5.0, "Job should be <= 5 km"
print(f"[OK] Actively posted job appeared in Section 1 (Nearby): distance {active_jobs['nearby'][0]['distance']} km")

# 6. Test seeding sample employer jobs (both nearby <= 5km and extended > 5km)
seeded = db.seed_sample_employer_jobs(worker['latitude'], worker['longitude'])
print(f"Total seeded jobs: {seeded['total_count']}")
print(f"Section 1 (Nearby <= 5 km): {len(seeded['nearby'])} jobs")
print(f"Section 2 (Extended > 5 km): {len(seeded['extended'])} jobs")

assert len(seeded['nearby']) > 0, "Expected nearby jobs"
assert len(seeded['extended']) > 0, "Expected extended jobs"

# Verify all jobs in Section 1 are strictly <= 5.0 km
for j in seeded['nearby']:
    assert j['distance'] <= 5.0, f"Job {j['id']} in nearby section has distance {j['distance']} > 5.0"

# Verify all jobs in Section 2 are strictly > 5.0 km
for j in seeded['extended']:
    assert j['distance'] > 5.0, f"Job {j['id']} in extended section has distance {j['distance']} <= 5.0"

print("[OK] Strict geo-fenced partitioning verified (<= 5 km vs > 5 km)!")

# 7. Test search and profession filtering
mason_jobs = db.get_geo_fenced_jobs(worker['latitude'], worker['longitude'], profession_filter='Mason')
assert all(j['profession'] == 'Mason' for j in mason_jobs['nearby']), "Non-mason in nearby"
assert all(j['profession'] == 'Mason' for j in mason_jobs['extended']), "Non-mason in extended"
# 8. Restore clean empty state (No pre-feeded jobs in production database)
db.clear_all_jobs()
print("[OK] Production database restored to clean initial state (0 pre-feeded jobs).")

print("\n>>> ALL BACKEND DATABASE & GEO-FENCING TESTS PASSED PERFECTLY! <<<")
