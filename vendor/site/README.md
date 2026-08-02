# @ursamu/site

Public front-end shell for UrsaMU games.

- **Layout** from the Court template (nav · banner · left / main / right · footer)
- **Tokens** from [`design.md`](./design.md) (same family as staff `design.md`)
- **Skins** as one CSS file — ship Court look or your own

## Install

```json
// deno.json
"@ursamu/site": "jsr:@ursamu/site@^0.1.0"
```

```json
// config/config.json
{
  "server": {
    "plugins": ["@ursamu/site"]
  },
  "plugins": {
    "site": {
      "skin": "default",
      "title": "My Game",
      "serveRoot": false
    }
  }
}
```

Open **`/site/`** after start.

## Skins

| Value | Look |
|-------|------|
| `default` | design.md violet night (no art) |
| `court` | Court of Miracles template (cream / gold / art) |
| `skinCss` URL | Your file — full re-skin |

### Court-identical

```json
"plugins": {
  "site": {
    "skin": "court",
    "title": "Court of Miracles",
    "bannerImage": "/site/skins/court/imgs/header.png",
    "nav": [
      { "label": "Home", "href": "/site/", "active": true },
      { "label": "Characters", "href": "#" },
      { "label": "Help", "href": "#" },
      { "label": "Wiki", "href": "#" }
    ]
  }
}
```

With `"skin": "court"` only, the plugin fills in Court title, header
banner, and demo nav automatically.

### Fully custom CSS (re-skin)

1. Copy the example skin:

```bash
mkdir -p theme
cp node_modules…/css/skins/custom.example.css theme/site.css
# or from the package after install:
#   public/css/skins/custom.example.css
```

2. Edit tokens and image URLs in `theme/site.css`.

3. Point the plugin at it:

```json
"plugins": {
  "site": {
    "themeDir": "theme",
    "skinCss": "/site/theme/site.css",
    "title": "My Game",
    "bannerImage": "/site/theme/imgs/header.png"
  }
}
```

`themeDir` is resolved from the game root and served under
`/site/theme/…`. Put CSS, fonts, and images there.

You can also host CSS on a CDN:

```json
"skinCss": "https://cdn.example.com/my-game.css"
```

## CSS architecture

```
/site/css/reset.css
/site/css/tokens.css       ← variables only (design.md family)
/site/css/layout.css       ← framing (no brand colors)
/site/css/components.css   ← menus, search, prose
/site/css/skins/*.css      ← brand (last wins)
```

Stable classes: `.site-shell`, `.site-nav`, `.site-banner`,
`.site-body`, `.site-aside--start|end`, `.site-main`, `.site-footer`.

See [design.md](./design.md) for the full contract.

## Config reference

| Field | Type | Default | Notes |
|-------|------|---------|--------|
| `skin` | string | `"default"` | `default` \| `court` \| path |
| `skinCss` | string | — | Wins over `skin` |
| `title` | string | game name | Brand + document title |
| `bannerImage` | string | — | Hero image URL |
| `plainBg` | boolean | `false` | Drop top background art |
| `mount` | string | `"/site"` | URL prefix |
| `serveRoot` | boolean | `false` | Also serve index at `/` |
| `themeDir` | string | — | Game dir → `/site/theme/` |
| `nav` | array | demo | `{ label, href, active? }` |

## Dev

```bash
cd packages/site
deno task check
deno task test
# With a running game that loads @ursamu/site:
open http://127.0.0.1:4203/site/
```

Force a skin in the browser without config:

```html
<html data-skin="court">
```
