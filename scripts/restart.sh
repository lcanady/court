#!/bin/bash
export PATH="/Users/kumakun/.deno/bin:/Users/kumakun/flutter/bin:/Users/kumakun/.antigravity-ide/antigravity-ide/bin:/Users/kumakun/.grok/bin:/Users/kumakun/.local/bin:/Users/kumakun/.nvm/versions/node/v22.22.2/bin:/Users/kumakun/.bun/bin:/Users/kumakun/.pyenv/shims:/Users/kumakun/.antigravity/antigravity/bin:/opt/homebrew/opt/openjdk@17/bin:/Users/kumakun/.foundry/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/local/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/appleinternal/bin:/pkg/env/global/bin://Applications/Topaz Gigapixel AI.app/Contents/Resources/bin:/Library/Apple/usr/bin:/Users/kumakun/flutter/bin:/Users/kumakun/.deno/bin:/Users/kumakun/.langflow/uv://Applications/Topaz Gigapixel.app/Contents/Resources/bin:/Applications/Ghostty.app/Contents/MacOS:/opt/homebrew/opt/dart/libexec/bin:/Users/kumakun/Library/Android/sdk/emulator:/Users/kumakun/Library/Android/sdk/platform-tools:/Users/kumakun/Library/Android/sdk/tools:/Users/kumakun/Library/Android/sdk/tools/bin:/Users/kumakun/.lmstudio/bin:/Users/kumakun/.foundry/bin:/Users/kumakun/.foundry/bin"
cd "$(dirname "$0")/.." || exit 1
PID_FILE=".ursamu.pid"
DENO_PID_FILE=".ursamu-deno.pid"
LOG_DIR="logs"
MAIN_LOG="$LOG_DIR/main.log"
if [ ! -f "$PID_FILE" ]; then
  echo "Not running. Use 'deno task daemon' to start."
  exit 1
fi
# shellcheck disable=SC1090
source "$PID_FILE"
[ -n "${MAIN_PID:-}" ] && kill "$MAIN_PID" 2>/dev/null || true
sleep 1
if [ -f "$DENO_PID_FILE" ]; then
  kill "$(cat "$DENO_PID_FILE")" 2>/dev/null || true
  rm -f "$DENO_PID_FILE"
fi
mkdir -p "$LOG_DIR"
chmod +x "$(dirname "$0")/main-loop.sh"
MAIN_LOG="$MAIN_LOG" nohup bash "$(dirname "$0")/main-loop.sh" \
  >> /dev/null 2>&1 &
MAIN_PID=$!
printf "MAIN_PID=%s\nTELNET_PID=%s\n" \
  "$MAIN_PID" "${TELNET_PID:-}" > "$PID_FILE"
echo "Main restarted (loop PID: $MAIN_PID). Telnet untouched."
