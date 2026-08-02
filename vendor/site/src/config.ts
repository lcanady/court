/**
 * plugins.site config from game config.json.
 */

export type SiteNavItem = {
  label: string;
  href: string;
  active?: boolean;
};

export type SitePluginConfig = {
  /** Named skin: "default" | "changeling" | "court" | path-like */
  skin?: string;
  /**
   * Absolute or site-relative CSS URL for a fully custom skin.
   * Wins over `skin`. Example: "/theme/my-game.css"
   * or a game-local path served via themeDir: "/site/theme/my.css"
   */
  skinCss?: string;
  /** Document / brand title */
  title?: string;
  /** Banner image URL (optional) */
  bannerImage?: string;
  /** Suppress top background art */
  plainBg?: boolean;
  /**
   * Mount path for static assets (default "/site/").
   * Trailing slash normalized.
   */
  mount?: string;
  /** Also serve index at GET / when true (default false). */
  serveRoot?: boolean;
  /**
   * Game-relative directory of custom CSS/images.
   * Served at `{mount}/theme/…` (e.g. "theme" → /site/theme/foo.css).
   */
  themeDir?: string;
  nav?: SiteNavItem[];
  /** Telnet address shown in the connect panel (e.g. "host:4201") */
  telnet?: string;
};

export function normalizeMount(raw: unknown): string {
  let m = typeof raw === "string" && raw.trim() ? raw.trim() : "/site";
  if (!m.startsWith("/")) m = `/${m}`;
  if (m.length > 1 && m.endsWith("/")) m = m.slice(0, -1);
  return m;
}

/** Cache-bust query for shipped site CSS (bump when layout/tokens change). */
export const SITE_ASSET_V = "20260802d";

/** Resolve stylesheet href for the active skin. */
export function resolveSkinHref(cfg: SitePluginConfig): string {
  const custom = (cfg.skinCss ?? "").trim();
  if (custom) {
    // Preserve absolute/custom URLs; append bust only for same-origin skins
    if (custom.startsWith("/site/") && !custom.includes("?")) {
      return `${custom}?v=${SITE_ASSET_V}`;
    }
    return custom;
  }
  const named = (cfg.skin ?? "default").trim() || "default";
  if (named.startsWith("/") || named.startsWith("http")) {
    return named;
  }
  return `/site/css/skins/${named}.css?v=${SITE_ASSET_V}`;
}

/**
 * Brand defaults when skin is "changeling" or legacy "court"
 * and fields are left unset.
 */
export function applySkinDefaults(
  cfg: SitePluginConfig,
): SitePluginConfig {
  const skin = (cfg.skinCss ? "" : (cfg.skin ?? "default")).trim()
    .toLowerCase();
  if (skin !== "changeling" && skin !== "court") return cfg;
  const asset = skin === "court" ? "court" : "changeling";
  const out = { ...cfg };
  if (!out.bannerImage) {
    out.bannerImage =
      `/site/skins/${asset}/imgs/header.png`;
  }
  if (!out.title) out.title = "Court of Miracles";
  if (!out.nav) {
    out.nav = [
      { label: "Home", href: "/site/", active: true },
      { label: "Characters", href: "#" },
      { label: "Help", href: "#" },
      { label: "Wiki", href: "#" },
    ];
  }
  return out;
}

export function readSiteConfig(
  // deno-lint-ignore no-explicit-any
  gameConfig: any,
): SitePluginConfig {
  const block = gameConfig?.plugins?.site;
  if (!block || typeof block !== "object") return {};
  const o = block as Record<string, unknown>;
  const out: SitePluginConfig = {};
  if (typeof o.skin === "string") out.skin = o.skin.trim();
  if (typeof o.skinCss === "string") out.skinCss = o.skinCss.trim();
  if (typeof o.title === "string") out.title = o.title.trim();
  if (typeof o.bannerImage === "string") {
    out.bannerImage = o.bannerImage.trim();
  }
  if (typeof o.plainBg === "boolean") out.plainBg = o.plainBg;
  if (typeof o.mount === "string") out.mount = o.mount.trim();
  if (typeof o.serveRoot === "boolean") out.serveRoot = o.serveRoot;
  if (typeof o.themeDir === "string") {
    out.themeDir = o.themeDir.trim();
  }
  if (typeof o.telnet === "string") {
    out.telnet = o.telnet.trim();
  }
  if (Array.isArray(o.nav)) {
    out.nav = o.nav
      .filter((x) => x && typeof x === "object")
      .map((x) => {
        const r = x as Record<string, unknown>;
        return {
          label: String(r.label ?? "Link"),
          href: String(r.href ?? "#"),
          active: r.active === true,
        };
      });
  }
  return out;
}
