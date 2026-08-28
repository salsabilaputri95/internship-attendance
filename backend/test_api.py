import json
import urllib.request
import urllib.error
import uuid

BASE_URL = "http://localhost:8080/api"

def make_request(url, method="GET", data=None, headers=None, is_json=True):
    req_headers = headers.copy() if headers else {}
    req_data = None

    if data is not None:
        if is_json:
            req_data = json.dumps(data).encode("utf-8")
            req_headers["Content-Type"] = "application/json"
        else:
            req_data = data

    req = urllib.request.Request(url, data=req_data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            return resp.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_body)
        except Exception:
            err_json = {"raw": err_body}
        return e.code, err_json

def make_multipart_request(url, fields, files, headers=None):
    boundary = uuid.uuid4().hex
    body = bytearray()

    for name, val in fields.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"))
        body.extend(f"{val}\r\n".encode("utf-8"))

    for name, (filename, filedata, content_type) in files.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode("utf-8"))
        body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
        body.extend(filedata)
        body.extend(b"\r\n")

    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    req_headers = headers.copy() if headers else {}
    req_headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"

    req = urllib.request.Request(url, data=bytes(body), headers=req_headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            return resp.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_body)
        except Exception:
            err_json = {"raw": err_body}
        return e.code, err_json

def run_tests():
    print("=== 1. TEST INTERN LOGIN ===")
    status, res = make_request(f"{BASE_URL}/auth/login", method="POST", data={
        "email": "salsabila@intern.bps.go.id",
        "password": "password123"
    })
    assert status == 200, f"Intern login failed: {res}"
    intern_token = res["data"]["token"]
    intern_name = res["data"]["user"]["name"]
    print(f"[OK] Intern Login Success: {intern_name} (Role: {res['data']['user']['role']})")
    intern_headers = {"Authorization": f"Bearer {intern_token}"}

    print("\n=== 2. TEST MENTOR LOGIN ===")
    status, res = make_request(f"{BASE_URL}/auth/login", method="POST", data={
        "email": "mentor@bps-jeneponto.go.id",
        "password": "password123"
    })
    assert status == 200, f"Mentor login failed: {res}"
    mentor_token = res["data"]["token"]
    mentor_name = res["data"]["user"]["name"]
    print(f"[OK] Mentor Login Success: {mentor_name} (Role: {res['data']['user']['role']})")
    mentor_headers = {"Authorization": f"Bearer {mentor_token}"}

    print("\n=== 3. TEST AUTH ME ===")
    status, res = make_request(f"{BASE_URL}/auth/me", method="GET", headers=intern_headers)
    assert status == 200, f"Auth me failed: {res}"
    print(f"[OK] Auth Me Success: {res['data']['name']} - Intern ID: {res['data']['intern_id']}")

    print("\n=== 4. TEST GEOFENCE REJECTION (GPS FAR AWAY > 100M) ===")
    dummy_photo = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
    status, res = make_multipart_request(
        f"{BASE_URL}/attendance/check-in",
        fields={
            "latitude": "-5.7100000",
            "longitude": "119.7350000",
            "accuracy": "10.0",
            "notes": "Test absensi jarak jauh"
        },
        files={
            "photo": ("selfie_far.jpg", dummy_photo, "image/jpeg")
        },
        headers=intern_headers
    )
    assert status == 422, f"Expected 422 for far location, got {status}: {res}"
    print(f"[OK] Correctly rejected by Geofence (HTTP 422): {res['message']}")

    print("\n=== 5. TEST CHECK-IN SUCCESS (INSIDE GEOFENCE < 100M) ===")
    status, res = make_multipart_request(
        f"{BASE_URL}/attendance/check-in",
        fields={
            "latitude": "-5.6987123",
            "longitude": "119.7289456",
            "accuracy": "5.0",
            "notes": "Presensi masuk tepat waktu"
        },
        files={
            "photo": ("selfie_masuk.jpg", dummy_photo, "image/jpeg")
        },
        headers=intern_headers
    )
    assert status == 200, f"Check-in failed: {res}"
    att_id = res["data"]["id"]
    print(f"[OK] Check-in Success! Status: {res['data']['status']}, Distance: {res['data']['check_in_distance']}m, Photo URL: {res['data']['check_in_photo_url']}")

    print("\n=== 6. TEST TODAY ATTENDANCE ENDPOINT ===")
    status, res = make_request(f"{BASE_URL}/attendance/today", method="GET", headers=intern_headers)
    assert status == 200, f"Get today attendance failed: {res}"
    print(f"[OK] Get Today Attendance: Status={res['data']['attendance']['status']}, Office={res['data']['office_location']['name']}")

    print("\n=== 7. TEST CHECK-OUT SUCCESS ===")
    status, res = make_multipart_request(
        f"{BASE_URL}/attendance/check-out",
        fields={
            "latitude": "-5.6987200",
            "longitude": "119.7289500",
            "accuracy": "6.0",
            "notes": "Presensi pulang magang"
        },
        files={
            "photo": ("selfie_pulang.jpg", dummy_photo, "image/jpeg")
        },
        headers=intern_headers
    )
    assert status == 200, f"Check-out failed: {res}"
    print(f"[OK] Check-out Success! Check-out Time: {res['data']['check_out']}, Photo URL: {res['data']['check_out_photo_url']}")

    print("\n=== 8. TEST MENTOR DASHBOARD ===")
    status, res = make_request(f"{BASE_URL}/mentor/dashboard", method="GET", headers=mentor_headers)
    assert status == 200, f"Mentor dashboard failed: {res}"
    stats = res["data"]["stats"]
    print(f"[OK] Mentor Dashboard Stats: Total Interns={stats['total_interns']}, Hadir={stats['hadir']}, Belum Hadir={stats['belum_hadir']}")

    print("\n=== 9. TEST MENTOR ATTENDANCE CORRECTION & AUDIT LOG ===")
    status, res = make_request(f"{BASE_URL}/mentor/attendance/{att_id}/correct", method="POST", data={
        "status": "HADIR",
        "reason": "Konfirmasi kehadiran fisik oleh mentor di seksi IPDS",
        "notes": "Koreksi terverifikasi oleh pembimbing"
    }, headers=mentor_headers)
    assert status == 200, f"Correction failed: {res}"
    print(f"[OK] Attendance Correction Saved! Message: {res['message']}")

    print("\n=== 10. TEST ATTENDANCE DETAIL WITH AUDIT TRAIL ===")
    status, res = make_request(f"{BASE_URL}/mentor/attendance/{att_id}", method="GET", headers=mentor_headers)
    assert status == 200, f"Detail failed: {res}"
    corrections = res["data"]["corrections"]
    assert len(corrections) > 0, "Expected at least 1 audit correction log"
    print(f"[OK] Verified Attendance Detail & Audit Log: Intern={res['data']['intern_name']}, Logs Count={len(corrections)}")
    print(f"     Log Detail: Reason='{corrections[0]['reason']}', CorrectedBy='{corrections[0]['mentor_name']}'")

    print("\n[SUCCESS] ALL 10 TEST SUITES PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    run_tests()
