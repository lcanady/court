#!/bin/bash
export PATH="/Users/kumakun/.deno/bin:/Users/kumakun/flutter/bin:/Users/kumakun/.antigravity-ide/antigravity-ide/bin:/Users/kumakun/.grok/bin:/Users/kumakun/.local/bin:/Users/kumakun/.nvm/versions/node/v22.22.2/bin:/Users/kumakun/.bun/bin:/Users/kumakun/.pyenv/shims:/Users/kumakun/.antigravity/antigravity/bin:/opt/homebrew/opt/openjdk@17/bin:/Users/kumakun/.foundry/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/local/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/appleinternal/bin:/pkg/env/global/bin://Applications/Topaz Gigapixel AI.app/Contents/Resources/bin:/Library/Apple/usr/bin:/Users/kumakun/flutter/bin:/Users/kumakun/.deno/bin:/Users/kumakun/.langflow/uv://Applications/Topaz Gigapixel.app/Contents/Resources/bin:/Applications/Ghostty.app/Contents/MacOS:/opt/homebrew/opt/dart/libexec/bin:/Users/kumakun/Library/Android/sdk/emulator:/Users/kumakun/Library/Android/sdk/platform-tools:/Users/kumakun/Library/Android/sdk/tools:/Users/kumakun/Library/Android/sdk/tools/bin:/Users/kumakun/.lmstudio/bin:/Users/kumakun/.foundry/bin:/Users/kumakun/.foundry/bin"
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
