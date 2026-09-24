import urllib.request
import urllib.error
import json

API_BASE = 'https://d9nizxaxf9.execute-api.ap-south-1.amazonaws.com'
print('=' * 75)
print('HIREFLOW AI — STEP 2: ADD COMPANY + PLACEMENT DRIVE VERIFICATION')
print('=' * 75)

# TEST 1: GET /drives returns current drives
url_drives = f'{API_BASE}/drives'
with urllib.request.urlopen(url_drives) as resp:
    assert resp.status == 200, f'Expected 200, got {resp.status}'
    drives = json.loads(resp.read().decode('utf-8'))
    print(f'[PASS 1] GET /drives: 200 OK — Found {len(drives)} drives in live RDS')
    for d in drives:
        print(f"         - [{d['id']}] {d['role']} at {d['company']['name']} ({d['package']})")

# TEST 2: Verify TechNova Solutions exists in RDS drives
technova_drives = [d for d in drives if 'TechNova' in d['company']['name']]
print(f'[PASS 2] TechNova Solutions verified in RDS drives: {len(technova_drives)} drive(s)')
assert len(technova_drives) == 1, f"Expected 1 TechNova drive, got {len(technova_drives)}"
technova = technova_drives[0]
print(f"         Role: {technova['role']}")
print(f"         Company: {technova['company']['name']}")
print(f"         Package: {technova['package']}")
print(f"         Deadline: {technova['deadline']}")
print(f"         Drive Date: {technova.get('driveDate')}")

# TEST 3: GET /companies returns TechNova Solutions
url_comp = f'{API_BASE}/companies'
with urllib.request.urlopen(url_comp) as resp:
    assert resp.status == 200
    companies = json.loads(resp.read().decode('utf-8'))
    comp_names = [c['name'] for c in companies]
    print(f'[PASS 3] GET /companies: 200 OK — Companies: {comp_names}')
    assert 'TechNova Solutions' in comp_names, 'TechNova Solutions not in companies!'
    assert 'Accenture' in comp_names and 'Infosys' in comp_names

# TEST 4: Validation on missing required fields
req_bad = urllib.request.Request(
    f'{API_BASE}/drives',
    data=json.dumps({'companyName': 'Incomplete Corp'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
try:
    urllib.request.urlopen(req_bad)
    assert False, 'Expected 400 Bad Request'
except urllib.error.HTTPError as e:
    assert e.code == 400, f'Expected 400, got {e.code}'
    err_body = json.loads(e.read().decode('utf-8'))
    print(f"[PASS 4] Missing fields validation: 400 Bad Request correctly returned:")
    print(f"         Error message: {err_body.get('error')}")

# TEST 5: Duplicate Drive prevention
req_dup = urllib.request.Request(
    f'{API_BASE}/drives',
    data=json.dumps({
        'companyName': 'TechNova Solutions',
        'role': 'Full Stack Cloud Engineer',
        'jobDescription': 'Duplicate test',
        'package': '8.50 LPA',
        'location': 'Bengaluru',
        'deadline': '2026-11-20'
    }).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
try:
    urllib.request.urlopen(req_dup)
    assert False, 'Expected 409 Conflict'
except urllib.error.HTTPError as e:
    assert e.code == 409, f'Expected 409, got {e.code}'
    err_body = json.loads(e.read().decode('utf-8'))
    print(f"[PASS 5] Duplicate drive rejection: 409 Conflict correctly returned:")
    print(f"         Error message: {err_body.get('error')}")

# TEST 6: Existing /applications API regression check
url_apps = f'{API_BASE}/applications'
with urllib.request.urlopen(url_apps) as resp:
    assert resp.status == 200
    apps = json.loads(resp.read().decode('utf-8'))
    print(f'[PASS 6] Existing /applications API: 200 OK — {len(apps)} applications')

# TEST 7: Existing /preparation API regression check
url_prep = f'{API_BASE}/preparation?driveId=drive-infosys-01&category=technical'
with urllib.request.urlopen(url_prep) as resp:
    assert resp.status == 200
    prep = json.loads(resp.read().decode('utf-8'))
    print(f"[PASS 7] Existing /preparation API: 200 OK — Prep for {prep.get('company')}")

# TEST 8: Existing /resume/analyze Comprehend NLP check
req_comp = urllib.request.Request(
    f'{API_BASE}/resume/analyze',
    data=json.dumps({'resumeText': 'Python, SQL, AWS, Docker', 'jobDescription': 'Python, SQL, AWS, Docker'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req_comp) as resp:
    assert resp.status == 200
    comp = json.loads(resp.read().decode('utf-8'))
    print(f"[PASS 8] Existing /resume/analyze API: 200 OK — ATS Score: {comp.get('atsScore')}%")

print('=' * 75)
print('ALL 8 STEP 2 VERIFICATION TESTS PASSED 100%!')
print('=' * 75)
