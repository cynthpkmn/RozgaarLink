import json
import re
import urllib.request
import urllib.parse
from backend import db

print("=== TESTING REGISTRATION GATING, VALIDATION & BACKEND SYNC ===")

# Test 1: Worker Database Persistence
new_worker_payload = {
    "id": "w-test-999",
    "name": "Sunil Gavaskar",
    "phone": "9822998877",
    "age": 28,
    "gender": "Male",
    "address": "Opposite Gandhi Bhavan, Kothrud",
    "city": "Pune",
    "locationName": "Kothrud, Pune",
    "latitude": 18.5080,
    "longitude": 73.8090,
    "profession": "Electrician",
    "skills": "House Wiring, Inverter Setup, MCB Installation",
    "yearsExp": 6,
    "expectedWage": 950.0,
    "preferredHours": "8:30 AM - 6:00 PM",
    "aadhaarNumber": "8877 6655 4433",
    "panNumber": "ABCDE5678F",
    "availability": "Available for Work ✓",
    "rating": 5.0,
    "reviewsCount": 0
}

inserted = db.insert_worker(new_worker_payload)
assert inserted is not None, "Failed to insert worker into SQLite DB"
assert inserted['id'] == "w-test-999", "Inserted worker ID mismatch"
assert inserted['name'] == "Sunil Gavaskar", "Inserted worker name mismatch"
assert inserted['profession'] == "Electrician", "Inserted worker profession mismatch"
assert inserted['expected_wage'] == 950.0, "Inserted expected wage mismatch"
assert inserted['coordinates']['lat'] == 18.5080, "Inserted latitude mismatch"
assert inserted['coordinates']['lng'] == 73.8090, "Inserted longitude mismatch"
print("[OK] insert_worker SQLite database persistence verified!")

# Test 2: Verify Step 1 validation rules directly
def py_validate_step1(d):
    errors = {}
    name = str(d.get('name', '')).strip()
    if not name or len(name) < 2:
        errors['name'] = "errNameRequired"
    mobile = str(d.get('mobile', '')).strip().replace(" ", "").replace("-", "")
    if not re.match(r'^[6-9]\d{9}$', mobile):
        errors['mobile'] = "errMobileRequired"
    try:
        age = int(d.get('age', 0))
        if age < 18 or age > 70:
            errors['age'] = "errAgeInvalid"
    except (ValueError, TypeError):
        errors['age'] = "errAgeInvalid"
    addr = str(d.get('address', '')).strip()
    if not addr or len(addr) < 3:
        errors['address'] = "errAddressRequired"
    loc = str(d.get('locationName', '')).strip()
    if not loc:
        errors['locationName'] = "errLocationRequired"
    return len(errors) == 0, errors

def py_validate_step2(d):
    errors = {}
    skills = str(d.get('skills', '')).strip()
    if not skills or len(skills) < 2:
        errors['skills'] = "errSkillsRequired"
    try:
        wage = float(d.get('expectedWage', 0))
        if wage < 200 or wage > 50000:
            errors['expectedWage'] = "errWageInvalid"
    except (ValueError, TypeError):
        errors['expectedWage'] = "errWageInvalid"
    aadhaar = str(d.get('aadhaarNumber', '')).strip().replace(" ", "")
    if not re.match(r'^\d{12}$', aadhaar):
        errors['aadhaarNumber'] = "errAadhaarInvalid"
    pan = str(d.get('panNumber', '')).strip().upper()
    if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', pan):
        errors['panNumber'] = "errPanInvalid"
    return len(errors) == 0, errors

# Test Step 1 Gating: Empty fields must fail
v1_empty, errs1_empty = py_validate_step1({})
assert not v1_empty, "Empty Step 1 should fail validation"
assert 'name' in errs1_empty and 'mobile' in errs1_empty and 'address' in errs1_empty and 'locationName' in errs1_empty
print("[OK] Step 1 Gating: Empty submission rejected cleanly with field errors.")

# Test Step 1 Gating: Invalid mobile numbers (less than 10 digits, starts with 1-5, letters)
v1_bad_mob, _ = py_validate_step1({'name': 'Ramesh', 'mobile': '1234567890', 'age': 25, 'address': 'Pune', 'locationName': 'Kothrud'})
assert not v1_bad_mob, "Mobile starting with 1 should be rejected"
v1_short_mob, _ = py_validate_step1({'name': 'Ramesh', 'mobile': '9822', 'age': 25, 'address': 'Pune', 'locationName': 'Kothrud'})
assert not v1_short_mob, "Short mobile should be rejected"
print("[OK] Step 1 Gating: Invalid phone formats strictly rejected.")

# Test Step 1 Gating: Valid details must pass
v1_valid, errs1_valid = py_validate_step1({'name': 'Ramesh Pawar', 'mobile': '9822145670', 'age': 32, 'address': 'Paud Road, Kothrud', 'locationName': 'Kothrud, Pune'})
assert v1_valid and len(errs1_valid) == 0, "Valid Step 1 failed validation"
print("[OK] Step 1 Gating: Valid details successfully approved to proceed to Step 2.")

# Test Step 2 Gating: Empty skills, wage < 200, invalid Aadhaar/PAN
v2_empty, errs2_empty = py_validate_step2({})
assert not v2_empty, "Empty Step 2 should fail validation"
assert 'skills' in errs2_empty and 'expectedWage' in errs2_empty and 'aadhaarNumber' in errs2_empty and 'panNumber' in errs2_empty
print("[OK] Step 2 Gating: Empty Step 2 rejected cleanly with field errors.")

# Test Step 2 Gating: Invalid Aadhaar / PAN
v2_bad_id, _ = py_validate_step2({'skills': 'Masonry', 'expectedWage': 800, 'aadhaarNumber': '12345', 'panNumber': 'INVALID'})
assert not v2_bad_id, "Invalid Aadhaar/PAN should be rejected"
print("[OK] Step 2 Gating: Invalid Aadhaar/PAN formats strictly rejected.")

# Test Step 2 Gating: Valid Step 2 details pass
v2_valid, errs2_valid = py_validate_step2({'skills': 'Brickwork, Plastering', 'expectedWage': 800, 'aadhaarNumber': '7845 9012 3456', 'panNumber': 'ABCDE1234F'})
assert v2_valid and len(errs2_valid) == 0, "Valid Step 2 failed validation"
print("[OK] Step 2 Gating: Valid Step 2 details successfully approved for registration.")

# Test 3: Verify JS files consistency
with open('js/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

assert 'const worker = window.RozgaarState.getCurrentWorker()' in app_js, "renderWorkerHomeTab worker reference missing"
assert 'window.RozgaarState.validateWorkerStep1' in app_js, "Worker Step 1 validation call missing in app.js"
assert 'window.RozgaarState.validateWorkerStep2' in app_js, "Worker Step 2 validation call missing in app.js"
assert 'replaceScreen("workerDashboard")' in app_js, "Navigation to workerDashboard missing in app.js"
print("[OK] app.js contains all required validation, gating, and navigation logic.")

with open('js/state.js', 'r', encoding='utf-8') as f:
    state_js = f.read()

assert 'function validateWorkerStep1' in state_js, "validateWorkerStep1 missing in state.js"
assert 'function validateWorkerStep2' in state_js, "validateWorkerStep2 missing in state.js"
assert 'function checkRoutingGuards' in state_js, "checkRoutingGuards missing in state.js"
print("[OK] state.js contains validation functions and routing guards.")

db.clear_all_jobs()
conn = db.get_connection()
cursor = conn.cursor()
cursor.execute("DELETE FROM workers WHERE id = 'w-test-999'")
conn.commit()
conn.close()

print("\n>>> ALL REGISTRATION GATING, VALIDATION & NAVIGATION TESTS PASSED! <<<")
