#!/usr/bin/env python3
"""Build gitignored .deno.local.json for local vendor mush.

deno.json stays JSR-only (prod). When vendor/mush exists, local run
scripts call this to point mush imports at ./vendor/mush without
touching the committed pin file.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DENO_JSON = ROOT / "deno.json"
OUT = ROOT / ".deno.local.json"
VENDOR_MOD = ROOT / "vendor" / "mush" / "mod.ts"

MUSH_OVERRIDES = {
    "ursamu": "./vendor/mush/mod.ts",
    "@ursamu/mush": "./vendor/mush/mod.ts",
    "@ursamu/mush/app": "./vendor/mush/src/app.ts",
    "@ursamu/mush/permissions": (
        "./vendor/mush/src/world/permissions.ts"
    ),
    "@ursamu/ursamu": "./vendor/mush/mod.ts",
    "@ursamu/ursamu/app": "./vendor/mush/src/app.ts",
}


def main() -> int:
    if not VENDOR_MOD.is_file():
        if OUT.exists():
            OUT.unlink()
        print("no vendor/mush — using deno.json (JSR)", file=sys.stderr)
        return 1

    cfg = json.loads(DENO_JSON.read_text())
    imports = dict(cfg.get("imports") or {})
    imports.update(MUSH_OVERRIDES)
    cfg["imports"] = imports
    OUT.write_text(json.dumps(cfg, indent=2) + "\n")
    print(f"wrote {OUT.relative_to(ROOT)} (vendor mush)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
