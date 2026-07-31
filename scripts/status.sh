#!/bin/bash
export PATH="/Users/kumakun/.deno/bin:/Users/kumakun/flutter/bin:/Users/kumakun/.antigravity-ide/antigravity-ide/bin:/Users/kumakun/.grok/bin:/Users/kumakun/.local/bin:/Users/kumakun/.nvm/versions/node/v22.22.2/bin:/Users/kumakun/.bun/bin:/Users/kumakun/.pyenv/shims:/Users/kumakun/.antigravity/antigravity/bin:/opt/homebrew/opt/openjdk@17/bin:/Users/kumakun/.foundry/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/local/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/appleinternal/bin:/pkg/env/global/bin://Applications/Topaz Gigapixel AI.app/Contents/Resources/bin:/Library/Apple/usr/bin:/Users/kumakun/flutter/bin:/Users/kumakun/.deno/bin:/Users/kumakun/.langflow/uv://Applications/Topaz Gigapixel.app/Contents/Resources/bin:/Applications/Ghostty.app/Contents/MacOS:/opt/homebrew/opt/dart/libexec/bin:/Users/kumakun/Library/Android/sdk/emulator:/Users/kumakun/Library/Android/sdk/platform-tools:/Users/kumakun/Library/Android/sdk/tools:/Users/kumakun/Library/Android/sdk/tools/bin:/Users/kumakun/.lmstudio/bin:/Users/kumakun/.foundry/bin:/Users/kumakun/.foundry/bin"
cd "$(dirname "$0")/.." || exit 1
PID_FILE=".ursamu.pid"
if [ ! -f "$PID_FILE" ]; then
  echo "UrsaMU: stopped (no PID file)."
  exit 1
fi
# shellcheck disable=SC1090
source "$PID_FILE"
echo "UrsaMU status:"
if kill -0 "${MAIN_PID:-}" 2>/dev/null; then
  echo "  Main server   : running  (PID: $MAIN_PID)"
else
  echo "  Main server   : stopped"
fi
if kill -0 "${TELNET_PID:-}" 2>/dev/null; then
  echo "  Telnet server : running  (PID: $TELNET_PID)"
else
  echo "  Telnet server : stopped"
fi
for port in 4201:telnet 4202:ws 4203:http; do
  p=${port%:*}; label=${port#*:}
  bound=$(lsof -ti ":$p" 2>/dev/null || true)
  if [ -n "$bound" ]; then
    printf "  %-8s :%s bound (pid %s)\n" "$label" "$p" "$bound"
  else
    printf "  %-8s :%s free\n" "$label" "$p"
  fi
done
