/**
 * MUSH text → safe HTML for the game client.
 *
 * Supports %c codes, truecolor <#rrggbb>, %r/%t/%b layout, and
 * raw ANSI SGR. Escapes all plain text. Used by GameOutput when a
 * message has no JSON layout.
 *
 * @see packages/web/design.md § Game client output
 */

const FG: Record<string, string> = {
  x: "var(--text-muted)",
  r: "var(--error)",
  g: "var(--success)",
  y: "var(--warning)",
  b: "var(--info)",
  m: "#e879f9",
  c: "#22d3ee",
  w: "var(--text)",
};

const BG: Record<string, string> = {
  X: "#000000",
  R: "#7f1d1d",
  G: "#14532d",
  Y: "#713f12",
  B: "#1e3a5f",
  M: "#701a75",
  C: "#164e63",
  W: "#374151",
};

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function webSafeHex(hex: string): string {
  const h = hex.replace(/^#/, "").toLowerCase();
  if (!/^[0-9a-f]{6}$/.test(h)) return "var(--text)";
  return `#${h}`;
}

type Style = {
  color?: string;
  bg?: string;
  bold?: boolean;
  underline?: boolean;
  italic?: boolean;
};

/**
 * Convert MUSH / ANSI game text to HTML spans.
 * Newlines become &#10; inside a white-space:pre-wrap parent.
 */
export function mushTextToHtml(raw: unknown): string {
  if (raw == null) return "";
  // deno-lint-ignore no-control-regex
  let s = String(raw).replace(/\u001b\[[0-9;]*m/g, "");

  // Layout codes before color tokenization
  s = s
    .replace(/%r/gi, "\n")
    .replace(/%t/gi, "\t")
    .replace(/%b/gi, " ");

  let style: Style = {};
  const parts: string[] = [];
  let buf = "";

  const flush = () => {
    if (!buf) return;
    // Keep real newlines — parent .game-pre uses white-space:pre-wrap
    const text = escHtml(buf);
    buf = "";
    const css: string[] = [];
    if (style.color) css.push(`color:${style.color}`);
    if (style.bg) css.push(`background-color:${style.bg}`);
    if (style.underline) css.push("text-decoration:underline");
    let open = "";
    let close = "";
    if (css.length) {
      open += `<span style="${css.join(";")}">`;
      close = `</span>${close}`;
    }
    if (style.bold) {
      open += "<b>";
      close = `</b>${close}`;
    }
    if (style.italic) {
      open += "<i>";
      close = `</i>${close}`;
    }
    parts.push(open ? `${open}${text}${close}` : text);
  };

  const re =
    /%c([nNrRgGyYbBmMcCwWxXhHuUiI])|%c<#([0-9a-fA-F]{6})>|<#([0-9a-fA-F]{6})>|%x([nNrRgGyYbBmMcCwWxXhHuUiI])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) {
      buf += s.slice(last, m.index);
      flush();
    }
    last = m.index + m[0].length;

    if (m[2] || m[3]) {
      const hex = webSafeHex(m[2] || m[3] || "ffffff");
      flush();
      style = { ...style, color: hex };
      continue;
    }

    const code = (m[1] || m[4] || "").toLowerCase();
    const rawCode = m[1] || m[4] || "";
    flush();

    if (code === "n") {
      style = {};
      continue;
    }
    if (code === "h") {
      style = { ...style, bold: true };
      continue;
    }
    if (code === "u") {
      style = { ...style, underline: true };
      continue;
    }
    if (code === "i") {
      style = { ...style, italic: true };
      continue;
    }
    if (
      rawCode.length === 1 &&
      rawCode === rawCode.toUpperCase() &&
      BG[rawCode]
    ) {
      style = { ...style, bg: BG[rawCode] };
      continue;
    }
    if (FG[code]) {
      style = { ...style, color: FG[code] };
    }
  }
  if (last < s.length) {
    buf += s.slice(last);
    flush();
  }

  return parts.join("");
}

/** True when a WS payload carries structured UI layout. */
export function hasGameLayout(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  const ui = d.ui;
  if (!ui || typeof ui !== "object") return false;
  const u = ui as Record<string, unknown>;
  return Array.isArray(u.components) || u.type === "layout";
}

export function gameLayoutOf(
  data: unknown,
): { components: unknown[]; meta?: Record<string, unknown> } | null {
  if (!hasGameLayout(data)) return null;
  const ui = (data as { ui: Record<string, unknown> }).ui;
  const components = Array.isArray(ui.components)
    ? ui.components
    : [];
  const meta =
    ui.meta && typeof ui.meta === "object"
      ? (ui.meta as Record<string, unknown>)
      : undefined;
  return { components, meta };
}
