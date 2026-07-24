#!/usr/bin/env -S deno run -A --minimum-dependency-age=0
/**
 * Court-local engine/plugin updater.
 *
 * Bumps @ursamu/mush (and alias keys) to the latest JSR release, keeps
 * related import-map aliases in sync, then reloads the Deno cache.
 *
 * Prefer this over the published CLI until @ursamu/cli understands mush.
 */

const DENO_JSON = "deno.json";
const ENGINE_KEYS = ["ursamu", "@ursamu/ursamu", "@ursamu/mush"] as const;
const ENGINE_RE = /^jsr:@ursamu\/(?:mush|ursamu)(@[^\s]*)?$/;

const denoJsonPath = new URL(`../${DENO_JSON}`, import.meta.url);
const raw = await Deno.readTextFile(denoJsonPath);
const denoJson = JSON.parse(raw) as {
  imports?: Record<string, string>;
  minimumDependencyAge?: number | string;
  [k: string]: unknown;
};

const imports = denoJson.imports;
if (!imports) {
  console.error("deno.json has no imports map.");
  Deno.exit(1);
}

const importKey = ENGINE_KEYS.find((k) => k in imports);
if (!importKey) {
  console.error(
    "No engine import found (ursamu / @ursamu/mush / @ursamu/ursamu).",
  );
  Deno.exit(1);
}

const current = imports[importKey];
if (!ENGINE_RE.test(current)) {
  console.error(`Engine import is not a JSR mush/ursamu package: ${current}`);
  Deno.exit(1);
}

const pkg = current.includes("@ursamu/mush") ? "mush" : "ursamu";
const scope = `@ursamu/${pkg}`;
const metaRes = await fetch(`https://jsr.io/${scope}/meta.json`);
if (!metaRes.ok) {
  console.error(`Failed to fetch ${scope} meta: HTTP ${metaRes.status}`);
  Deno.exit(1);
}
const meta = await metaRes.json() as { latest: string };
const latest = meta.latest;
const currentVer = current.match(/@(\d+\.\d+\.\d+)/)?.[1] ?? null;
const next = `jsr:${scope}@${latest}`;

let dirty = false;
if (currentVer !== latest) {
  console.log(`${current} → ${next}`);
  for (const key of ENGINE_KEYS) {
    if (!(key in imports)) continue;
    if (!ENGINE_RE.test(imports[key])) continue;
    imports[key] = next;
  }
  for (const key of Object.keys(imports)) {
    if (!key.endsWith("/")) continue;
    const base = key.slice(0, -1);
    if ((ENGINE_KEYS as readonly string[]).includes(base)) {
      imports[key] = `${next}/`;
    }
  }
  dirty = true;
} else {
  console.log(`Already on ${scope}@${latest}`);
}

// Allow same-day first-party publishes (Deno default is 24h).
if (denoJson.minimumDependencyAge !== 0) {
  denoJson.minimumDependencyAge = 0;
  dirty = true;
  console.log("Set minimumDependencyAge = 0");
}

if (dirty) {
  await Deno.writeTextFile(
    denoJsonPath,
    JSON.stringify(denoJson, null, 2) + "\n",
  );
  console.log("Updated deno.json");
}

const toCache: string[] = [];
for (const e of ["src/main.ts", "src/telnet.ts"]) {
  try {
    await Deno.stat(e);
    toCache.push(e);
  } catch {
    /* missing */
  }
}

if (toCache.length) {
  console.log(`Re-caching: ${toCache.join(", ")}`);
  const cmd = new Deno.Command(Deno.execPath(), {
    args: [
      "cache",
      "--reload",
      "--minimum-dependency-age=0",
      ...toCache,
    ],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  const status = await cmd.spawn().status;
  if (!status.success) {
    console.warn("deno cache exited non-zero");
    Deno.exit(status.code || 1);
  }
}

console.log("Done.");
