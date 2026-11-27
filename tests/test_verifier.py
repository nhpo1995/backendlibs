"""Exercise the verifier against a faulty implementation, with no real lab data."""
import base64
import http.server
import json
from pathlib import Path
import subprocess
import sys
import threading
import unittest

ROOT = Path(__file__).resolve().parents[1]


class VerifierSafetyTest(unittest.TestCase):
    def test_wrong_location_never_authorizes_deleting_seed(self):
        records = [{"id": 1, "name": "Backend"}, {"id": 2, "name": "Ops"}]
        deleted = []

        class Handler(http.server.BaseHTTPRequestHandler):
            def log_message(self, *_):
                pass

            def respond(self, status, payload=None, location=None):
                body = b"" if payload is None else json.dumps(payload).encode()
                self.send_response(status)
                self.send_header("Content-Type", "application/json")
                if location:
                    self.send_header("Location", location)
                self.end_headers()
                self.wfile.write(body)

            def user(self):
                auth = self.headers.get("Authorization", "")
                return base64.b64decode(auth.split(" ")[-1]).decode() if auth else ""

            def do_GET(self):
                if self.user() not in {"admin:demo-pass", "reader:demo-pass"}:
                    return self.respond(401)
                if self.path == "/api/csrf":
                    return self.respond(200, {"headerName": "X-CSRF-TOKEN", "token": "test"})
                if self.path == "/api/groups":
                    return self.respond(200, records)
                group = next((row for row in records if str(row["id"]) == self.path.rsplit("/", 1)[-1]), None)
                return self.respond(200 if group else 404, group)

            def do_POST(self):
                if not self.headers.get("X-CSRF-TOKEN") or self.user().startswith("reader:"):
                    return self.respond(403)
                data = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
                if not data["name"].strip():
                    return self.respond(400)
                created = {"id": 3, "name": data["name"].strip()}
                records.append(created)
                # Common learner bug: insert works, response points to a seed row.
                return self.respond(201, created, "/api/groups/1")

            def do_DELETE(self):
                ident = int(self.path.rsplit("/", 1)[-1])
                deleted.append(ident)
                records[:] = [row for row in records if row["id"] != ident]
                self.respond(204)

        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            result = subprocess.run([sys.executable, str(ROOT / "practice/spring-foundations/verify_http.py"),
                                     "--base", f"http://127.0.0.1:{server.server_port}"], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0, "Broken Location must not pass verification")
            self.assertNotIn(1, deleted, "Verifier deleted Backend because it trusted broken Location")
            self.assertEqual(records[:2], [{"id": 1, "name": "Backend"}, {"id": 2, "name": "Ops"}])
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == "__main__":
    unittest.main()
