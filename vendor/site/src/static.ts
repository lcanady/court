/**
 * Serve the public site under /site/ (and optionally /).
 */

import { fromFileUrl, join, normalize } from "@std/path";
import type { SitePluginConfig } from "./config.ts";
import { normalizeMount, resolveSkinHref } from "./config.ts";
import { injectSiteHtml } from "./html.ts";

const PUBLIC_DIR = fromFileUrl(
  new URL("../public/", import.meta.url),
);

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function extOf(path: string): string {
  const i = path.lastIndexOf(".");
  return i >= 0 ? path.slice(i).toLowerCase() : "";
}

function safeJoin(root: string, rel: string): string | null {
  const cleaned = rel.replace(/^\/+/, "").replace(/\\/g, "/");
  if (cleaned.includes("\0") || cleaned.split("/").includes("..")) {
    return null;
  }
  const full = normalize(join(root, cleaned));
  const rootNorm = normalize(root);
  const prefix = rootNorm.endsWith("/") ? rootNorm : `${rootNorm}/`;
  if (full !== rootNorm && !full.startsWith(prefix)) return null;
  return full;
}

export type SiteRuntime = {
  cfg: SitePluginConfig;
  mount: string;
  /** Absolute path to game themeDir, if configured */
  themeRoot: string | null;
};

let runtime: SiteRuntime = {
  cfg: {},
  mount: "/site",
  themeRoot: null,
};

export function setSiteRuntime(cfg: SitePluginConfig): void {
  let themeRoot: string | null = null;
  const td = (cfg.themeDir ?? "").trim();
  if (td) {
    // Resolve relative to process cwd (game root)
    try {
      const abs = td.startsWith("/")
        ? normalize(td)
        : normalize(join(Deno.cwd(), td));
      themeRoot = abs;
    } catch {
      themeRoot = null;
    }
  }
  runtime = {
    cfg,
    mount: normalizeMount(cfg.mount),
    themeRoot,
  };
}

export function getSiteRuntime(): SiteRuntime {
  return runtime;
}

/** JSON config consumed by public/js/site.js */
export function siteConfigResponse(): Response {
  const c = runtime.cfg;
  const body = {
    title: c.title ?? "UrsaMU",
    skin: c.skin ?? "default",
    skinCss: c.skinCss,
    skinHref: resolveSkinHref(c),
    bannerImage: c.bannerImage,
    plainBg: c.plainBg === true,
    nav: c.nav,
    telnet: c.telnet,
  };
  return Response.json(body, {
    headers: {
      "cache-control": "no-store",
    },
  });
}

async function readFile(path: string): Promise<Uint8Array | null> {
  try {
    const data = await Deno.readFile(path);
    return new Uint8Array(data);
  } catch {
    return null;
  }
}

async function serveIndexHtml(): Promise<Response> {
  const idx = safeJoin(PUBLIC_DIR, "index.html");
  if (!idx) return new Response("Not found", { status: 404 });
  const bytes = await readFile(idx);
  if (!bytes) return new Response("Not found", { status: 404 });
  const raw = new TextDecoder().decode(bytes);
  const html = injectSiteHtml(raw, runtime.cfg);
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-cache",
    },
  });
}

/**
 * Map request URL path → file under public/ (or themeDir).
 * Handles /site, /site/, /site/css/… and optional /.
 */
export async function siteStaticHandler(
  req: Request,
  _userId: string | null = null,
): Promise<Response> {
  const url = new URL(req.url);
  let path = url.pathname;

  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const mount = runtime.mount;

  // Config endpoint
  if (
    path === `${mount}/config.json` ||
    path === "/site/config.json"
  ) {
    return siteConfigResponse();
  }

  // Strip mount prefix
  if (path === mount || path === `${mount}/`) {
    path = "/index.html";
  } else if (path.startsWith(`${mount}/`)) {
    path = path.slice(mount.length);
  } else if (runtime.cfg.serveRoot && (path === "/" || path === "")) {
    path = "/index.html";
  } else if (!path.startsWith("/site/")) {
    return new Response("Not found", { status: 404 });
  } else {
    path = path.slice("/site".length) || "/index.html";
  }

  if (path.endsWith("/")) path += "index.html";
  if (path === "") path = "/index.html";

  // Injected HTML shell
  if (path === "/index.html" || path === "index.html") {
    return await serveIndexHtml();
  }

  // Game themeDir → /site/theme/*
  if (
    runtime.themeRoot &&
    (path.startsWith("/theme/") || path.startsWith("theme/"))
  ) {
    const rel = path.replace(/^\/?theme\//, "");
    const filePath = safeJoin(runtime.themeRoot, rel);
    if (filePath) {
      const bytes = await readFile(filePath);
      if (bytes) {
        const ext = extOf(filePath);
        const type = MIME[ext] ?? "application/octet-stream";
        return new Response(bytes.buffer as ArrayBuffer, {
          headers: {
            "content-type": type,
            "cache-control": "no-cache",
          },
        });
      }
    }
  }

  const filePath = safeJoin(PUBLIC_DIR, path);
  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  const bytes = await readFile(filePath);
  if (!bytes) {
    // SPA-ish: unknown bare paths under mount → index
    if (!extOf(path) || path.endsWith(".html")) {
      return await serveIndexHtml();
    }
    return new Response("Not found", { status: 404 });
  }

  const ext = extOf(filePath);
  const type = MIME[ext] ?? "application/octet-stream";
  const immutable = ext === ".woff2" || ext === ".woff" ||
    ext === ".png" || ext === ".jpg" || ext === ".svg";

  return new Response(bytes.buffer as ArrayBuffer, {
    headers: {
      "content-type": type,
      "cache-control": immutable
        ? "public, max-age=86400"
        : "no-cache",
    },
  });
}
