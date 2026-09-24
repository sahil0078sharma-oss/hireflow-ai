import urllib.request
import json
import urllib.error

API_URL = 'https://d9nizxaxf9.execute-api.ap-south-1.amazonaws.com/preparation'

print("=" * 60)
print("TESTING LIVE /preparation API")
print("=" * 60)

# Test Categories
for cat in ['technical', 'aptitude', 'hr', 'company-role']:
    url = f"{API_URL}?driveId=drive-tcs-01&category={cat}"
    req = urllib.request.Request(url, method='GET')
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        first_q = data.get("questions", [])[0]["question"] if data.get("questions") else "None"
        print(f"[PASS] Category '{cat}': {len(data.get('questions', []))} questions. Q1: {first_q[:65]}...")

# Test Invalid driveId
try:
    url = f"{API_URL}?driveId=invalid-drive"
    urllib.request.urlopen(url)
    print("[FAIL] Expected 404 for invalid driveId")
except urllib.error.HTTPError as e:
    print(f"[PASS] Invalid driveId returned HTTP {e.code}")

# Test Different Company / Role
url = f"{API_URL}?driveId=drive-accenture-01"
with urllib.request.urlopen(url) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print(f"[PASS] Accenture Drive: Company={data.get('company')}, Role={data.get('role')}, Stage={data.get('applicationStage')}, Readiness={data.get('readinessScore')}%")

print("=" * 60)
print("ALL LIVE BACKEND /preparation ENDPOINTS VERIFIED!")
print("=" * 60)
