import { javaLanguage } from "@codemirror/lang-java";
import { yamlLanguage } from "@codemirror/lang-yaml";

export type ComparisonMode = "whole" | "addition" | "manual";
export type ComparisonKind =
  | "match"
  | "different"
  | "empty"
  | "manual"
  | "unsupported"
  | "invalid";
export interface ComparisonResult {
  kind: ComparisonKind;
  message: string;
}
interface Input {
  actual: string;
  expected: string;
  language: string;
  starter?: string;
  mode?: ComparisonMode;
}

type SyntaxNode = ReturnType<typeof javaLanguage.parser.parse>["topNode"];
interface Normalized {
  signature: string;
  tokens: string[];
}

/** Whitespace is ignored between syntax nodes, never inside a literal leaf. */
function syntax(source: string, language: "java" | "yaml"): Normalized {
  const tree = (language === "java" ? javaLanguage : yamlLanguage).parser.parse(
    source,
  );
  const parts: string[] = [],
    tokens: string[] = [];
  function gap(from: number, to: number) {
    const value = source.slice(from, to).replace(/\s/g, "");
    if (value) {
      parts.push(JSON.stringify(value));
      tokens.push(value);
    }
  }
  function visit(node: SyntaxNode) {
    if (/comment/i.test(node.name)) {
      const text = source.slice(node.from, node.to);
      if (language === "java" && text.startsWith("/*") && !text.endsWith("*/"))
        throw new Error("Unclosed comment");
      return;
    }
    const child = node.firstChild;
    if (!child) {
      const text = source.slice(node.from, node.to);
      if (!text.trim()) {
        if (node.type.isError) parts.push("<error>");
        return;
      }
      parts.push(node.name, JSON.stringify(text));
      tokens.push(text);
      return;
    }
    parts.push(`(${node.name}`);
    let position = node.from;
    for (let item: SyntaxNode | null = child; item; item = item.nextSibling) {
      gap(position, item.from);
      visit(item);
      position = item.to;
    }
    gap(position, node.to);
    parts.push(")");
  }
  visit(tree.topNode);
  return { signature: JSON.stringify(parts), tokens };
}

/** Java tokens for a reference fragment inserted into unchanged starter context. */
function javaTokens(source: string): string[] {
  const tokens: string[] = [];
  const identifier =
    /^[\p{L}\p{Nl}\p{Sc}\p{Pc}][\p{L}\p{N}\p{Sc}\p{Pc}\p{M}\p{Cf}]*/u;
  const operator =
    /^(?:>>>=|<<=|>>=|>>>|>>|<<|\+\+|--|&&|\|\||==|!=|<=|>=|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|->|::|\.\.\.)/;
  for (let i = 0; i < source.length; ) {
    if (/\s/.test(source[i])) {
      i++;
      continue;
    }
    if (source.startsWith("//", i)) {
      const end = source.indexOf("\n", i);
      i = end < 0 ? source.length : end;
      continue;
    }
    if (source.startsWith("/*", i)) {
      const end = source.indexOf("*/", i + 2);
      if (end < 0) throw new Error("Unclosed comment");
      i = end + 2;
      continue;
    }
    if (source[i] === '"' || source[i] === "'") {
      const start = i,
        delimiter = source.startsWith('"""', i) ? '"""' : source[i];
      i += delimiter.length;
      let closed = false;
      while (i < source.length) {
        if (source[i] === "\\") {
          i += 2;
          continue;
        }
        if (source.startsWith(delimiter, i)) {
          i += delimiter.length;
          closed = true;
          break;
        }
        i++;
      }
      if (!closed) throw new Error("Unclosed literal");
      tokens.push(source.slice(start, i));
      continue;
    }
    const word =
      source.slice(i).match(identifier)?.[0] ??
      source.slice(i).match(/^\d[\w.]*/)?.[0] ??
      source.slice(i).match(operator)?.[0];
    if (word) {
      tokens.push(word);
      i += word.length;
    } else tokens.push(source[i++]);
  }
  return tokens;
}

/** Preserve PowerShell command boundaries and quoted/bare arguments. */
function powerShellTokens(source: string): string[] {
  const tokens: string[] = [];
  let i = 0,
    parentheses = 0;
  const endStatement = () => {
    if (tokens.length && tokens.at(-1) !== "<statement>")
      tokens.push("<statement>");
  };
  while (i < source.length) {
    const ch = source[i];
    if (ch === "`" && /^(?:\r\n|\n)/.test(source.slice(i + 1))) {
      i += source[i + 1] === "\r" ? 3 : 2;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (!parentheses) endStatement();
      i++;
      continue;
    }
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "#") {
      const end = source.indexOf("\n", i);
      i = end < 0 ? source.length : end;
      continue;
    }
    if (source.startsWith("<#", i)) {
      const end = source.indexOf("#>", i + 2);
      if (end < 0) throw new Error("Unclosed comment");
      i = end + 2;
      continue;
    }
    if (ch === "'" || ch === '"') {
      const start = i++,
        quote = ch;
      let closed = false;
      while (i < source.length) {
        if (quote === '"' && source[i] === "`") {
          i += 2;
          continue;
        }
        if (source[i] === quote) {
          if (source[i + 1] === quote) {
            i += 2;
            continue;
          }
          i++;
          closed = true;
          break;
        }
        i++;
      }
      if (!closed) throw new Error("Unclosed literal");
      tokens.push(source.slice(start, i));
      continue;
    }
    if (ch === ";") {
      endStatement();
      i++;
      continue;
    }
    if ("(){}[]=,+*".includes(ch)) {
      if (ch === "(") parentheses++;
      if (ch === ")") parentheses = Math.max(0, parentheses - 1);
      tokens.push(ch);
      i++;
      continue;
    }
    const start = i;
    const url = /^(?:https?|ftp):\/\//i.test(source.slice(i));
    while (
      i < source.length &&
      !/\s/.test(source[i]) &&
      !"'\"(){}[]".includes(source[i]) &&
      (url || !";=,+*".includes(source[i]))
    ) {
      if (source[i] === "`" && i + 1 < source.length) i += 2;
      else i++;
    }
    if (start === i) tokens.push(source[i++]);
    else tokens.push(source.slice(start, i));
  }
  if (tokens.at(-1) === "<statement>") tokens.pop();
  return tokens;
}

function additionMatches(
  actual: string[],
  expected: string[],
  starter: string[],
): boolean {
  if (!expected.length) return false;
  if (actual.length !== expected.length + starter.length) return false;
  for (let i = 0; i + expected.length <= actual.length; i++) {
    if (!expected.every((token, index) => token === actual[i + index]))
      continue;
    const rest = [...actual.slice(0, i), ...actual.slice(i + expected.length)];
    if (
      rest.length === starter.length &&
      rest.every((token, index) => token === starter[index])
    )
      return true;
  }
  return false;
}

export function compareCode({
  actual,
  expected,
  language,
  starter = "",
  mode = "whole",
}: Input): ComparisonResult {
  if (mode === "manual")
    return {
      kind: "manual",
      message:
        "Bài này cần tự kiểm chứng theo tiêu chí và kết quả thực hành; lời giải hiện là hướng dẫn, không đủ để tự động đối chiếu code.",
    };
  if (!["java", "yaml", "powershell"].includes(language))
    return {
      kind: "unsupported",
      message: "Ngôn ngữ này chưa hỗ trợ đối chiếu tự động.",
    };
  if (actual.length > 100_000 || expected.length > 100_000)
    return {
      kind: "invalid",
      message:
        "Đoạn code quá dài để đối chiếu trên trang; hãy dùng đoạn bài tập ngắn.",
    };
  try {
    const normalize = (source: string): Normalized =>
      language === "powershell"
        ? (() => {
            const tokens = powerShellTokens(source);
            return { tokens, signature: JSON.stringify(tokens) };
          })()
        : syntax(source, language as "java" | "yaml");
    const reference = normalize(expected);
    if (!reference.tokens.length)
      return {
        kind: "manual",
        message:
          "Lời giải của bài này là checklist/giải thích. Hãy tự kiểm chứng theo tiêu chí; không tự đánh dấu đúng từ phần chú thích.",
      };
    const user = normalize(actual);
    if (!user.tokens.length)
      return {
        kind: "empty",
        message: "Bạn chưa nhập phần code cần đối chiếu.",
      };
    let matched = user.signature === reference.signature;
    if (!matched && language === "java") {
      const placeholder = ["throw", "new", "UnsupportedOperationException", "(", ")", ";"];
      const containsPlaceholder = (tokens: string[]) => tokens.some((_, i) =>
        placeholder.every((token, offset) => tokens[i + offset] === token));
      if (containsPlaceholder(javaTokens(actual)) && !containsPlaceholder(javaTokens(expected)))
        return {
          kind: "different",
          message: "Xóa dòng throw new UnsupportedOperationException(); dùng làm chỗ trống trong starter cũ và thay bằng implementation của bạn. Giữ dòng này sau return sẽ gây lỗi unreachable statement khi biên dịch Java. Sau đó nhấn Kiểm tra lại.",
        };
    }
    if (!matched && mode === "addition" && language === "java")
      matched = additionMatches(
        javaTokens(actual),
        javaTokens(expected),
        javaTokens(starter),
      );
    return matched
      ? {
          kind: "match",
          message:
            "Khớp lời giải sau khi bỏ qua định dạng và chú thích. Đây là đối chiếu code, chưa biên dịch hoặc chạy kiểm thử.",
        }
      : {
          kind: "different",
          message:
            "Chưa khớp lời giải về nội dung code. Cách triển khai khác vẫn có thể đúng; hãy đối chiếu gợi ý hoặc chạy kiểm thử trong project.",
        };
  } catch {
    return {
      kind: "invalid",
      message:
        "Chưa đối chiếu được đoạn code này. Kiểm tra lại chuỗi ký tự hoặc chú thích chưa đóng và cấu trúc đoạn code.",
    };
  }
}
