"""
RozgaarLink SQLite Database Engine & Geo-Spatial Query Service
Handles Workers, Employers, Jobs, Applications, and Transactions with Haversine distance calculations.
"""

import sqlite3
import os
import math
import json
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rozgaarlink.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE, timeout=30.0)
    conn.row_factory = sqlite3.Row
    return conn

def haversine_km(lat1, lon1, lat2, lon2):
    """Calculate the great-circle distance between two points in kilometers."""
    try:
        lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
    except (TypeError, ValueError):
        return 999.0
    R = 6371.0  # Earth's radius in kilometers
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def init_db():
    """Create all required tables for Workers, Employers, Jobs, Applications, and Transactions."""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Workers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        age INTEGER,
        gender TEXT,
        address TEXT,
        city TEXT,
        location_name TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        profession TEXT NOT NULL,
        skills TEXT,
        years_exp INTEGER,
        expected_wage REAL,
        preferred_hours TEXT,
        aadhaar_number TEXT,
        pan_number TEXT,
        availability TEXT DEFAULT 'Available for Work ✓',
        rating REAL DEFAULT 4.8,
        reviews_count INTEGER DEFAULT 0,
        photo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Employers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS employers (
        id TEXT PRIMARY KEY,
        name TEXT,
        company_name TEXT NOT NULL,
        phone TEXT,
        business_address TEXT,
        city TEXT,
        location_name TEXT,
        latitude REAL,
        longitude REAL,
        gstin TEXT,
        pan TEXT,
        aadhaar TEXT,
        rating REAL DEFAULT 4.8,
        business_verified INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. Jobs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        title_hi TEXT,
        title_mr TEXT,
        title_te TEXT,
        title_ta TEXT,
        profession TEXT NOT NULL,
        employer_id TEXT NOT NULL,
        employer_name TEXT,
        employer_verified INTEGER DEFAULT 1,
        employer_rating REAL DEFAULT 4.8,
        location_name TEXT NOT NULL,
        location_hi TEXT,
        location_mr TEXT,
        location_te TEXT,
        location_ta TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        wage REAL NOT NULL,
        wage_type TEXT DEFAULT 'per day',
        date_required TEXT,
        start_time TEXT,
        end_time TEXT,
        duration TEXT,
        duration_hi TEXT,
        duration_mr TEXT,
        duration_te TEXT,
        duration_ta TEXT,
        workers_required INTEGER DEFAULT 1,
        workers_accepted INTEGER DEFAULT 0,
        workers_remaining INTEGER DEFAULT 1,
        required_skills TEXT,
        required_skills_hi TEXT,
        required_skills_mr TEXT,
        required_skills_te TEXT,
        required_skills_ta TEXT,
        required_experience TEXT,
        description TEXT,
        description_hi TEXT,
        description_mr TEXT,
        description_te TEXT,
        description_ta TEXT,
        payment_protected INTEGER DEFAULT 1,
        status TEXT DEFAULT 'Applications Open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employer_id) REFERENCES employers (id)
    );
    """)

    # 4. Applications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        worker_id TEXT NOT NULL,
        worker_name TEXT,
        profession TEXT,
        wage REAL,
        status TEXT DEFAULT 'Pending',
        applied_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs (id),
        FOREIGN KEY (worker_id) REFERENCES workers (id)
    );
    """)

    # 5. Transactions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        employer_id TEXT NOT NULL,
        worker_id TEXT,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'Held',
        date TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()

    # Pre-populate default worker Rajesh Kumar and default employer ABC Construction if not existing
    seed_default_worker_and_employer(conn)
    conn.close()

def seed_default_worker_and_employer(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM workers WHERE id = 'w-1'")
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO workers (
            id, name, phone, age, gender, address, city, location_name,
            latitude, longitude, profession, skills, years_exp, expected_wage,
            preferred_hours, aadhaar_number, pan_number, availability, rating, reviews_count, photo_url
        ) VALUES (
            'w-1', 'Rajesh Kumar', '9822145670', 34, 'Male',
            'Near Maruti Mandir, Kothrud', 'Pune', 'Kothrud, Pune',
            18.5074, 73.8077, 'Mason', 'Brickwork, Wall Plastering, Stone Masonry, Concrete Mix',
            8, 750, '8:00 AM - 5:30 PM', '7845 9012 3456', 'ABCDE1234F',
            'Available for Work ✓', 4.9, 24,
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
        )
        """)

    cursor.execute("SELECT id FROM employers WHERE id = 'emp-1'")
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO employers (
            id, name, company_name, phone, business_address, city, location_name,
            latitude, longitude, gstin, pan, aadhaar, rating, business_verified
        ) VALUES (
            'emp-1', 'Vikram Deshmukh', 'ABC Construction', '9822001122',
            'Shop 12, Rahul Complex, Paud Road, Kothrud', 'Pune', 'Kothrud, Pune',
            18.5074, 73.8077, '27AABCA1234F1Z5', 'AABCA1234F', '5544 3322 1100', 4.8, 1
        )
        """)
    conn.commit()

# ==========================================
# WORKER OPERATIONS
# ==========================================

def get_worker(worker_id='w-1'):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM workers WHERE id = ?", (worker_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        d = dict(row)
        d['coordinates'] = {'lat': d['latitude'], 'lng': d['longitude']}
        return d
    return None

def update_worker_location(worker_id, lat, lng, location_name=None):
    conn = get_connection()
    cursor = conn.cursor()
    if location_name:
        cursor.execute("UPDATE workers SET latitude = ?, longitude = ?, location_name = ? WHERE id = ?", (lat, lng, location_name, worker_id))
    else:
        cursor.execute("UPDATE workers SET latitude = ?, longitude = ? WHERE id = ?", (lat, lng, worker_id))
    conn.commit()
    conn.close()
    return get_worker(worker_id)

def get_all_workers():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM workers")
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d['coordinates'] = {'lat': d['latitude'], 'lng': d['longitude']}
        result.append(d)
    return result

def insert_worker(worker, firebase_uid=None):
    """
    Insert or register a newly signed up worker into SQLite database.
    Strictly requires the Firebase uid (passed via firebase_uid, worker['id'], or worker['uid'])
    and uses it as the primary key.
    """
    conn = get_connection()
    cursor = conn.cursor()

    worker_id = firebase_uid or worker.get('id') or worker.get('uid')
    if not worker_id:
        conn.close()
        raise ValueError("Firebase UID is required to insert worker (cannot generate ID from timestamps).")

    coords = worker.get('coordinates', {})
    lat = float(worker.get('latitude', coords.get('lat', 18.5074)))
    lng = float(worker.get('longitude', coords.get('lng', 73.8077)))

    cursor.execute("""
    INSERT OR REPLACE INTO workers (
        id, name, phone, age, gender, address, city, location_name,
        latitude, longitude, profession, skills, years_exp, expected_wage,
        preferred_hours, aadhaar_number, pan_number, availability,
        rating, reviews_count, photo_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        worker_id,
        worker.get('name', 'Registered Worker'),
        worker.get('phone', worker.get('mobile', '')),
        int(worker.get('age', 30)),
        worker.get('gender', 'Male'),
        worker.get('address', ''),
        worker.get('city', 'Pune'),
        worker.get('locationName', worker.get('location_name', 'Kothrud, Pune')),
        lat,
        lng,
        worker.get('profession', 'Mason'),
        worker.get('skills', ''),
        int(worker.get('yearsExp', worker.get('years_exp', 3))),
        float(worker.get('expectedWage', worker.get('expected_wage', 750.0))),
        worker.get('preferredHours', worker.get('preferred_hours', '8:00 AM - 5:30 PM')),
        worker.get('aadhaarNumber', worker.get('aadhaar_number', '')),
        worker.get('panNumber', worker.get('pan_number', '')),
        worker.get('availability', 'Available for Work ✓'),
        float(worker.get('rating', 5.0)),
        int(worker.get('reviewsCount', worker.get('reviews_count', 0))),
        worker.get('photoUrl', worker.get('photo_url', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'))
    ))
    conn.commit()
    conn.close()
    return get_worker(worker_id)

# ==========================================
# EMPLOYER OPERATIONS
# ==========================================

def get_employer(employer_id='emp-1'):
    """Retrieve an employer record by ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM employers WHERE id = ?", (employer_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        d = dict(row)
        d['companyName'] = d['company_name']
        d['businessAddress'] = d['business_address']
        d['locationName'] = d['location_name']
        d['businessVerified'] = bool(d['business_verified'])
        return d
    return None

def get_all_employers():
    """Retrieve all employer records."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM employers")
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d['companyName'] = d['company_name']
        d['businessAddress'] = d['business_address']
        d['locationName'] = d['location_name']
        d['businessVerified'] = bool(d['business_verified'])
        result.append(d)
    return result

def insert_employer(employer, firebase_uid=None):
    """
    Insert or register a newly signed up employer into SQLite database.
    Strictly requires the Firebase uid (passed via firebase_uid, employer['id'], or employer['uid'])
    and uses it as the primary key.
    """
    conn = get_connection()
    cursor = conn.cursor()

    emp_id = firebase_uid or employer.get('id') or employer.get('uid')
    if not emp_id:
        conn.close()
        raise ValueError("Firebase UID is required to insert employer.")

    lat = float(employer.get('latitude', 18.5074)) if employer.get('latitude') else 18.5074
    lng = float(employer.get('longitude', 73.8077)) if employer.get('longitude') else 73.8077

    cursor.execute("""
    INSERT OR REPLACE INTO employers (
        id, name, company_name, phone, business_address, city, location_name,
        latitude, longitude, gstin, pan, aadhaar, rating, business_verified
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        emp_id,
        employer.get('name', 'Registered Employer'),
        employer.get('companyName', employer.get('company_name', 'Business')),
        employer.get('phone', employer.get('mobile', '')),
        employer.get('businessAddress', employer.get('business_address', '')),
        employer.get('city', 'Pune'),
        employer.get('locationName', employer.get('location_name', 'Kothrud, Pune')),
        lat,
        lng,
        employer.get('gstin', ''),
        employer.get('pan', ''),
        employer.get('aadhaar', ''),
        float(employer.get('rating', 4.8)),
        1 if employer.get('businessVerified', True) else 0
    ))
    conn.commit()
    conn.close()
    return get_employer(emp_id)

# ==========================================
# JOB OPERATIONS & GEO-FENCED DISCOVERY
# ==========================================

def insert_job(job, employer_uid=None):
    """
    Insert a newly posted employer job into the database.
    Strictly requires the Firebase employer UID (via employer_uid, job['employerId'], or job['employer_id'])
    to prevent spoofing.
    """
    conn = get_connection()
    cursor = conn.cursor()

    job_id = job.get('id') or f"job-{int(datetime.now().timestamp() * 1000)}"
    employer_id = employer_uid or job.get('employerId') or job.get('employer_id')
    if not employer_id:
        conn.close()
        raise ValueError("Firebase employer UID is required to post a job.")

    coords = job.get('coordinates', {})
    lat = float(job.get('latitude', coords.get('lat', 18.5074)))
    lng = float(job.get('longitude', coords.get('lng', 73.8077)))

    cursor.execute("""
    INSERT OR REPLACE INTO jobs (
        id, title, title_hi, title_mr, title_te, title_ta,
        profession, employer_id, employer_name, employer_verified, employer_rating,
        location_name, location_hi, location_mr, location_te, location_ta,
        latitude, longitude, wage, wage_type,
        date_required, start_time, end_time, duration, duration_hi, duration_mr, duration_te, duration_ta,
        workers_required, workers_accepted, workers_remaining,
        required_skills, required_skills_hi, required_skills_mr, required_skills_te, required_skills_ta,
        required_experience, description, description_hi, description_mr, description_te, description_ta,
        payment_protected, status
    ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?
    )
    """, (
        job_id,
        job.get('title', 'Daily Construction Requirement'),
        job.get('title_hi', job.get('title')),
        job.get('title_mr', job.get('title')),
        job.get('title_te', job.get('title')),
        job.get('title_ta', job.get('title')),
        job.get('profession', 'Mason'),
        employer_id,
        job.get('employerName', job.get('employer_name', 'ABC Construction')),
        1 if job.get('employerVerified', True) else 0,
        float(job.get('employerRating', 4.8)),
        job.get('location', job.get('location_name', 'Kothrud, Pune')),
        job.get('location_hi', job.get('location')),
        job.get('location_mr', job.get('location')),
        job.get('location_te', job.get('location')),
        job.get('location_ta', job.get('location')),
        lat, lng,
        float(job.get('wage', 800)),
        job.get('wageType', 'per day'),
        job.get('date', job.get('date_required', 'Tomorrow')),
        job.get('startTime', job.get('start_time', '8:30 AM')),
        job.get('endTime', job.get('end_time', '5:30 PM')),
        job.get('duration', '3 Days'),
        job.get('duration_hi', job.get('duration')),
        job.get('duration_mr', job.get('duration')),
        job.get('duration_te', job.get('duration')),
        job.get('duration_ta', job.get('duration')),
        int(job.get('workersRequired', job.get('workers_required', 2))),
        int(job.get('workersAccepted', job.get('workers_accepted', 0))),
        int(job.get('workersRemaining', job.get('workers_remaining', 2))),
        job.get('requiredSkills', job.get('required_skills', 'Standard craft skills')),
        job.get('requiredSkills_hi', job.get('requiredSkills')),
        job.get('requiredSkills_mr', job.get('requiredSkills')),
        job.get('requiredSkills_te', job.get('requiredSkills')),
        job.get('requiredSkills_ta', job.get('requiredSkills')),
        job.get('requiredExperience', job.get('required_experience', '2+ Years')),
        job.get('description', 'Work requirement posted by employer.'),
        job.get('description_hi', job.get('description')),
        job.get('description_mr', job.get('description')),
        job.get('description_te', job.get('description')),
        job.get('description_ta', job.get('description')),
        1 if job.get('paymentProtected', True) else 0,
        job.get('status', 'Applications Open')
    ))
    conn.commit()
    conn.close()
    return get_job_by_id(job_id)

def get_job_by_id(job_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return row_to_job_dict(row)
    return None

def row_to_job_dict(row, worker_lat=None, worker_lng=None):
    d = dict(row)
    d['location'] = d['location_name']
    d['coordinates'] = {'lat': d['latitude'], 'lng': d['longitude']}
    d['employerId'] = d['employer_id']
    d['employerName'] = d['employer_name']
    d['employerVerified'] = bool(d['employer_verified'])
    d['employerRating'] = d['employer_rating']
    d['workersRequired'] = d['workers_required']
    d['workersAccepted'] = d['workers_accepted']
    d['workersRemaining'] = d['workers_remaining']
    d['requiredSkills'] = d['required_skills']
    d['requiredExperience'] = d['required_experience']
    d['paymentProtected'] = bool(d['payment_protected'])
    d['wageType'] = d['wage_type']
    d['date'] = d['date_required']
    d['startTime'] = d['start_time']
    d['endTime'] = d['end_time']
    d['assignedWorkers'] = []

    if worker_lat is not None and worker_lng is not None:
        d['distance'] = haversine_km(worker_lat, worker_lng, d['latitude'], d['longitude'])
    else:
        d['distance'] = 0.0
    return d

def get_geo_fenced_jobs(worker_lat, worker_lng, profession_filter='All', search_query=''):
    """
    Core Discovery Query:
    Retrieves all actively posted jobs, calculates Haversine distance from worker's GPS,
    and partitions them into:
      - Section 1 (Nearby): distance <= 5.0 km
      - Section 2 (Extended): distance > 5.0 km
    """
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM jobs WHERE status != 'Completed'"
    params = []

    if profession_filter and profession_filter != 'All':
        query += " AND profession = ?"
        params.append(profession_filter)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    nearby = []
    extended = []

    for r in rows:
        job = row_to_job_dict(r, worker_lat, worker_lng)

        # Search query matching
        if search_query:
            q = search_query.lower()
            text_corpus = f"{job['title']} {job['location']} {job['profession']} {job['requiredSkills']} {job['description']}".lower()
            if q not in text_corpus:
                continue

        dist = job['distance']
        if dist <= 5.0:
            nearby.append(job)
        else:
            extended.append(job)

    # Sort each section by proximity
    nearby.sort(key=lambda j: j['distance'])
    extended.sort(key=lambda j: j['distance'])

    return {
        "nearby": nearby,
        "extended": extended,
        "total_count": len(nearby) + len(extended),
        "worker_location": {"lat": worker_lat, "lng": worker_lng}
    }

def clear_all_jobs():
    """Clear all posted jobs to test clean/empty state."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM applications")
    cursor.execute("DELETE FROM transactions")
    cursor.execute("DELETE FROM jobs")
    conn.commit()
    conn.close()
    return {"message": "All jobs cleared successfully. Initial empty state restored."}

def insert_application(app_data, worker_uid=None):
    """
    Inserts a new row into the applications table.
    Ensures worker_id is bound to verified UID if supplied.
    """
    conn = get_connection()
    cursor = conn.cursor()

    app_id = app_data.get('id') or f"app-{int(datetime.now().timestamp() * 1000)}"
    job_id = app_data.get('jobId') or app_data.get('job_id')
    if not job_id:
        conn.close()
        raise ValueError("job_id is required to submit an application")

    worker_id = worker_uid or app_data.get('workerId') or app_data.get('worker_id')
    if not worker_id:
        conn.close()
        raise ValueError("worker_id is required to submit an application")

    worker_name = app_data.get('workerName') or app_data.get('worker_name') or ""
    profession = app_data.get('profession') or ""
    wage = float(app_data.get('wage', 0.0))
    status = app_data.get('status') or "Pending"
    applied_date = app_data.get('appliedDate') or app_data.get('applied_date') or "Just now"

    cursor.execute("""
    INSERT OR REPLACE INTO applications (
        id, job_id, worker_id, worker_name, profession, wage, status, applied_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        app_id, job_id, worker_id, worker_name, profession, wage, status, applied_date
    ))
    conn.commit()

    cursor.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
    row = cursor.fetchone()
    result = dict(row) if row else None
    conn.close()
    return result

def get_application(app_id):
    """Retrieves an application by ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
    row = cursor.fetchone()
    result = dict(row) if row else None
    conn.close()
    return result

def get_all_applications():
    """Retrieves all applications."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applications ORDER BY created_at DESC")
    rows = cursor.fetchall()
    result = [dict(r) for r in rows]
    conn.close()
    return result

def update_application_status(app_id, status):
    """
    Updates the status of an application in the applications table.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    UPDATE applications
    SET status = ?
    WHERE id = ?
    """, (status, app_id))
    conn.commit()

    cursor.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
    row = cursor.fetchone()
    result = dict(row) if row else None
    conn.close()
    return result

def update_job_status(job_id, status):
    """
    Updates the status of a job in the jobs table.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    UPDATE jobs
    SET status = ?
    WHERE id = ?
    """, (status, job_id))
    conn.commit()

    cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    result = row_to_job_dict(row) if row else None
    conn.close()
    return result

def seed_sample_employer_jobs(center_lat=18.5074, center_lng=73.8077):
    """
    Seed realistic sample employer jobs anchored to the given coordinates.
    Creates 4 nearby jobs (0.8km - 4.2km) and 3 extended jobs (6.5km - 14.5km).
    """
    # Clear existing jobs first
    clear_all_jobs()

    # Angle helper for radial offsets (1 deg lat ~ 111 km)
    def make_coords(dist_km, angle_deg):
        rad = math.radians(angle_deg)
        d_lat = (dist_km * math.cos(rad)) / 111.0
        d_lng = (dist_km * math.sin(rad)) / (111.0 * math.cos(math.radians(center_lat)))
        return round(center_lat + d_lat, 4), round(center_lng + d_lng, 4)

    # 4 NEARBY JOBS (<= 5 KM)
    nearby_defs = [
        {
            "id": "job-1",
            "title": "Brickwork & Masonry for Residential Villa",
            "title_hi": "आवासीय विला के लिए ईंट जोड़ाई व राजमिस्त्री कार्य",
            "title_mr": "निवासी व्हिलासाठी वीटकाम आणि गवंडी काम",
            "title_te": "రెసిడెన్షియల్ విల్లా కోసం ఇటుక పని & మేస్త్రీ పని",
            "title_ta": "குடியிருப்பு வில்லாவிற்கான செங்கல் வேலை & கொத்து வேலை",
            "profession": "Mason",
            "wage": 800,
            "dist": 1.2,
            "angle": 45,
            "location": "Near Vanaz Metro, Paud Road",
            "location_hi": "वनाज मेट्रो के पास, पौड रोड",
            "location_mr": "वनाज मेट्रो जवळ, पौड रोड",
            "location_te": "వనాజ్ మెట్రో సమీపంలో, పౌడ్ రోడ్",
            "location_ta": "வனாஸ் மெட்ரோ அருகில், பவுட் சாலை",
            "workers": 4,
            "desc": "Construction of exterior red brick walls and interior partition walls for a new bungalow. Lunch break provided."
        },
        {
            "id": "job-2",
            "title": "Plastering & Cement Boundary Wall Construction",
            "title_hi": "प्लास्टरिंग व सीमेंट चारदीवारी निर्माण कार्य",
            "title_mr": "प्लास्टर काम आणि सिमेंट संरक्षक भिंत बांधकाम",
            "title_te": "ప్లాస్టరింగ్ & సిమెంట్ కాంపౌండ్ వాల్ నిర్మాణం",
            "title_ta": "பூச்சு வேலை & சிமெண்ட் சுற்றுச்சுவர் கட்டுதல்",
            "profession": "Mason",
            "wage": 750,
            "dist": 2.4,
            "angle": 120,
            "location": "Near Cummins College, Karve Nagar",
            "location_hi": "कमिंस कॉलेज के पास, कर्वे नगर",
            "location_mr": "कमिन्स कॉलेज जवळ, कर्वे नगर",
            "location_te": "కమ్మిన్స్ కాలేజ్ సమీపంలో, కార్వే నగర్",
            "location_ta": "கம்மின்ஸ் கல்லூரி அருகில், கார்வே நகர்",
            "workers": 3,
            "desc": "Internal and external sand-face cement plastering for boundary wall. Scaffolding provided."
        },
        {
            "id": "job-3",
            "title": "Concealed Electric Wiring & Fitting for 2BHK",
            "title_hi": "2BHK के लिए कंसील्ड बिजली वायरिंग व फिटिंग",
            "title_mr": "२BHK साठी कन्सिल्ड वायरिंग व फिटिंग",
            "title_te": "2BHK కోసం కన్సీల్డ్ ఎలక్ట్రిక్ వైరింగ్ & ఫిట్టింగ్",
            "title_ta": "2BHK வீட்டிற்கான மறைமுக மின்சார வயரிங் மற்றும் பொருத்துதல்",
            "profession": "Electrician",
            "wage": 900,
            "dist": 3.1,
            "angle": 210,
            "location": "Near MIT College, Paud Road",
            "location_hi": "एमआईटी कॉलेज के पास, पौड रोड",
            "location_mr": "एमआयटी कॉलेज जवळ, पौड रोड",
            "location_te": "MIT కాలేజ్ సమీపంలో, పౌడ్ రోడ్",
            "location_ta": "எம்ஐடி கல்லூரி அருகில், பவுட் சாலை",
            "workers": 2,
            "desc": "Concealed electrical conduit pipe laying, wire pulling, switchboard fitting, and MCB distribution board installation."
        },
        {
            "id": "job-4",
            "title": "Kitchen Cabinet & Wardrobe Woodwork",
            "title_hi": "किचन कैबिनेट व अलमारी बढ़ई कार्य",
            "title_mr": "किचन कॅबिनेट आणि कपाट सुतारकाम",
            "title_te": "కిచెన్ క్యాబినెట్ & వార్డ్‌రోబ్ చెక్క పని",
            "title_ta": "சமையலறை அலமாரி மற்றும் மர வேலை",
            "profession": "Carpenter",
            "wage": 850,
            "dist": 4.2,
            "angle": 300,
            "location": "Chandani Chowk, Bavdhan",
            "location_hi": "चांदनी चौक, बावधान",
            "location_mr": "चांदणी चौक, बावधन",
            "location_te": "చాందని చౌక్, బావధాన్",
            "location_ta": "சாந்தினி சவுக், பாவதான்",
            "workers": 2,
            "desc": "Modular kitchen plywood carcass assembly, laminate pressing, and hydraulic hinges fitting."
        }
    ]

    # 3 EXTENDED JOBS (> 5 KM)
    extended_defs = [
        {
            "id": "job-5",
            "title": "Plumbing Pipe Laying & Bathroom Sanitary Fitting",
            "title_hi": "प्लंबिंग पाइप बिछाना व बाथरूम सैनिटरी फिटिंग",
            "title_mr": "प्लंबिंग पाईप टाकणे व बाथरूम सॅनिटरी फिटिंग",
            "title_te": "ప్లంబింగ్ పైపులు వేయడం & బాత్రూమ్ శానిటరీ ఫిట్టింగ్",
            "title_ta": "குழாய் பதித்தல் மற்றும் குளியலறை பொருத்துதல்கள்",
            "profession": "Plumber",
            "wage": 950,
            "dist": 7.5,
            "angle": 70,
            "location": "FC Road, Shivajinagar",
            "location_hi": "एफसी रोड, शिवाजीनगर",
            "location_mr": "एफसी रोड, शिवाजीनगर",
            "location_te": "FC రోడ్, శివాజీనగర్",
            "location_ta": "எஃப்சி சாலை, சிவாஜி நகர்",
            "workers": 2,
            "desc": "CPVC and UPVC drainage and water supply pipe line concealed fitting for 4 new bathrooms."
        },
        {
            "id": "job-6",
            "title": "Full Flat Interior Emulsion & Texture Painting",
            "title_hi": "पूरे फ्लैट की आंतरिक इमल्शन व टेक्सचर पुताई",
            "title_mr": "संपूर्ण फ्लॅटची आतील इमल्शन व टेक्स्चर रंगकाम",
            "title_te": "ఫ్లాట్ ఇంటీరియర్ ఎమల్షన్ & టెక్స్చర్ పెయింటింగ్",
            "title_ta": "முழு அடுக்குமாடி உள் எமல்ஷன் & டெக்ஸ்ச்சர் பெயிண்டிங்",
            "profession": "Painter",
            "wage": 700,
            "dist": 11.2,
            "angle": 160,
            "location": "High Street, Baner",
            "location_hi": "हाई स्ट्रीट, बानेर",
            "location_mr": "हाय स्ट्रीट, बाणेर",
            "location_te": "హై స్ట్రీట్, బానేర్",
            "location_ta": "ஹை ஸ்ட்ரீட், பாணர்",
            "workers": 4,
            "desc": "Two coats of Birla putty, primer, and two coats of Asian Paints Royal Emulsion on all walls."
        },
        {
            "id": "job-7",
            "title": "Commercial Complex Structural Concrete Mix & Casting",
            "title_hi": "व्यावसायिक परिसर कंक्रीट मिक्स व ढलाई कार्य",
            "title_mr": "व्यावसायिक संकुल काँक्रीट मिक्स आणि स्लॅब ओतकाम",
            "title_te": "వాణిజ్య సముదాయం కాంక్రీట్ మిక్స్ & స్లాబ్ కాస్టింగ్",
            "title_ta": "வணிக வளாக கான்கிரீட் கலவை மற்றும் தளம் அமைத்தல்",
            "profession": "Construction Worker",
            "wage": 650,
            "dist": 14.8,
            "angle": 250,
            "location": "Magarpatta City, Hadapsar",
            "location_hi": "मगरपट्टा सिटी, हडपसर",
            "location_mr": "मगरपट्टा सिटी, हडपसर",
            "location_te": "మగర్పట్టా సిటీ, హడప్సర్",
            "location_ta": "மக்ரபட்டா நகரம், ஹடப்சர்",
            "workers": 6,
            "desc": "Commercial RCC slab casting and concrete shifting work. Concrete mixer and vibrator operator available."
        }
    ]

    all_jobs_to_seed = nearby_defs + extended_defs
    for item in all_jobs_to_seed:
        lat, lng = make_coords(item['dist'], item['angle'])
        item['latitude'] = lat
        item['longitude'] = lng
        item['employerId'] = 'emp-1'
        item['employerName'] = 'ABC Construction'
        item['status'] = 'Applications Open'
        insert_job(item)

    return get_geo_fenced_jobs(center_lat, center_lng)

# Initialize schema when module loads
init_db()
