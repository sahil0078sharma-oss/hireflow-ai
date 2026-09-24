import urllib.request
import json

API_BASE = 'https://d9nizxaxf9.execute-api.ap-south-1.amazonaws.com'
print('=' * 70)
print('HIREFLOW AI — STEP 1 VERIFICATION TEST SUITE (RDS LIVE DRIVES)')
print('=' * 70)

# Test 1: GET /drives returns exactly the 2 database drives
url_drives = f'{API_BASE}/drives'
with urllib.request.urlopen(url_drives) as resp:
    assert resp.status == 200, f'Expected 200, got {resp.status}'
    drives = json.loads(resp.read().decode('utf-8'))
    print(f'[PASS 1] GET /drives: 200 OK — Returned {len(drives)} drives')
    assert len(drives) == 2, f'Expected 2 drives, got {len(drives)}'
    
    company_names = {d['company']['name'] for d in drives}
    print(f'         Companies in drives: {company_names}')
    assert 'TCS' not in company_names, 'TCS should not be in drives!'
    assert company_names == {'Accenture', 'Infosys'}, f'Expected Accenture and Infosys, got {company_names}'
    
    for d in drives:
        print(f"         - [{d['id']}] {d['role']} at {d['company']['name']} ({d['package']})")
        assert 'company' in d, 'Drive missing company enrichment'
        assert d['company']['avatar'] in ['ACN', 'INF'], f"Unexpected avatar {d['company']['avatar']}"

# Test 2: GET /companies returns live RDS companies
url_companies = f'{API_BASE}/companies'
with urllib.request.urlopen(url_companies) as resp:
    assert resp.status == 200
    companies = json.loads(resp.read().decode('utf-8'))
    comp_names = [c['name'] for c in companies]
    print(f'[PASS 2] GET /companies: 200 OK — Companies: {comp_names}')
    assert len(companies) == 2, f'Expected 2 companies, got {len(companies)}'
    assert 'TCS' not in comp_names, 'TCS found in companies!'
    assert set(comp_names) == {'Accenture', 'Infosys'}

# Test 3: Existing Application API regression check
url_apps = f'{API_BASE}/applications'
with urllib.request.urlopen(url_apps) as resp:
    assert resp.status == 200
    apps = json.loads(resp.read().decode('utf-8'))
    print(f'[PASS 3] GET /applications: 200 OK — Applications count: {len(apps)}')
    app_companies = {a['company']['name'] for a in apps}
    print(f'         Application companies: {app_companies}')
    assert 'TCS' not in app_companies, 'TCS found in applications!'

# Test 4: Existing Adaptive Preparation API regression check
url_prep = f'{API_BASE}/preparation?driveId=drive-infosys-01&category=technical'
with urllib.request.urlopen(url_prep) as resp:
    assert resp.status == 200
    prep = json.loads(resp.read().decode('utf-8'))
    print(f"[PASS 4] GET /preparation: 200 OK — Prep for {prep.get('company')} ({prep.get('role')}): {len(prep.get('questions', []))} questions")
    assert prep.get('company') == 'Infosys'

# Test 5: Resume Analyzer Comprehend API regression check
req_comp = urllib.request.Request(
    f'{API_BASE}/resume/analyze',
    data=json.dumps({'resumeText': 'Python, SQL, AWS', 'jobDescription': 'Python, SQL, AWS'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req_comp) as resp:
    assert resp.status == 200
    comp = json.loads(resp.read().decode('utf-8'))
    print(f"[PASS 5] POST /resume/analyze: 200 OK — ATS Score: {comp.get('atsScore')}%")

print('=' * 70)
print('ALL 5 BACKEND & INTEGRATION TESTS PASSED 100%!')
print('=' * 70)
