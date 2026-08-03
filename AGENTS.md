# Court of Miracles: Agent Instructions

This file is the **authoritative** guide for any AI agent or developer
working on this game. Prefer it over outdated copies of CLAUDE.md /
GEMINI.md. Those files should point here.

---

## What this is

**Court of Miracles** is a *Changeling: The Lost* freehold game on the
UrsaMU engine (`jsr:@ursamu/mush` — **JSR only**, no vendor override).

- **Tone:** Victorian literary fiction, not modern chat or RPG boxed text
- **Setting:** A fog-bound, slightly wrong city of gaslight, iron, and
  bargains: the freehold's London-that-never-quite-was. Prefer atmosphere
  over naming the real city repeatedly.
- **This repo:** game code, config samples, help, softcode, and ops
  scripts. Engine and first-party plugins load from JSR pins in
  `deno.json`. Source of truth for packages is the ursamu monorepo;
  production never vendors mush/site/web.

| Layer | Tech |
|-------|------|
| Engine | `jsr:@ursamu/mush@1.0.9` |
| Public FE | `jsr:@ursamu/site@0.1.11` |
| Staff console | `jsr:@ursamu/web@0.2.41` |
| Runtime | Deno |
| DB | PGlite / TypeGraph (`data/typegraph.db`) |
| Game system | `@ursamu/cofd-plugin` (CtL / CofD 2e) |
| Jobs / mail / channels / Discord | matching `@ursamu/*` plugins |

---

## Voice & prose (non-negotiable)

All **player-facing prose** (room descriptions, exit messages, connect
text, MOTD, IC prop text, short-descs that read as narrative) must sound
**human**, **easy to read**, and **literary**. Write as if this were a
Victorian novel or a careful period short story, not a wiki stub or an
LLM summary.

### Punctuation ban: no em-dashes

**Never use em-dashes** (Unicode U+2014) in player-facing text, help,
short-descs, connect copy, commit messages for world prose, or agent
docs that model house style. Do not paste the character at all.

Also avoid en-dashes (Unicode U+2013) as a stylish substitute.

Use instead:

- a period and a new sentence
- a comma or semicolon
- a colon
- parentheses
- a plain hyphen only in compound words (fog-bound, gaslight)

Wrong: a long dash between clauses (the fog lifts [em-dash] or pretends)  
Right: `The fog lifts, or pretends to.`  
Right: `The fog lifts. Or it pretends to.`

### Do

- Prefer plain, musical English: concrete nouns, active verbs, one clear
  image per sentence.
- Use **sensory detail** (smell of coal-smoke, wet iron, damp wool, gas
  hiss) sparingly and specifically.
- Keep paragraphs short enough to breathe on a 78-column terminal, still
  continuous prose, not bullet lists.
- Let mood come from what is *seen*, not from telling the reader how to
  feel ("eerie," "epic," "amazing").
- Match register to place: street and rookery can be rougher; drawing-room
  and club more measured; Arcadian bleed stranger, never purple for its
  own sake.
- Read the line aloud. If it sounds like a thesaurus or a quest log,
  rewrite.

### Masquerade (multi-splat, non-negotiable)

Court is a **multi-splat** chronicle. Supernaturals hide from the public
and from each other unless trust is earned.

**Public IC layer** (`@desc`, exit names, short-descs, `+views` open to
mortals, MOTD, connect copy, default NPC descs): only what a careful
mortal could notice. Vice, fog, coin, fear, odd light, private doors.
No rulebook handouts.

**Never in the public layer:**
- Splat names or fanspeak aimed at everyone (Changeling, the Lost,
  Kindred, Garou, Mage as labels on the street)
- Power economy dumps (Glamour, Vitae, Essence, Rage) as plain facts
- Chargen / approval / staff meta

**Weird is fine on the public layer.** Wrong geometry, cold without
draft, unseasonable fruit, a watched door: show, do not lecture.

**Splat-only perception (keep and use these):**
- `FAEDESC` / kenning / fae dual-desc: **requires `fae` flag only**
  (changeling template). Staff does not auto-see; preview with
  `@set me=fae` / `@set me=!fae`. May name thorns, Mask/Mien, briar,
  freehold truth when only fae sight applies.
- Other dual fields (Hisil, etc.) when added: that splat's flag only.
- Locked `+views` and staff OOC may hold clearer lore.

**OOC** help, `+hedge`, and staff notes use real system terms freely.

### Do not

- **Em-dashes or en-dashes** anywhere in narrative or house-style copy.
- **AI sludge:** "nestled," "sprawling," "tapestry of," "in the heart of,"
  "stands as a testament," "bustling hub," "delve," "realm," "plethora."
- **Command coaching in IC space.** Never "Type +ic to..." or "Use look
  to..." inside an IC room or hub description. OOC / chargen rooms may
  teach commands carefully (see below).
- **Modern slang, UI chrome, or game-engine jargon** in narrative text
  (no "NPC," "respawn," "grid," "RP," "pose" as in-world words).
- **Walls of unbroken clause-chains** or fake archaic soup ("thou doth
  thrice behold yon ethereal..."). Victorian is not the same as
  unreadable.
- **Repeating "London"** in every desc. The city can feel like London
  without the guidebook label.
- Hard-wrapped lines inside a paragraph (look wraps for you).
- **Splat leaks** (see Masquerade above).

### Room description format

- Store as **continuous paragraphs** joined by `%r%r` (blank line
  between).
- No manual mid-paragraph line breaks for "pretty" width.
- **IC rooms:** pure atmosphere and place. Exits speak for themselves.
- **OOC / chargen / staff workshops:** may include clear, brief
  instruction, still in complete sentences, not a man page dump. Highlight
  command names with `%ch%cy...%cn` only where players must type them.
- **short-desc** (`&short-desc me=...`): one spare clause, period voice,
  fits a who/look column, not a second room desc.

### Good (voice)

> Smoke hangs low over wet cobbles. Gaslight pools in the fog, and
> blackthorn claws the railings as if the city grew thorns overnight.

### Bad (avoid)

> This bustling hub of activity is nestled in the heart of Victorian
> London, offering players a unique RP experience. Type +ic to begin!

> The circus opens (em-dashes around a list) gaslight, fog, and secrets.

---

## Live operations (prefer in-game)

Production: **court.ursamu.io**

| | |
|--|--|
| Telnet | `court.ursamu.io:4201` |
| Staff login | `connect Builder animefan` (superuser) |
| SSH | `ssh court.ursamu.io` (user `ursamu`, key `~/court`) |
| Game dir | `/home/ursamu/court` |

### Prefer live telnet over offline scripts

The DB is **single-writer** (PGlite). Offline `deno run` scripts against
`data/typegraph.db` require **stopping the game**. For rooms, exits,
descs, flags, locks, soft attributes, and most world work:

1. Log in as **Builder** (or another staff char).
2. Use building verbs: `@desc`, `@name`, `@dig`, `@open`, `@link`,
   `@set`, `@lock`, `@tel`, `&attr`, etc.
3. Leave the daemon running.

Write offline scripts **only** when bulk migration or code-only work
cannot be done in-game, and always stop the daemon first, then restart.

### Deploy (code / JSR pins)

From the **local** court checkout:

```bash
# after bumping deno.json JSR pins or game files
git add -A && git commit -m "..." && git push origin main
ssh court.ursamu.io 'bash ./court-update.sh'
```

`court-update.sh` hard-resets to `origin/main`, merges live config
safely, reloads JSR cache, restarts daemon. Do **not** hand-edit
production without git when the change belongs in the repo.

### Engine / FE pins (JSR only)

- Production imports **`jsr:@ursamu/mush@1.0.9`**,
  **`jsr:@ursamu/site@0.1.14`**, **`jsr:@ursamu/web@0.2.41`**.
- Court brand is **`theme/installed/court/`** (not a builtin site
  skin). Config: `skinCss` + `themeDir: "theme"`.
- Bump by publishing packages from the ursamu monorepo to JSR, then
  editing `deno.json` pins here, commit, push, deploy.
- Do **not** reintroduce `vendor/mush`, `vendor/site`, or
  `vendor/web`.

---

## Project layout

```
court/
├── AGENTS.md           <- you are here (agent source of truth)
├── CLAUDE.md           <- thin pointer to AGENTS.md
├── deno.json           <- tasks + import map (JSR pins)
├── config/
│   ├── config.sample.json
│   └── config.json     <- gitignored live config
├── src/
│   ├── main.ts         <- main server entry
│   ├── telnet.ts       <- telnet sidecar entry
│   └── plugins/        <- local game plugins only
├── scripts/            <- daemon, setup helpers, one-off tools
├── system/scripts/     <- softcode overrides
├── help/               <- in-game help (.md)
├── text/               <- connect screen, etc.
├── vendor/             <- optional local extras only (not engine)
├── data/               <- DB (gitignored runtime)
└── logs/               <- gitignored
```

### Tasks

```bash
deno task start     # run.sh (dev-style)
deno task daemon    # production background
deno task stop | restart | status | logs
deno task server    # main only, --watch
deno task telnet    # telnet sidecar
deno task test
```

Ports: telnet **4201**, WS **4202**, HTTP **4203**.

---

## Game systems (Court-specific)

### CofD / Changeling

- Chargen: `+cg`, help under `+help +cg` / cofd topics.
- Sheet / roll: `+sheet`, `+roll`.
- **Approval:** `approved` flag (builder+). Unapproved players are gated
  from finishing into full play; staff `+approve` sets it.
- Do not invent rules that contradict CofD 2e / CtL books without staff
  direction.

### IC / OOC

- **OOC** start / lounge is the default social grid (playerStart).
- **IC hub** (e.g. Blackfriars Circus `#14`): room flag `ic`.
- `+ic` / `+ooc` move between bookmarked IC location and OOC; IC bookmark
  only sticks on rooms flagged `ic`.
- Look may show `[IC]` on IC room titles. Do not duplicate that in the
  `@desc`.
- IC prose stays IC. Put meta and command teaching in OOC/chargen.

### Notable flags

| Flag | Role |
|------|------|
| `superuser` | root staff |
| `admin` / `wizard` | staff ladder |
| `builder` | build rights |
| `approved` | chargen cleared |
| `ic` | IC play room (on rooms) |
| `safe` / `dark` / `exit` / `room` / `player` | engine standards |

`@set` / `@flags` resolve targets **globally** (and `*Name`).  
`@pcreate <name>=<password>` creates a player without logging in as them.

### Channels & Discord

- Defaults: Public (`pub`), Admin (`ad`, admin+).
- Discord plugin: webhooks + bot; secrets in `.env` only.
- In-game: `@discord/set`, `@discord/link`, `help discord`.

### Layout chrome

Headers/dividers/footers come from `game.layout` in config (mushcode
templates). Do not hardcode alternate borders in plugins unless
overriding deliberately via `registerHeader` / etc.

---

## Code conventions

- **Line width:** 78 characters for code, help, and softcode you add.
- **Language:** TypeScript / Deno. `deno check`, `deno lint`, tests green
  before commit when you touch code.
- **DB writes:** `$set` / `$inc` / `$unset` only. `stripSubs` user text
  before length checks or storage when coming from commands.
- **Permissions:** `canEdit` before editing others' objects; staff checks
  for admin verbs.
- **Plugins:** three-phase load: `import` commands at load, `init()`
  returns true, `remove()` offs the same named hook refs. DBO namespaces
  prefixed with plugin name.
- **Help files:** max 78 cols, max 22 content lines per page; split with
  SEE ALSO; subtle markdown (`**bold**`, `` `code` ``) only.
- **Softcode / system scripts:** no Deno, no `fetch`, no real imports at
  runtime; only `u` SDK.
- **Secrets:** never commit `.env`, `config/config.json`, or passwords.
  Staff account passwords are ops knowledge, not repo content.
- **Prose in code strings:** same voice rules and **no em-dashes**.

### Local plugins

Register from `src/main.ts` / plugin packages listed in
`server.plugins`. Prefer extending official `@ursamu/*` packages over
rewriting mail, jobs, channels, or combat.

### Scripts under `scripts/`

- Daemon lifecycle: `run.sh`, `daemon.sh`, `stop.sh`, `restart.sh`,
  `status.sh`, `main-loop.sh`, `safe-update.sh`.
- Pin bumps: `update.ts` (`deno task update`).

---

## Testing

```bash
deno task test
deno lint
```

Prefix test object IDs to avoid collisions. Close DB in the last test of
a file when using DBO. For engine-layer work, fix and test in the ursamu
monorepo, then vendor.

---

## What agents must not do

- Use em-dashes (or en-dashes as a dodge) in player-facing or house-style
  copy.
- Take production down for a one-line `@desc` you could set as Builder.
- Force-push `main` or rewrite production git history without explicit
  ask.
- Commit `data/`, `logs/`, `.env`, or live `config.json`.
- "Improve" IC prose into modern marketing or gamified tutorial voice.
- Invent staff policy, canon NPCs, or freehold law without being asked.
- Mention these internal ops notes inside player-visible room text.

---

## Quick reference: building in-game

```
connect Builder animefan
@tel #14
@desc here=First paragraph.%r%rSecond paragraph.
@name here=Blackfriars Circus;IC;hub
@set here=ic
@open North;n=#20
&short-desc me=A figure in a dark coat, fog at the hem.
```

Password and name changes: `@password` / `@newpassword` as staff.

---

## Related

- Engine monorepo: ursamu (`packages/mush`, cofd, discord, ...)
- Player-facing README: `README.md`
- Connect art: `text/default_connect.txt`
