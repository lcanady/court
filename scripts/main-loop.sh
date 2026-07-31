#!/bin/bash
export PATH="$HOME/.deno/bin:$PATH"
# Restart loop for game main server (src/main.ts).
# 75 = @reboot; 0 = clean stop; other = stop loop.
cd "$(dirname "$0")/.." || exit 1

LOG_DIR="logs"
MAIN_LOG="${MAIN_LOG:-$LOG_DIR/main.log}"
DENO_PID_FILE=".ursamu-deno.pid"
DENO_FLAGS=(--minimum-dependency-age=0 --allow-all --node-modules-dir=auto --unstable-detect-cjs --unstable-kv --unstable-net)

RESTART_DELAY=1
MAX_DELAY=60
FAST_EXIT_SECS=5
MAIN_ENTRY="src/main.ts"

mkdir -p "$LOG_DIR"

clear_pglite_lock() {
  local db_dir="data/typegraph.db"
  if [ -f config/config.json ]; then
    local cfg
    cfg=$(sed -n \
      's/.*"db"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
      config/config.json | head -1)
    [ -n "$cfg" ] && db_dir="$cfg"
  fi
  [ -n "${URSAMU_TYPEGRAPH_DB:-}" ] && db_dir="$URSAMU_TYPEGRAPH_DB"
  if [ "$db_dir" != "memory://" ] && \
     [ -f "$db_dir/postmaster.pid" ]; then
    rm -f "$db_dir/postmaster.pid"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleared stale postmaster.pid" \
      >> "$MAIN_LOG"
  fi
}

_deno_pid=""
cleanup() {
  if [ -n "$_deno_pid" ]; then
    kill "$_deno_pid" 2>/dev/null
    wait "$_deno_pid" 2>/dev/null
  fi
  rm -f "$DENO_PID_FILE"
  exit 0
}
trap cleanup SIGTERM SIGINT

while true; do
  clear_pglite_lock
  START_TS=$(date +%s)
  deno run "${DENO_FLAGS[@]}" "$MAIN_ENTRY" >> "$MAIN_LOG" 2>&1 &
  _deno_pid=$!
  echo "$_deno_pid" > "$DENO_PID_FILE"

  wait "$_deno_pid"
  EXIT_CODE=$?
  _deno_pid=""
  rm -f "$DENO_PID_FILE"

  END_TS=$(date +%s)
  RUN_SECS=$(( END_TS - START_TS ))
  TS="$(date '+%Y-%m-%d %H:%M:%S')"

  if [ $EXIT_CODE -eq 75 ]; then
    clear_pglite_lock
    if [ $RUN_SECS -lt $FAST_EXIT_SECS ]; then
      RESTART_DELAY=$(( RESTART_DELAY * 2 ))
      [ $RESTART_DELAY -gt $MAX_DELAY ] && RESTART_DELAY=$MAX_DELAY
    else
      RESTART_DELAY=2
    fi
    echo "[$TS] Reboot ($EXIT_CODE) — restart in ${RESTART_DELAY}s" \
      >> "$MAIN_LOG"
    sleep $RESTART_DELAY
    clear_pglite_lock
    continue
  elif [ $EXIT_CODE -eq 0 ]; then
    echo "[$TS] Clean shutdown (0) — loop stopped." >> "$MAIN_LOG"
    break
  else
    echo "[$TS] Unexpected exit ($EXIT_CODE) — loop stopped." \
      >> "$MAIN_LOG"
    break
  fi
done
