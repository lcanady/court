#!/bin/bash
export PATH="/Users/kumakun/.deno/bin:/Users/kumakun/flutter/bin:/Users/kumakun/.antigravity-ide/antigravity-ide/bin:/Users/kumakun/.grok/bin:/Users/kumakun/.local/bin:/Users/kumakun/.nvm/versions/node/v22.22.2/bin:/Users/kumakun/.bun/bin:/Users/kumakun/.pyenv/shims:/Users/kumakun/.antigravity/antigravity/bin:/opt/homebrew/opt/openjdk@17/bin:/Users/kumakun/.foundry/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/local/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/appleinternal/bin:/pkg/env/global/bin://Applications/Topaz Gigapixel AI.app/Contents/Resources/bin:/Library/Apple/usr/bin:/Users/kumakun/flutter/bin:/Users/kumakun/.deno/bin:/Users/kumakun/.langflow/uv://Applications/Topaz Gigapixel.app/Contents/Resources/bin:/Applications/Ghostty.app/Contents/MacOS:/opt/homebrew/opt/dart/libexec/bin:/Users/kumakun/Library/Android/sdk/emulator:/Users/kumakun/Library/Android/sdk/platform-tools:/Users/kumakun/Library/Android/sdk/tools:/Users/kumakun/Library/Android/sdk/tools/bin:/Users/kumakun/.lmstudio/bin:/Users/kumakun/.foundry/bin:/Users/kumakun/.foundry/bin"
cd "$(dirname "$0")/.." || exit 1
PID_FILE=".ursamu.pid"
DENO_PID_FILE=".ursamu-deno.pid"
if [ ! -f "$PID_FILE" ]; then
  echo "UrsaMU is not running (no PID file)."
  exit 0
fi
# shellcheck disable=SC1090
source "$PID_FILE"
echo "Stopping UrsaMU..."
[ -n "${MAIN_PID:-}" ] && kill "$MAIN_PID" 2>/dev/null \
  && echo "  Stopped main loop (PID: $MAIN_PID)" || true
if [ -f "$DENO_PID_FILE" ]; then
  kill "$(cat "$DENO_PID_FILE")" 2>/dev/null || true
  rm -f "$DENO_PID_FILE"
fi
[ -n "${TELNET_PID:-}" ] && kill "$TELNET_PID" 2>/dev/null \
  && echo "  Stopped telnet (PID: $TELNET_PID)" || true
rm -f "$PID_FILE"
for port in 4201 4202 4203; do
  pids=$(lsof -ti ":$port" 2>/dev/null || true)
  # shellcheck disable=SC2086
  [ -n "$pids" ] && echo $pids | xargs kill -9 2>/dev/null || true
done
echo "Done."
