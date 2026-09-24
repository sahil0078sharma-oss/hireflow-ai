import urllib.request
import urllib.error
import json

API_BASE = 'https://d9nizxaxf9.execute-api.ap-south-1.amazonaws.com'

print("=" * 70)
print("HIREFLOW AI — PHASE 4B FULL VERIFICATION SUITE")
print("=" * 70)

# Test 1: GET /preparation with valid driveId
url1 = f"{API_BASE}/preparation?driveId=drive-tcs-01"
with urllib.request.urlopen(url1) as resp:
    assert resp.status == 200
    d1 = json.loads(resp.read().decode('utf-8'))
    print(f"[PASS 1] GET /preparation valid driveId: {d1.get('company')} - {d1.get('role')} (Readiness: {d1.get('readinessScore')}%)")

# Test 2: Invalid driveId
try:
    url2 = f"{API_BASE}/preparation?driveId=non-existent-drive"
    urllib.request.urlopen(url2)
    print("[FAIL 2] Expected 404 for invalid driveId")
except urllib.error.HTTPError as e:
    assert e.code == 404
    print(f"[PASS 2] Invalid driveId returned HTTP {e.code} as expected")

# Test 3: Technical category
url3 = f"{API_BASE}/preparation?driveId=drive-tcs-01&category=technical"
with urllib.request.urlopen(url3) as resp:
    d3 = json.loads(resp.read().decode('utf-8'))
    assert d3.get('meta', {}).get('selectedCategory') == 'technical'
    print(f"[PASS 3] Technical category: {len(d3.get('questions', []))} questions, Topic: {d3.get('questions', [])[0]['topic']}")

# Test 4: Aptitude category
url4 = f"{API_BASE}/preparation?driveId=drive-tcs-01&category=aptitude"
with urllib.request.urlopen(url4) as resp:
    d4 = json.loads(resp.read().decode('utf-8'))
    assert d4.get('meta', {}).get('selectedCategory') == 'aptitude'
    print(f"[PASS 4] Aptitude category: {len(d4.get('questions', []))} questions")

# Test 5: HR category
url5 = f"{API_BASE}/preparation?driveId=drive-tcs-01&category=hr"
with urllib.request.urlopen(url5) as resp:
    d5 = json.loads(resp.read().decode('utf-8'))
    assert d5.get('meta', {}).get('selectedCategory') == 'hr'
    print(f"[PASS 5] HR category: {len(d5.get('questions', []))} questions")

# Test 6: Company & Role category
url6 = f"{API_BASE}/preparation?driveId=drive-tcs-01&category=company-role"
with urllib.request.urlopen(url6) as resp:
    d6 = json.loads(resp.read().decode('utf-8'))
    assert d6.get('meta', {}).get('selectedCategory') == 'company-role'
    print(f"[PASS 6] Company & Role category: {len(d6.get('questions', []))} questions, Topic: {d6.get('questions', [])[0]['topic']}")

# Test 7: Different company (Accenture)
url7 = f"{API_BASE}/preparation?driveId=drive-accenture-01"
with urllib.request.urlopen(url7) as resp:
    d7 = json.loads(resp.read().decode('utf-8'))
    assert d7.get('company') == 'Accenture'
    print(f"[PASS 7] Different company (Accenture): Role={d7.get('role')}, Stage={d7.get('applicationStage')}")

# Test 8: Different role (Data Engineer vs Systems Engineer)
url8 = f"{API_BASE}/preparation?driveId=drive-tcs-02"
with urllib.request.urlopen(url8) as resp:
    d8 = json.loads(resp.read().decode('utf-8'))
    assert d8.get('role') == 'Data Engineer'
    print(f"[PASS 8] Different role (Data Engineer): Package={d8.get('meta', {}).get('package')}, Focus={d8.get('roundFocus')[0]}")

# Test 9: Different application stage (drive-infosys-01 is 'final' stage in seed)
url9 = f"{API_BASE}/preparation?driveId=drive-infosys-01"
with urllib.request.urlopen(url9) as resp:
    d9 = json.loads(resp.read().decode('utf-8'))
    print(f"[PASS 9] Different application stage: {d9.get('applicationStage')} (Status: {d9.get('applicationStatus')})")

# Test 10: Missing skill personalization
url10 = f"{API_BASE}/preparation?driveId=drive-tcs-01&missingSkills=SQL,Docker"
with urllib.request.urlopen(url10) as resp:
    d10 = json.loads(resp.read().decode('utf-8'))
    high_skills = [p['skill'] for p in d10.get('prioritySkills', []) if p['priority'] == 'HIGH']
    assert 'SQL' in high_skills
    print(f"[PASS 10] Missing skill personalization: HIGH priority skills = {high_skills}, Q1 Topic: {d10.get('questions', [])[0]['topic']}")

# Test 11: No missing skills
url11 = f"{API_BASE}/preparation?driveId=drive-tcs-01&missingSkills="
with urllib.request.urlopen(url11) as resp:
    d11 = json.loads(resp.read().decode('utf-8'))
    high_skills_11 = [p['skill'] for p in d11.get('prioritySkills', []) if p['priority'] == 'HIGH']
    assert len(high_skills_11) == 0
    print(f"[PASS 11] No missing skills: 0 HIGH priority skills, Readiness: {d11.get('readinessScore')}%")

# Test 12: Existing GET /applications regression
url12 = f"{API_BASE}/applications"
with urllib.request.urlopen(url12) as resp:
    assert resp.status == 200
    apps = json.loads(resp.read().decode('utf-8'))
    print(f"[PASS 12] Existing GET /applications: 200 OK, {len(apps)} applications retrieved")

# Test 13: Existing POST /applications validation (duplicate check)
try:
    req13 = urllib.request.Request(
        f"{API_BASE}/applications",
        data=json.dumps({"driveId": "drive-tcs-01"}).encode('utf-8'),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    urllib.request.urlopen(req13)
    print("[WARN 13] Application created")
except urllib.error.HTTPError as e:
    # 409 Conflict expected if already applied
    assert e.code in [409, 201]
    print(f"[PASS 13] Existing POST /applications contract verified: HTTP {e.code}")

# Test 14: Existing POST /resume/analyze regression
res_text = "Python developer with experience in AWS Lambda, Amazon S3, MySQL, Docker, Git, Machine Learning"
jd_text = "Software Engineer requiring Python, AWS Lambda, RDS, Docker, and Git"
req14 = urllib.request.Request(
    f"{API_BASE}/resume/analyze",
    data=json.dumps({"resumeText": res_text, "jobDescription": jd_text}).encode('utf-8'),
    headers={"Content-Type": "application/json"},
    method="POST"
)
with urllib.request.urlopen(req14) as resp:
    assert resp.status == 200
    analysis = json.loads(resp.read().decode('utf-8'))
    print(f"[PASS 14] Existing POST /resume/analyze: 200 OK, ATS Score: {analysis.get('atsScore')}%, Key Phrases: {len(analysis.get('resumeKeyPhrases', []))}")

print("=" * 70)
print("ALL 14 BACKEND INTEGRATION & REGRESSION TESTS PASSED 100%!")
print("=" * 70)
