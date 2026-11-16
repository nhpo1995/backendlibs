"use strict";

for (const snippet of document.querySelectorAll(".snippet")) {
  const code = snippet.querySelector("code");
  const caption = snippet.querySelector("figcaption");
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
