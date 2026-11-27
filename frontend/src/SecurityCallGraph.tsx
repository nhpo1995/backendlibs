import { useEffect, useRef, useState } from "react";
import type { SecurityGraph, SecurityNode } from "./securityCallGraphs";
import "./security-call-graph.css";

export function SecurityCallGraph({ graph, id, inline = false }: { graph: SecurityGraph; id: string; inline?: boolean }) {
  const [selected, setSelected] = useState(graph.steps[0]);
  const [copyState, setCopyState] = useState<{ node: SecurityNode; label: string }>();
  const inspector = useRef<HTMLDivElement>(null);
  const codeBlock = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeBlock.current) window.Prism?.highlightAllUnder(codeBlock.current);
  }, [selected]);

  function select(node: SecurityNode) {
    setSelected(node);
    setCopyState(undefined);
    if (window.matchMedia("(max-width: 720px)").matches) {
      inspector.current?.focus({ preventScroll: true });
      inspector.current?.scrollIntoView({ block: "nearest" });
    }
  }

  async function copyCode() {
    const code = codeBlock.current?.querySelector("code");
    try {
      await navigator.clipboard.writeText(selected.code);
      setCopyState({ node: selected, label: "Đã sao chép" });
    } catch {
      if (!code?.isConnected) return;
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      setCopyState({ node: selected, label: "Nhấn Ctrl/Cmd+C" });
    }
  }

  function nodeButton(node: SecurityNode) {
    return (
      <button type="button" className="security-node" aria-label={node.name}
        aria-pressed={selected === node} aria-controls={`${id}-inspector`}
        onClick={() => select(node)}>
        <span>{node.kind}</span>
        <strong>{node.name}</strong>
        <code>{node.method}</code>
      </button>
    );
  }

  return (
    <section className={inline ? "security-call-graph" : "chapter security-call-graph"} id={id}
      aria-label={inline ? graph.title : undefined} aria-labelledby={inline ? undefined : `${id}-title`}>
      {!inline && <h2 id={`${id}-title`}>{graph.title}</h2>}
      <p>{graph.context}</p>
      <div className="security-graph-layout">
        <ol className="security-graph-path" id={`${id}-classes`} aria-label="Luồng gọi chính">
          {graph.steps.map((node) => (
            <li key={node.name}>
              {node.via && <div className="security-edge"><span aria-hidden="true">↓</span> {node.via}</div>}
              {nodeButton(node)}
              {node.calls && (
                <ul className="security-graph-calls" aria-label={`Các lời gọi tại ${node.name}`}>
                  {node.calls.map((call) => (
                    <li key={call.name}>
                      <div className="security-branch-edge"><span aria-hidden="true">↳</span> {call.via}</div>
                      {nodeButton(call)}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
        <div ref={inspector} className="security-call-inspector" id={`${id}-inspector`}
          tabIndex={-1} aria-labelledby={`${id}-component`}>
          <p className="security-node-kind">{selected.kind}</p>
          <h3 id={`${id}-component`}>{selected.name}</h3>
          <dl>
            <dt>Nhận vào</dt><dd>{selected.input}</dd>
            <dt>Xử lý</dt><dd>{selected.behavior}</dd>
            <dt>Trả về hoặc gọi tiếp</dt><dd>{selected.output}</dd>
          </dl>
          <figure className="snippet" ref={codeBlock} key={selected.name}>
            <figcaption>
              {selected.framework ? "Java · lược đồ cơ chế Spring Security" : "Java · đoạn cấu hình hoặc mã ứng dụng"}
              <button className="copy" type="button" onClick={copyCode}>
                {copyState?.node === selected ? copyState.label : "Sao chép"}
              </button>
            </figcaption>
            <pre tabIndex={0}><code className="language-java">{selected.code}</code></pre>
          </figure>
          <a className="security-graph-back" href={`#${id}-classes`}>Về sơ đồ</a>
        </div>
      </div>
    </section>
  );
}
