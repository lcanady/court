# Court of Miracles: Claude Code

**Read [AGENTS.md](./AGENTS.md) first.** It is the authoritative guide for
this game: Victorian literary voice, no em-dashes, live ops (Builder /
telnet), vendor deploy, IC/OOC rules, and code conventions.

This file exists so Claude Code auto-loads project context. Do not
duplicate long policy here. Update **AGENTS.md** instead.

## Load order

1. `AGENTS.md` (voice, world, ops, architecture)
2. Engine skill `/ursamu-dev` when editing UrsaMU plugins or vendor mush
3. Package docs under `vendor/*/README.md` as needed

## Hard rules (summary)

- **Prose:** human, readable, Victorian literary. Never AI sludge, never
  IC command-coaching, **never em-dashes**. Continuous paragraphs
  (`%r%r`).
- **Live world edits:** log in as Builder on court; do not stop the DB
  for a simple `@desc`.
- **Code:** 78-col lines; Deno lint/check; no secrets in git.
- **Deploy:** commit, then `git push origin main`, then
  `ssh court.ursamu.io 'bash ./court-update.sh'`.
