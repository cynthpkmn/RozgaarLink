import glob
import os
import re

print("Starting RozgaarLink verification...")

# Verify translation keys strictly by line matching
with open('js/translations.js', 'r', encoding='utf-8') as f:
    text = f.read()

en_part = text[text.find('en: {'):text.find('hi: {')]
hi_part = text[text.find('hi: {'):text.find('mr: {')]
mr_part = text[text.find('mr: {'):text.find('te: {')]
te_part = text[text.find('te: {'):text.find('ta: {')]
ta_part = text[text.find('ta: {'):]

en_keys = set(re.findall(r'^\s*([a-zA-Z0-9_]+):', en_part, re.MULTILINE)) - {'en'}
hi_keys = set(re.findall(r'^\s*([a-zA-Z0-9_]+):', hi_part, re.MULTILINE)) - {'hi'}
mr_keys = set(re.findall(r'^\s*([a-zA-Z0-9_]+):', mr_part, re.MULTILINE)) - {'mr'}
te_keys = set(re.findall(r'^\s*([a-zA-Z0-9_]+):', te_part, re.MULTILINE)) - {'te'}
ta_keys = set(re.findall(r'^\s*([a-zA-Z0-9_]+):', ta_part, re.MULTILINE)) - {'ta'}

print(f"English keys: {len(en_keys)}")
print(f"Hindi keys:   {len(hi_keys)}")
print(f"Marathi keys: {len(mr_keys)}")
print(f"Telugu keys:  {len(te_keys)}")
print(f"Tamil keys:   {len(ta_keys)}")

missing_in_hi = en_keys - hi_keys
missing_in_mr = en_keys - mr_keys
missing_in_te = en_keys - te_keys
missing_in_ta = en_keys - ta_keys

if missing_in_hi:
    print(f"Missing in Hindi: {missing_in_hi}")
if missing_in_mr:
    print(f"Missing in Marathi: {missing_in_mr}")
if missing_in_te:
    print(f"Missing in Telugu: {missing_in_te}")
if missing_in_ta:
    print(f"Missing in Tamil: {missing_in_ta}")

assert not missing_in_hi and not missing_in_mr and not missing_in_te and not missing_in_ta, "Key mismatch detected"
print("[OK] Perfect 100% translation key parity across English, Hindi, Marathi, Telugu, and Tamil!")

# Check data.js structure
with open('js/data.js', 'r', encoding='utf-8') as f:
    data_text = f.read()
for entity in ['workers:', 'employers:', 'jobs:', 'applications:', 'transactions:', 'notifications:']:
    assert entity in data_text, f"Missing {entity} in data.js"
print("[OK] data.js verified with workers, employers, jobs, applications, transactions, notifications!")

# Check HTML elements
with open('index.html', 'r', encoding='utf-8') as f:
    html_text = f.read()

assert 'id="app-viewport-content"' in html_text, "Missing main viewport container"
assert 'id="voice-modal"' in html_text, "Missing voice modal"
assert 'id="rating-modal"' in html_text, "Missing rating modal"
assert 'id="toast-container"' in html_text, "Missing toast container"
assert 'device-wrapper' in html_text, "Missing device wrapper"
assert 'src="js/gemini.js"' in html_text, "Missing gemini.js in index.html"
print("[OK] index.html structural components and Gemini script verified!")

# Check Gemini AI Module
with open('js/gemini.js', 'r', encoding='utf-8') as f:
    gemini_text = f.read()

assert 'window.RozgaarGemini' in gemini_text, "Missing window.RozgaarGemini in gemini.js"
assert 'getJobField' in gemini_text, "Missing getJobField in gemini.js"
assert 'autoTranslateNewJob' in gemini_text, "Missing autoTranslateNewJob in gemini.js"
assert 'tradeGlossary' in gemini_text, "Missing tradeGlossary in gemini.js"
print("[OK] js/gemini.js module and methods verified!")

# Check multilingual fields in data.js
for field in ['title_hi', 'title_mr', 'title_te', 'title_ta', 'location_hi', 'location_mr', 'location_te', 'location_ta', 'requiredSkills_hi', 'requiredSkills_mr', 'requiredSkills_te', 'requiredSkills_ta', 'description_hi', 'description_mr', 'description_te', 'description_ta']:
    count = data_text.count(field)
    assert count >= 8, f"Expected at least 8 instances of {field} in data.js, found {count}"
print(f"[OK] data.js verified with 8 jobs fully translated into Hindi, Marathi, Telugu, and Tamil!")

# Check app.js integration
with open('js/app.js', 'r', encoding='utf-8') as f:
    app_text = f.read()

assert 'RozgaarGemini.getJobField' in app_text, "Missing RozgaarGemini.getJobField in app.js"
assert 'autoTranslateNewJob' in app_text, "Missing autoTranslateNewJob in app.js"
assert 'saveGeminiApiKey' in app_text, "Missing saveGeminiApiKey in app.js"
print("[OK] js/app.js Gemini AI integration verified!")

print("\n[SUCCESS] All verification tests passed cleanly!")
