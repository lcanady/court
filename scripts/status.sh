#!/bin/bash
# Report supervisor status and port bindings.
cd "$(dirname "$0")/.."

pidfile="run/supervisor.pid"
if [ ! -f "$pidfile" ]; then
  echo "supervisor  not running"
else
  pid=$(cat "$pidfile")
  if kill -0 "$pid" 2>/dev/null; then
    echo "supervisor  running (pid $pid)"
  else
    echo "supervisor  stale pidfile (pid $pid, no process)"
  fi
fi

for port in 4201:telnet 4202:ws 4203:http; do
  p=${port%:*}; label=${port#*:}
  bound=$(lsof -ti ":$p" 2>/dev/null || true)
  if [ -n "$bound" ]; then
    printf "%-11s bound on :%s (pid %s)\n" "$label" "$p" "$bound"
  else
    printf "%-11s :%s free\n" "$label" "$p"
  fi
done
