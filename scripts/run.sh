#!/bin/bash
export PATH="$HOME/.deno/bin:$PATH"
# Foreground runner (Ctrl+C stops both).
cd "$(dirname "$0")/.." || exit 1
DENO_FLAGS="--minimum-dependency-age=0 --allow-all --node-modules-dir=auto --unstable-detect-cjs --unstable-kv --unstable-net"
for port in 4201 4202 4203; do
  pids=$(lsof -ti ":$port" 2>/dev/null || true)
  # shellcheck disable=SC2086
  [ -n "$pids" ] && echo $pids | xargs kill -9 2>/dev/null || true
done
cleanup() {
  kill $MAIN_PID $TELNET_PID 2>/dev/null
  wait $MAIN_PID $TELNET_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM
# shellcheck disable=SC2086
deno run $DENO_FLAGS --watch src/main.ts &
MAIN_PID=$!
# shellcheck disable=SC2086
deno run $DENO_FLAGS src/telnet.ts &
TELNET_PID=$!
echo "Servers running. Telnet :4201  WS :4202  HTTP :4203"
wait $MAIN_PID
cleanup
