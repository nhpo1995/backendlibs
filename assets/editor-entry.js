import { basicSetup, EditorView } from "codemirror";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { java } from "@codemirror/lang-java";
import { yaml } from "@codemirror/lang-yaml";
import { StreamLanguage, indentUnit, indentService, syntaxTree } from "@codemirror/language";
import { powerShell } from "@codemirror/legacy-modes/mode/powershell";
import { oneDark } from "@codemirror/theme-one-dark";

/** Enhance the existing form control; it remains the source for draft/download. */
export function mount(textarea, language) {
  const host = document.createElement("div");
  host.className = "code-input";
  textarea.before(host);
  const label = document.querySelector(`label[for="${textarea.id}"]`);
  if (label && !label.id) label.id = `${textarea.id}-label`;
  const languages = { java: java, yaml: yaml, powershell: () => StreamLanguage.define(powerShell) };
  let silent = false;
  const view = new EditorView({
    parent: host,
    doc: textarea.value,
    extensions: [
      basicSetup,
      indentUnit.of("    "),
      keymap.of([indentWithTab]),
      // Supply missing Enter indentation for an unfinished YAML key and the
      // PowerShell stream mode. Leave Java and existing syntax rules in charge.
      indentService.of((context, pos) => {
        if (context.simulatedBreak !== pos || !["yaml", "powershell"].includes(language)) return undefined;
        const line = context.lineAt(pos, -1);
        let end = line.from + line.text.trimEnd().length;
        let node = syntaxTree(context.state).resolveInner(end, -1);
        if (/comment/i.test(node.name) && node.from >= line.from) {
          end = node.from;
          while (end > line.from && /\s/.test(context.state.doc.sliceString(end - 1, end))) end--;
          node = syntaxTree(context.state).resolveInner(end, -1);
        }
        if (end <= line.from) return undefined;
        if (/string|comment|quoted|literalcontent/i.test(node.name)) return undefined;
        const last = context.state.doc.sliceString(end - 1, end);
        if ((language === "yaml" && node.name === ":") ||
            (language === "powershell" && /[({\[]/.test(last)))
          return context.lineIndent(line.from, -1) + context.unit;
        return undefined;
      }),
      oneDark,
      languages[language]?.() ?? [],
      EditorView.contentAttributes.of({
        ...(label ? { "aria-labelledby": label.id } : { "aria-label": "Mã của bạn" }),
        spellcheck: "false",
        autocapitalize: "off",
      }),
      EditorView.theme({
        "&": { backgroundColor: "#12251f", color: "#edf4e8" },
        ".cm-scroller": { fontFamily: '"IBM Plex Mono", Consolas, monospace', fontSize: ".88rem", lineHeight: "1.65" },
        ".cm-content": { padding: "14px 0", caretColor: "#d7f97b" },
        ".cm-line": { padding: "0 12px" },
        ".cm-gutters": { backgroundColor: "#1a332a", color: "#93aa9b", borderRight: "1px solid #365043" },
        ".cm-activeLineGutter": { backgroundColor: "#294539" },
        ".cm-activeLine": { backgroundColor: "#ffffff08" },
        "&.cm-focused .cm-cursor": { borderLeftColor: "#d7f97b" },
      }, { dark: true }),
      EditorView.updateListener.of(update => {
        if (!update.docChanged) return;
        textarea.value = update.state.doc.toString();
        if (!silent) textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }),
    ],
  });
  textarea.hidden = true;
  const focus = () => view.focus();
  label?.addEventListener("click", focus);
  return {
    setValue(value) {
      if (value === view.state.doc.toString()) return;
      silent = true;
      try { view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } }); }
      finally { silent = false; }
    },
    focus() { view.focus(); },
    destroy() { label?.removeEventListener("click", focus); view.destroy(); host.remove(); textarea.hidden = false; },
  };
}
