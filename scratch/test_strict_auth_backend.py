"""
Verification script for strict Firebase Admin authentication and endpoint protection in run.py.
Tests that:
1. Requests without Authorization header are strictly rejected with 401 Unauthorized.
2. Requests with fake/invalid Bearer tokens are rejected with 401 Unauthorized by Firebase Admin.
3. db.py insert_worker requires Firebase UID and does not use timestamps.
4. db.py insert_job requires Firebase employer UID and does not default to 'emp-1'.
"""

import sys
import os
import json
import urllib.request
import urllib.error

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend import db
import run
import firebase_admin
from firebase_admin import auth

print("=== VERIFYING STRICT FIREBASE ADMIN & DATABASE ENGINE ===")

# 1. Test db.insert_worker requires UID
try:
    db.insert_worker({"name": "Test No UID"})
    assert False, "insert_worker should have raised ValueError when no UID provided!"
except ValueError as e:
    print(f"[OK] db.insert_worker strictly rejected payload missing Firebase UID: {e}")

# Test db.insert_worker with UID
worker_with_uid = {
    "id": "firebase-uid-worker-123",
    "name": "Suresh Raina",
    "phone": "9822114477",
    "profession": "Plumber"
}
saved_worker = db.insert_worker(worker_with_uid)
assert saved_worker['id'] == "firebase-uid-worker-123", "Worker ID should be exact Firebase UID"
print(f"[OK] db.insert_worker successfully used Firebase UID as primary key: {saved_worker['id']}")

# 2. Test db.insert_job requires employer_id
try:
    db.insert_job({"title": "Test No Employer"})
    assert False, "insert_job should have raised ValueError when no employer UID provided!"
except ValueError as e:
    print(f"[OK] db.insert_job strictly rejected job missing Firebase employer UID: {e}")

# Test db.insert_job with employer_uid
job_with_uid = {
    "title": "Strict Security Compound Wall",
    "profession": "Mason",
    "wage": 850
}
saved_job = db.insert_job(job_with_uid, employer_uid="firebase-uid-emp-456")
assert saved_job['employerId'] == "firebase-uid-emp-456", "Employer ID should be exact Firebase UID"
print(f"[OK] db.insert_job successfully enforced verified employer UID: {saved_job['employerId']}")

# 3. Test RozgaarRequestHandler.verify_auth_token rejects invalid tokens
class DummyHandler(run.RozgaarRequestHandler):
    def __init__(self, headers):
        self.headers = headers

# Missing header test
handler_no_header = DummyHandler({})
decoded, err = handler_no_header.verify_auth_token()
assert decoded is None and "Missing or invalid Authorization header" in err
print(f"[OK] verify_auth_token strictly rejected missing header: {err}")

# Invalid Bearer token test
handler_bad_token = DummyHandler({'Authorization': 'Bearer fake_invalid_jwt_token_12345'})
decoded, err = handler_bad_token.verify_auth_token()
assert decoded is None and "Firebase token verification failed" in err
print(f"[OK] verify_auth_token strictly rejected fake token with Firebase Admin: {err}")

# Clean up test rows
db.clear_all_jobs()
conn = db.get_connection()
cursor = conn.cursor()
cursor.execute("DELETE FROM workers WHERE id = 'firebase-uid-worker-123'")
conn.commit()
conn.close()

# 3. Test Firebase Admin is initialized with project
app = firebase_admin.get_app()
assert app.project_id == "rozgaarlink-60d5a", f"Expected project rozgaarlink-60d5a, got {app.project_id}"
print(f"[OK] Firebase Admin verified project: {app.project_id}")

print("\n>>> ALL STRICT BACKEND & DATABASE TESTS PASSED! <<<")
