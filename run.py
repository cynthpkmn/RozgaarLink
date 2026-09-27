#!/usr/bin/env python3
"""
RozgaarLink Mobile Prototype Web Server & REST API Engine
Powered by SQLite3 with live Geo-Spatial Haversine partitioning (Within 5 km vs Beyond 5 km).
"""

import os
import sys
import json
import urllib.parse
import urllib.request
import urllib.error
from http.server import HTTPServer, SimpleHTTPRequestHandler
import socket

# Load local environment variables from .env file via python-dotenv
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
except ImportError:
    pass

# Firebase Admin SDK imports
import firebase_admin
from firebase_admin import credentials, auth

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, DIRECTORY)

from backend import db

# Support custom port for deployment environments (e.g., Render sets PORT)
PORT = int(os.getenv("PORT", 8080))

# -------------------------------------------------------------
# FIREBASE ADMIN INITIALIZATION (service-account.json or ENV)
# -------------------------------------------------------------
sa_json_env = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
SERVICE_ACCOUNT_FILE = os.path.join(DIRECTORY, "service-account.json")
if not os.path.exists(SERVICE_ACCOUNT_FILE):
    parent_sa = os.path.join(os.path.dirname(DIRECTORY), "service-account.json")
    if os.path.exists(parent_sa):
        SERVICE_ACCOUNT_FILE = parent_sa

if not firebase_admin._apps:
    if sa_json_env:
        try:
            sa_data = json.loads(sa_json_env)
            cred = credentials.Certificate(sa_data)
            firebase_admin.initialize_app(cred)
            print(f"[OK] Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT_JSON for project: {firebase_admin.get_app().project_id}")
        except Exception as e:
            print(f"[WARN] Could not parse FIREBASE_SERVICE_ACCOUNT_JSON: {e}")

    if not firebase_admin._apps and os.path.exists(SERVICE_ACCOUNT_FILE):
        cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
        firebase_admin.initialize_app(cred)
        print(f"[OK] Firebase Admin strictly initialized for project: {firebase_admin.get_app().project_id}")

    if not firebase_admin._apps:
        raise FileNotFoundError(f"service-account.json not found in {DIRECTORY} or {os.path.dirname(DIRECTORY)} and FIREBASE_SERVICE_ACCOUNT_JSON not set")


class RozgaarRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def verify_auth_token(self):
        """
        Strictly verify the Firebase Bearer token from the Authorization header.
        Rejects requests without a valid, verifiable Firebase ID token.
        Returns (decoded_token, error_message).
        """
        auth_header = self.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None, "Missing or invalid Authorization header (expected 'Bearer <firebase_id_token>')"

        token = auth_header.split(' ', 1)[1].strip()
        if not token:
            return None, "Bearer token is empty"

        try:
            decoded_token = auth.verify_id_token(token)
            return decoded_token, None
        except Exception as e:
            return None, f"Firebase token verification failed: {str(e)}"

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # -----------------------------
        # REST API ROUTING
        # -----------------------------
        if path.startswith('/api/'):
            try:
                # 1. Health check (Public endpoint)
                if path == '/api/health':
                    return self.send_json({"status": "healthy", "service": "RozgaarLink API", "engine": "SQLite3"})

                # Strictly protect all worker, employer, job, and application GET endpoints
                if (path == '/api/workers' or path.startswith('/api/workers/') or
                    path == '/api/employers' or path.startswith('/api/employers/') or
                    path == '/api/jobs' or
                    path == '/api/applications' or path.startswith('/api/applications/')):
                    decoded_token, auth_err = self.verify_auth_token()
                    if auth_err:
                        return self.send_json({"error": "Unauthorized", "detail": auth_err}, 401)

                # 2. Get Worker Profile
                if path == '/api/workers':
                    workers = db.get_all_workers()
                    return self.send_json(workers)

                elif path.startswith('/api/workers/'):
                    worker_id = path.split('/')[3]
                    worker = db.get_worker(worker_id)
                    if worker:
                        return self.send_json(worker)
                    return self.send_json({"error": "Worker not found"}, 404)

                # 2b. Get Employer Profile
                elif path == '/api/employers':
                    employers = db.get_all_employers()
                    return self.send_json(employers)

                elif path.startswith('/api/employers/'):
                    emp_id = path.split('/')[3]
                    employer = db.get_employer(emp_id)
                    if employer:
                        return self.send_json(employer)
                    return self.send_json({"error": "Employer not found"}, 404)

                # 2c. Get Application(s)
                elif path == '/api/applications':
                    apps = db.get_all_applications()
                    return self.send_json(apps)

                elif path.startswith('/api/applications/'):
                    app_id = path.split('/')[3]
                    app_item = db.get_application(app_id)
                    if app_item:
                        return self.send_json(app_item)
                    return self.send_json({"error": "Application not found"}, 404)

                # 3. Geo-Fenced Jobs (Nearby <= 5km vs Extended > 5km)
                elif path == '/api/jobs':
                    lat = float(query.get('lat', [18.5074])[0])
                    lng = float(query.get('lng', [73.8077])[0])
                    prof = query.get('profession', ['All'])[0]
                    q = query.get('q', [''])[0]

                    geo_jobs = db.get_geo_fenced_jobs(lat, lng, profession_filter=prof, search_query=q)
                    return self.send_json(geo_jobs)

                # Unknown API endpoint
                return self.send_json({"error": "Endpoint not found"}, 404)

            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        # Static file routing
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith('/api/'):
            try:
                # 0. Google Gemini AI Generation & Multilingual Translation Endpoint
                if path == '/api/generate':
                    content_len = int(self.headers.get('Content-Length', 0))
                    body = self.rfile.read(content_len).decode('utf-8') if content_len > 0 else '{}'
                    data = json.loads(body) if body else {}

                    prompt = data.get('prompt')
                    text = data.get('text')
                    target_lang = data.get('targetLang')

                    if not prompt and text:
                        lang_map = {
                            "hi": "Hindi (हिंदी)",
                            "mr": "Marathi (मराठी)",
                            "te": "Telugu (తెలుగు)",
                            "ta": "Tamil (தமிழ்)"
                        }
                        lang_name = lang_map.get(target_lang, target_lang or "Hindi")
                        script_hint = "in Telugu script" if target_lang == "te" else "in Tamil script" if target_lang == "ta" else "in Devanagari script"
                        prompt = (
                            f"You are a professional multilingual translator for an Indian blue-collar daily-wage job portal. "
                            f"Translate the following text into natural, authentic {lang_name} {script_hint}. "
                            f"Translate ALL proper nouns, localities, and construction words cleanly. "
                            f"Output strictly and ONLY the direct translated phrase without markdown bold, explanations, prefixes, or quotes:\n{text}"
                        )

                    if not prompt:
                        return self.send_json({"error": "Missing 'prompt' or 'text' in request body"}, 400)

                    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
                    if not gemini_api_key:
                        return self.send_json({
                            "error": "GEMINI_API_KEY environment variable is not configured on the server",
                            "fallback": True
                        }, 503)

                    # Determine models to attempt
                    custom_model = data.get('model')
                    models_to_try = [custom_model] if custom_model else []
                    for m in ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"]:
                        if m not in models_to_try:
                            models_to_try.append(m)

                    headers = {"Content-Type": "application/json"}
                    payload = json.dumps({
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.1,
                            "maxOutputTokens": 250
                        }
                    }).encode("utf-8")

                    last_error = None
                    for model in models_to_try:
                        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_api_key}"
                        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
                        try:
                            with urllib.request.urlopen(req, timeout=10) as response:
                                res_body = response.read().decode("utf-8")
                                res_json = json.loads(res_body)
                                candidates = res_json.get("candidates", [])
                                if candidates:
                                    parts = candidates[0].get("content", {}).get("parts", [])
                                    if parts and "text" in parts[0]:
                                        gen_text = parts[0]["text"].strip()
                                        return self.send_json({
                                            "text": gen_text,
                                            "candidates": candidates,
                                            "model": model,
                                            "success": True
                                        }, 200)
                        except urllib.error.HTTPError as he:
                            err_msg = he.read().decode('utf-8', errors='ignore')
                            last_error = f"HTTP {he.code}: {err_msg}"
                            continue
                        except Exception as e:
                            last_error = str(e)
                            continue

                    return self.send_json({
                        "error": f"Gemini API request failed across models: {last_error}",
                        "fallback": True
                    }, 502)

                # Strictly enforce authentication for all other protected POST endpoints
                decoded_token, auth_err = self.verify_auth_token()
                if auth_err:
                    return self.send_json({"error": "Unauthorized", "detail": auth_err}, 401)

                uid = decoded_token.get('uid')
                if not uid:
                    return self.send_json({"error": "Unauthorized", "detail": "Token contains no valid UID"}, 401)

                content_len = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_len).decode('utf-8') if content_len > 0 else '{}'
                data = json.loads(body) if body else {}

                # 1. Post a new Job (Employer Action) - inject verified UID as employer_id
                if path == '/api/jobs':
                    data['employerId'] = uid
                    data['employer_id'] = uid
                    new_job = db.insert_job(data, employer_uid=uid)
                    return self.send_json(new_job, 201)

                # 1b. Register a new Worker - inject verified UID as worker primary key
                elif path == '/api/workers':
                    data['id'] = uid
                    new_worker = db.insert_worker(data, firebase_uid=uid)
                    return self.send_json(new_worker, 201)

                # 1c. Register a new Employer - inject verified UID as employer primary key
                elif path == '/api/employers':
                    data['id'] = uid
                    new_employer = db.insert_employer(data, firebase_uid=uid)
                    return self.send_json(new_employer, 201)

                # 1d. Submit a new Job Application (Worker Action) - inject verified UID as worker_id
                elif path == '/api/applications':
                    data['workerId'] = uid
                    data['worker_id'] = uid
                    new_app = db.insert_application(data, worker_uid=uid)
                    return self.send_json(new_app, 201)

                # 2. Seed Sample Employer Jobs for demonstration
                elif path == '/api/jobs/seed-demo':
                    lat = float(data.get('lat', 18.5074))
                    lng = float(data.get('lng', 73.8077))
                    seeded = db.seed_sample_employer_jobs(lat, lng)
                    return self.send_json(seeded, 200)

                # 3. Clear all jobs (Reset to clean initial state)
                elif path == '/api/jobs/clear':
                    res = db.clear_all_jobs()
                    return self.send_json(res, 200)

                return self.send_json({"error": "Endpoint not found"}, 404)

            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        self.send_response(405)
        self.end_headers()

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith('/api/'):
            try:
                # Strictly enforce authentication for all PUT endpoints
                decoded_token, auth_err = self.verify_auth_token()
                if auth_err:
                    return self.send_json({"error": "Unauthorized", "detail": auth_err}, 401)

                uid = decoded_token.get('uid')
                content_len = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_len).decode('utf-8') if content_len > 0 else '{}'
                data = json.loads(body) if body else {}

                # 1. Update Worker GPS Location
                if '/api/workers/' in path and path.endswith('/location'):
                    parts = path.split('/')
                    worker_id = parts[3]
                    lat = float(data.get('lat', 18.5074))
                    lng = float(data.get('lng', 73.8077))
                    loc_name = data.get('locationName')

                    updated = db.update_worker_location(worker_id, lat, lng, loc_name)
                    return self.send_json(updated, 200)

                # 2. Update Application Status (PUT /api/applications/<id>)
                elif path.startswith('/api/applications/'):
                    parts = path.split('/')
                    if len(parts) >= 4:
                        app_id = parts[3]
                        status = data.get('status')
                        if not status:
                            return self.send_json({"error": "Missing 'status' in request body"}, 400)
                        updated_app = db.update_application_status(app_id, status)
                        if updated_app:
                            return self.send_json(updated_app, 200)
                        return self.send_json({"error": "Application not found"}, 404)

                # 3. Update Job Status (PUT /api/jobs/<id>/status)
                elif path.startswith('/api/jobs/') and path.endswith('/status'):
                    parts = path.split('/')
                    if len(parts) >= 5:
                        job_id = parts[3]
                        status = data.get('status')
                        if not status:
                            return self.send_json({"error": "Missing 'status' in request body"}, 400)
                        updated_job = db.update_job_status(job_id, status)
                        if updated_job:
                            return self.send_json(updated_job, 200)
                        return self.send_json({"error": "Job not found"}, 404)

                return self.send_json({"error": "Endpoint not found"}, 404)

            except Exception as e:
                return self.send_json({"error": str(e)}, 500)

        self.send_response(405)
        self.end_headers()

    def guess_type(self, path):
        if path.endswith('.js'):
            return 'application/javascript; charset=utf-8'
        if path.endswith('.css'):
            return 'text/css; charset=utf-8'
        if path.endswith('.json'):
            return 'application/json; charset=utf-8'
        return super().guess_type(path)

def find_available_port(start_port):
    port = start_port
    while port < start_port + 100:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('localhost', port)) != 0:
                return port
            port += 1
    return start_port

def run():
    os.chdir(DIRECTORY)
    port = find_available_port(PORT)
    server_address = ('', port)
    httpd = HTTPServer(server_address, RozgaarRequestHandler)
    url = f"http://localhost:{port}"

    print("=" * 60)
    print(" >> ROZGAARLINK BACKEND REST API & PROTOTYPE SERVER")
    print("=" * 60)
    print(f" Local Web Server: {url}")
    print(f" SQLite Database:  {db.DB_FILE}")
    print(f" API Endpoints:    {url}/api/jobs, {url}/api/workers")
    print("=" * 60)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n Server stopped.")
        httpd.server_close()

if __name__ == '__main__':
    run()
