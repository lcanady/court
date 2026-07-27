# Court of Miracles — Claude Code

**Read [AGENTS.md](./AGENTS.md) first.** It is the authoritative guide for
this game: Victorian literary voice, live ops (Builder / telnet), vendor
deploy, IC/OOC rules, and code conventions.

This file exists so Claude Code auto-loads project context. Do not
duplicate long policy here — update **AGENTS.md** instead.

## Load order

1. `AGENTS.md` (voice, world, ops, architecture)
2. Engine skill `/ursamu-dev` when editing UrsaMU plugins or vendor mush
3. Package docs under `vendor/*/README.md` as needed

## Hard rules (summary)

- **Prose:** human, readable, Victorian literary — never AI sludge or
  IC command-coaching. Continuous paragraphs (`%r%r`).
- **Live world edits:** log in as Builder on court; do not stop the DB
  for a simple `@desc`.
- **Code:** 78-col lines; Deno lint/check; no secrets in git.
- **Deploy:** commit → `git push origin main` →
  `ssh court.ursamu.io 'bash ./court-update.sh'`.
