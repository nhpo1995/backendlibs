import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    Prism?: { highlightAllUnder(element: Element): void };
  }
}

/** Trusted repository-authored HTML only. Learner input never enters innerHTML. */
export function Article({ html, children }: { html: string; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [slot, setSlot] = useState<{ html: string; element: Element }>();
  const markup = useMemo(() => ({ __html: html }), [html]);
  const hasSlot = Boolean(children);
  const navigate = useNavigate();
  useEffect(() => {
    const root = ref.current!;
    window.Prism?.highlightAllUnder(root);
    const cleanups: (() => void)[] = [];
    for (const snippet of root.querySelectorAll(".snippet")) {
      const code = snippet.querySelector("code");
      const caption = snippet.querySelector("figcaption");
      if (!code || !caption) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy";
      button.textContent = "Sao chép";
      button.setAttribute(
        "aria-label",
        `Sao chép mã từ ${caption.textContent}`,
      );
      let timer: ReturnType<typeof setTimeout>;
      const copy = async () => {
        clearTimeout(timer);
        try {
          await navigator.clipboard.writeText(code.textContent ?? "");
          button.textContent = "Đã sao chép";
        } catch {
          const range = document.createRange();
          range.selectNodeContents(code);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          button.textContent = "Nhấn Ctrl/Cmd+C";
        }
        timer = setTimeout(() => {
          button.textContent = "Sao chép";
        }, 2500);
      };
      button.addEventListener("click", copy);
      caption.append(button);
      cleanups.push(() => {
        clearTimeout(timer);
        button.removeEventListener("click", copy);
        button.remove();
      });
    }
    return () => cleanups.forEach((clean) => clean());
  }, [html]);
  useEffect(() => {
    if (!hasSlot) return;
    const element = ref.current?.querySelector("[data-article-slot]");
    if (element) setSlot({ html, element });
  }, [html, hasSlot]);
  return (
    <>
    <div
      ref={ref}
      dangerouslySetInnerHTML={markup}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        const anchor = (event.target as Element).closest<HTMLAnchorElement>(
          "a[href]",
        );
        if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
        const url = new URL(anchor.href);
        const base = import.meta.env.BASE_URL;
        if (url.origin !== location.origin || !url.pathname.startsWith(base))
          return;
        const route = url.pathname.slice(base.length - 1);
        if (
          route === "/" ||
          route === "/index.html" ||
          /^\/(lessons\/springboot|practice\/(spring-foundations|reference-directory))\/.*index\.html$/.test(
            route,
          )
        ) {
          event.preventDefault();
          navigate(route + url.search + url.hash);
        }
      }}
    />
    {children && slot?.html === html && createPortal(children, slot.element)}
    </>
  );
}
