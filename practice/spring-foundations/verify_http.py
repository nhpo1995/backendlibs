"""Live HTTP verification. Run against the completed local lab; no mock server."""
import argparse
import base64
import http.cookiejar
import json
import uuid
from urllib.error import HTTPError
from urllib.request import build_opener, HTTPCookieProcessor, Request


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://127.0.0.1:8181")
    args = parser.parse_args()
    jar = http.cookiejar.CookieJar()
    client = build_opener(HTTPCookieProcessor(jar))
    count = 0

    def request(method, route, expected, user=None, body=None, token=None):
        nonlocal count
        headers = {"Accept": "application/json"}
        if user:
            headers["Authorization"] = "Basic " + base64.b64encode(user.encode()).decode()
        if token:
            headers[token["headerName"]] = token["token"]
        data = None if body is None else json.dumps(body).encode()
        if data is not None:
            headers["Content-Type"] = "application/json"
        try:
            result = client.open(Request(args.base + route, data=data, headers=headers, method=method), timeout=10)
        except HTTPError as error:
            result = error
        with result:
            status, response_headers, payload = result.status, result.headers, result.read()
        assert status == expected, f"{method} {route}: expected {expected}, got {status}: {payload[:200]!r}"
        count += 1
        return response_headers, json.loads(payload) if payload else None

    admin, reader = "admin:demo-pass", "reader:demo-pass"
    request("GET", "/api/groups", 401)
    request("GET", "/api/groups", 401, "reader:wrong")
    _, before = request("GET", "/api/groups", 200, reader)
    _, token = request("GET", "/api/csrf", 200, admin)
    request("POST", "/api/groups", 403, admin, {"name": "No token"})
    request("POST", "/api/groups", 403, reader, {"name": "Denied"}, token)
    request("POST", "/api/groups", 400, admin, {"name": " "}, token)
    _, unchanged = request("GET", "/api/groups", 200, reader)
    assert unchanged == before, "Rejected requests changed data"
    name = "HTTP-" + uuid.uuid4().hex[:12]
    location = None
    try:
        headers, created = request("POST", "/api/groups", 201, admin, {"name": " " + name + " "}, token)
        candidate = headers["Location"]
        assert isinstance(created.get("id"), int) and created["id"] > 0
        assert created["id"] not in {group["id"] for group in before}, "POST returned an existing group identity"
        assert candidate == f"/api/groups/{created['id']}", "Location does not match the created identity"
        assert created["name"] == name
        _, read = request("GET", candidate, 200, reader)
        assert read == created
        # Cleanup is authorized only for the newly created, read-back-verified row.
        # A broken learner implementation may return Location of an existing seed.
        location = candidate
        request("POST", "/api/groups", 409, admin, {"name": name}, token)
        _, updated = request("PUT", location, 200, admin, {"name": name + "-renamed"}, token)
        assert updated["id"] == created["id"] and updated["name"] == name + "-renamed"
        request("DELETE", location, 204, admin, token=token)
        request("GET", location, 404, reader)
        location = None
    finally:
        if location:
            request("DELETE", location, 204, admin, token=token)
    _, after = request("GET", "/api/groups", 200, reader)
    assert after == before, "Lab did not restore its data"
    print(f"PASS: {count} live HTTP responses; rejected requests unchanged, CRUD verified and created group cleaned up.")


if __name__ == "__main__":
    main()
