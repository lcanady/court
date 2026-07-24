#!/bin/bash
# Run script for cor

cd "$(dirname "$0")/.." || exit

# Free bound ports (4201 telnet, 4202 ws, 4203 http)
for port in 4201 4202 4203; do
  pids=$(lsof -ti ":$port" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "Freeing port $port (PIDs: $pids)..."
    echo "$pids" | xargs kill -9 2>/dev/null
  fi
done

cleanup() {
  echo "Shutting down servers..."
  kill $MAIN_PID $TELNET_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "Starting main server in watch mode..."
deno run --allow-all --unstable-detect-cjs --unstable-kv --unstable-net --watch src/main.ts &
MAIN_PID=$!

# Local-link projects (`ursamu create --local`) have the engine checkout
# somewhere above this directory; walk upward looking for mod.ts + telnet.ts.
# Falls back to JSR when no engine checkout is found.
TELNET_ENTRY="jsr:@ursamu/ursamu/telnet"
probe="$(pwd)"
while [ "$probe" != "/" ]; do
  if [ -f "$probe/mod.ts" ] && [ -f "$probe/packages/mush/src/telnet.ts" ]; then
    TELNET_ENTRY="$probe/packages/mush/src/telnet.ts"
    break
  fi
  probe="$(dirname "$probe")"
done

echo "Starting telnet server..."
deno run --allow-all --unstable-detect-cjs --unstable-kv --unstable-net "$TELNET_ENTRY" &
TELNET_PID=$!

echo "Servers are running. Press Ctrl+C to stop."
wait $MAIN_PID $TELNET_PID
cleanup
