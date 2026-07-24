# cor — UrsaMU Game Server

## What This Is

A UrsaMU game server built on `jsr:@ursamu/ursamu`. UrsaMU is a TypeScript/Deno
MUSH-like engine with a full TinyMUX 2.x softcode evaluator, plugin system,
WebSocket API, and optional Telnet sidecar.

This repo contains **only game-specific code** — plugins, softcode scripts,
chargen, help files, and configuration. The engine lives at `jsr:@ursamu/ursamu`.

## Tech Stack

| Layer | Tech |
|---|---|
| Engine | `jsr:@ursamu/ursamu` (v2.x) |
| Runtime | Deno |
| Database | Deno KV (embedded) |
| Softcode | TinyMUX 2.x evaluator (built into engine) |
| Web client | Served by engine at `/client` (via web-client plugin) |
| Telnet | Optional sidecar (`src/telnet.ts`) |

## Project Structure

```
cor/
├── CLAUDE.md                  ← you are here
├── deno.json                  ← tasks, import map, engine version pin
├── plugins.manifest.json      ← installed plugins (managed by ensurePlugins)
├── config/                    ← game config (gitignored: config.json)
│   └── config.sample.json     ← template — copy to config.json to run
├── src/
│   ├── main.ts                ← entry point: imports engine + local plugins
│   ├── telnet.ts              ← telnet sidecar entry point
│   └── plugins/               ← local game plugins (each in own subdirectory)
│       ├── chargen/           ← character generation system
│       │   └── index.ts       ← implements IStatSystem, registers with engine
│       └── [feature]/         ← additional game plugins
├── system/
│   └── scripts/               ← softcode scripts (@commands, $patterns)
├── help/                      ← help file entries (plain text)
├── text/                      ← motd, connect screen, other text files
├── tests/                     ← Deno test files
└── logs/                      ← runtime logs (gitignored)
```

## Running the Server

```bash
# First-time setup
cp config/config.sample.json config/config.json
# Edit config.json with your game settings

# Development (with --watch)
deno task server

# Full stack (server + telnet)
deno task dev

# Run tests
deno task test
```

**Ports (defaults):**
- `4202` — Hub WebSocket + HTTP API
- `4203` — native WebSocket upgrades
- `4201` — Telnet (sidecar)

## Plugin System

Plugins are either:

1. **Local** — TypeScript files in `src/plugins/`. Register in `src/main.ts`.
2. **External** — JSR/GitHub packages listed in `plugins.manifest.json`.
   The engine's `ensurePlugins` auto-fetches and loads them on startup.

### Writing a local plugin

```ts
// src/plugins/myplugin/index.ts
import { registerPlugin } from "ursamu";

registerPlugin({
  name: "myplugin",
  version: "1.0.0",
  async init() {
    // register scripts, commands, routes, etc.
  },
});
```

### Registering a softcode script

```ts
import { registerScript } from "ursamu";
import { join } from "@std/path";

await registerScript("myscript", await Deno.readTextFile(
  join(import.meta.dirname!, "scripts/myscript.ts")
));
```

## Chargen / Stat System

Implement `IStatSystem` and register it so the engine's chargen and sheet
commands can resolve stats without importing engine internals.

```ts
import { registerStatSystem } from "ursamu";

registerStatSystem({
  name: "cor",
  version: "1.0.0",
  getCategories: () => ["Attributes", "Skills"],
  getStats: (cat) => cat === "Attributes" ? ["Strength", "Dexterity", "Stamina"] : [],
  getStat: (actor, stat) => actor[stat.toLowerCase()] ?? 0,
  setStat: async (actor, stat, value) => { actor[stat.toLowerCase()] = value; },
  validate: (stat, value) => typeof value === "number" && value >= 1 && value <= 5,
});
```

Use `/ursamu-chargen` to generate a chargen plugin from a rulebook PDF.

## Softcode Scripts

Engine lookup order: **local override → plugin registry → engine bundled**.

Put game-specific `@command` and `$pattern` scripts in `system/scripts/`.
Register them in a plugin's `init()` with `registerScript()`.

Scripts run in Web Workers (sandboxed). Access services via the `u` SDK —
do NOT import engine services directly inside scripts.

Useful SDK methods:
- `u.db.search(query)` — search objects; `u.db.create()`, `u.db.modify(id, op, data)`, `u.db.destroy(id)`
- `u.ui.layout()` — send structured UI to client
- `u.cmd.switches` — parsed command switches
- `u.util.stripSubs(str)` — strip MUSH substitutions and ANSI (always call before DB ops)
- `u.eval(targetId, attr, args)` — evaluate a softcode attribute
- `u.forceAs(targetId, command)` — execute a command as another actor

## AI GM Integration (optional)

If using `@ursamu/ai-gm`, connect your stat system via the game hooks bridge —
do NOT import ai-gm directly from chargen plugins:

```ts
// In your plugin's init():
import { gameHooks } from "ursamu";

gameHooks.emit("gm:system:register" as never, { system: myStatSystem });
```

## Key Engine Patterns

**Privilege levels** (for `@tel`, `@force`, admin commands):
- `superuser` (3) → `admin` (2) → `wizard` (1) → `player` (0)

**Flags:** `"wizard"` is level 9, code `"wiz"`, locked to superuser.
Use `isStaff(flags)` and `isWizard(flags)` utilities (exported from engine).

**Hidden/internal attributes:** prefix with `_` to make wiz-only.
Use `_COR_*` naming for internal system state.

**Comment detection in softcode:** `/*` is only a comment opener at the start
of a line (`^\s*/\*`). Do not treat `*/*` or `<tag>/*` as comments.

**DB IDs in tests:** prefix to avoid collision — `"si_actor1"`, `"ta_room1"`.

**wrapScript pattern for tests:**
```ts
// Required when importing any service layer (CmdParser triggers async reads):
const OPTS = { sanitizeResources: false, sanitizeOps: false };
```

## Developer Tooling (ursamu-dev)

`@lhi/ursamu-dev` guides AI agents and human developers through proper UrsaMU
plugin development with static analysis, scaffolding, and documentation generation.

### Installation

```bash
# Install the package (Node 18+ required)
npx @lhi/ursamu-dev

# Install Git pre-commit hooks (blocks commits that fail audit)
ursamu-dev --install-hooks
```

Then activate the skill in Claude Code with: `/ursamu-dev`

### Tools

| Command | Purpose |
|---|---|
| `ursamu-dev` | Installs the AI coding skill into your agent |
| `ursamu-scaffold` | Generates plugin boilerplate with correct structure and help files |
| `ursamu-audit` | Static analysis — catches violations before they reach the engine |
| `ursamu-docs` | Auto-generates documentation from source (requires LLM API key) |

### Workflow

```bash
# During development — live feedback
ursamu-audit --watch

# Auto-repair common violations
ursamu-audit --fix
```

Six-stage pipeline: **Design → Generate → Audit → Refine → Test → Docs**

Source: https://github.com/UrsaMU/ursamu-dev-skill

## Testing

```bash
deno task test
deno lint
```

Tests live in `tests/`. Mirror the file being tested:
`src/plugins/chargen/index.ts` → `tests/chargen.test.ts`.

Always close the DB in the last test of any file:
```ts
await DBO.close();
```

## Environment / Config

Copy `config/config.sample.json` → `config/config.json`. Never commit
`config.json` (it is gitignored). Never hardcode credentials.
