#!/bin/bash
# Stop the supervisor (and with it, main + telnet). Disconnects all telnet
# clients. For a no-disconnect restart, use scripts/restart.sh or @reboot.
cd "$(dirname "$0")/.."

pidfile="run/supervisor.pid"
if [ ! -f "$pidfile" ]; then
  echo "Nothing to stop."
  exit 0
fi

pid=$(cat "$pidfile")
if kill -0 "$pid" 2>/dev/null; then
  echo "Stopping supervisor (pid $pid)..."
  kill "$pid" 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.5
  done
  kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
fi
rm -f "$pidfile"

for port in 4201 4202 4203; do
  pids=$(lsof -ti ":$port" 2>/dev/null || true)
  [ -n "$pids" ] && echo "$pids" | xargs kill -9 2>/dev/null || true
done
