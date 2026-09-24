import urllib.request
import json

API_BASE = 'https://d9nizxaxf9.execute-api.ap-south-1.amazonaws.com'

print("=" * 70)
print("HIREFLOW AI — PHASE 4C CONTEXT BINDING VERIFICATION")
print("=" * 70)

# TEST 1: Matching Drive Analysis (Infosys Digital Specialist Engineer)
# driveId: drive-infosys-02, analysisDriveId: drive-infosys-02, missingSkills: Docker,MongoDB
url1 = f"{API_BASE}/preparation?driveId=drive-infosys-02&category=technical&missingSkills=Docker,MongoDB&analysisDriveId=drive-infosys-02&atsScore=72"
with urllib.request.urlopen(url1) as resp:
    data1 = json.loads(resp.read().decode('utf-8'))
    ctx1 = data1.get("analysisContext", {})
    high_skills1 = [p["skill"] for p in data1.get("prioritySkills", []) if p["priority"] == "HIGH"]
    print(f"[PASS TEST 1] Matching Analysis (Infosys):")
    print(f"  - analysisContext.linked: {ctx1.get('linked')}")
    print(f"  - analysisContext.driveId: {ctx1.get('driveId')}")
    print(f"  - HIGH priority skills applied: {high_skills1}")
    assert ctx1.get('linked') == True
    assert 'Docker' in high_skills1 or 'MongoDB' in high_skills1

# TEST 2: Context Isolation / Mismatched Analysis (Paarsiv analysis on Infosys drive)
# driveId: drive-infosys-02, analysisDriveId: custom-paarsiv, missingSkills: Angular,CSharp
url2 = f"{API_BASE}/preparation?driveId=drive-infosys-02&category=technical&missingSkills=Angular,CSharp&analysisDriveId=custom-paarsiv&atsScore=55"
with urllib.request.urlopen(url2) as resp:
    data2 = json.loads(resp.read().decode('utf-8'))
    ctx2 = data2.get("analysisContext", {})
    high_skills2 = [p["skill"] for p in data2.get("prioritySkills", []) if p["priority"] == "HIGH"]
    print(f"[PASS TEST 2] Mismatched Analysis (Paarsiv gaps on Infosys):")
    print(f"  - analysisContext.linked: {ctx2.get('linked')} (Correctly rejected)")
    print(f"  - analysisContext.message: {ctx2.get('message')}")
    print(f"  - HIGH priority skills: {high_skills2} (No cross-drive contamination)")
    assert ctx2.get('linked') == False
    assert len(high_skills2) == 0

# TEST 3: Switching Drive (TCS with no analysis)
url3 = f"{API_BASE}/preparation?driveId=drive-tcs-01&category=technical"
with urllib.request.urlopen(url3) as resp:
    data3 = json.loads(resp.read().decode('utf-8'))
    ctx3 = data3.get("analysisContext", {})
    print(f"[PASS TEST 3] TCS Drive without Analysis:")
    print(f"  - analysisContext.linked: {ctx3.get('linked')}")
    print(f"  - Company: {data3.get('company')} | Role: {data3.get('role')}")
    assert ctx3.get('linked') == False

# TEST 4: Regression Test on Live Placement & Comprehend Endpoints
req_apps = urllib.request.Request(f"{API_BASE}/applications", method="GET")
with urllib.request.urlopen(req_apps) as resp_apps:
    apps_data = json.loads(resp_apps.read().decode('utf-8'))
    print(f"[PASS TEST 4] Applications API: 200 OK, {len(apps_data)} applications")

req_comp = urllib.request.Request(
    f"{API_BASE}/resume/analyze",
    data=json.dumps({"resumeText": "Python, AWS, SQL", "jobDescription": "Python, AWS, SQL, Docker"}).encode('utf-8'),
    headers={"Content-Type": "application/json"},
    method="POST"
)
with urllib.request.urlopen(req_comp) as resp_comp:
    comp_data = json.loads(resp_comp.read().decode('utf-8'))
    print(f"[PASS TEST 5] Comprehend Resume Analyzer: 200 OK, ATS Score: {comp_data.get('atsScore')}%")

print("=" * 70)
print("ALL CONTEXT BINDING & ISOLATION TESTS PASSED 100%!")
print("=" * 70)
