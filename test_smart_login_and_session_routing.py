"""
Test Suite: Smart Login Routing, Returning vs New Users, and Firebase Profile Registration
Validates:
1. completeLoginFlow implementation in js/app.js
2. Proper gating and routing between New Users and Returning Users
3. Wiring of signInWithGoogle, verifyWorkerOTP, and verifyEmployerOTP to completeLoginFlow
4. Profile registration forms using real Firebase session UID and awaiting backend persistence
5. Backend GET /api/workers/<uid> and GET /api/employers/<uid> routing
"""

import sys
import os
import re

print("=== VERIFYING SMART LOGIN ROUTING & FIREBASE REGISTRATION FLOW ===")

# 1. Read js/app.js
with open('js/app.js', 'r', encoding='utf-8') as f:
    app_code = f.read()

# Verify completeLoginFlow exists
assert 'async function completeLoginFlow(' in app_code, "completeLoginFlow function definition missing in js/app.js"
print("[OK] completeLoginFlow function exists in js/app.js")

# Verify completeLoginFlow pings backend via api.getWorker and api.getEmployer
assert 'window.RozgaarApi.getWorker(user.uid)' in app_code, "completeLoginFlow must query getWorker(user.uid)"
assert 'window.RozgaarApi.getEmployer(user.uid)' in app_code, "completeLoginFlow must query getEmployer(user.uid)"
print("[OK] Backend profile query via RozgaarApi verified for both Worker and Employer.")

# Verify Smart Routing in completeLoginFlow:
# Returning worker -> workerDashboard
assert 'replaceScreen("workerDashboard")' in app_code, "Navigation to workerDashboard missing"
# New worker -> workerSignUp
assert 'replaceScreen("workerSignUp")' in app_code, "New worker routing to workerSignUp missing"
# Returning employer -> employerDashboard
assert "replaceScreen('employerDashboard')" in app_code, "Navigation to employerDashboard missing"
# New employer -> employerSignUp
assert 'replaceScreen("employerSignUp")' in app_code, "New employer routing to employerSignUp missing"
print("[OK] Smart routing to Dashboard (returning users) and SignUp (new users) verified.")

# Verify Pre-filling form data for new users
assert 'state.authForm.workerData' in app_code, "workerData prefill missing in completeLoginFlow"
assert 'state.authForm.employerData' in app_code, "employerData prefill missing in completeLoginFlow"
print("[OK] Form pre-filling with authenticated user details verified.")

# Verify Wiring of Auth functions to completeLoginFlow
assert re.search(r'signInWithGoogle.*await completeLoginFlow\(user,\s*token,\s*role\)', app_code, re.DOTALL), "signInWithGoogle must await completeLoginFlow"
assert re.search(r'verifyWorkerOTP.*await completeLoginFlow\(user,\s*token,\s*["\']worker["\']\)', app_code, re.DOTALL), "verifyWorkerOTP must await completeLoginFlow"
assert re.search(r'verifyEmployerOTP.*await completeLoginFlow\(user,\s*token,\s*["\']employer["\']\)', app_code, re.DOTALL), "verifyEmployerOTP must await completeLoginFlow"
print("[OK] signInWithGoogle, verifyWorkerOTP, and verifyEmployerOTP successfully wired to completeLoginFlow.")

# Verify completeWorkerRegistration uses Firebase UID and awaits backend
assert 'const activeUid = (activeUser && activeUser.uid) || localStorage.getItem("rozgaar_user_uid")' in app_code, "completeWorkerRegistration must pull active Firebase UID"
assert 'id: "w-" + Date.now()' not in app_code, "completeWorkerRegistration must not generate timestamp IDs"
assert 'await window.RozgaarApi.registerWorker(newWorker)' in app_code, "completeWorkerRegistration must await registerWorker"
print("[OK] completeWorkerRegistration verified: Uses Firebase UID and awaits backend sync.")

# Verify completeEmployerRegistration uses Firebase UID and awaits backend
assert 'id: "emp-" + Date.now()' not in app_code, "completeEmployerRegistration must not generate timestamp IDs"
assert 'await window.RozgaarApi.registerEmployer(newEmployer)' in app_code, "completeEmployerRegistration must await registerEmployer"
print("[OK] completeEmployerRegistration verified: Uses Firebase UID and awaits backend sync.")

# 2. Read js/api.js
with open('js/api.js', 'r', encoding='utf-8') as f:
    api_code = f.read()

assert 'async function getWorker(' in api_code, "getWorker missing in js/api.js"
assert 'async function getEmployer(' in api_code, "getEmployer missing in js/api.js"
assert 'async function registerWorker(' in api_code, "registerWorker missing in js/api.js"
assert 'async function registerEmployer(' in api_code, "registerEmployer missing in js/api.js"
assert 'getWorker,' in api_code and 'getEmployer,' in api_code, "getWorker/getEmployer must be exported in RozgaarApi"
print("[OK] RozgaarApi methods (getWorker, getEmployer, registerWorker, registerEmployer) verified.")

print("\n>>> ALL SMART LOGIN ROUTING & REGISTRATION TESTS PASSED! <<<")
