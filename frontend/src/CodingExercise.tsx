import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { mount } from "../../assets/editor-entry.js";
import { read, write } from "./storage";
import { Article } from "./Article";
import type { Lesson } from "./types";
import type { ComparisonResult } from "./codeComparison";

const escape = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function CodingExercise({ lesson }: { lesson: Lesson }) {
  const { lab, slug } = lesson;
  const key = `backendlibs:draft:${slug}:v1`;
  const initial = useRef(read(key) ?? lab.starter);
  const draft = useRef(initial.current);
  const input = useRef<HTMLTextAreaElement>(null);
  const widget = useRef<ReturnType<typeof mount> | null>(null);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const comparisonRevision = useRef(0);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(
    read(key) !== null
      ? "Đã khôi phục nháp trên trình duyệt này."
      : "Nháp tự lưu khi trình duyệt cho phép. Không nhập mật khẩu hoặc token thật.",
  );
  const filename = lab.language === "yaml" ? "application.yaml" : lab.filename;
  function save() {
    const ok = write(key, draft.current);
    if (ok) dirty.current = false;
    setStatus(
      ok
        ? "Đã lưu nháp trên trình duyệt này. Đây chưa phải kết quả chạy code."
        : "Không lưu được nháp. Dùng Tải mã để giữ nội dung trước khi đóng trang.",
    );
  }
  useEffect(() => {
    const textarea = input.current!;
    let disposed = false;
    import("../../assets/editor-entry.js")
      .then(({ mount }) => {
        if (!disposed) widget.current = mount(textarea, lab.language);
      })
      .catch(() => {
        if (!disposed)
          setStatus(
            "Chưa tải được màu cú pháp; bạn vẫn có thể nhập mã, lưu nháp và tải file.",
          );
      });
    const changed = () => {
      draft.current = textarea.value;
      comparisonRevision.current++;
      setComparison(null);
      setChecking(false);
      dirty.current = true;
      setStatus("Đang sửa; nháp sẽ tự lưu khi trình duyệt cho phép.");
      clearTimeout(timer.current);
      timer.current = setTimeout(save, 400);
    };
    const flush = () => {
      clearTimeout(timer.current);
      if (dirty.current) {
        if (write(key, draft.current)) dirty.current = false;
      }
    };
    textarea.addEventListener("input", changed);
    window.addEventListener("pagehide", flush);
    return () => {
      disposed = true;
      comparisonRevision.current++;
      flush();
      textarea.removeEventListener("input", changed);
      window.removeEventListener("pagehide", flush);
      widget.current?.destroy();
      widget.current = null;
    };
  }, [key, lab.language]);
  return (
    <section className="chapter coding-lab" id="bai-tap-code">
      <p className="eyebrow">Tự viết trước khi xem lời giải</p>
      <h2>Bài tập lập trình</h2>
      <p>{lab.goal}</p>
      {lab.instructions && <p className="exercise-instructions"><strong>Cách sửa starter:</strong> {lab.instructions}</p>}
      <p>
        <strong>Tiêu chí kiểm chứng:</strong> {lab.expected}
      </p>
      <p>
        Gõ code trực tiếp trong editor. Java/Spring chạy và kiểm thử trong
        project local. Tab để thụt lề, Shift+Tab để lùi lề; Enter tự thụt dòng.
        {" "}{lab.comparison === "manual" ? "Ghi kế hoạch và kết quả kiểm chứng vào phần TODO." : "Thay chú thích TODO bằng implementation của bạn."}
      </p>
      <p className="reading">
        {lab.comparison === "manual" ? "Bài này tự nghiệm thu theo hướng dẫn và kết quả thực hành; nút Kiểm tra không chấm độ giống của phần giải thích." : <>Nút Kiểm tra đối chiếu toàn bộ đoạn code với lời giải, bỏ qua định dạng và chú thích. Nội
        dung chuỗi ký tự và cấu trúc YAML vẫn có ý nghĩa. Kết quả không thay thế
        biên dịch/kiểm thử; một cách triển khai khác có thể đúng dù chưa khớp
        mẫu.</>}
      </p>
      <div className="editor" data-editor data-lesson={slug}>
        <label htmlFor={`editor-${slug}`}>Mã của bạn · {filename}</label>
        <textarea
          ref={input}
          id={`editor-${slug}`}
          defaultValue={initial.current}
          spellCheck={false}
          rows={10}
        />
        <div className="editor-actions">
          <button
            type="button"
            data-action="check"
            disabled={checking}
            onClick={async () => {
              const revision = ++comparisonRevision.current;
              const actual = draft.current;
              setChecking(true);
              setComparison(null);
              try {
                const { compareCode } = await import("./codeComparison");
                if (revision !== comparisonRevision.current) return;
                setComparison(
                  compareCode({
                    actual,
                    expected: lab.solution,
                    language: lab.language,
                    starter: lab.starter,
                    mode: lab.comparison,
                  }),
                );
              } catch {
                if (revision === comparisonRevision.current)
                  setComparison({
                    kind: "invalid",
                    message:
                      "Chưa tải được bộ đối chiếu. Nháp của bạn vẫn được giữ; hãy thử lại.",
                  });
              } finally {
                if (revision === comparisonRevision.current) setChecking(false);
              }
            }}
          >
            Kiểm tra
          </button>
          <button
            type="button"
            data-action="save"
            onClick={() => {
              clearTimeout(timer.current);
              save();
            }}
          >
            Lưu nháp
          </button>
          <button
            type="button"
            data-action="download"
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([draft.current], { type: "text/plain;charset=utf-8" }),
              );
              const link = document.createElement("a");
              link.href = url;
              link.download = filename;
              document.body.append(link);
              link.click();
              link.remove();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              setStatus(
                "Đã yêu cầu tải mã. Đưa vào project tương ứng để biên dịch và kiểm thử.",
              );
            }}
          >
            Tải mã
          </button>
          <button
            type="button"
            data-action="reset"
            onClick={() => {
              if (
                draft.current !== lab.starter &&
                !confirm(
                  "Khôi phục starter sẽ thay nháp hiện tại. Bạn đã tải mã cần giữ chưa?",
                )
              )
                return;
              clearTimeout(timer.current);
              draft.current = lab.starter;
              comparisonRevision.current++;
              setComparison(null);
              setChecking(false);
              input.current!.value = lab.starter;
              widget.current?.setValue(lab.starter);
              save();
              widget.current?.focus();
            }}
          >
            Khôi phục starter
          </button>
        </div>
        <p className="editor-status" role="status" aria-live="polite">
          {status}
        </p>
        <p
          className="code-check-feedback"
          data-code-check-result={comparison?.kind}
          role="status"
          aria-live="polite"
          aria-busy={checking}
        >
          {checking ? "Đang đối chiếu code…" : comparison?.message}
        </p>
      </div>
      <details>
        <summary>Gợi ý cách làm và tự kiểm tra</summary>
        <p>
          Ghi dữ liệu ban đầu, dự đoán đầu ra, rồi thử trường hợp đúng và lỗi.{" "}
          {lab.expected}
        </p>
      </details>
      <details className="solution">
        <summary>Lời giải tham khảo · mở sau khi tự làm</summary>
        <Article
          html={`<figure class="snippet"><figcaption>${escape(filename)} · tham khảo</figcaption><pre tabindex="0"><code class="language-${escape(lab.language)}">${escape(lab.solution)}</code></pre></figure>`}
        />
      </details>
      <p>
        <Link to="/practice/spring-foundations/index.html">
          Starter Maven, đề theo mốc và bộ kiểm thử chạy local →
        </Link>
      </p>
    </section>
  );
}
