#!/bin/bash
# Safe package/code update while the game stays online, then soft-reboot.
#
# 1. git fetch + reset to origin/main  (or pull --ff-only if CLEAN_PULL=1)
# 2. merge live config (gitignored)
# 3. deno cache --reload WHILE main still serves players
# 4. soft-restart main only (telnet stays up) if cache ok
# 5. health-check; print status
#
# Usage (on the game host):
#   bash ./scripts/safe-update.sh
#   bash ~/court-update.sh          # thin wrapper may call this
set -euo pipefail
export PATH="${HOME}/.deno/bin:${PATH}"
cd "$(dirname "$0")/.." || exit 1

echo "[safe-update] HEAD before: $(git log -1 --oneline 2>/dev/null || echo '?')"

# --- git: get code without killing the game ---------------------------------
git fetch origin
if [ "${CLEAN_PULL:-0}" = "1" ]; then
  git pull --ff-only origin main || git pull --ff-only
else
  # Production default: hard reset to published main (ignores dirty lock).
  git reset --hard origin/main
fi
echo "[safe-update] HEAD after:  $(git log -1 --oneline)"

# --- merge gitignored live config ------------------------------------------
python3 - <<'PY'
import json
from pathlib import Path

p = Path("config/config.json")
d = json.loads(p.read_text()) if p.exists() else {}
sample = {}
sp = Path("config/config.sample.json")
if sp.exists():
    sample = json.loads(sp.read_text())

pl = d.setdefault("plugins", {})
ch = sample.get("plugins", {}).get("channels") or pl.get("channels") or {
    "defaults": [
        {
            "name": "Public",
            "alias": "pub",
            "lock": "connected",
            "announce": True,
        },
        {
            "name": "Admin",
            "alias": "ad",
            "lock": "connected admin+",
            "announce": False,
        },
    ]
}
# ensure announce on Public from sample
for row in ch.get("defaults", []):
    if str(row.get("name", "")).lower() == "public":
        row.setdefault("announce", True)
pl["channels"] = ch

look = (
    sample.get("plugins", {})
    .get("globals", {})
    .get("theme", {})
    .get("look")
)
if look:
    g = pl.setdefault("globals", {})
    th = g.setdefault("theme", {})
    th["look"] = look
d["plugins"] = pl
p.parent.mkdir(parents=True, exist_ok=True)
p.write_text(json.dumps(d, indent=2) + "\n")
print("[safe-update] config merged")
PY

# --- pre-warm Deno cache while old main still runs -------------------------
echo "[safe-update] caching packages (game still up)..."
# Drop lock + node_modules so soft-reboot cannot reuse a stale graph.
rm -f deno.lock
rm -rf node_modules
if ! deno cache --reload --minimum-dependency-age=0 \
  src/main.ts src/telnet.ts; then
  echo "[safe-update] ERROR: deno cache failed — aborting reboot."
  echo "[safe-update] Game left running on previous code."
  exit 1
fi
echo "[safe-update] cache ok — soft-rebooting main (telnet stays up)"

# --- soft restart main only ------------------------------------------------
if [ -f .ursamu-deno.pid ]; then
  kill -TERM "$(cat .ursamu-deno.pid)" 2>/dev/null || true
  sleep 2
fi
# Prefer restart.sh (telnet untouched) when daemon loop is already up
if [ -f .ursamu.pid ] && kill -0 "$(
  # shellcheck disable=SC1090
  source .ursamu.pid 2>/dev/null
  echo "${MAIN_PID:-}"
)" 2>/dev/null; then
  bash ./scripts/restart.sh
else
  rm -f data/typegraph.db/postmaster.pid
  bash ./scripts/daemon.sh
fi

# --- health ----------------------------------------------------------------
ok=0
for i in $(seq 1 90); do
  if curl -sf -m 2 "http://127.0.0.1:4203/" >/dev/null 2>&1 ||
     curl -sf -m 2 "http://127.0.0.1:4203/api/v1/help" >/dev/null 2>&1; then
    echo "[safe-update] ready at ${i}s"
    ok=1
    break
  fi
  sleep 1
done
bash ./scripts/status.sh || true
if [ "$ok" -ne 1 ]; then
  echo "[safe-update] WARNING: health check did not pass within 90s"
  tail -30 logs/main.log || true
  exit 2
fi
grep -E "Gateway READY|Court of Miracles|File cache ready|plugin:loaded" \
  logs/main.log | tail -20 || true
echo "[safe-update] done"
