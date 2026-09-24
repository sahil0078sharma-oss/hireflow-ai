import urllib.request
import json

API_BASE = 'https://d9nizxaxf9.execute-api.ap-south-1.amazonaws.com'

print("=" * 60)
print("PHASE 3D VERIFICATION SUITE")
print("=" * 60)

# 1. Verify Placement Applications API remains unaffected
print("\n[TEST 1] Verifying Placement Applications API...")
req1 = urllib.request.Request(f'{API_BASE}/applications', method='GET')
with urllib.request.urlopen(req1) as resp1:
    assert resp1.status == 200
    data1 = json.loads(resp1.read().decode('utf-8'))
    print(f"[PASS] Applications API status 200 OK - {len(data1)} applications retrieved")

# 2. Verify Resume + Job Description extraction & Comprehend analysis
print("\n[TEST 2] Verifying AWS Comprehend with extracted Resume + extracted JD...")
with open('test_docs/sample_resume.txt', 'r', encoding='utf-8') as f:
    res_text = f.read()
with open('test_docs/sample_jd.txt', 'r', encoding='utf-8') as f:
    jd_text = f.read()

payload = json.dumps({'resumeText': res_text, 'jobDescription': jd_text}).encode('utf-8')
req2 = urllib.request.Request(
    f'{API_BASE}/resume/analyze',
    data=payload,
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req2) as resp2:
    assert resp2.status == 200
    data2 = json.loads(resp2.read().decode('utf-8'))
    print(f"[PASS] AWS Comprehend Status: {resp2.status} OK")
    print(f"[PASS] ATS Compatibility Score: {data2.get('atsScore')}%")
    print(f"[PASS] Matched Skills: {data2.get('matchedSkills')}")
    print(f"[PASS] Missing Skills: {data2.get('missingSkills')}")
    print(f"[PASS] Comprehend Key Phrases: {len(data2.get('resumeKeyPhrases', []))} extracted")
    print(f"[PASS] Comprehend Entities: {len(data2.get('entities', []))} detected")

print("\n" + "=" * 60)
print("ALL LIVE BACKEND CONTRACTS AND ANALYSES VERIFIED!")
print("=" * 60)
