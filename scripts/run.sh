#!/bin/bash
# Run script for court

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
deno run --minimum-dependency-age=0 --allow-all --node-modules-dir=auto --unstable-detect-cjs --unstable-kv --unstable-net --watch src/main.ts &
MAIN_PID=$!

echo "Starting telnet server..."
deno run --minimum-dependency-age=0 --allow-all --node-modules-dir=auto --unstable-detect-cjs --unstable-kv --unstable-net src/telnet.ts &
TELNET_PID=$!

echo "Servers are running. Press Ctrl+C to stop."
wait $MAIN_PID $TELNET_PID
cleanup
