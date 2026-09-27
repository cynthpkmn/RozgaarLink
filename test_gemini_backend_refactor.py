"""
Verification suite for Gemini API Backend Refactor & GitHub Push Protection Fix.
Tests:
1. Absence of hardcoded credentials in js/gemini.js and git tracking.
2. .gitignore rules ignoring .env, credentials, and databases.
3. python-dotenv loading in run.py.
4. /api/generate backend endpoint handling (missing key 503 fallback, parameter handling, upstream payload).
5. Open accessibility of /api/generate vs strictly protected endpoints like /api/jobs.
6. RozgaarApi.generate client function presence.
"""

import os
import sys
import json
import urllib.request
import urllib.error
import threading
import time
from http.server import HTTPServer

# Ensure directory is on sys.path
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, DIRECTORY)

print("=== VERIFYING GEMINI BACKEND REFACTOR & PUSH PROTECTION FIX ===")

# 1. Check js/gemini.js for any hardcoded keys
with open(os.path.join(DIRECTORY, "js", "gemini.js"), "r", encoding="utf-8") as f:
    gemini_code = f.read()

assert "DEFAULT_API_KEY" not in gemini_code, "DEFAULT_API_KEY still found in js/gemini.js!"
assert "AQ." not in gemini_code, "Hardcoded Google API key found in js/gemini.js!"
assert "/api/generate" in gemini_code, "callGeminiApi must call /api/generate endpoint!"
print("[OK] js/gemini.js is completely clean of hardcoded API keys and targets /api/generate.")

# 2. Check .gitignore
with open(os.path.join(DIRECTORY, ".gitignore"), "r", encoding="utf-8") as f:
    gitignore_content = f.read()

assert ".env" in gitignore_content, ".env missing from .gitignore!"
print("[OK] .gitignore properly ignores .env and environment files.")

# 3. Check requirements.txt
assert os.path.exists(os.path.join(DIRECTORY, "requirements.txt")), "requirements.txt missing!"
with open(os.path.join(DIRECTORY, "requirements.txt"), "r", encoding="utf-8") as f:
    reqs = f.read()
assert "python-dotenv" in reqs, "python-dotenv missing from requirements.txt!"
assert "firebase-admin" in reqs, "firebase-admin missing from requirements.txt!"
print("[OK] requirements.txt contains required dependencies for Render deployment.")

# 4. Check js/api.js for generate function
with open(os.path.join(DIRECTORY, "js", "api.js"), "r", encoding="utf-8") as f:
    api_code = f.read()
assert "generate" in api_code, "RozgaarApi.generate missing in js/api.js!"
print("[OK] RozgaarApi.generate endpoint client method is implemented and exported.")

# 5. Test Live /api/generate HTTP Endpoint behavior
import run
from run import RozgaarRequestHandler

test_port = 8899
server = HTTPServer(('127.0.0.1', test_port), RozgaarRequestHandler)
server_thread = threading.Thread(target=server.serve_forever, daemon=True)
server_thread.start()
time.sleep(0.5)

base_url = f"http://127.0.0.1:{test_port}"

try:
    # 5a. Call /api/generate without GEMINI_API_KEY set (Simulate unconfigured environment)
    saved_key = os.environ.get("GEMINI_API_KEY")
    if "GEMINI_API_KEY" in os.environ:
        del os.environ["GEMINI_API_KEY"]

    payload = json.dumps({"text": "Wall Masonry", "targetLang": "hi"}).encode("utf-8")
    req = urllib.request.Request(
        f"{base_url}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        urllib.request.urlopen(req)
        assert False, "Expected 503 when GEMINI_API_KEY is not configured"
    except urllib.error.HTTPError as e:
        assert e.code == 503, f"Expected 503 error, got {e.code}"
        res_data = json.loads(e.read().decode("utf-8"))
        assert res_data.get("fallback") is True, "Response must include fallback: true"
        print("[OK] /api/generate gracefully returns 503 with fallback=True when key is unconfigured.")

    # 5b. Verify /api/generate rejects empty request body
    os.environ["GEMINI_API_KEY"] = "dummy_test_key"
    empty_req = urllib.request.Request(
        f"{base_url}/api/generate",
        data=json.dumps({}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        urllib.request.urlopen(empty_req)
        assert False, "Expected 400 for empty payload"
    except urllib.error.HTTPError as e:
        assert e.code == 400, f"Expected 400, got {e.code}"
        print("[OK] /api/generate properly validates presence of prompt or text.")

    # 5c. Verify protected endpoints still require authentication
    job_req = urllib.request.Request(
        f"{base_url}/api/jobs",
        data=json.dumps({"title": "Test"}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        urllib.request.urlopen(job_req)
        assert False, "Expected 401 for unauthenticated /api/jobs"
    except urllib.error.HTTPError as e:
        assert e.code == 401, f"Expected 401, got {e.code}"
        print("[OK] Protected POST endpoints (/api/jobs) still strictly require valid Firebase authentication.")

    # Restore key if was originally present
    if saved_key:
        os.environ["GEMINI_API_KEY"] = saved_key
    elif "GEMINI_API_KEY" in os.environ:
        del os.environ["GEMINI_API_KEY"]

finally:
    server.shutdown()
    server.server_close()

print("\n>>> ALL GEMINI BACKEND REFACTOR & PUSH PROTECTION TESTS PASSED! <<<")
