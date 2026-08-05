#!/bin/bash
# Shared Deno flags for court run/daemon/main-loop.
#
# Local: if vendor/mush exists and COURT_VENDOR_MUSH != 0, build
#   .deno.local.json (gitignored) that overrides mush → vendor.
# Prod: no vendor/mush → committed deno.json JSR pins only.
#
# COURT_VENDOR_MUSH=0  force JSR even if vendor/mush is present
# COURT_VENDOR_MUSH=1  require vendor (fail if missing)

court_deno_flags() {
  local root
  root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  local flags=(
    --minimum-dependency-age=0
    --allow-all
    --node-modules-dir=auto
    --unstable-detect-cjs
    --unstable-kv
    --unstable-net
  )

  local mode="${COURT_VENDOR_MUSH:-auto}"
  local vendor="$root/vendor/mush/mod.ts"
  local cfg="$root/deno.json"
  local local_cfg="$root/.deno.local.json"

  if [ "$mode" = "0" ]; then
    rm -f "$local_cfg"
    flags+=(--config="$cfg")
    echo "[court] mush: JSR (COURT_VENDOR_MUSH=0)" >&2
  elif [ -f "$vendor" ] && [ "$mode" != "0" ]; then
    if python3 "$root/scripts/mk-local-config.py"; then
      flags+=(--config="$local_cfg")
      echo "[court] mush: local vendor/mush" >&2
    else
      flags+=(--config="$cfg")
      echo "[court] mush: JSR (vendor build failed)" >&2
    fi
  else
    rm -f "$local_cfg"
    if [ "$mode" = "1" ]; then
      echo "[court] ERROR: COURT_VENDOR_MUSH=1 but vendor/mush missing" >&2
      echo "  run: bash scripts/vendor-mush.sh" >&2
      return 1
    fi
    flags+=(--config="$cfg")
    echo "[court] mush: JSR (deno.json)" >&2
  fi

  # shellcheck disable=SC2034
  DENO_FLAGS=("${flags[@]}")
  # space-joined for legacy `deno run $DENO_FLAGS` callers
  # shellcheck disable=SC2034
  DENO_FLAGS_STR="${flags[*]}"
}
