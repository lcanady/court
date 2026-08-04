# Changelog

## 0.1.31

- Help uses the single left search box (placeholder “Search help…”);
  removed duplicate Search help field. `?q=` filters the topic table.

## 0.1.30

- Help index: single Topic column (no Section/Open), Figma table
- Help bodies: escape `<>`, keep line breaks, SYNTAX headings,
  fenced example blocks — prose matches wiki sample

## 0.1.29

- Help section filters use `?section=` so they never clash with
  topic names (e.g. `channel`).

## 0.1.28

- Help index is a flat topic table (Topic / Section / Open),
  like wiki — not a section directory. Side nav sections filter.

## 0.1.27

- Help browser sends Bearer token when signed in so staff
  see admin topics; public/anonymous only get player help.

## 0.1.26

- Public **Wiki** index and directory listings use tables
  (Title / Path / Type / Updated / Tags / Open) instead of
  bullet lists.

## 0.1.25

- Public Help index + section pages use **tables** instead of
  card groups (Section/Topics/Sample and Topic/Summary).

## 0.1.24

- Public **Help** browser at `/help/` (and `/site/help/`):
  section index, section listings, topic pages, left-rail
  search. Uses `GET /api/v1/help` from `@ursamu/help`.
- Default nav: Home / Wiki / Help (Help no longer `#`).
- Strips MUSH color codes; ALL-CAPS labels → headings.

## 0.1.23

- Sync plugin.version with package version (was stuck at 0.1.19).

## 0.1.22

- Short wiki image refs: `![crest](crest.png)` expands to the
  current page’s `/api/v1/wiki/<page>/_assets/crest.png`.

## 0.1.21

- Markdown images: `![alt](url)` renders as `<img>` (lazy).
  Use on-server wiki assets:
  `/api/v1/wiki/<page>/_assets/<file>`.
- Body images are responsive (`max-width: 100%`).

## 0.1.20

- Wiki pages honor frontmatter `bgImage` (default false):
  - **on** — theme top background + home-height spacer
  - **off** — compact under nav (no title height)
- Home chrome still follows site `plainBg` / hero settings only.

## 0.1.19

- Left menu Figma order: **Featured**, then **Related**
  (section siblings). Was section-first without a Related title.

## 0.1.18

- Home main content loads wiki path **home** only (not featured).
- Featured pages stay left-menu links only.
- Brand/logo href is public home (`/` when serveRoot).

## 0.1.17

- Nav account: more space between avatar and name; show moniker
  colors via `/api/v1/me` `monikerHtml` (web-safe palette).

## 0.1.16

- Fix mobile hamburger: call `wireNavMenu()` on boot.

## 0.1.15

- Mobile hamburger nav (≤720px): brand + toggle; links open in a
  slide-down drawer. Escape / outside tap / link / resize close it.

## 0.1.14

- Theme install rewrites relative `url(...)` in CSS to absolute
  `/site/theme/installed/<id>/…` paths (CSS vars resolve against
  layout.css under `/site/css/`, which broke Court backgrounds).
- Court example theme uses absolute asset URLs; `plainBg` default
  false so the background art shows.

## 0.1.13

- Drop right-rail **Connect** menu. When `title` and `telnet` are
  both set, show the host under the hero title (`.site-banner__connect`).

## 0.1.12

- **Court is installable, not builtin.** Removed `changeling` /
  `court` named skins and `public/skins/{changeling,court}` assets
  from the package. Only `default` ships as a builtin skin.
- Court of Miracles lives at `examples/themes/court/` — pack with
  `deno task pack-theme` and install via Admin theme zip (or
  `theme/installed/court/`).
- `applySkinDefaults` no longer injects Court title/banner for a
  bare `skin: "court"` name.

## 0.1.11

- Spacing under search: left menu no longer sits flush on the
  search box (Figma ~44px). `--site-search-below` + bare-list fix
  when the first panel has no section title

## 0.1.10

- injectSiteHtml rewrites all `/site/…?v=` to current `SITE_ASSET_V`
  (base CSS links no longer stick on a stale literal in index.html)

## 0.1.9

- `plugin.version` matches package version (was stuck at 0.1.7,
  which made court safe-update report a false mismatch)

## 0.1.8

- Column gaps match Figma Main/Wiki (1728): `--site-col-gap` ≈ 50px
  between search rail and main, and main and right menu (was ~35px
  from a too-tight `clamp` max / `2vw`)
- Document gap math in `docs/figma-court-main.md`
- Cache-bust `SITE_ASSET_V` → `20260803d`

## 0.1.7

- Fix flashing home/Welcome page content during wiki page navigation:
  - Blank initial section title and skeleton pulse placeholder in `index.html`
  - Instant loading state injection in `site.js`
  - SPA router and `popstate` link handler to prevent full browser reloads


- Wiki: nested paths no longer 404 (`lore/city` was encoded as
  `lore%2Fcity`). Encode path segments; keep `/`.
- Wiki index `/wiki/` lists pages instead of stuck "Loading…"
- Directory API responses render a section listing
- Wiki mode hides site hero banner; document title is
  `Page · Site` (not site title alone on every page)

## 0.1.5

- JSR-safe public assets: serve `public/` via `fetch(import.meta.url)`
  when the package is loaded from `https://jsr.io/…` (no
  `fromFileUrl` on non-file URLs). Path checkouts still use disk.
- `listBuiltinSkins` returns shipped names under JSR (no readdir).

## 0.1.4

- Theme hot-reload: `setSiteRuntime` uses process-wide
  `globalThis` so admin activate reaches the live FE even when
  `@ursamu/web` and the site plugin resolve different module URLs
- `liveSkinHref` adds `g=<gen>` cache-bust after each theme swap
- `site.js` no longer overwrites server `skin` with stale HTML
  `data-skin` when `skinCss` is empty
- Import `registerPluginRoute` from `@ursamu/mush` (not bare
  `ursamu`) to share the game's route registry

## 0.1.3

- `serveRoot`: SPA at `/`, `/login`, `/profile`, `/wiki/*`
  (for apex hosts like court.ursamu.io)
- Client links honor apex vs `/site` mount
- Works with mush 1.0.7+ (`/` no longer always → /admin/)

## 0.1.2

- Compact layout when hero title and banner image are empty
  (Figma no-banner: content sits under nav)
- Empty `plugins.site.title` from admin stays empty (Court
  skin no longer re-fills "Court of Miracles")
- Theme zip install: `installThemeZip`, `listAllThemes`,
  `registerSiteTheme`; Court example package + `pack-theme`
- Cache-bust `SITE_ASSET_V` → `20260802k`

## 0.1.1

- Theme zip packages: `theme.json` + `site.css` + assets
- `installThemeZip` / `listAllThemes` / `registerSiteTheme`
- Install under `theme/installed/<id>/` (served via `themeDir`)
- Court example: `examples/themes/court/` + `deno task pack-theme`
- Admin upload: `POST /api/v1/admin/site/theme` (via `@ursamu/web`)

## 0.1.0

- Initial public front-end shell from court-template framing
- design.md token stack (`reset → tokens → layout → components → skin`)
- Built-in skins: `default` (violet night), `court` (Court of Miracles)
- Custom re-skin via `plugins.site.skinCss` + optional `themeDir`
- Server-side HTML injection for title / skin / banner / nav (no FOUC)
- Example skin: `public/css/skins/custom.example.css`
