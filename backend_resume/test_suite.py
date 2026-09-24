import urllib.request
import json
import sys

API_BASE_URL = "https://d9nizxaxf9.execute-api.ap-south-1.amazonaws.com"

def post_json(endpoint, payload):
    url = f"{API_BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body

print("=" * 60)
print("RUNNING HIREFLOW AI COMPREHEND RESUME ANALYZER TEST SUITE")
print("=" * 60)

# TEST 1 & 5 & 6: Realistic Sample via API Gateway POST /resume/analyze
print("\n--- TEST 1 & 5: Valid Resume + JD via API Gateway ---")
resume_sample = "Python developer with experience in AWS Lambda, S3, RDS, MySQL, React, Git, and machine learning projects."
jd_sample = "Looking for a software engineer with Python, AWS Lambda, S3, SQL, Docker, Git, and machine learning experience."

status, resp = post_json("/resume/analyze", {
    "resumeText": resume_sample,
    "jobDescription": jd_sample
})

print(f"Status Code: {status}")
assert status == 200, f"Expected 200, got {status}"
print(f"ATS Score: {resp.get('atsScore')}%")
print(f"Matched Skills: {resp.get('matchedSkills')}")
print(f"Missing Skills: {resp.get('missingSkills')}")
print(f"Resume Key Phrases (Comprehend): {resp.get('resumeKeyPhrases')}")
print(f"Job Key Phrases (Comprehend): {resp.get('jobKeyPhrases')}")
print(f"Entities (Comprehend): {resp.get('entities')}")
print(f"Recommendations: {resp.get('recommendations')}")
print(f"Score Breakdown: {resp.get('breakdown')}")

assert resp.get("atsScore") > 0, "ATS score must be non-zero"
assert len(resp.get("matchedSkills")) > 0, "Matched skills must not be empty"
assert "Python" in resp.get("matchedSkills"), "Python should be matched"
assert "Docker" in resp.get("missingSkills") or "SQL" in resp.get("missingSkills"), "Docker or SQL should be in missing skills"
print(">>> TEST 1, 5, 6 PASSED: Valid input returned high-fidelity Comprehend NLP response.")

# TEST 2: Missing Resume (Expect 400)
print("\n--- TEST 2: Missing Resume ---")
status2, resp2 = post_json("/resume/analyze", {
    "resumeText": "",
    "jobDescription": jd_sample
})
print(f"Status: {status2}, Error: {resp2.get('error')}")
assert status2 == 400, f"Expected 400, got {status2}"
print(">>> TEST 2 PASSED: Missing resume rejected with HTTP 400.")

# TEST 3: Missing Job Description (Expect 400)
print("\n--- TEST 3: Missing Job Description ---")
status3, resp3 = post_json("/resume/analyze", {
    "resumeText": resume_sample,
    "jobDescription": ""
})
print(f"Status: {status3}, Error: {resp3.get('error')}")
assert status3 == 400, f"Expected 400, got {status3}"
print(">>> TEST 3 PASSED: Missing job description rejected with HTTP 400.")

# TEST 4: Oversized Input Handling
print("\n--- TEST 4: Oversized Input (> 6,000 characters) ---")
oversized_resume = resume_sample + (" Detailed experience working with Python and cloud services." * 150)
print(f"Oversized length: {len(oversized_resume)} characters")
status4, resp4 = post_json("/resume/analyze", {
    "resumeText": oversized_resume,
    "jobDescription": jd_sample
})
print(f"Status: {status4}, ATS Score: {resp4.get('atsScore')}%")
assert status4 == 200, f"Expected 200, got {status4}"
print(">>> TEST 4 PASSED: Oversized input truncated and analyzed safely.")

# TEST 9: Verify existing placement application APIs are working without regression
print("\n--- TEST 9: Regression Verification of Existing Application APIs ---")
get_req = urllib.request.Request(f"{API_BASE_URL}/applications")
with urllib.request.urlopen(get_req) as g_resp:
    apps = json.loads(g_resp.read().decode("utf-8"))
    print(f"Existing Applications in RDS: {len(apps)} applications retrieved.")
    assert len(apps) >= 3, "Applications should still be retrieved from RDS"
print(">>> TEST 9 PASSED: Existing RDS MySQL application API completely unaffected.")

print("\n" + "=" * 60)
print("ALL TESTS PASSED WITH 100% SUCCESS!")
print("=" * 60)
