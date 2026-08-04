/**
 * @ursamu/site — shell behavior, wiki reader, and context sidebars.
 *
 * Page modes (detected from pathname):
 *   home    /site/ or /site/index.html
 *   wiki    /site/wiki/<path>
 *   generic anything else under /site/
 *
 * Left sidebar:
 *   - Search box (static HTML)
 *   - Left menu (Figma): Featured, then Related (section siblings)
 *   - Home main content = wiki path "home" (not featured)
 * Wiki chrome: bgImage → home-height + theme bg; else compact
 *
 * Right sidebar:
 *   - "On this page" TOC (scraped from rendered headings)
 *   - "Edit this page" staff link (wiki mode, authenticated staff only)
 *   - Telnet host under hero title when title + plugins.site.telnet
 */

(function () {

  // ── DOM handles ────────────────────────────────────────────────────────────

  var root        = document.documentElement;
  var siteNav     = document.querySelector("[data-site-nav]");
  var shell       = document.querySelector("[data-site-shell]");
  var brand       = document.querySelector("[data-site-brand]");
  var bannerTitle = document.querySelector("[data-site-banner-title]");
  var bannerImg   = document.querySelector("[data-site-banner-img]");
  var banner      = document.querySelector("[data-site-banner]");
  var bannerConnect = document.querySelector("[data-site-banner-connect]");
  var navList     = document.querySelector("[data-site-nav-list]");
  var navToggle   = document.querySelector("[data-site-nav-toggle]");
  var skinLink    = document.querySelector("[data-site-skin]");
  var mainEl      = document.querySelector("[data-site-main]");
  var leftPanels  = document.querySelector("[data-site-left-panels]");
  var rightPanels = document.querySelector("[data-site-right-panels]");

  // ── Page mode ─────────────────────────────────────────────────────────────

  // Support mount /site and serveRoot apex (court.ursamu.io/)
  // Recomputed on SPA navigations via refreshPathname().
  var pathname = "/";

  function refreshPathname() {
    pathname = window.location.pathname.replace(/\/+$/, "") || "/";
    if (pathname === "") pathname = "/";
  }
  refreshPathname();

  function detectMode() {
    if (
      pathname === "/" ||
      pathname === "/site" ||
      pathname === "/site/index.html"
    ) {
      return "home";
    }
    if (
      pathname === "/login" ||
      pathname === "/site/login" ||
      pathname === "/site/login.html"
    ) {
      return "login";
    }
    if (
      pathname === "/profile" ||
      pathname === "/site/profile" ||
      pathname === "/site/profile.html"
    ) {
      return "profile";
    }
    if (
      pathname.startsWith("/wiki") ||
      pathname.startsWith("/site/wiki")
    ) {
      return "wiki";
    }
    if (
      pathname.startsWith("/help") ||
      pathname.startsWith("/site/help")
    ) {
      return "help";
    }
    return "generic";
  }

  // Alias used by SPA route loader
  function modeFromUrl() {
    return detectMode();
  }

  // "/wiki/lore" or "/site/wiki/lore" → "lore"
  function wikiPathFromUrl() {
    return pathname.replace(/^\/(?:site\/)?wiki\/?/, "") || "";
  }

  // "/help/mail" or "/site/help/mail" → "mail"
  function helpPathFromUrl() {
    return pathname.replace(/^\/(?:site\/)?help\/?/, "") || "";
  }

  /** Public path prefix for in-app links ("" at apex, "/site" under mount). */
  function publicBase() {
    if (pathname === "/" || pathname === "/login" ||
      pathname === "/profile" || pathname.startsWith("/wiki") ||
      pathname.startsWith("/help")) {
      return "";
    }
    return "/site";
  }
  var PUB = publicBase();

  function refreshPub() {
    PUB = publicBase();
  }

  function pubPath(sub) {
    sub = String(sub || "").replace(/^\/+/, "");
    if (!sub) return PUB ? PUB + "/" : "/";
    return (PUB || "") + "/" + sub;
  }
  function wikiHref(path) {
    var rest = String(path || "").replace(/^\/+/, "");
    return pubPath(rest ? "wiki/" + rest : "wiki/");
  }
  function helpHref(topic) {
    var rest = String(topic || "").replace(/^\/+/, "");
    return pubPath(rest ? "help/" + rest : "help/");
  }

  /**
   * Encode a wiki path for /api/v1/wiki/<path>.
   * Keep "/" separators — encodeURIComponent whole-path turns them
   * into %2F and the API 404s nested pages (lore/city).
   */
  function encodeWikiApiPath(path) {
    return String(path || "")
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .filter(Boolean)
      .map(encodeURIComponent)
      .join("/");
  }

  var MODE     = detectMode();
  var WIKI_PATH = wikiPathFromUrl();
  var HELP_PATH = helpPathFromUrl();
  /** Wiki frontmatter bgImage (default false). Home uses site settings. */
  var pageBgImage = false;
  /** Cached GET /api/v1/help payload. */
  var helpIndex = null;
  var helpIndexPromise = null;

  // ── Config helpers ─────────────────────────────────────────────────────────

  var siteConfig = {};

  /**
   * Shell chrome: home height vs compact (no title height).
   * - home: site plainBg + hero offset from settings
   * - wiki + bgImage: theme top bg, home-height spacer
   * - wiki default / login / profile: compact under nav
   */
  function applyShellChrome() {
    if (!shell) return;
    var cfg = siteConfig || {};
    var wikiBg = MODE === "wiki" && pageBgImage === true;
    var compactMode = MODE === "login" || MODE === "profile" ||
      MODE === "help" ||
      (MODE === "wiki" && !pageBgImage);

    if (MODE === "home") {
      if (cfg.plainBg) shell.classList.add("is-plain");
      else shell.classList.remove("is-plain");
    } else if (wikiBg) {
      shell.classList.remove("is-plain");
    } else if (compactMode) {
      shell.classList.add("is-plain");
    } else if (cfg.plainBg) {
      shell.classList.add("is-plain");
    } else {
      shell.classList.remove("is-plain");
    }

    if (compactMode) {
      shell.classList.add("is-compact");
      shell.classList.add("is-mode-no-hero");
    } else if (wikiBg || MODE === "home") {
      // Same home-height hero chrome (title / offset / bg)
      shell.classList.remove("is-mode-no-hero");
      var bSrc = String(cfg.bannerImage || "").trim();
      var hTitle = String(cfg.title || "").trim();
      if (!bSrc && !hTitle) shell.classList.add("is-compact");
      else shell.classList.remove("is-compact");
    } else {
      shell.classList.remove("is-compact");
      shell.classList.remove("is-mode-no-hero");
    }
  }

  function setSkinHref(href) {
    if (!skinLink || !href) return;
    if (skinLink.getAttribute("href") === href) return;
    skinLink.setAttribute("href", href);
  }

  /** Match nav href to current path (Home ≠ login). */
  function normalizeNavPath(raw) {
    var p = String(raw || "").split("?")[0].split("#")[0].trim();
    if (!p || p === "#") return "";
    if (p.slice(-11) === "/index.html") {
      p = p.slice(0, -11) || "/";
    }
    if (p.length > 1 && p.charAt(p.length - 1) === "/") {
      p = p.slice(0, -1);
    }
    return p || "/";
  }

  function navHrefIsActive(href) {
    var h = normalizeNavPath(href);
    var p = pathname;
    if (!h || h === "#") return false;
    if (h === p) return true;
    // Bare /site must not match /site/login — only deeper roots
    var depth = h.split("/").filter(Boolean).length;
    if (depth >= 2 && p.indexOf(h + "/") === 0) return true;
    return false;
  }

  function applyConfig(cfg) {
    if (!cfg || typeof cfg !== "object") return;
    siteConfig = cfg;

    var heroTitle = String(cfg.title || "").trim();
    var brandTitle = heroTitle || "UrsaMU";
    // Nav brand always uses site name; document title set per-mode below
    if (brand) {
      brand.textContent = brandTitle;
      // Logo always goes to public home (/ at apex, /site/ when mounted)
      brand.setAttribute("href", pubPath(""));
    }

    var href  = String(cfg.skinHref || cfg.skinCss || "").trim();
    var named = String(cfg.skin || "default").trim();
    if (href) {
      setSkinHref(href);
    } else if (named.startsWith("/") || named.startsWith("http")) {
      setSkinHref(named);
    } else if (named) {
      setSkinHref("/site/css/skins/" + named + ".css");
    }

    if (named && !cfg.skinCss) {
      root.setAttribute("data-skin", named);
    } else if (cfg.skinCss) {
      root.setAttribute("data-skin", "custom");
    }

    var bannerSrc = String(cfg.bannerImage || "").trim();
    // Home always; wiki only when page bgImage (home-height layout)
    var showHero = MODE === "home" ||
      (MODE === "wiki" && pageBgImage === true);
    if (bannerImg) {
      if (showHero && bannerSrc) {
        bannerImg.src = bannerSrc;
        bannerImg.hidden = false;
        if (banner) banner.classList.add("has-image");
      } else {
        bannerImg.removeAttribute("src");
        bannerImg.hidden = true;
        if (banner) banner.classList.remove("has-image");
      }
    }
    if (bannerTitle) {
      if (showHero && heroTitle) {
        bannerTitle.textContent = heroTitle;
        bannerTitle.hidden = false;
        bannerTitle.removeAttribute("hidden");
      } else {
        bannerTitle.textContent = "";
        bannerTitle.hidden = true;
      }
    }
    // Connect under title (not a right-rail "Connect" menu)
    var telnetHost = String((cfg && cfg.telnet) || "").trim();
    if (bannerConnect) {
      if (showHero && heroTitle && telnetHost) {
        bannerConnect.textContent = telnetHost;
        bannerConnect.href = "telnet://" + telnetHost;
        bannerConnect.hidden = false;
        bannerConnect.removeAttribute("hidden");
      } else {
        bannerConnect.textContent = "";
        bannerConnect.removeAttribute("href");
        bannerConnect.hidden = true;
      }
    }
    document.title = brandTitle;
    applyShellChrome();

    if (Array.isArray(cfg.nav) && navList) {
      navList.innerHTML = "";
      for (var i = 0; i < cfg.nav.length; i++) {
        var item = cfg.nav[i];
        var li = document.createElement("li");
        var a  = document.createElement("a");
        a.href = String(item.href || "#");
        a.textContent = String(item.label || "Link");
        // Path wins over static active:true from config
        if (navHrefIsActive(item.href)) a.classList.add("is-active");
        li.appendChild(a);
        navList.appendChild(li);
      }
    }
  }

  // ── Minimal markdown renderer ──────────────────────────────────────────────

  // Shared wiki page list — keyed by path for wikilink resolution.
  var wikiIndex = {};  // path → { title, path }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function slug(text) {
    return String(text)
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  /**
   * Page-local image refs → API URL.
   * Authors write: ![crest](crest.png)
   * Also: _assets/crest.png  ./crest.png
   * Absolute /http(s) left as-is.
   */
  function resolveImageSrc(src, pagePath) {
    var raw = String(src || "").trim();
    if (!raw) return null;
    if (/^\s*javascript:/i.test(raw) || /^\s*data:/i.test(raw)) {
      return null;
    }
    if (/^https?:\/\//i.test(raw) || raw.charAt(0) === "/") {
      return raw;
    }
    var ref = raw.replace(/^\.\//, "");
    if (ref.indexOf("_assets/") === 0) {
      ref = ref.slice("_assets/".length);
    }
    // basename + safe chars only
    ref = ref.replace(/^.*[/\\]/, "").toLowerCase();
    ref = ref.replace(/\s+/g, "-").replace(/[^a-z0-9._-]+/g, "");
    if (!/^[a-z0-9][a-z0-9._-]*\.(png|jpe?g|gif|webp|svg)$/i
      .test(ref)) {
      return null;
    }
    var page = String(pagePath || "").replace(/^\/+|\/+$/g, "");
    if (!page) return null;
    return "/api/v1/wiki/" + page.split("/").map(encodeURIComponent)
      .join("/") + "/_assets/" + encodeURIComponent(ref);
  }

  function inlineMarkdown(text, pagePath) {
    // Wikilinks [[target|label]] or [[target]] — resolve to real links
    text = text.replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      function (_, target, label) {
        var t   = target.trim();
        var lbl = label ? label.trim() : (wikiIndex[t] ? wikiIndex[t].title : t);
        return '<a href="' + wikiHref(t) + '">' + esc(lbl) + "</a>";
      }
    );
    // Bold+italic
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, function (_, t) {
      return "<strong><em>" + esc(t) + "</em></strong>";
    });
    text = text.replace(/\*\*(.+?)\*\*/g, function (_, t) {
      return "<strong>" + esc(t) + "</strong>";
    });
    text = text.replace(/\*(.+?)\*/g, function (_, t) {
      return "<em>" + esc(t) + "</em>";
    });
    // Inline code
    text = text.replace(/`([^`]+)`/g, function (_, t) {
      return "<code>" + esc(t) + "</code>";
    });
    // Images ![alt](url|filename) — before links
    text = text.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      function (_, alt, url) {
        var src = resolveImageSrc(url, pagePath);
        if (!src) return esc(alt || "");
        return '<img src="' + esc(src) + '" alt="' +
          esc(alt || "") + '" loading="lazy">';
      }
    );
    // Markdown links
    text = text.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      function (_, lbl, url) {
        return '<a href="' + esc(url) + '">' + esc(lbl) + "</a>";
      }
    );
    return text;
  }

  function renderMarkdown(md, pagePath) {
    var lines    = md.split(/\r?\n/);
    var html     = "";
    var inList   = false;
    var listTag  = "";
    var inPara   = false;
    var inTable  = false;
    var tableRows = []; // array of string[] (one per row)
    var pg = pagePath || "";

    function closePara() {
      if (inPara) { html += "</p>\n"; inPara = false; }
    }
    function closeList() {
      if (inList) {
        html += "</" + listTag + ">\n";
        inList = false; listTag = "";
      }
    }
    function flushTable() {
      if (!tableRows.length) { inTable = false; return; }
      html += "<table>\n<thead>\n<tr>";
      var headers = tableRows[0];
      for (var h = 0; h < headers.length; h++) {
        html += "<th>" + inlineMarkdown(headers[h], pg) + "</th>";
      }
      html += "</tr>\n</thead>\n<tbody>\n";
      for (var r = 1; r < tableRows.length; r++) {
        html += "<tr>";
        var cells = tableRows[r];
        for (var c = 0; c < cells.length; c++) {
          html += "<td>" + inlineMarkdown(cells[c], pg) + "</td>";
        }
        html += "</tr>\n";
      }
      html += "</tbody>\n</table>\n";
      tableRows = [];
      inTable = false;
    }
    function parseRow(line) {
      // "| a | b |" → ["a", "b"]
      return line.replace(/^\||\|$/g, "").split("|").map(function (c) {
        return c.trim();
      });
    }
    function isSepRow(line) {
      return /^\|[\s\-:|]+\|$/.test(line.replace(/\s/g, ""));
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      // ── Table rows ─────────────────────────────────────────────────
      if (/^\|/.test(line)) {
        closePara(); closeList();
        inTable = true;
        if (!isSepRow(line)) {
          tableRows.push(parseRow(line));
        }
        continue;
      }
      if (inTable) { flushTable(); }

      // ── Blank line ─────────────────────────────────────────────────
      if (!line.trim()) { closePara(); closeList(); continue; }

      // ── Headings ───────────────────────────────────────────────────
      var hMatch = line.match(/^(#{1,6})\s+(.*)/);
      if (hMatch) {
        closePara(); closeList();
        var level = hMatch[1].length;
        var hText = hMatch[2];
        var hId   = slug(hText);
        html += "<h" + level + ' id="' + esc(hId) + '">' +
          inlineMarkdown(hText, pg) + "</h" + level + ">\n";
        continue;
      }

      // ── Horizontal rule ────────────────────────────────────────────
      if (/^[-*_]{3,}\s*$/.test(line)) {
        closePara(); closeList();
        html += "<hr>\n";
        continue;
      }

      // ── Blockquote ─────────────────────────────────────────────────
      var bqMatch = line.match(/^>\s?(.*)/);
      if (bqMatch) {
        closePara(); closeList();
        html += "<blockquote><p>" +
          inlineMarkdown(bqMatch[1], pg) + "</p></blockquote>\n";
        continue;
      }

      // ── Unordered list ─────────────────────────────────────────────
      var ulMatch = line.match(/^[-*+]\s+(.*)/);
      if (ulMatch) {
        closePara();
        if (!inList || listTag !== "ul") {
          closeList();
          html += "<ul>\n"; inList = true; listTag = "ul";
        }
        html += "<li>" + inlineMarkdown(ulMatch[1], pg) + "</li>\n";
        continue;
      }

      // ── Ordered list ───────────────────────────────────────────────
      var olMatch = line.match(/^\d+\.\s+(.*)/);
      if (olMatch) {
        closePara();
        if (!inList || listTag !== "ol") {
          closeList();
          html += "<ol>\n"; inList = true; listTag = "ol";
        }
        html += "<li>" + inlineMarkdown(olMatch[1], pg) + "</li>\n";
        continue;
      }

      // ── Paragraph ──────────────────────────────────────────────────
      closeList();
      if (!inPara) { html += "<p>"; inPara = true; } else { html += " "; }
      html += inlineMarkdown(line, pg);
    }
    closePara(); closeList(); flushTable();
    return html;
  }

  // ── Main content injection ─────────────────────────────────────────────────

  function setDocumentTitle(pageTitle) {
    var siteName = String(
      (siteConfig && siteConfig.title) || "",
    ).trim() || "UrsaMU";
    var t = String(pageTitle || "").trim();
    document.title = t ? (t + " · " + siteName) : siteName;
  }

  function articleFooterHtml() {
    return "<footer class=\"site-footer\" id=\"footer\">" +
      "<div class=\"site-rule site-rule--image\" role=\"presentation\"></div>" +
      "<p>Powered by <a href=\"https://github.com/UrsaMU/ursamu\"" +
      " target=\"_blank\" rel=\"noopener\">UrsaMU</a></p></footer>";
  }

  function injectArticle(page) {
    if (!mainEl || !page) return;
    var pagePath = String(page.path || WIKI_PATH || "").trim();
    // Home content is wiki path "home"
    if (!pagePath && MODE === "home") pagePath = "home";
    var bodyHtml = renderMarkdown(
      String(page.body || ""),
      pagePath,
    );
    var title = String(page.title || page.path || "").trim();
    if (!bodyHtml.trim() && !title) return;
    // Per-page bg only in wiki mode; home uses site settings
    if (MODE === "wiki") {
      pageBgImage = page.bgImage === true;
      // Re-apply hero + chrome now that flag is known
      if (siteConfig && Object.keys(siteConfig).length) {
        applyConfig(siteConfig);
      } else {
        applyShellChrome();
      }
    }
    setDocumentTitle(title);
    var inner = "<section class=\"site-section\">";
    if (title) {
      inner += "<h2 class=\"site-section__title\">" + esc(title) + "</h2>" +
        "<div class=\"site-rule site-rule--image\" role=\"presentation\"></div>";
    }
    inner += "<div class=\"site-section__body\">" +
      (bodyHtml.trim() || "<p><em>No content.</em></p>") +
      "</div></section>";
    inner += articleFooterHtml();
    mainEl.innerHTML = inner;
  }

  /** Wiki index (/wiki/) or directory listing — table, not card list. */
  function injectWikiListing(opts) {
    if (!mainEl) return;
    opts = opts || {};
    pageBgImage = false;
    if (MODE === "wiki") {
      if (siteConfig && Object.keys(siteConfig).length) {
        applyConfig(siteConfig);
      } else {
        applyShellChrome();
      }
    }
    var title = String(opts.title || "Wiki").trim();
    var items = Array.isArray(opts.items) ? opts.items : [];
    setDocumentTitle(title);
    var body = "";
    if (!items.length) {
      body = "<p>No pages yet.</p>";
    } else {
      var hasMeta = false;
      for (var m = 0; m < items.length; m++) {
        if (items[m].date || items[m].author ||
          (items[m].tags && items[m].tags.length) ||
          items[m].chars != null) {
          hasMeta = true;
          break;
        }
      }
      body = "<div class=\"site-wiki-table-wrap\">" +
        "<table class=\"site-wiki-table\">" +
        "<thead><tr>" +
        "<th scope=\"col\">Title</th>" +
        "<th scope=\"col\">Path</th>" +
        "<th scope=\"col\">Type</th>";
      if (hasMeta) {
        body += "<th scope=\"col\">Updated</th>" +
          "<th scope=\"col\">Tags</th>";
      }
      body += "<th scope=\"col\"><span class=\"site-sr-only\">" +
        "Open</span></th>" +
        "</tr></thead><tbody>";
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var p = String(it.path || "").trim();
        if (!p) continue;
        var lbl = String(it.title || p).trim();
        var isDir = it.type === "directory";
        var kind = isDir ? "Section" : "Page";
        var tags = Array.isArray(it.tags)
          ? it.tags.map(String).join(", ")
          : "";
        body += "<tr>" +
          "<td><a href=\"" + wikiHref(p) + "\">" +
          esc(lbl) + "</a></td>" +
          "<td><code>" + esc(p) + "</code></td>" +
          "<td class=\"site-wiki-type muted\">" + esc(kind) +
          "</td>";
        if (hasMeta) {
          body += "<td class=\"muted\">" +
            esc(String(it.date || "—")) + "</td>" +
            "<td class=\"muted\">" +
            esc(tags || "—") + "</td>";
        }
        body += "<td class=\"site-wiki-open\">" +
          "<a class=\"site-wiki-open-link\" href=\"" +
          wikiHref(p) + "\">Open</a></td>" +
          "</tr>";
      }
      body += "</tbody></table></div>";
    }
    mainEl.innerHTML =
      "<section class=\"site-section\">" +
      "<h2 class=\"site-section__title\">" + esc(title) + "</h2>" +
      "<div class=\"site-rule site-rule--image\" role=\"presentation\"></div>" +
      "<div class=\"site-section__body\">" + body + "</div></section>" +
      articleFooterHtml();
  }

  function injectNotFound(path) {
    injectArticle({
      title: "Not found",
      body: "No wiki page at `" + String(path || "") + "`.\n\n" +
        "[Browse the wiki](" + wikiHref("") + ").",
    });
  }

  function injectLoadingState(title) {
    if (!mainEl) return;
    var t = String(title || "Loading").trim();
    setDocumentTitle(t);
    // Theme-neutral skeleton: widths only (colors from CSS tokens)
    mainEl.innerHTML =
      "<section class=\"site-section site-section--loading\" " +
      "aria-busy=\"true\" aria-live=\"polite\">" +
      "<h2 class=\"site-section__title\">" + esc(t) + "</h2>" +
      "<div class=\"site-rule site-rule--image\" role=\"presentation\"></div>" +
      "<div class=\"site-section__body site-loading-skeleton\" " +
      "role=\"status\">" +
      "<span class=\"site-sr-only\">Loading content…</span>" +
      "<div class=\"site-skeleton-line\" style=\"width:72%\"></div>" +
      "<div class=\"site-skeleton-line\" style=\"width:94%\"></div>" +
      "<div class=\"site-skeleton-line\" style=\"width:58%\"></div>" +
      "<div class=\"site-skeleton-line\" style=\"width:81%\"></div>" +
      "</div></section>" +
      articleFooterHtml();
  }

  // ── Wiki article index helper ──────────────────────────────────────────────

  function buildIndex(pages) {
    wikiIndex = {};
    for (var i = 0; i < pages.length; i++) {
      var p = pages[i];
      wikiIndex[p.path] = p;
    }
  }

  function wikiLinkHtml(p) {
    var isCurrent = (p.path === WIKI_PATH);
    return "<li" + (isCurrent ? " class=\"is-current\"" : "") + ">" +
      "<a href=\"" + wikiHref(p.path) + "\"" +
      (isCurrent ? " aria-current=\"page\"" : "") + ">" +
      esc(p.title || p.path) + "</a></li>";
  }

  function menuSection(title, items) {
    if (!items.length) return "";
    var html = "<section class=\"site-menu menu\">" +
      "<h2 class=\"site-menu__title\">" + esc(title) + "</h2>" +
      "<ul class=\"site-menu__list\">";
    for (var i = 0; i < items.length; i++) {
      html += wikiLinkHtml(items[i]);
    }
    html += "</ul></section>";
    return html;
  }

  var leftAside  = document.getElementById("left");
  var rightAside = document.getElementById("right");

  function updateSidebarAndBannerVisibility() {
    // Layout chrome (bg height) is applyShellChrome; this is asides + banner
    var wikiBg = MODE === "wiki" && pageBgImage === true;
    if (MODE === "login") {
      if (leftAside) leftAside.style.display = "none";
      if (rightAside) rightAside.style.display = "none";
      if (banner) banner.style.display = "none";
      if (mainEl) {
        mainEl.style.margin = "0 auto";
        mainEl.style.maxWidth = "440px";
        mainEl.style.minHeight = "calc(100vh - var(--site-nav-h) - 4rem)";
        mainEl.style.display = "flex";
        mainEl.style.flexDirection = "column";
        mainEl.style.justifyContent = "center";
        mainEl.style.alignItems = "center";
      }
      applyShellChrome();
    } else if (MODE === "profile") {
      if (leftAside) leftAside.style.display = "none";
      if (rightAside) rightAside.style.display = "none";
      if (banner) banner.style.display = "none";
      if (mainEl) {
        mainEl.style.margin = "0 auto";
        mainEl.style.maxWidth = "600px";
        mainEl.style.minHeight = "";
        mainEl.style.display = "";
        mainEl.style.flexDirection = "";
        mainEl.style.justifyContent = "";
        mainEl.style.alignItems = "";
      }
      applyShellChrome();
    } else if (MODE === "wiki") {
      if (leftAside) leftAside.style.display = "";
      if (rightAside) rightAside.style.display = "";
      // bgImage pages keep empty banner for home-height spacer
      if (banner) banner.style.display = wikiBg ? "" : "none";
      if (mainEl) {
        mainEl.style.margin = "";
        mainEl.style.maxWidth = "";
        mainEl.style.minHeight = "";
        mainEl.style.display = "";
        mainEl.style.flexDirection = "";
        mainEl.style.justifyContent = "";
        mainEl.style.alignItems = "";
      }
      applyShellChrome();
    } else if (MODE === "help") {
      if (leftAside) leftAside.style.display = "";
      if (rightAside) rightAside.style.display = "";
      if (banner) banner.style.display = "none";
      if (mainEl) {
        mainEl.style.margin = "";
        mainEl.style.maxWidth = "";
        mainEl.style.minHeight = "";
        mainEl.style.display = "";
        mainEl.style.flexDirection = "";
        mainEl.style.justifyContent = "";
        mainEl.style.alignItems = "";
      }
      applyShellChrome();
    } else {
      if (leftAside) leftAside.style.display = "";
      if (rightAside) rightAside.style.display = "";
      if (banner) banner.style.display = "";
      if (mainEl) {
        mainEl.style.margin = "";
        mainEl.style.maxWidth = "";
        mainEl.style.minHeight = "";
        mainEl.style.display = "";
        mainEl.style.flexDirection = "";
        mainEl.style.justifyContent = "";
        mainEl.style.alignItems = "";
      }
      applyShellChrome();
    }
  }

  // ── Left sidebar ───────────────────────────────────────────────────────────

  /** Expand leftMenu template (parity with packages/site menu.ts). */
  function expandLeftMenu(template, blocks) {
    var BLOCK_LINE = /^\s*\[\[([a-z][a-z0-9_-]*)(?::([^\]]*))?\]\]\s*$/i;
    var HEADING = /^\s*##\s+(.+?)\s*$/;
    var UL_ITEM = /^\s*[-*+]\s+(.+?)\s*$/;
    var MD_LINK = /^\[([^\]]+)\]\(([^)]+)\)\s*$/;
    var lines = String(template || "").split(/\r?\n/);
    var html = "";
    var pendingTitle = null;
    var staticItems = [];

    function renderItems(items) {
      if (!items || !items.length) return "";
      var out = "<ul class=\"site-menu__list\">";
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var cur = it.current ? " class=\"is-current\"" : "";
        var aria = it.current ? " aria-current=\"page\"" : "";
        var href = it.href || (it.path ? wikiHref(it.path) : "#");
        var label = it.label || it.title || it.path || "Link";
        out += "<li" + cur + "><a href=\"" + esc(href) + "\"" + aria + ">" +
          esc(label) + "</a></li>";
      }
      out += "</ul>";
      return out;
    }

    function renderSection(title, bodyHtml) {
      if (!bodyHtml || !String(bodyHtml).trim()) return "";
      return "<section class=\"site-menu menu\">" +
        "<h2 class=\"site-menu__title\">" + esc(title) + "</h2>" +
        bodyHtml + "</section>";
    }

    function flushStatic() {
      if (!staticItems.length) return;
      var body = renderItems(staticItems);
      if (pendingTitle) {
        html += renderSection(pendingTitle, body);
        pendingTitle = null;
      } else {
        html += "<section class=\"site-menu menu\">" + body +
          "</section>";
      }
      staticItems = [];
    }

    function emitBlock(name, arg) {
      var key = String(name).toLowerCase();
      var keyed = (arg != null && arg !== "")
        ? (blocks[key + ":" + arg] || blocks[key])
        : blocks[key];
      if (!keyed) {
        pendingTitle = null;
        return;
      }
      var body = "";
      if (keyed.html && String(keyed.html).trim()) {
        body = keyed.html;
      } else if (keyed.items && keyed.items.length) {
        body = renderItems(keyed.items);
      }
      if (!String(body).trim()) {
        pendingTitle = null;
        return;
      }
      if (pendingTitle) {
        html += renderSection(pendingTitle, body);
        pendingTitle = null;
      } else if (/^\s*<section\b/i.test(body)) {
        html += body;
      } else {
        html += "<section class=\"site-menu menu\">" + body +
          "</section>";
      }
    }

    for (var li = 0; li < lines.length; li++) {
      var line = lines[li];
      var bm = line.match(BLOCK_LINE);
      if (bm) {
        flushStatic();
        emitBlock(bm[1], bm[2] ? bm[2].trim() : undefined);
        continue;
      }
      var hm = line.match(HEADING);
      if (hm) {
        flushStatic();
        pendingTitle = hm[1].trim();
        continue;
      }
      var um = line.match(UL_ITEM);
      if (um) {
        var content = um[1].trim();
        var lm = content.match(MD_LINK);
        if (lm) {
          staticItems.push({ label: lm[1], href: lm[2] });
        } else {
          staticItems.push({ label: content, href: "#" });
        }
        continue;
      }
      if (!line.trim()) {
        flushStatic();
      }
    }
    flushStatic();
    return html;
  }

  function pagesToMenuItems(list) {
    var items = [];
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      items.push({
        label: p.title || p.path,
        href: wikiHref(p.path),
        current: p.path === WIKI_PATH,
      });
    }
    return items;
  }

  function renderLeft(pages) {
    if (!leftPanels || MODE === "login" || MODE === "profile") return;

    // Help mode owns the left rail (sections + topics)
    if (MODE === "help") {
      renderHelpLeft();
      return;
    }

    var featured = pages.filter(function (p) {
      return p.featured && !p.draft;
    });

    var siblings = [];
    if (MODE === "wiki" && WIKI_PATH) {
      var section = WIKI_PATH.split("/")[0];
      siblings = pages.filter(function (p) {
        return !p.draft &&
          p.path !== WIKI_PATH &&
          p.path.split("/")[0] === section;
      });
    }

    // Built-in blocks + plugin menuBlocks from config
    var blocks = Object.assign({}, siteConfig.menuBlocks || {});
    if (featured.length) {
      blocks.featured = { items: pagesToMenuItems(featured) };
    }
    if (MODE === "wiki" && (siblings.length || wikiIndex[WIKI_PATH])) {
      var current = wikiIndex[WIKI_PATH];
      var sectionItems = current
        ? [current].concat(siblings)
        : siblings;
      blocks.section = { items: pagesToMenuItems(sectionItems) };
    }

    var template = siteConfig.leftMenu;
    if (template && String(template).trim()) {
      leftPanels.innerHTML = expandLeftMenu(template, blocks) || "";
      return;
    }

    // Fallback when no template (should be rare) — Figma order
    var html = "";
    if (featured.length) {
      html += menuSection("Featured", featured);
    }
    if (MODE === "wiki" && (siblings.length || wikiIndex[WIKI_PATH])) {
      var currentPg = wikiIndex[WIKI_PATH];
      var secItems = currentPg
        ? [currentPg].concat(siblings)
        : siblings;
      html += menuSection("Related", secItems);
    }
    leftPanels.innerHTML = html || "";
  }

  // ── Right sidebar ──────────────────────────────────────────────────────────

  function buildToc() {
    if (!mainEl) return [];
    var headings = mainEl.querySelectorAll("h2, h3");
    var items = [];
    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      // Assign id if missing
      if (!h.id) h.id = slug(h.textContent || "");
      items.push({ id: h.id, text: h.textContent || "", level: h.tagName });
    }
    return items;
  }

  // ── Auth & Account system ──────────────────────────────────────────────────

  var STAFF_FLAGS = ["wizard", "admin", "superuser", "builder"];
  var currentAuthMode = "login"; // "login" | "register"

  function probeAuth() {
    var token = "";
    try {
      token = sessionStorage.getItem("ursamu.webAdmin.token") || "";
    } catch (_) {}

    if (!token) return Promise.resolve(null);

    return fetch("/api/v1/me", {
      headers: { "Authorization": "Bearer " + token },
      credentials: "same-origin",
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (me) {
        if (!me || !me.id) return null;
        var flags = Array.isArray(me.flags) ? me.flags : [];
        var isStaff = STAFF_FLAGS.some(function (f) {
          return flags.indexOf(f) !== -1;
        });
        return {
          id: me.id,
          name: me.name || me.moniker || "Player",
          moniker: me.moniker || "",
          monikerHtml: me.monikerHtml || "",
          flags: flags,
          location: me.location || "",
          avatar: me.avatar || "",
          isStaff: isStaff,
        };
      })
      .catch(function () { return null; });
  }

  function doSignOut() {
    try { sessionStorage.removeItem("ursamu.webAdmin.token"); } catch (_) {}
    try { localStorage.removeItem("ursamu.webAdmin.token"); } catch (_) {}
    window.location.href = pubPath("");
  }

  function safeNextPath(raw) {
    var n = String(raw || "").trim();
    if (!n || n.charAt(0) !== "/" || n.indexOf("//") === 0) return pubPath("");
    if (n.indexOf("/site") !== 0 && n.indexOf("/admin") !== 0) {
      return pubPath("");
    }
    return n;
  }

  function updateNavUser(user) {
    var existingNavUser = document.getElementById("nav-user-item");
    if (existingNavUser) existingNavUser.remove();

    if (!navList) return;
    var li = document.createElement("li");
    li.id = "nav-user-item";
    li.className = "site-nav-user-item";

    if (user) {
      // Compact account control — no full profile page
      var wrap = document.createElement("div");
      wrap.className = "site-nav-account";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "site-nav-user-link site-nav-account-toggle";
      btn.setAttribute("aria-haspopup", "true");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", "site-nav-account-menu");

      if (user.avatar) {
        var img = document.createElement("img");
        img.src = user.avatar;
        img.className = "site-nav-avatar";
        img.alt = "";
        btn.appendChild(img);
      } else {
        var init = document.createElement("span");
        init.className = "site-nav-avatar-initial";
        init.textContent = user.name.charAt(0).toUpperCase();
        btn.appendChild(init);
      }

      var nameSpan = document.createElement("span");
      nameSpan.className = "site-nav-username";
      // Prefer server-built moniker HTML (web-safe colors); else plain name
      if (user.monikerHtml) {
        nameSpan.innerHTML = user.monikerHtml;
      } else {
        nameSpan.textContent = user.moniker || user.name;
      }
      btn.appendChild(nameSpan);

      var menu = document.createElement("div");
      menu.id = "site-nav-account-menu";
      menu.className = "site-nav-account-menu";
      menu.hidden = true;
      menu.setAttribute("role", "menu");

      if (user.isStaff) {
        var staffA = document.createElement("a");
        staffA.href = "/admin/";
        staffA.className = "site-nav-account-item";
        staffA.setAttribute("role", "menuitem");
        staffA.textContent = "Staff console";
        menu.appendChild(staffA);
      }

      var outBtn = document.createElement("button");
      outBtn.type = "button";
      outBtn.className = "site-nav-account-item site-nav-account-signout";
      outBtn.setAttribute("role", "menuitem");
      outBtn.textContent = "Sign out";
      outBtn.addEventListener("click", function () {
        doSignOut();
      });
      menu.appendChild(outBtn);

      function setOpen(open) {
        menu.hidden = !open;
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        wrap.classList.toggle("is-open", open);
      }

      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        setOpen(menu.hidden);
      });

      document.addEventListener("click", function () {
        setOpen(false);
      });
      menu.addEventListener("click", function (e) {
        e.stopPropagation();
      });

      wrap.appendChild(btn);
      wrap.appendChild(menu);
      li.appendChild(wrap);
    } else {
      var loginA = document.createElement("a");
      loginA.href = pubPath("login");
      loginA.className = "site-nav-login-link" +
        (MODE === "login" ? " is-active" : "");
      loginA.textContent = "Sign in";
      li.appendChild(loginA);
    }

    navList.appendChild(li);
  }

  function injectSpecialPage(user) {
    if (!mainEl) return;

    if (MODE === "login") {
      var innerHtml = "<section class=\"site-section\" style=\"width:100%;display:flex;flex-direction:column;align-items:center;\">" +
        "<h2 class=\"site-section__title\">" + (user ? "Account" : (currentAuthMode === "register" ? "Register" : "Sign In")) + "</h2>" +
        "<div class=\"site-rule site-rule--image\" role=\"presentation\" style=\"width:100%;max-width:400px;\"></div>" +
        "<div class=\"site-section__body\" style=\"width:100%;display:flex;justify-content:center;\">";

      if (user) {
        // Already signed in — no profile page; useful actions only
        innerHtml += "<div class=\"site-auth-card\" style=\"text-align:center;\">" +
          "<p>Signed in as <strong>" + esc(user.name) + "</strong>.</p>" +
          "<div class=\"site-profile-actions\" style=\"justify-content:center;margin-top:1rem;\">" +
          "<a href=\"" + pubPath("") + "\" class=\"site-auth-submit\" style=\"display:inline-flex;align-items:center;justify-content:center;text-decoration:none;padding:0 1.25rem;width:auto;\">Continue to site</a>";
        if (user.isStaff) {
          innerHtml += "<a href=\"/admin/\" class=\"site-auth-logout\" style=\"display:inline-flex;align-items:center;justify-content:center;text-decoration:none;\">Staff console</a>";
        }
        innerHtml += "<button type=\"button\" class=\"site-auth-logout\" id=\"page-logout-link\">Sign out</button>" +
          "</div></div>";
      } else {
        var isReg = (currentAuthMode === "register");
        innerHtml += "<div class=\"site-auth-card\" style=\"width:100%;margin:0.5rem 0 0;\">" +
          "<div class=\"site-auth-tabs\">" +
          "<button type=\"button\" class=\"site-auth-tab" + (isReg ? "" : " is-active") + "\" id=\"tab-login\">Sign In</button>" +
          "<button type=\"button\" class=\"site-auth-tab" + (isReg ? " is-active" : "") + "\" id=\"tab-register\">Register</button>" +
          "</div>" +
          "<form class=\"site-auth-form\" id=\"site-auth-form\">" +
          "<div class=\"site-auth-field\">" +
          "<label class=\"site-auth-label\" for=\"auth-username\">Username</label>" +
          "<input type=\"text\" id=\"auth-username\" class=\"site-auth-input\" autocomplete=\"username\" required />" +
          "</div>" +
          "<div class=\"site-auth-field" + (isReg ? "" : " site-hidden") + "\" id=\"auth-email-group\">" +
          "<label class=\"site-auth-label\" for=\"auth-email\">Email</label>" +
          "<input type=\"email\" id=\"auth-email\" class=\"site-auth-input\" autocomplete=\"email\"" + (isReg ? " required" : "") + " />" +
          "</div>" +
          "<div class=\"site-auth-field\">" +
          "<label class=\"site-auth-label\" for=\"auth-password\">Password</label>" +
          "<input type=\"password\" id=\"auth-password\" class=\"site-auth-input\" autocomplete=\"current-password\" required />" +
          "</div>" +
          "<div class=\"site-auth-error site-hidden\" id=\"auth-error\"></div>" +
          "<button type=\"submit\" class=\"site-auth-submit\" id=\"auth-submit-btn\">" + (isReg ? "Create Account" : "Sign In") + "</button>" +
          "</form></div>";
      }

      innerHtml += "</div></section>";

      mainEl.innerHTML = innerHtml;
      wireAuthEvents(user);
    } else if (MODE === "profile") {
      // Legacy /site/profile — redirect home (account lives in nav menu)
      window.location.replace(pubPath(""));
      return;
    }
  }

  function renderRight(user) {
    if (!rightPanels || MODE === "login" || MODE === "profile") {
      return;
    }
    var html = "";

    // TOC (wiki + help topics)
    var toc = buildToc();
    if (toc.length) {
      html += "<section class=\"site-menu menu\">" +
        "<h2 class=\"site-menu__title\">On this page</h2>" +
        "<ul class=\"site-menu__list\">";
      for (var i = 0; i < toc.length; i++) {
        var cls = toc[i].level === "H3" ? " class=\"toc-sub\"" : "";
        html += "<li" + cls + "><a href=\"#" + esc(toc[i].id) + "\">" +
          esc(toc[i].text) + "</a></li>";
      }
      html += "</ul></section>";
    }

    // Edit panel (wiki mode + staff)
    if (MODE === "wiki" && WIKI_PATH && user && user.isStaff) {
      var editUrl = "/admin/#/wiki/" + encodeURIComponent(WIKI_PATH);
      var histUrl = "/api/v1/wiki/" + encodeURIComponent(WIKI_PATH) + "/history";
      html += "<section class=\"site-menu menu\">" +
        "<h2 class=\"site-menu__title\">Edit</h2>" +
        "<ul class=\"site-menu__list\">" +
        "<li><a href=\"" + esc(editUrl) + "\">Edit this page</a></li>" +
        "<li><a href=\"" + esc(histUrl) + "\">Page history</a></li>" +
        "</ul></section>";
    }

    rightPanels.innerHTML = html;
  }

  function wireAuthEvents(user) {
    var logoutBtn = document.getElementById("profile-logout-btn") ||
      document.getElementById("page-logout-link");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        doSignOut();
      });
    }

    var tabLogin = document.getElementById("tab-login");
    var tabRegister = document.getElementById("tab-register");
    var authForm = document.getElementById("site-auth-form");

    if (tabLogin && tabRegister) {
      tabLogin.addEventListener("click", function () {
        if (currentAuthMode !== "login") {
          currentAuthMode = "login";
          injectSpecialPage(user);
        }
      });
      tabRegister.addEventListener("click", function () {
        if (currentAuthMode !== "register") {
          currentAuthMode = "register";
          injectSpecialPage(user);
        }
      });
    }

    if (authForm) {
      authForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var userInput = document.getElementById("auth-username");
        var passInput = document.getElementById("auth-password");
        var emailInput = document.getElementById("auth-email");
        var errDiv = document.getElementById("auth-error");
        var submitBtn = document.getElementById("auth-submit-btn");

        if (!userInput || !passInput || !errDiv || !submitBtn) return;

        var username = userInput.value.trim();
        var password = passInput.value;
        var email = emailInput ? emailInput.value.trim() : "";

        errDiv.classList.add("site-hidden");
        errDiv.textContent = "";
        submitBtn.disabled = true;

        var isReg = (currentAuthMode === "register");
        var endpoint = isReg ? "/api/v1/register" : "/api/v1/login";
        var payload = { username: username, password: password };
        if (isReg) payload.email = email;

        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "same-origin",
        })
          .then(function (r) {
            return r.json().then(function (d) {
              return { ok: r.ok, status: r.status, data: d };
            });
          })
          .then(function (res) {
            submitBtn.disabled = false;
            if (!res.ok || !res.data || !res.data.token) {
              errDiv.textContent = (res.data && res.data.error) ? res.data.error : "Authentication failed.";
              errDiv.classList.remove("site-hidden");
              return;
            }
            try {
              sessionStorage.setItem("ursamu.webAdmin.token", res.data.token);
            } catch (_) {}
            probeAuth().then(function (u) {
              updateNavUser(u);
              var params = new URLSearchParams(window.location.search);
              var next = safeNextPath(params.get("next") || pubPath(""));
              window.location.href = next;
            });
          })
          .catch(function () {
            submitBtn.disabled = false;
            errDiv.textContent = "Network error. Please try again.";
            errDiv.classList.remove("site-hidden");
          });
      });
    }
  }

  // ── Search wiring ──────────────────────────────────────────────────────────

  function wireSearch(pages) {
    var form  = document.getElementById("search");
    var input = document.getElementById("site-q");
    if (!form || !input) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = (input.value || "").trim().toLowerCase();
      if (!q) return;
      var hits = pages.filter(function (p) {
        return !p.draft && (
          (p.title || "").toLowerCase().includes(q) ||
          (p.path  || "").toLowerCase().includes(q) ||
          (p.tags  || []).some(function (t) {
            return String(t).toLowerCase().includes(q);
          })
        );
      });
      if (!hits.length) {
        alert("No pages match \"" + q + "\".");
        return;
      }
      if (hits.length === 1) {
        window.location.href = wikiHref(hits[0].path);
        return;
      }
      // Multiple results — navigate to wiki index with query
      window.location.href = pubPath("wiki/") + "?q=" + encodeURIComponent(q);
    });
  }

  // ── Scroll nav + TOC spy ───────────────────────────────────────────────────

  var threshold = 100;
  function onScroll() {
    if (!siteNav) return;
    siteNav.classList.toggle("is-scrolled", window.scrollY > threshold);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /** Highlight right-rail TOC links for headings in view (optional). */
  function wireScrollSpy() {
    if (!mainEl || !rightPanels) return;
    var links = rightPanels.querySelectorAll('a[href^="#"]');
    if (!links.length) return;
    var heads = [];
    for (var i = 0; i < links.length; i++) {
      var id = (links[i].getAttribute("href") || "").slice(1);
      var el = id ? document.getElementById(id) : null;
      if (el) heads.push({ el: el, link: links[i] });
    }
    if (!heads.length || typeof IntersectionObserver === "undefined") return;
    var obs = new IntersectionObserver(function (entries) {
      for (var j = 0; j < entries.length; j++) {
        if (!entries[j].isIntersecting) continue;
        var t = entries[j].target;
        for (var k = 0; k < heads.length; k++) {
          heads[k].link.classList.toggle(
            "is-active",
            heads[k].el === t,
          );
        }
      }
    }, { rootMargin: "-20% 0px -60% 0px", threshold: 0 });
    for (var h = 0; h < heads.length; h++) obs.observe(heads[h].el);
  }


  // ── Mobile hamburger nav ─────────────────────────────────────────────────

  function setNavOpen(open) {
    if (!siteNav) return;
    siteNav.classList.toggle("is-open", !!open);
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute(
        "aria-label",
        open ? "Close menu" : "Open menu",
      );
    }
    document.body.classList.toggle("site-nav-open", !!open);
  }

  function isNavOpen() {
    return !!(siteNav && siteNav.classList.contains("is-open"));
  }

  function wireNavMenu() {
    if (!siteNav || !navToggle) return;

    navToggle.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      setNavOpen(!isNavOpen());
    });

    // Close when a nav link is chosen (SPA + full load)
    if (navList) {
      navList.addEventListener("click", function (e) {
        var a = e.target && e.target.closest
          ? e.target.closest("a")
          : null;
        if (!a) return;
        // Keep open for account toggle inside drawer
        if (a.classList.contains("site-nav-account-toggle")) return;
        setNavOpen(false);
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isNavOpen()) setNavOpen(false);
    });

    // Tap dimmed backdrop (shell::after is not clickable — use body)
    document.addEventListener("click", function (e) {
      if (!isNavOpen()) return;
      var t = e.target;
      if (siteNav.contains(t)) return;
      setNavOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 720 && isNavOpen()) setNavOpen(false);
    });
  }

  // ── Boot sequence ──────────────────────────────────────────────────────────

  wireNavMenu();

  var cfgUrl = root.getAttribute("data-site-config") || "/site/config.json";

  // 1. Config
  var configPromise = fetch(cfgUrl, { credentials: "same-origin" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (cfg) {
      // Server config wins. Only fall back to HTML data-skin when the
      // config request failed or omitted skin entirely — never overwrite
      // a live theme with a stale injected data-skin (cached HTML).
      if (
        cfg &&
        !cfg.skin &&
        !cfg.skinCss &&
        !cfg.skinHref
      ) {
        var htmlSkin = root.getAttribute("data-skin");
        if (htmlSkin && htmlSkin !== "custom") {
          cfg = Object.assign({}, cfg, { skin: htmlSkin });
        }
      }
      applyConfig(cfg || {});
      return cfg || {};
    })
    .catch(function () {
      var htmlSkin = root.getAttribute("data-skin");
      if (htmlSkin && htmlSkin !== "custom") applyConfig({ skin: htmlSkin });
      return {};
    });

  // 2. Wiki list (all modes — needed for left sidebar and wikilink resolution)
  var listPromise = fetch("/api/v1/wiki", { credentials: "same-origin" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (pages) {
      if (!Array.isArray(pages)) return [];
      buildIndex(pages);
      return pages;
    })
    .catch(function () { return []; });

  // 3. Auth probe
  var authPromise = probeAuth();

  // ── Public help browser (/help, /help/<topic>) ───────────────────────────

  function fetchHelpIndex() {
    if (helpIndex) return Promise.resolve(helpIndex);
    if (helpIndexPromise) return helpIndexPromise;
    helpIndexPromise = fetch("/api/v1/help", {
      credentials: "same-origin",
    })
      .then(function (r) {
        return r.ok ? r.json() : { sections: [], topics: [] };
      })
      .then(function (data) {
        helpIndex = {
          sections: Array.isArray(data.sections) ? data.sections : [],
          topics: Array.isArray(data.topics) ? data.topics : [],
        };
        return helpIndex;
      })
      .catch(function () {
        helpIndex = { sections: [], topics: [] };
        return helpIndex;
      });
    return helpIndexPromise;
  }

  function stripMushCodes(s) {
    return String(s || "")
      .replace(/%c[hn]/gi, "")
      .replace(/%c[a-z]/gi, "")
      .replace(/%x[0-9a-fA-F]{6}/g, "")
      .replace(/%[rR]/g, "\n")
      .replace(/%t/gi, "  ")
      .replace(/%b/gi, " ")
      .replace(/%[a-zA-Z]/g, "");
  }

  /** Prepare help body for the shared markdown renderer. */
  function helpBodyToMarkdown(raw) {
    var t = stripMushCodes(raw).replace(/\r\n/g, "\n").trim();
    if (!t) return "";
    // ALL-CAPS section labels → ### headings (SYNTAX, SWITCHES, …)
    t = t.replace(
      /^([A-Z][A-Z0-9 /+._-]{1,48})\s*$/gm,
      function (_m, label) {
        // Skip lines that look like code samples
        if (/[@+#]/.test(label)) return label;
        return "### " + label;
      },
    );
    // Bare first-line +TOPIC titles → drop if already shown as H2
    t = t.replace(/^\+[A-Z0-9][A-Z0-9 /._-]{0,60}\s*\n+/, "");
    return t;
  }

  function helpTopicByName(name) {
    if (!helpIndex || !helpIndex.topics) return null;
    var want = String(name || "").toLowerCase();
    for (var i = 0; i < helpIndex.topics.length; i++) {
      var t = helpIndex.topics[i];
      if (String(t.name || "").toLowerCase() === want) return t;
    }
    // tag / alias match
    for (var j = 0; j < helpIndex.topics.length; j++) {
      var e = helpIndex.topics[j];
      var tags = Array.isArray(e.tags) ? e.tags : [];
      for (var k = 0; k < tags.length; k++) {
        if (String(tags[k]).toLowerCase() === want) return e;
      }
    }
    return null;
  }

  function helpTopicsInSection(section) {
    if (!helpIndex || !helpIndex.topics) return [];
    var sec = String(section || "").toLowerCase();
    return helpIndex.topics.filter(function (t) {
      return String(t.section || "").toLowerCase() === sec;
    }).sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name));
    });
  }

  function helpActiveSection() {
    if (!HELP_PATH) return "";
    var topic = helpTopicByName(HELP_PATH);
    if (topic) return String(topic.section || "");
    // path is a section name
    if (helpIndex && helpIndex.sections) {
      var low = HELP_PATH.toLowerCase();
      for (var i = 0; i < helpIndex.sections.length; i++) {
        if (String(helpIndex.sections[i]).toLowerCase() === low) {
          return helpIndex.sections[i];
        }
      }
    }
    // nested topic prefix (mail/send → mail section if unknown)
    if (HELP_PATH.indexOf("/") !== -1) {
      return HELP_PATH.split("/")[0];
    }
    return "";
  }

  function renderHelpLeft() {
    if (!leftPanels) return;
    var q = "";
    var searchEl = document.getElementById("help-side-search");
    if (searchEl) q = String(searchEl.value || "").trim().toLowerCase();

    var activeSec = helpActiveSection();
    var sections = (helpIndex && helpIndex.sections) || [];
    var html = "";

    html += "<section class=\"site-menu menu site-help-search\">" +
      "<h2 class=\"site-menu__title\">Search help</h2>" +
      "<label class=\"site-sr-only\" for=\"help-side-search\">" +
      "Search topics</label>" +
      "<input type=\"search\" id=\"help-side-search\" " +
      "class=\"site-help-search__input\" " +
      "placeholder=\"Topic or keyword…\" " +
      "value=\"" + esc(q) + "\" autocomplete=\"off\" />" +
      "</section>";

    if (q) {
      var hits = ((helpIndex && helpIndex.topics) || []).filter(
        function (t) {
          var name = String(t.name || "").toLowerCase();
          var body = String(t.content || "").toLowerCase();
          var sec = String(t.section || "").toLowerCase();
          return name.indexOf(q) !== -1 ||
            body.indexOf(q) !== -1 ||
            sec.indexOf(q) !== -1;
        },
      ).slice(0, 40);
      html += "<section class=\"site-menu menu\">" +
        "<h2 class=\"site-menu__title\">Matches</h2>" +
        "<ul class=\"site-menu__list\">";
      if (!hits.length) {
        html += "<li class=\"site-help-empty\">No matches.</li>";
      } else {
        for (var h = 0; h < hits.length; h++) {
          var hit = hits[h];
          var cur = hit.name === HELP_PATH ? " class=\"is-current\"" : "";
          html += "<li" + cur + "><a href=\"" +
            helpHref(hit.name) + "\">" + esc(hit.name) +
            "</a></li>";
        }
      }
      html += "</ul></section>";
    } else {
      html += "<section class=\"site-menu menu\">" +
        "<h2 class=\"site-menu__title\">Sections</h2>" +
        "<ul class=\"site-menu__list\">";
      html += "<li" + (!HELP_PATH ? " class=\"is-current\"" : "") +
        "><a href=\"" + helpHref("") + "\">All sections</a></li>";
      for (var s = 0; s < sections.length; s++) {
        var secName = sections[s];
        var isCur = String(secName).toLowerCase() ===
          String(activeSec).toLowerCase() &&
          !helpTopicByName(HELP_PATH);
        // Also highlight section when viewing a topic in it
        if (helpTopicByName(HELP_PATH) &&
          String(activeSec).toLowerCase() ===
            String(secName).toLowerCase()) {
          isCur = true;
        }
        var n = helpTopicsInSection(secName).length;
        html += "<li" + (isCur ? " class=\"is-current\"" : "") +
          "><a href=\"" + helpHref(secName) + "\">" +
          esc(secName) +
          " <span class=\"site-help-count\">" + n +
          "</span></a></li>";
      }
      html += "</ul></section>";

      if (activeSec) {
        var topics = helpTopicsInSection(activeSec);
        html += "<section class=\"site-menu menu\">" +
          "<h2 class=\"site-menu__title\">" +
          esc(activeSec) + "</h2>" +
          "<ul class=\"site-menu__list\">";
        for (var t = 0; t < topics.length; t++) {
          var top = topics[t];
          var on = top.name === HELP_PATH ? " class=\"is-current\"" : "";
          html += "<li" + on + "><a href=\"" +
            helpHref(top.name) + "\">" +
            esc(top.name) + "</a></li>";
        }
        html += "</ul></section>";
      }
    }

    leftPanels.innerHTML = html;
    var inp = document.getElementById("help-side-search");
    if (inp) {
      var timer = null;
      inp.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          renderHelpLeft();
          var again = document.getElementById("help-side-search");
          if (again) {
            again.focus();
            var len = again.value.length;
            try { again.setSelectionRange(len, len); } catch (_) {}
          }
        }, 120);
      });
    }
  }

  function helpBlurb(t, maxLen) {
    var n = maxLen || 100;
    return stripMushCodes(t.content || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, n);
  }

  /** Section index — table (not card grid). */
  function injectHelpIndex() {
    if (!mainEl || !helpIndex) return;
    setDocumentTitle("Help");
    var sections = helpIndex.sections || [];
    var allTopics = helpIndex.topics || [];
    var body = "<div class=\"site-help-index\">";
    body += "<p class=\"site-help-lead\">Browse command and " +
      "system help by section, or search in the left rail. " +
      allTopics.length + " topic" +
      (allTopics.length === 1 ? "" : "s") + ".</p>";
    if (!sections.length) {
      body += "<p>No help topics are available yet.</p>";
    } else {
      body += "<div class=\"site-help-table-wrap\">" +
        "<table class=\"site-help-table\">" +
        "<thead><tr>" +
        "<th scope=\"col\">Section</th>" +
        "<th scope=\"col\">Topics</th>" +
        "<th scope=\"col\">Sample</th>" +
        "<th scope=\"col\"><span class=\"site-sr-only\">" +
        "Open</span></th>" +
        "</tr></thead><tbody>";
      for (var i = 0; i < sections.length; i++) {
        var sec = sections[i];
        var topics = helpTopicsInSection(sec);
        var sample = topics.slice(0, 4).map(function (t) {
          return t.name;
        }).join(", ");
        if (topics.length > 4) {
          sample += "…";
        }
        body += "<tr>" +
          "<td><a href=\"" + helpHref(sec) + "\">" +
          esc(sec) + "</a></td>" +
          "<td class=\"site-help-num\">" + topics.length +
          "</td>" +
          "<td class=\"site-help-sample muted\">" +
          esc(sample || "—") + "</td>" +
          "<td class=\"site-help-open\">" +
          "<a class=\"site-help-open-link\" href=\"" +
          helpHref(sec) + "\">Open</a></td>" +
          "</tr>";
      }
      body += "</tbody></table></div>";
    }
    body += "</div>";
    mainEl.innerHTML =
      "<section class=\"site-section\">" +
      "<h2 class=\"site-section__title\">Help</h2>" +
      "<div class=\"site-rule site-rule--image\" " +
      "role=\"presentation\"></div>" +
      "<div class=\"site-section__body\">" + body +
      "</div></section>" + articleFooterHtml();
    if (rightPanels) rightPanels.innerHTML = "";
  }

  /** Topics in a section — table. */
  function injectHelpSection(section) {
    if (!mainEl) return;
    var topics = helpTopicsInSection(section);
    setDocumentTitle(section + " · Help");
    var body = "";
    if (!topics.length) {
      body = "<p>No topics in this section.</p>";
    } else {
      body = "<div class=\"site-help-table-wrap\">" +
        "<table class=\"site-help-table\">" +
        "<thead><tr>" +
        "<th scope=\"col\">Topic</th>" +
        "<th scope=\"col\">Summary</th>" +
        "<th scope=\"col\"><span class=\"site-sr-only\">" +
        "Open</span></th>" +
        "</tr></thead><tbody>";
      for (var i = 0; i < topics.length; i++) {
        var t = topics[i];
        var blurb = helpBlurb(t, 120);
        body += "<tr>" +
          "<td><a href=\"" + helpHref(t.name) + "\">" +
          "<code>" + esc(t.name) + "</code></a></td>" +
          "<td class=\"site-help-sample muted\">" +
          (blurb
            ? esc(blurb) + (blurb.length >= 120 ? "…" : "")
            : "—") +
          "</td>" +
          "<td class=\"site-help-open\">" +
          "<a class=\"site-help-open-link\" href=\"" +
          helpHref(t.name) + "\">Open</a></td>" +
          "</tr>";
      }
      body += "</tbody></table></div>";
    }
    mainEl.innerHTML =
      "<section class=\"site-section\">" +
      "<p class=\"site-help-crumb\"><a href=\"" +
      helpHref("") + "\">Help</a> / " + esc(section) +
      "</p>" +
      "<h2 class=\"site-section__title\">" + esc(section) +
      "</h2>" +
      "<div class=\"site-rule site-rule--image\" " +
      "role=\"presentation\"></div>" +
      "<div class=\"site-section__body\">" + body +
      "</div></section>" + articleFooterHtml();
    if (rightPanels) rightPanels.innerHTML = "";
  }

  function injectHelpTopic(entry) {
    if (!mainEl || !entry) return;
    var title = String(entry.name || HELP_PATH || "Help");
    setDocumentTitle(title + " · Help");
    var md = helpBodyToMarkdown(entry.content || "");
    var bodyHtml = renderMarkdown(md, "");
    if (!bodyHtml.trim()) {
      bodyHtml = "<p><em>No detailed help for this topic.</em></p>";
    }
    var sec = String(entry.section || "");
    var crumb = "<p class=\"site-help-crumb\">" +
      "<a href=\"" + helpHref("") + "\">Help</a>";
    if (sec) {
      crumb += " / <a href=\"" + helpHref(sec) + "\">" +
        esc(sec) + "</a>";
    }
    crumb += " / " + esc(title) + "</p>";
    var meta = "";
    if (entry.source) {
      meta = "<p class=\"site-help-meta muted\">Source: " +
        esc(entry.source) + "</p>";
    }
    mainEl.innerHTML =
      "<section class=\"site-section\">" + crumb +
      "<h2 class=\"site-section__title\">" + esc(title) +
      "</h2>" +
      "<div class=\"site-rule site-rule--image\" " +
      "role=\"presentation\"></div>" +
      "<div class=\"site-section__body site-help-body\">" +
      meta + bodyHtml +
      "</div></section>" + articleFooterHtml();
    // TOC into right rail
    if (rightPanels) {
      var toc = buildToc();
      var rh = "";
      if (toc.length) {
        rh += "<section class=\"site-menu menu\">" +
          "<h2 class=\"site-menu__title\">On this page</h2>" +
          "<ul class=\"site-menu__list\">";
        for (var i = 0; i < toc.length; i++) {
          var cls = toc[i].level === "H3" ? " class=\"toc-sub\"" : "";
          rh += "<li" + cls + "><a href=\"#" +
            esc(toc[i].id) + "\">" +
            esc(toc[i].text) + "</a></li>";
        }
        rh += "</ul></section>";
      }
      rightPanels.innerHTML = rh;
    }
  }

  function injectHelpNotFound(path) {
    injectArticle({
      title: "Help not found",
      body: "No help topic at `" + String(path || "") + "`.\n\n" +
        "[Browse all help](" + helpHref("") + ").",
    });
    if (rightPanels) rightPanels.innerHTML = "";
  }

  function loadHelpRoute() {
    injectLoadingState(HELP_PATH || "Help");
    return fetchHelpIndex().then(function () {
      if (!HELP_PATH) {
        injectHelpIndex();
        return null;
      }
      var topic = helpTopicByName(HELP_PATH);
      if (topic) {
        // Prefer fresh API body when available
        return fetch(
          "/api/v1/help/" +
            encodeURIComponent(HELP_PATH).replace(/%2F/gi, "/"),
          { credentials: "same-origin" },
        )
          .then(function (r) {
            return r.ok ? r.json() : null;
          })
          .then(function (data) {
            var entry = (data && data.entry) ? data.entry : topic;
            injectHelpTopic(entry);
            return entry;
          })
          .catch(function () {
            injectHelpTopic(topic);
            return topic;
          });
      }
      // Section listing?
      var secMatch = null;
      var sections = (helpIndex && helpIndex.sections) || [];
      for (var i = 0; i < sections.length; i++) {
        if (String(sections[i]).toLowerCase() ===
          HELP_PATH.toLowerCase()) {
          secMatch = sections[i];
          break;
        }
      }
      if (secMatch) {
        injectHelpSection(secMatch);
        return null;
      }
      injectHelpNotFound(HELP_PATH);
      return null;
    });
  }

  // 4. Route loader & SPA navigation
  function loadCurrentRoute() {
    setNavOpen(false);
    refreshPathname();
    refreshPub();
    WIKI_PATH = wikiPathFromUrl();
    HELP_PATH = helpPathFromUrl();
    MODE = modeFromUrl();
    // Default compact until wiki article with bgImage loads
    pageBgImage = false;
    if (siteConfig && Object.keys(siteConfig).length) {
      applyConfig(siteConfig);
    }
    updateSidebarAndBannerVisibility();

    var articlePromise;
    if (MODE === "help") {
      articlePromise = loadHelpRoute();
    } else if (MODE === "wiki" && WIKI_PATH) {
      var slug = WIKI_PATH.split("/").pop().replace(/[-_]/g, " ");
      var loadTitle = slug ? (slug.charAt(0).toUpperCase() + slug.slice(1)) : "Wiki";
      injectLoadingState(loadTitle);

      articlePromise = fetch(
        "/api/v1/wiki/" + encodeWikiApiPath(WIKI_PATH),
        { credentials: "same-origin" }
      )
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (page) {
          if (!page) {
            injectNotFound(WIKI_PATH);
            return null;
          }
          if (page.type === "directory" && Array.isArray(page.children)) {
            injectWikiListing({
              title: page.title || page.path || WIKI_PATH,
              items: page.children,
            });
            return page;
          }
          if (page.body != null || page.title) {
            injectArticle(page);
            return page;
          }
          injectNotFound(WIKI_PATH);
          return page;
        })
        .catch(function () {
          injectNotFound(WIKI_PATH);
          return null;
        });
    } else if (MODE === "wiki" && !WIKI_PATH) {
      injectLoadingState("Wiki");
      articlePromise = listPromise.then(function (pages) {
        var items = (pages || []).slice().sort(function (a, b) {
          return String(a.path || "").localeCompare(String(b.path || ""));
        });
        injectWikiListing({ title: "Wiki", items: items });
        return { title: "Wiki", items: items };
      });
    } else if (MODE === "home") {
      // Home main column = wiki path "home" only.
      // featured:true pages are left-menu links, not the homepage body.
      injectLoadingState("Home");
      articlePromise = fetch("/api/v1/wiki/home", {
        credentials: "same-origin",
      })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (page) {
          if (page && page.body) {
            injectArticle(page);
            return page;
          }
          if (mainEl) {
            injectArticle({
              title: "Welcome",
              body: "Welcome to the game.\n\n" +
                "Edit the wiki page **home** for this content, or browse " +
                "**Wiki** in the nav. Mark pages **Featured** to list them " +
                "in the left menu (separate from home).",
            });
          }
          return null;
        })
        .catch(function () {
          if (mainEl) {
            injectArticle({
              title: "Welcome",
              body: "Welcome. The wiki could not be loaded right now.",
            });
          }
          return null;
        });
    } else {
      articlePromise = Promise.resolve(null);
    }

    return Promise.all([listPromise, articlePromise, configPromise])
      .then(function (results) {
        var pages = results[0];
        wireSearch(pages);
        updateSidebarAndBannerVisibility();
        renderLeft(pages);
        return authPromise.then(function (user) {
          updateNavUser(user);
          if (MODE === "login" || MODE === "profile") {
            injectSpecialPage(user);
          }
          renderRight(user);
          wireScrollSpy();
        });
      });
  }

  // Intercept internal wiki links for instant SPA navigation without full reloads
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    var href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || a.target === "_blank") return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var targetUrl;
    try { targetUrl = new URL(href, window.location.href); } catch (_) { return; }
    if (targetUrl.origin !== window.location.origin) return;

    var p = targetUrl.pathname;
    if (
      p.startsWith("/wiki") ||
      p.startsWith("/site/wiki") ||
      p.startsWith("/help") ||
      p.startsWith("/site/help") ||
      p === "/site/" ||
      p === "/site" ||
      p === "/"
    ) {
      e.preventDefault();
      if (
        window.location.pathname + window.location.search ===
          targetUrl.pathname + targetUrl.search
      ) {
        return;
      }
      window.history.pushState({}, "", targetUrl.href);
      loadCurrentRoute();
    }
  });

  window.addEventListener("popstate", function () {
    loadCurrentRoute();
  });

  // Initial route load
  loadCurrentRoute();

})();
