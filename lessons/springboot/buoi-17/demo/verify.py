"""Verify the documented contracts against a freshly started demo (Python 3)."""
import base64
import json
import sys
from urllib.error import HTTPError
from urllib.request import Request, urlopen

base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8117"
count = 0

def req(path, status=200, method="GET", data=None, user="admin", lang=None, session=None):
    global count
    headers = {}
    if user:
        credentials = user if ":" in user else user + ":demo-pass"
        headers["Authorization"] = "Basic " + base64.b64encode(credentials.encode()).decode()
    if lang:
        headers["Accept-Language"] = lang
    if session:
        headers.update(session)
    if data is not None:
        headers["Content-Type"] = "application/json"
        data = (data if isinstance(data, str) else json.dumps(data)).encode()
    try:
        response = urlopen(Request(base + path, data, headers, method=method), timeout=10)
    except HTTPError as exc:
        response = exc
    with response:
        body = response.read()
        assert response.status == status, (method, path, status, response.status, body[:500])
        count += 1
        return (json.loads(body) if "json" in response.headers.get("Content-Type", "") else body), response.headers

def get(path):
    return req("/api/" + path)[0]

assert req("/api/groups", 401, user=None)[1]["WWW-Authenticate"].startswith("Basic")
req("/api/groups", 401, user="admin:wrong")
req("/api/whoami", user="reader")
req("/api/ops", 403, user="reader")
assert req("/api/ops")[0]["username"] == "admin"
assert b"Group" in req("/ui.html", user=None)[0]
assert b"function" in req("/lab-ui.js", user=None)[0]

token, h = req("/api/csrf")
session = {"Cookie": h["Set-Cookie"].split(";")[0], token["headerName"]: token["token"]}
req("/api/groups", 403, "POST", {"name":"Docs"})
req("/api/groups", 403, "POST", {"name":"Docs"}, user="reader", session=session)
def write(path, status, method, data=None, lang=None):
    return req("/api/" + path, status, method, data, lang=lang, session=session)[0]

assert [x["id"] for x in get("members/find?prefix=an&mode=derived")] == [1,2]
assert get("members/find?prefix=an&mode=jpql") == get("members/find?prefix=an&mode=native")
assert get("members/find?prefix=%25&mode=derived") == get("members/find?prefix=%25&mode=jpql") == []
assert [x["id"] for x in get("members/between?min=20&max=25")] == [1,2]
assert get("members/by-age?age=25") == get("members/jpql-by-age?age=25")
assert get("members/by-name?name=AN") == get("members/native-by-name?name=AN")
assert write("members/rename",200,"PATCH",{"prefix":"an","newName":"An mới"}) == {"affected":2}
assert write("members/rename",200,"PATCH",{"prefix":"xyz","newName":"No match"}) == {"affected":0}
assert get("members/find?prefix=an&mode=derived")[0]["firstName"] == "An mới"
assert write("members/purge?beforeAge=19",200,"DELETE") == {"affected":1}

a,b = [get("products/page?page=2&size=2&mode=" + m) for m in ("jpa","sql")]
assert a == b and [x["id"] for x in a["items"]] == [3,4]
assert a["totalPages"] == 3 and a["totalElements"] == 6
assert get("products/page?page=4&size=2")["items"] == []
assert [x["id"] for x in get("products/page?page=1&size=2&order=price")["items"]] == [1,6]
req("/api/products/page?page=0",400)
req("/api/products/page?size=101",400)
req("/api/products/page?page=oops",400)
req("/api/products/page?order=arbitrary",400)
assert get("products/summary") == get("products/mapped")
assert len(get("products/summary")[0]) == 2
assert [x["id"] for x in get("products?name=lap&minPrice=200&maxPrice=350&color=BLACK&status=ACTIVE")["items"]] == [3]
assert get("products?name=absent")["totalPages"] == 0
req("/api/products?minPrice=5&maxPrice=2",400)
req("/api/products?status=unknown",400)
assert get("products?name=%25")["items"] == []

groups = get("groups")
assert [(g["name"],g["memberCount"]) for g in groups] == [("Backend",2),("Ops",1),("Empty",0)]
assert [x["id"] for x in get("groups?q=BACK")] == [1]
assert get("groups?q=%25") == []
created, created_headers = req("/api/groups",201,"POST",{"name":"Platform"},session=session)
gid = created["id"]
assert created_headers["Location"] == f"/api/groups/{gid}"
assert req(created_headers["Location"])[0] == created
assert created["memberCount"] == 0 and created["creator"] == "admin" and created["createdAt"].endswith("Z")
assert write("groups",409,"POST",{"name":"Platform"})["code"] == "CONFLICT"
assert write("groups/999",404,"PUT",{"name":"Xyz"})["code"] == "NOT_FOUND"
assert write(f"groups/{gid}",400,"PUT",{"id":1,"name":"Renamed"})["code"] == "INVALID_JSON"
assert write(f"groups/{gid}",200,"PUT",{"name":"Renamed"})["name"] == "Renamed"
assert get("groups?q=Backend")[0]["id"] == 1

assert write("groups",400,"POST",{"name":" "}, "vi")["errors"][0]["message"] == "Tên là bắt buộc."
assert write("groups",400,"POST",{"name":" "}, "en")["errors"][0]["message"] == "Name is required."
assert write("groups",415,"POST",None)["code"] == "UNSUPPORTED_MEDIA_TYPE"
assert write("groups",400,"POST","{")["code"] == "INVALID_JSON"
assert write("groups",400,"POST","")["code"] == "INVALID_JSON"
assert write("registration-check",400,"POST",{})["code"] == "VALIDATION_FAILED"
good = {"username":"student_1","password":"Sample+1234","email":"student@example.test",
        "fullName":"Student One","phoneNumber":"0912345678","birthDate":"2000-01-01",
        "address":"Ha Noi","acceptPolicy":True,"gender":"UNSPECIFIED",
        "securityQuestion":"S1","securityAnswer":"demo"}
assert write("registration-check",200,"POST",good) == {"valid":True}
assert write("registration-check",400,"POST",dict(good,password="alllowercase"))["errors"][0]["field"] == "password"
assert write("registration-check",400,"POST",dict(good,birthDate="9999-01-01"))["errors"][0]["field"] == "birthDate"
err = write("registration-check",400,"POST",dict(good,acceptPolicy=None))
assert err["errors"][0]["field"] == "acceptPolicy" and "Sample+1234" not in str(err)

assert [x["id"] for x in get("accounts?q=lin")] == [2]
assert "email" in get("accounts")[0] and "password" not in str(get("accounts"))
assert write("accounts",404,"POST",{"username":"new_user","email":"new@example.test","groupIds":[999]})["code"] == "NOT_FOUND"
assert get("accounts?q=new_user") == []
a = write("accounts",201,"POST",{"username":"new_user","email":"new@example.test","groupIds":[1,gid,1]})
aid = a["id"]
assert a["groupIds"] == [1,gid]
assert write(f"accounts/{aid}",404,"PUT",{"username":"new_name","email":"new@example.test","groupIds":[999]})["code"] == "NOT_FOUND"
assert get("accounts?q=new_user")[0]["groupIds"] == [1,gid]
assert write(f"accounts/{aid}",200,"PUT",{"username":"new_user","email":"new@example.test","groupIds":[gid]})["groupIds"] == [gid]
assert [x["memberCount"] for x in get("groups?q=Renamed")] == [1]
assert write(f"groups/{gid}",204,"DELETE") == b""
assert not get("groups?q=Renamed") and get("accounts?q=new_user")[0]["groupIds"] == []
assert write(f"accounts/{aid}",204,"DELETE") == b""
assert not get("accounts?q=new_user")
e,_ = req("/api/lab/failure",500)
assert e["code"] == "INTERNAL_ERROR" and "trace" not in e and "synthetic" not in str(e)
print(f"{count} HTTP responses checked")
