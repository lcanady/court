#!/bin/bash
# No-disconnect restart. Tells the supervisor to re-spawn main; telnet stays up
# and connected players auto-reauth via their JWT session token. Equivalent to
# typing @reboot in-game. For a full stop (disconnect everyone), use stop.sh
# or @shutdown.
cd "$(dirname "$0")/.."

if [ ! -f run/supervisor.pid ]; then
  echo "Supervisor not running — start with scripts/daemon.sh."
  exit 1
fi

pid=$(cat run/supervisor.pid)
if ! kill -0 "$pid" 2>/dev/null; then
  echo "Stale supervisor pidfile (pid $pid). Run scripts/daemon.sh."
  exit 1
fi

echo "Signaling supervisor (pid $pid) — main will respawn, telnet stays up."
kill -USR2 "$pid"
