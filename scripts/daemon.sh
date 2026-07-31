#!/bin/bash
export PATH="/Users/kumakun/.deno/bin:/Users/kumakun/flutter/bin:/Users/kumakun/.antigravity-ide/antigravity-ide/bin:/Users/kumakun/.grok/bin:/Users/kumakun/.local/bin:/Users/kumakun/.nvm/versions/node/v22.22.2/bin:/Users/kumakun/.bun/bin:/Users/kumakun/.pyenv/shims:/Users/kumakun/.antigravity/antigravity/bin:/opt/homebrew/opt/openjdk@17/bin:/Users/kumakun/.foundry/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/local/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/appleinternal/bin:/pkg/env/global/bin://Applications/Topaz Gigapixel AI.app/Contents/Resources/bin:/Library/Apple/usr/bin:/Users/kumakun/flutter/bin:/Users/kumakun/.deno/bin:/Users/kumakun/.langflow/uv://Applications/Topaz Gigapixel.app/Contents/Resources/bin:/Applications/Ghostty.app/Contents/MacOS:/opt/homebrew/opt/dart/libexec/bin:/Users/kumakun/Library/Android/sdk/emulator:/Users/kumakun/Library/Android/sdk/platform-tools:/Users/kumakun/Library/Android/sdk/tools:/Users/kumakun/Library/Android/sdk/tools/bin:/Users/kumakun/.lmstudio/bin:/Users/kumakun/.foundry/bin:/Users/kumakun/.foundry/bin"
# Background daemon: telnet sidecar + main restart loop.
set -e
cd "$(dirname "$0")/.." || exit 1

PID_FILE=".ursamu.pid"
LOG_DIR="logs"
MAIN_LOG="$LOG_DIR/main.log"
TELNET_LOG="$LOG_DIR/telnet.log"
DENO_FLAGS="--minimum-dependency-age=0 --allow-all --node-modules-dir=auto --unstable-detect-cjs --unstable-kv --unstable-net"

if [ -f "$PID_FILE" ]; then
  # shellcheck disable=SC1090
  source "$PID_FILE"
  if kill -0 "${MAIN_PID:-}" 2>/dev/null || \
     kill -0 "${TELNET_PID:-}" 2>/dev/null; then
    echo "Already running (main: ${MAIN_PID:-?}, telnet: ${TELNET_PID:-?})"
    echo "Run 'deno task stop' first."
    exit 1
  fi
fi

mkdir -p "$LOG_DIR"
chmod +x "$(dirname "$0")/main-loop.sh"

for port in 4201 4202 4203; do
  pids=$(lsof -ti ":$port" 2>/dev/null || true)
  # shellcheck disable=SC2086
  [ -n "$pids" ] && echo $pids | xargs kill -9 2>/dev/null || true
done

# shellcheck disable=SC2086
nohup deno run $DENO_FLAGS src/telnet.ts >> "$TELNET_LOG" 2>&1 &
TELNET_PID=$!

MAIN_LOG="$MAIN_LOG" nohup bash "$(dirname "$0")/main-loop.sh" \
  >> /dev/null 2>&1 &
MAIN_PID=$!

printf "MAIN_PID=%s\nTELNET_PID=%s\n" \
  "$MAIN_PID" "$TELNET_PID" > "$PID_FILE"

echo ""
echo "UrsaMU daemon started."
echo "  Telnet  : port 4201  (PID: $TELNET_PID)  log: $TELNET_LOG"
echo "  Main    : WS 4202 / HTTP 4203  (loop PID: $MAIN_PID)"
echo "            log: $MAIN_LOG"
echo ""
echo "  deno task stop | restart | status | logs"
