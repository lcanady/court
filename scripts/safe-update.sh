#!/bin/bash
# Safe package/code update while the game stays online, then soft-reboot.
#
# Fixes that used to slip through on court.ursamu.io:
#   - live config.json (gitignored) missing new server.plugins entries
#   - sample plugins.* blocks (map, channels, globals) not merged
#   - stale Deno cache / lock loading old JSR versions (e.g. web@0.2.3)
#   - no post-boot check that expected plugins actually loaded
#
# 1. git fetch + reset to origin/main
# 2. merge live config from sample (plugins list + plugin blocks)
# 3. deno cache --reload --minimum-dependency-age=0 (game still up)
# 4. soft-restart main (telnet stays up when possible)
# 5. health-check + verify plugin:loaded versions vs deno.json pins
#
# Usage (on the game host):
#   bash ./scripts/safe-update.sh
#   bash ~/court-update.sh   # thin wrapper → this script
set -euo pipefail
export PATH="${HOME}/.deno/bin:/usr/local/bin:/usr/bin:/bin:${PATH}"
cd "$(dirname "$0")/.." || exit 1

log() { echo "[safe-update] $*"; }

# Keep ~/court-update.sh as a thin wrapper so cron/muscle-memory work.
WRAPPER="${HOME}/court-update.sh"
WRAPPER_BODY='#!/bin/bash
set -euo pipefail
exec bash '"$(pwd)"'/scripts/safe-update.sh "$@"
'
if [ ! -f "$WRAPPER" ] || ! grep -q 'safe-update.sh' "$WRAPPER" 2>/dev/null; then
  printf '%s\n' "$WRAPPER_BODY" > "$WRAPPER"
  chmod +x "$WRAPPER"
  log "installed ${WRAPPER} → scripts/safe-update.sh"
fi

log "HEAD before: $(git log -1 --oneline 2>/dev/null || echo '?')"

# --- git -------------------------------------------------------------------
git fetch origin
if [ "${CLEAN_PULL:-0}" = "1" ]; then
  git pull --ff-only origin main || git pull --ff-only
else
  git reset --hard origin/main
fi
log "HEAD after:  $(git log -1 --oneline)"

# --- merge gitignored live config ------------------------------------------
python3 - <<'PY'
"""Merge sample → live config so new plugins/settings always land."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


def deep_merge(base: Any, over: Any) -> Any:
    """Merge over into base. Dicts recurse; lists/scalars: over wins."""
    if isinstance(base, dict) and isinstance(over, dict):
        out = dict(base)
        for k, v in over.items():
            if k in out:
                out[k] = deep_merge(out[k], v)
            else:
                out[k] = v
        return out
    return over


import os

def ensure_plugins_list(live: list[str], sample: list[str]) -> list[str]:
    """Sample order is canonical. Live extras only if ALLOW_EXTRA_PLUGINS=1."""
    seen: set[str] = set()
    out: list[str] = []
    for name in sample:
        n = str(name).strip()
        if not n or n in seen:
            continue
        seen.add(n)
        out.append(n)
    if os.environ.get("ALLOW_EXTRA_PLUGINS", "").strip() == "1":
        for name in live:
            n = str(name).strip()
            if not n or n in seen:
                continue
            seen.add(n)
            out.append(n)
    return out


live_p = Path("config/config.json")
sample_p = Path("config/config.sample.json")
live: dict[str, Any] = (
    json.loads(live_p.read_text()) if live_p.exists() else {}
)
sample: dict[str, Any] = (
    json.loads(sample_p.read_text()) if sample_p.exists() else {}
)

# server.plugins — sample is the game's shipped plugin list
live_srv = live.setdefault("server", {})
sample_srv = sample.get("server") or {}
live_list = list(live_srv.get("plugins") or [])
sample_list = list(sample_srv.get("plugins") or [])
if sample_list:
    merged = ensure_plugins_list(live_list, sample_list)
    dropped = [p for p in live_list if p not in merged]
    live_srv["plugins"] = merged
    print("[safe-update] server.plugins:", ", ".join(merged))
    if dropped:
        print("[safe-update] plugins removed:", ", ".join(dropped))
else:
    print("[safe-update] WARN: sample has no server.plugins", file=sys.stderr)
    merged = live_list

# plugins.* blocks from sample (channels, globals, …)
# Deep-merge so live-only keys (secrets, discord ids) are kept.
live_pl = live.setdefault("plugins", {})
sample_pl = sample.get("plugins") or {}
if isinstance(sample_pl, dict):
    for key, val in sample_pl.items():
        if key not in live_pl:
            live_pl[key] = val
            print(f"[safe-update] plugins.{key}: added from sample")
        else:
            before = json.dumps(live_pl[key], sort_keys=True)
            live_pl[key] = deep_merge(live_pl[key], val)
            after = json.dumps(live_pl[key], sort_keys=True)
            if before != after:
                print(f"[safe-update] plugins.{key}: merged from sample")
            else:
                print(f"[safe-update] plugins.{key}: ok")

# Drop plugin config blocks for packages no longer in server.plugins
# (e.g. remove plugins.map when map-plugin is unshipped).
plug_pkgs = " ".join(merged).lower()
for orphan in ("map",):
    token = orphan if orphan != "map" else "map"
    if token not in plug_pkgs and orphan in live_pl:
        del live_pl[orphan]
        print(f"[safe-update] plugins.{orphan}: removed (not in server.plugins)")
# Always ensure channels + globals.theme.look exist (legacy defaults)
ch = live_pl.get("channels") or {
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
for row in ch.get("defaults", []):
    if str(row.get("name", "")).lower() == "public":
        row.setdefault("announce", True)
live_pl["channels"] = ch

look = (
    (sample_pl.get("globals") or {})
    .get("theme", {})
    .get("look")
) or (live_pl.get("globals") or {}).get("theme", {}).get("look")
if look:
    g = live_pl.setdefault("globals", {})
    th = g.setdefault("theme", {})
    th["look"] = look

live_p.parent.mkdir(parents=True, exist_ok=True)
live_p.write_text(json.dumps(live, indent=2) + "\n")
print("[safe-update] config written →", live_p)
print(
    "[safe-update] plugins keys:",
    ", ".join(sorted(live_pl.keys())),
)
PY

# --- expected JSR pins from deno.json (for post-boot verify) ---------------
EXPECTED_JSON="$(python3 - <<'PY'
import json
import re
from pathlib import Path

d = json.loads(Path("deno.json").read_text())
imp = d.get("imports") or {}
# Map import specifier → expected version string
want = {}
for key in (
    "@ursamu/web",
    "@ursamu/site",
    "@ursamu/map-plugin",
    "@ursamu/map",
    "@ursamu/mush",
    "ursamu",
    "@ursamu/builder",
    "@ursamu/wiki",
):
    raw = str(imp.get(key) or "")
    m = re.search(r"@(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)\s*$", raw)
    if m:
        # normalize aliases
        name = key
        if key in ("ursamu", "@ursamu/mush"):
            name = "mush"  # engine; not always in plugin:loaded
        elif key == "@ursamu/map":
            name = "map"
        elif key.startswith("@ursamu/"):
            name = key.split("/", 1)[1]
            if name == "map-plugin":
                name = "map"
            if name.endswith("-plugin"):
                # cofd-plugin → cofd sometimes
                pass
        want[name] = m.group(1)
# plugin load name overrides
out = {
    "web": want.get("web"),
    "site": want.get("site"),
    "map": want.get("map") or want.get("map-plugin"),
    "wiki": want.get("wiki"),
    "builder": want.get("builder"),
}
print(json.dumps({k: v for k, v in out.items() if v}))
PY
)"
log "expected plugin versions: ${EXPECTED_JSON}"


# --- verify JSR pins resolve to expected engine/FE versions --------------
python3 - <<'PY' || exit 6
import json, re, sys
from pathlib import Path
imp = json.loads(Path("deno.json").read_text()).get("imports") or {}
need = {
    "@ursamu/mush": "1.0.9",
    "@ursamu/site": "0.1.7",
    "@ursamu/web": "0.2.40",
}
bad = []
for key, ver in need.items():
    raw = str(imp.get(key) or "")
    if "vendor" in raw:
        bad.append(f"{key} still points at vendor: {raw}")
        continue
    m = re.search(r"@(\d+\.\d+\.\d+)", raw)
    if not m or m.group(1) != ver:
        bad.append(f"{key} want jsr …@{ver}, got {raw!r}")
if bad:
    print("[safe-update] ERROR: JSR pin check failed:", file=sys.stderr)
    for b in bad:
        print(" ", b, file=sys.stderr)
    sys.exit(6)
print("[safe-update] JSR pins ok:",
      ", ".join(f"{k}@{v}" for k, v in need.items()))
PY

# --- pre-warm Deno cache while old main still runs -------------------------
log "caching packages (game still up)..."
# Drop lock + node_modules so reboot cannot reuse a stale graph.
# (deno.lock is regenerated from deno.json pins.)
rm -f deno.lock
rm -rf node_modules
# Explicitly pull critical packages first (clearer errors).
if ! deno cache --reload --minimum-dependency-age=0 \
  jsr:@ursamu/web@0.2.40 \
  jsr:@ursamu/site@0.1.7 \
  jsr:@ursamu/mush@1.0.9 \
  jsr:@ursamu/map-plugin \
  src/main.ts src/telnet.ts; then
  log "ERROR: deno cache failed — aborting reboot."
  log "Game left running on previous code."
  exit 1
fi
# Re-lock for reproducibility
deno install --minimum-dependency-age=0 2>/dev/null || true
log "cache ok — soft-rebooting main (telnet stays up)"

# Snapshot log length so we only inspect this boot
LOG_LINES_BEFORE=0
if [ -f logs/main.log ]; then
  LOG_LINES_BEFORE=$(wc -l < logs/main.log | tr -d ' ')
fi

# --- soft restart main only ------------------------------------------------
# Prefer scripts/restart.sh (kills main loop + deno child, keeps telnet).
# Fall back to stop+daemon only when nothing is running.
rm -f data/typegraph.db/postmaster.pid 2>/dev/null || true
if [ -f .ursamu.pid ]; then
  # shellcheck disable=SC1090
  # shellcheck source=/dev/null
  source .ursamu.pid 2>/dev/null || true
  if [ -n "${MAIN_PID:-}" ] && kill -0 "$MAIN_PID" 2>/dev/null; then
    log "restarting main loop (PID ${MAIN_PID}); telnet stays up"
    bash ./scripts/restart.sh
  else
    log "stale .ursamu.pid — full daemon start"
    bash ./scripts/stop.sh 2>/dev/null || true
    sleep 1
    bash ./scripts/daemon.sh
  fi
elif [ -f .ursamu-deno.pid ]; then
  log "deno pid without loop — killing child and starting daemon"
  kill -TERM "$(cat .ursamu-deno.pid)" 2>/dev/null || true
  sleep 1
  bash ./scripts/stop.sh 2>/dev/null || true
  bash ./scripts/daemon.sh
else
  log "not running — starting daemon"
  bash ./scripts/daemon.sh
fi

# --- health ----------------------------------------------------------------
ok=0
for i in $(seq 1 90); do
  if curl -sf -m 2 "http://127.0.0.1:4203/" >/dev/null 2>&1 ||
     curl -sf -m 2 "http://127.0.0.1:4203/api/v1/help" >/dev/null 2>&1; then
    log "ready at ${i}s"
    ok=1
    break
  fi
  sleep 1
done
bash ./scripts/status.sh || true
if [ "$ok" -ne 1 ]; then
  log "WARNING: health check did not pass within 90s"
  tail -40 logs/main.log || true
  exit 2
fi

# --- verify plugins loaded this boot ---------------------------------------
python3 - <<PY
import json
import re
import sys
from pathlib import Path

expected = json.loads("""${EXPECTED_JSON}""")
log_path = Path("logs/main.log")
if not log_path.exists():
    print("[safe-update] ERROR: no logs/main.log", file=sys.stderr)
    sys.exit(3)

# Only lines after our restart
all_lines = log_path.read_text(errors="replace").splitlines()
start = int("${LOG_LINES_BEFORE}")
chunk = all_lines[start:] if start < len(all_lines) else all_lines[-200:]

loaded: dict[str, str] = {}
pat = re.compile(
    r'"event"\s*:\s*"plugin:loaded".*?"name"\s*:\s*"([^"]+)".*?"version"\s*:\s*"([^"]+)"'
)
# JSON may have name/version in either order
pat2 = re.compile(
    r'"event"\s*:\s*"plugin:loaded"[^\n]*'
)
for line in chunk:
    if "plugin:loaded" not in line:
        continue
    try:
        # line may be pure JSON or prefixed
        brace = line.find("{")
        if brace < 0:
            continue
        obj = json.loads(line[brace:])
        data = obj.get("data") or {}
        name = str(data.get("name") or "")
        ver = str(data.get("version") or "")
        if name and ver:
            loaded[name] = ver
    except Exception:
        m = re.search(
            r'"name"\s*:\s*"([^"]+)".*?"version"\s*:\s*"([^"]+)"',
            line,
        )
        if m:
            loaded[m.group(1)] = m.group(2)

print("[safe-update] loaded this boot:")
for n, v in sorted(loaded.items()):
    print(f"  {n}@{v}")

# config required plugins
cfg = json.loads(Path("config/config.json").read_text())
required = [
    str(x).split("/")[-1].replace("@ursamu/", "")
    for x in (cfg.get("server") or {}).get("plugins") or []
]
# normalize package id → plugin runtime name
alias = {
    "map-plugin": "map",
    "cofd-plugin": "cofd",
    "lang-plugin": "sgp-language-plugin",
    "help-plugin": "help",
    "mail-plugin": "mail",
    "jobs-plugin": "jobs",
    "channels": "@ursamu/channels",
}

missing = []
for pkg in required:
    runtime = alias.get(pkg, pkg)
    # channels may load as @ursamu/channels
    if runtime not in loaded and pkg not in loaded:
        # try bare
        if not any(
            runtime in k or pkg in k for k in loaded
        ):
            missing.append(pkg)

if missing:
    print(
        "[safe-update] ERROR: plugins in config but not loaded:",
        ", ".join(missing),
        file=sys.stderr,
    )
    sys.exit(4)

# version mismatches for key packages
errors = []
# map loaded name
for key, want in expected.items():
    got = loaded.get(key)
    if key == "map":
        got = loaded.get("map") or loaded.get("map-plugin")
    if got is None:
        # not fatal if not in required — already checked missing
        continue
    if got != want:
        errors.append(f"{key}: loaded {got}, expected {want}")

if errors:
    print("[safe-update] ERROR: version mismatch:", file=sys.stderr)
    for e in errors:
        print(f"  - {e}", file=sys.stderr)
    print(
        "[safe-update] Tip: check deno.json pins and that "
        "daemon uses --minimum-dependency-age=0",
        file=sys.stderr,
    )
    sys.exit(5)

print("[safe-update] plugin versions OK")
PY

grep -E "Gateway READY|Court of Miracles|File cache ready|plugin:loaded|\\[map\\]" \
  logs/main.log | tail -25 || true
log "done"
