"use strict";

// Storage and clipboard are optional; reading and downloading must remain usable.
const storage = {
  get(key) {
    try { return { ok: true, value: localStorage.getItem(key) }; }
    catch { return { ok: false, value: null }; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch { return false; }
  },
};

for (const snippet of document.querySelectorAll(".snippet")) {
  const code = snippet.querySelector("code");
  const caption = snippet.querySelector("figcaption");
  if (!code || !caption) continue;
  const button = document.createElement("button");

  button.type = "button";
  button.className = "copy";
  button.textContent = "Sao chép";
  button.setAttribute("aria-label", "Sao chép mã từ " + caption.textContent);
  caption.append(button);

  let resetLabel;
  button.addEventListener("click", async () => {
    clearTimeout(resetLabel);
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = "Đã sao chép";
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = "Nhấn Ctrl/Cmd+C";
    }
    resetLabel = setTimeout(() => {
      button.textContent = "Sao chép";
    }, 2500);
  });
}

for (const editor of document.querySelectorAll("[data-editor]")) {
  const textarea = editor.querySelector("textarea");
  const status = editor.querySelector(".editor-status");
  const starter = editor.querySelector("[data-starter]").content.textContent;
  const key = `backendlibs:draft:${editor.dataset.lesson}:v${editor.dataset.version}`;
  const saved = storage.get(key);
  if (saved.ok && saved.value !== null) {
    textarea.value = saved.value;
    status.textContent = "Đã khôi phục nháp trên trình duyệt này. Java/Spring chưa được chạy.";
  } else if (!saved.ok) {
    status.textContent = "Trình duyệt không cho lưu nháp. Dùng Tải mã để giữ nội dung.";
  }
  let codeEditor;
  let dirty = false;
  function save() {
    const ok = storage.set(key, textarea.value);
    if (ok) dirty = false;
    status.textContent = ok
      ? "Đã lưu nháp trên trình duyệt này. Đây chưa phải kết quả chạy code."
      : "Không lưu được nháp. Dùng Tải mã để giữ nội dung trước khi đóng trang.";
  }
  let saveTimer;
  textarea.addEventListener("input", () => {
    dirty = true;
    status.textContent = "Đang sửa; nháp sẽ tự lưu khi trình duyệt cho phép.";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 400);
  });
  textarea.addEventListener("change", save);
  window.addEventListener("pagehide", () => {
    clearTimeout(saveTimer);
    if (dirty) save();
  });
  editor.querySelector('[data-action="save"]').addEventListener("click", () => {
    clearTimeout(saveTimer);
    save();
  });
  editor.querySelector('[data-action="reset"]').addEventListener("click", () => {
    if (textarea.value !== starter && !window.confirm("Khôi phục starter sẽ thay nháp hiện tại. Bạn đã tải mã cần giữ chưa?")) return;
    clearTimeout(saveTimer);
    textarea.value = starter;
    codeEditor?.setValue(starter);
    save();
    if (codeEditor) codeEditor.focus();
    else textarea.focus();
  });
  editor.querySelector('[data-action="download"]').addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([textarea.value], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = editor.dataset.filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "Đã yêu cầu tải mã. Đưa vào project tương ứng để biên dịch và kiểm thử.";
  });
  if (window.BackendCodeEditor) {
    codeEditor = window.BackendCodeEditor.mount(textarea, editor.dataset.language);
  }
}

for (const form of document.querySelectorAll("[data-quiz]")) {
  form.addEventListener("submit", event => {
    event.preventDefault();
    const selected = form.querySelector("input:checked");
    const feedback = form.querySelector("[data-feedback]");
    if (!selected) {
      feedback.textContent = "Chọn một đáp án trước khi kiểm tra.";
      return;
    }
    const correct = selected.value === form.dataset.correct;
    feedback.textContent = (correct ? "Đúng. " : "Chưa đúng. ") + form.querySelector("[data-explanation]").content.textContent;
    feedback.dataset.result = correct ? "correct" : "incorrect";
  });
}

for (const checkbox of document.querySelectorAll("[data-complete]")) {
  const key = `backendlibs:complete:${checkbox.dataset.complete}`;
  checkbox.checked = storage.get(key).value === "true";
  checkbox.addEventListener("change", () => {
    const ok = storage.set(key, String(checkbox.checked));
    const message = document.querySelector("[data-progress-status]");
    if (message) message.textContent = ok ? "Đã lưu lựa chọn trên trình duyệt này." : "Trình duyệt không lưu được tiến độ; lựa chọn chỉ có trong trang đang mở.";
  });
}

function normalize(value) {
  return value.toLowerCase().replaceAll("đ", "d").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const search = document.querySelector("[data-search]");
if (search) {
  const cards = [...document.querySelectorAll("[data-lesson-card]")];
  const modules = [...document.querySelectorAll("[data-module]")];
  const status = document.querySelector("[data-search-status]");
  let completed = 0;
  for (const card of cards) {
    if (storage.get(`backendlibs:complete:${card.dataset.slug}`).value === "true") {
      completed += 1;
      card.querySelector(".lesson-state").textContent = "✓";
      card.querySelector(".lesson-state").setAttribute("aria-label", "Đã tự đánh dấu hoàn thành");
    }
  }
  document.querySelector("[data-course-progress]").textContent = `${completed} / ${cards.length} bài đã tự đánh dấu trên trình duyệt này.`;
  search.addEventListener("input", () => {
    const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    let count = 0;
    for (const card of cards) {
      const text = normalize(card.textContent);
      card.hidden = !terms.every(term => text.includes(term));
      if (!card.hidden) count += 1;
    }
    for (const module of modules) module.hidden = !module.querySelector("[data-lesson-card]:not([hidden])");
    status.textContent = count ? `Hiển thị ${count} / ${cards.length} bài.` : "Không tìm thấy bài phù hợp. Thử từ khóa khác.";
  });
}

if (window.Prism) Prism.highlightAll();
