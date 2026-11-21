"use strict";
const $ = id => document.getElementById(id);
const kind = () => $("kind").value;
const api = () => "/api/" + kind();
const auth = () => "Basic " + btoa($("role").value + ":demo-pass");

async function request(url, method = "GET", data) {
    const headers = { Authorization: auth(), "Accept-Language": "vi" };
    if (method !== "GET") {
        const token = await fetch("/api/csrf", {headers}).then(async r => {
            if (!r.ok) throw new Error("Không lấy được CSRF token: " + r.status);
            return r.json();
        });
        headers[token.headerName] = token.token;
    }
    if (data !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetch(url, {method, headers, body: data === undefined ? undefined : JSON.stringify(data)});
    const text = await response.text();
    const body = text && response.headers.get("content-type")?.includes("json") ? JSON.parse(text) : text;
    return {status: response.status, ok: response.ok, body};
}

function show(result) {
    $("result").textContent = result.status + (result.body ? "\n" + JSON.stringify(result.body, null, 2) : "");
}

function cell(row, value, tag = "td") {
    const el = document.createElement(tag);
    el.textContent = value;
    row.append(el);
    return el;
}

async function load(showResult = true) {
    const target = api();
    const result = await request(target + "?" + new URLSearchParams({q: $("query").value}));
    if (target !== api()) return;
    if (showResult) show(result);
    const grid = $("rows");
    grid.replaceChildren();
    if (!result.ok) return;
    const groups = kind() === "groups";
    const headers = groups ? ["ID", "Tên group", "Thành viên", "Người tạo", "Ngày tạo", "Thao tác"] :
        ["ID", "Username", "Email", "Group ID", "Thao tác"];
    const head = grid.createTHead().insertRow();
    for (const name of headers) cell(head, name, "th").scope = "col";
    const tbody = grid.createTBody();
    for (const entry of result.body) {
        const row = tbody.insertRow();
        const values = groups ? [entry.id, entry.name, entry.memberCount, entry.creator, entry.createdAt] :
            [entry.id, entry.username, entry.email, entry.groupIds.join(", ")];
        values.forEach(value => cell(row, value));
        const actions = cell(row, "");
        const edit = document.createElement("button");
        edit.textContent = "Sửa";
        edit.onclick = () => {
            $("id").value = entry.id;
            $("name").value = groups ? entry.name : entry.username;
            $("email").value = entry.email ?? "";
            $("groupIds").value = entry.groupIds?.join(",") ?? "";
            $("name").focus();
        };
        const del = document.createElement("button");
        del.textContent = "Xóa";
        del.onclick = run(async () => {
            if (!confirm("Xóa bản ghi " + entry.id + " trong demo?")) return;
            const result = await request(target + "/" + entry.id, "DELETE");
            show(result);
            if (result.ok) { $("edit").reset(); await load(false); }
        });
        actions.append(edit, " ", del);
    }
}

function run(action) {
    return (...args) => Promise.resolve(action(...args)).catch(e => { $("result").textContent = e.message; });
}

$("search").onsubmit = run(async event => { event.preventDefault(); await load(); });
$("kind").onchange = run(async () => {
    const groups = kind() === "groups";
    $("account-fields").hidden = groups;
    $("name-label").firstChild.textContent = groups ? "Tên group " : "Username ";
    $("edit").reset();
    $("query").value = "";
    await load();
});
$("role").onchange = run(() => load());
$("edit").onsubmit = run(async event => {
    event.preventDefault();
    const id = $("id").value;
    let data = {name: $("name").value};
    if (kind() === "accounts") {
        const fields = $("groupIds").value.split(",").map(x => x.trim()).filter(Boolean);
        const groupIds = fields.map(Number);
        if (groupIds.some(n => !Number.isSafeInteger(n) || n < 1)) throw new Error("Group ID phải là số nguyên dương.");
        data = {username: $("name").value, email: $("email").value, groupIds};
    }
    const result = await request(api() + (id ? "/" + id : ""), id ? "PUT" : "POST", data);
    show(result);
    if (result.ok) { $("edit").reset(); await load(false); }
});
run(() => load())();
