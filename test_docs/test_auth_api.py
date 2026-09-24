"""
Test suite for HireFlow Student Authentication API (POST /auth/login, GET /auth/me, POST /auth/logout)
"""

import sys
import json
import urllib.request
import urllib.error

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "https://d9nizxaxf9.execute-api.ap-south-1.amazonaws.com"

def make_request(method, path, body=None, token=None):
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            status = resp.status
            content = resp.read().decode("utf-8")
            return status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = {"error": content}
        return e.code, parsed

def run_tests():
    print("==================================================")
    print("TESTING HIREFLOW STUDENT AUTHENTICATION API")
    print("==================================================")

    # 1. Invalid Email
    print("\n--- TEST 1: Invalid Email Fails ---")
    status, res = make_request("POST", "/auth/login", {
        "email": "nonexistent@aryacollege.in",
        "password": "AnyPassword123!"
    })
    print(f"Status: {status}, Response: {res}")
    assert status == 401, f"Expected 401, got {status}"
    assert "Invalid email or password." in res.get("error", "")
    print("✓ Invalid email correctly rejected with sanitized message.")

    # 2. Invalid Password
    print("\n--- TEST 2: Invalid Password Fails ---")
    status, res = make_request("POST", "/auth/login", {
        "email": "sahil.sharma@aryacollege.in",
        "password": "WrongPassword123"
    })
    print(f"Status: {status}, Response: {res}")
    assert status == 401, f"Expected 401, got {status}"
    assert "Invalid email or password." in res.get("error", "")
    print("✓ Invalid password correctly rejected with sanitized message.")

    # 3. Valid Login
    print("\n--- TEST 3: Valid Demo Student Login ---")
    status, res = make_request("POST", "/auth/login", {
        "email": "sahil.sharma@aryacollege.in",
        "password": "Arya@Placement2026"
    })
    print(f"Status: {status}, Token: {res.get('token')}")
    print(f"Student: {json.dumps(res.get('student'), indent=2)}")
    assert status == 200, f"Expected 200, got {status}: {res}"
    assert res.get("success") is True
    assert "token" in res and res["token"].startswith("hf-sess-")

    student = res.get("student", {})
    assert student.get("name") == "Sahil Sharma", f"Expected Sahil Sharma, got {student.get('name')}"
    assert student.get("college") == "Arya College of Engineering", f"Expected Arya College, got {student.get('college')}"
    assert student.get("branch") == "CSE", f"Expected CSE, got {student.get('branch')}"
    assert float(student.get("cgpa", 0)) == 8.0, f"Expected 8.0, got {student.get('cgpa')}"
    token = res["token"]
    print("✓ Valid login succeeded with complete student profile!")

    # 4. Session Validation (GET /auth/me)
    print("\n--- TEST 4: Validate Session Token (GET /auth/me) ---")
    status, me_res = make_request("GET", "/auth/me", token=token)
    print(f"Status: {status}, Profile: {me_res.get('student', {}).get('name')}")
    assert status == 200, f"Expected 200, got {status}: {me_res}"
    assert me_res.get("authenticated") is True
    assert me_res.get("student", {}).get("name") == "Sahil Sharma"
    print("✓ Session token validated successfully.")

    # 5. Authenticated Applications Retrieval (GET /applications)
    print("\n--- TEST 5: Fetch Applications for Authenticated Student ---")
    status, apps_res = make_request("GET", "/applications", token=token)
    print(f"Status: {status}, Applications count: {len(apps_res)}")
    assert status == 200, f"Expected 200, got {status}: {apps_res}"
    assert isinstance(apps_res, list)
    print("✓ Applications retrieved for authenticated student context.")

    # 6. Logout (POST /auth/logout)
    print("\n--- TEST 6: Logout (POST /auth/logout) ---")
    status, logout_res = make_request("POST", "/auth/logout", token=token)
    print(f"Status: {status}, Response: {logout_res}")
    assert status == 200, f"Expected 200, got {status}"
    assert logout_res.get("success") is True
    print("✓ Logout succeeded.")

    # 7. Post-logout Token Revocation
    print("\n--- TEST 7: Revoked Token Fails (GET /auth/me) ---")
    status, me_after = make_request("GET", "/auth/me", token=token)
    print(f"Status: {status}, Response: {me_after}")
    assert status == 401, f"Expected 401 after logout, got {status}"
    print("✓ Revoked session token correctly rejected.")

    print("\n==================================================")
    print("ALL AUTHENTICATION API TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
