#!/bin/bash
# Start the UrsaMU supervisor (start.ts) in the background. The supervisor
# spawns the telnet sidecar and the main server, and re-spawns main on
# exit code 75 — so in-game @reboot just works. SIGUSR2 also triggers a
# no-disconnect restart (scripts/restart.sh).
set -e
cd "$(dirname "$0")/.."

mkdir -p run logs

if [ -f run/supervisor.pid ] && kill -0 "$(cat run/supervisor.pid)" 2>/dev/null; then
  echo "supervisor already running (pid $(cat run/supervisor.pid))"
  exit 1
fi

for port in 4201 4202 4203; do
  pids=$(lsof -ti ":$port" 2>/dev/null || true)
  [ -n "$pids" ] && echo "$pids" | xargs kill -9 2>/dev/null || true
done

# Remove stale PGlite lock file left by hard kills or crash loops.
# PGlite writes postmaster.pid with PID -42 (not a real OS process),
# so it is always safe to remove when no server is running.
PGDATA="data/typegraph.db"
[ -f "$PGDATA/postmaster.pid" ] && rm -f "$PGDATA/postmaster.pid" && \
  echo "Removed stale PGlite lock ($PGDATA/postmaster.pid)." || true

DENO_FLAGS="--allow-all --unstable-detect-cjs --unstable-kv --unstable-net"

# Local-link projects (`ursamu create --local`) have the engine checkout
# somewhere above this directory; walk upward looking for mod.ts + start.ts.
# Falls back to JSR when no engine checkout is found.
ENTRY="jsr:@ursamu/ursamu/start"
probe="$(pwd)"
while [ "$probe" != "/" ]; do
  if [ -f "$probe/mod.ts" ] && [ -f "$probe/packages/cli/src/start.ts" ]; then
    ENTRY="$probe/packages/cli/src/start.ts"
    break
  fi
  probe="$(dirname "$probe")"
done

echo "Starting UrsaMU supervisor ($ENTRY)..."
nohup deno run $DENO_FLAGS "$ENTRY" >>logs/main.log 2>&1 &
echo $! > run/supervisor.pid

sleep 1
echo "supervisor pid: $(cat run/supervisor.pid)"
echo "logs:           logs/main.log"
echo "@reboot in-game (or scripts/restart.sh) respawns main without dropping telnet."
