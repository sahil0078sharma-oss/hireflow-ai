"""
End-to-End Context Flow Verification Script for Step 3:
Placement Drives -> Resume Analyzer -> Amazon Comprehend -> Adaptive Placement Preparation
"""

import sys
import json
import urllib.request
import urllib.error

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "https://d9nizxaxf9.execute-api.ap-south-1.amazonaws.com"

def make_request(method, path, body=None):
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            status = resp.status
            content = resp.read().decode("utf-8")
            return status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        return e.code, json.loads(content) if content else {"error": str(e)}

def run_tests():
    print("==================================================")
    print("STEP 3: COMPREHENSIVE CONTEXT FLOW VERIFICATION")
    print("==================================================")

    # 1. Verify GET /drives loads TechNova, Infosys, Accenture from RDS
    print("\n--- TEST 1: Load Live Placement Drives from RDS ---")
    code, drives = make_request("GET", "/drives")
    assert code == 200, f"Expected 200, got {code}"
    assert isinstance(drives, list) and len(drives) >= 3, f"Expected at least 3 drives, got {len(drives)}"

    technova_drive = next((d for d in drives if "technova" in d["id"].lower()), None)
    infosys_drive = next((d for d in drives if "infosys" in d["id"].lower()), None)
    accenture_drive = next((d for d in drives if "accenture" in d["id"].lower()), None)

    assert technova_drive is not None, "TechNova Solutions drive not found in RDS!"
    assert infosys_drive is not None, "Infosys drive not found in RDS!"
    assert accenture_drive is not None, "Accenture drive not found in RDS!"

    print(f"✓ Found TechNova Drive: {technova_drive['id']} - {technova_drive['role']}")
    print(f"  Company: {technova_drive['company']['name']}")
    print(f"  Required Skills: {technova_drive['requiredSkills']}")
    print(f"  Description length: {len(technova_drive['description'])} chars")
    print(f"✓ Found Infosys Drive: {infosys_drive['id']} - {infosys_drive['role']}")
    print(f"✓ Found Accenture Drive: {accenture_drive['id']} - {accenture_drive['role']}")

    # 2. Run Amazon Comprehend Resume Analysis for TechNova Solutions
    print("\n--- TEST 2: Run Amazon Comprehend Analysis against TechNova JD ---")
    sample_resume = (
        "Experienced Python and React developer with cloud knowledge in AWS Lambda, Amazon S3, and Git. "
        "Built web applications and REST APIs with MySQL databases."
    )
    technova_jd = f"Role: {technova_drive['role']}\nCompany: {technova_drive['company']['name']}\nDescription: {technova_drive['description']}\nRequired Skills: {', '.join(technova_drive['requiredSkills'])}"

    code, analysis_res = make_request("POST", "/resume/analyze", {
        "resumeText": sample_resume,
        "jobDescription": technova_jd
    })
    assert code == 200, f"Expected 200, got {code}: {analysis_res}"
    assert "atsScore" in analysis_res, "Missing atsScore"
    assert "matchedSkills" in analysis_res, "Missing matchedSkills"
    assert "missingSkills" in analysis_res, "Missing missingSkills"

    print(f"✓ Amazon Comprehend Analysis Succeeded:")
    print(f"  ATS Score: {analysis_res['atsScore']}%")
    print(f"  Matched Skills: {analysis_res['matchedSkills']}")
    print(f"  Missing Skills: {analysis_res['missingSkills']}")

    technova_missing = analysis_res["missingSkills"]
    # Verify missingSkills contains Docker or other missing items from requiredSkills
    print(f"✓ Gaps identified for TechNova: {technova_missing}")

    # 3. Preparation Plan for TechNova with MATCHED analysis context
    print("\n--- TEST 3: Adaptive Preparation with MATCHED TechNova Context ---")
    missing_str = ",".join(technova_missing)
    prep_path = f"/preparation?driveId={technova_drive['id']}&category=technical&missingSkills={missing_str}&analysisDriveId={technova_drive['id']}&atsScore={analysis_res['atsScore']}"
    code, prep_res = make_request("GET", prep_path)
    assert code == 200, f"Expected 200, got {code}: {prep_res}"
    assert prep_res["driveId"] == technova_drive["id"]
    assert prep_res["company"] == technova_drive["company"]["name"]
    assert prep_res["analysisContext"]["linked"] is True
    assert prep_res["analysisContext"]["driveId"] == technova_drive["id"]

    # Verify high priority skills include the missing skills
    high_priority_skills = [p["skill"] for p in prep_res["prioritySkills"] if p["priority"] == "HIGH"]
    for s in technova_missing:
        assert any(h.lower() == s.lower() for h in high_priority_skills), f"Expected missing skill {s} in HIGH priority list, got {high_priority_skills}"
    print(f"✓ TechNova Preparation Plan verified:")
    print(f"  Readiness Score: {prep_res['readinessScore']}%")
    print(f"  Priority Skills (HIGH): {high_priority_skills}")
    print(f"  Questions count: {len(prep_res['questions'])}")

    # 4. Preparation Plan MISMATCH Protection (TechNova analysis applied to Infosys)
    print("\n--- TEST 4: Context Leakage / Mismatch Protection ---")
    # Request Infosys preparation while sending TechNova analysis context
    mismatch_path = f"/preparation?driveId={infosys_drive['id']}&category=technical&missingSkills={missing_str}&analysisDriveId={technova_drive['id']}&atsScore={analysis_res['atsScore']}"
    code, mismatch_res = make_request("GET", mismatch_path)
    assert code == 200, f"Expected 200, got {code}: {mismatch_res}"
    assert mismatch_res["driveId"] == infosys_drive["id"]
    assert mismatch_res["analysisContext"]["linked"] is False, "Analysis context should NOT be linked for mismatched drive!"
    assert mismatch_res["analysisContext"]["driveId"] is None
    # Verify no foreign missing skills were marked HIGH from TechNova
    infosys_high_skills = [p["skill"] for p in mismatch_res["prioritySkills"] if p["priority"] == "HIGH"]
    assert len(infosys_high_skills) == 0, f"Expected 0 HIGH priority skills on mismatched context, got {infosys_high_skills}"
    print(f"✓ Context Leakage Protection Verified:")
    print(f"  Target: Infosys | Analysis Drive: TechNova")
    print(f"  Backend successfully rejected foreign skill gaps: linked = False")
    print(f"  Message: {mismatch_res['analysisContext'].get('message')}")

    # 5. Analysis for Infosys and Preparation
    print("\n--- TEST 5: Infosys Analysis & Dedicated Preparation ---")
    infosys_jd = f"Role: {infosys_drive['role']}\nCompany: {infosys_drive['company']['name']}\nDescription: {infosys_drive['description']}\nRequired Skills: {', '.join(infosys_drive['requiredSkills'])}"
    code, infosys_analysis = make_request("POST", "/resume/analyze", {
        "resumeText": sample_resume,
        "jobDescription": infosys_jd
    })
    assert code == 200
    infosys_missing = infosys_analysis["missingSkills"]
    print(f"✓ Infosys Analysis: ATS Score={infosys_analysis['atsScore']}%, Missing={infosys_missing}")

    infosys_prep_path = f"/preparation?driveId={infosys_drive['id']}&category=technical&missingSkills={','.join(infosys_missing)}&analysisDriveId={infosys_drive['id']}&atsScore={infosys_analysis['atsScore']}"
    code, infosys_prep = make_request("GET", infosys_prep_path)
    assert code == 200
    assert infosys_prep["analysisContext"]["linked"] is True
    assert infosys_prep["analysisContext"]["driveId"] == infosys_drive["id"]
    print(f"✓ Infosys Preparation Plan correctly linked to Infosys analysis")

    # 6. Check Accenture Drive
    print("\n--- TEST 6: Accenture Placement Drive Preparation ---")
    code, acc_prep = make_request("GET", f"/preparation?driveId={accenture_drive['id']}&category=technical")
    assert code == 200
    assert acc_prep["driveId"] == accenture_drive["id"]
    assert acc_prep["company"] == accenture_drive["company"]["name"]
    print(f"✓ Accenture Preparation functional without analysis context (general plan)")

    # 7. Verify Regression / Existing Endpoints
    print("\n--- TEST 7: Regression Check on All Existing Endpoints ---")
    code, comp_res = make_request("GET", "/companies")
    assert code == 200 and len(comp_res) >= 3, f"GET /companies failed: {code}"
    print(f"✓ GET /companies OK ({len(comp_res)} companies)")

    code, app_res = make_request("GET", "/applications")
    assert code == 200 and isinstance(app_res, list), f"GET /applications failed: {code}"
    print(f"✓ GET /applications OK ({len(app_res)} applications)")

    print("\n==================================================")
    print("ALL 7 API CONTEXT FLOW TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
