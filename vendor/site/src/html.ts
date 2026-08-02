/**
 * Inject runtime config into the public index.html shell.
 * Avoids FOUC: skin/title/banner/nav land in the first paint.
 */

import type { SitePluginConfig, SiteNavItem } from "./config.ts";
import { resolveSkinHref } from "./config.ts";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(s: string): string {
  return esc(s).replace(/'/g, "&#39;");
}

function navHtml(items: SiteNavItem[]): string {
  return items
    .map((item) => {
      const active = item.active ? ' class="is-active"' : "";
      const href = escAttr(item.href);
      const label = esc(item.label);
      return `<li><a href="${href}"${active}>${label}</a></li>`;
    })
    .join("\n          ");
}

/** Ensure a class token is present in a class="…" attribute string. */
function ensureClass(attrs: string, token: string): string {
  if (/\bclass\s*=\s*"/i.test(attrs)) {
    return attrs.replace(
      /\bclass\s*=\s*"([^"]*)"/i,
      (_c, cls: string) => {
        const next = cls.includes(token) ? cls : `${cls} ${token}`;
        return `class="${next.trim()}"`;
      },
    );
  }
  return ` class="${token}"${attrs}`;
}

/**
 * Apply cfg into the shipped index.html template.
 * Pure string rewrite — keep markers stable in public/index.html.
 */
export function injectSiteHtml(
  html: string,
  cfg: SitePluginConfig,
): string {
  const title = (cfg.title ?? "UrsaMU").trim() || "UrsaMU";
  const skinHref = resolveSkinHref(cfg);
  const named = (cfg.skin ?? "default").trim() || "default";
  const dataSkin = cfg.skinCss
    ? "custom"
    : (named.startsWith("/") ? "custom" : named);

  let out = html;

  // <html data-skin="…">
  out = out.replace(
    /<html\b([^>]*)>/i,
    (_m, attrs: string) => {
      let a = String(attrs);
      if (/\bdata-skin\s*=/.test(a)) {
        a = a.replace(
          /\bdata-skin\s*=\s*"[^"]*"/i,
          `data-skin="${escAttr(dataSkin)}"`,
        );
      } else {
        a += ` data-skin="${escAttr(dataSkin)}"`;
      }
      return `<html${a}>`;
    },
  );

  // <title>
  out = out.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${esc(title)}</title>`,
  );

  // Skin stylesheet href (attr order may vary)
  out = out.replace(
    /(<link\b[^>]*\bdata-site-skin\b[^>]*\bhref\s*=\s*")[^"]*(")/i,
    `$1${escAttr(skinHref)}$2`,
  );
  out = out.replace(
    /(<link\b[^>]*\bhref\s*=\s*")[^"]*("[^>]*\bdata-site-skin\b)/i,
    `$1${escAttr(skinHref)}$2`,
  );

  // Brand + banner title text
  out = out.replace(
    /(<a\b[^>]*\bdata-site-brand\b[^>]*>)[^<]*(<\/a>)/i,
    `$1${esc(title)}$2`,
  );
  out = out.replace(
    /(<h1\b[^>]*\bdata-site-banner-title\b[^>]*>)[\s\S]*?(<\/h1>)/i,
    `$1\n          ${esc(title)}\n        $2`,
  );

  // Banner image
  const banner = (cfg.bannerImage ?? "").trim();
  if (banner) {
    out = out.replace(
      /(<img\b[^>]*\bdata-site-banner-img\b)([^>]*)(>)/i,
      (_m, open: string, mid: string, close: string) => {
        let m = String(mid);
        const src = `src="${escAttr(banner)}"`;
        if (/\bsrc\s*=/.test(m)) {
          m = m.replace(/\bsrc\s*=\s*"[^"]*"/i, src);
        } else {
          m = ` ${src}${m}`;
        }
        m = m.replace(/\s*\bhidden\b/gi, "");
        return `${open}${m}${close}`;
      },
    );
    out = out.replace(
      /(<header\b[^>]*\bdata-site-banner\b)([^>]*)(>)/i,
      (_m, open: string, mid: string, close: string) => {
        const m = ensureClass(String(mid), "has-image");
        return `${open}${m}${close}`;
      },
    );
  }

  // plainBg
  if (cfg.plainBg) {
    out = out.replace(
      /(<div\b[^>]*\bdata-site-shell\b)([^>]*)(>)/i,
      (_m, open: string, mid: string, close: string) => {
        const m = ensureClass(String(mid), "is-plain");
        return `${open}${m}${close}`;
      },
    );
  }

  // Nav list
  if (Array.isArray(cfg.nav) && cfg.nav.length > 0) {
    const items = navHtml(cfg.nav);
    out = out.replace(
      /(<ul\b[^>]*\bdata-site-nav-list\b[^>]*>)[\s\S]*?(<\/ul>)/i,
      `$1\n          ${items}\n        $2`,
    );
  }

  return out;
}
