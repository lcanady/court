/**
 * Court: Chargen room coaching description.
 *
 * Every display line is kept ≤74 visible chars so look's wordWrap
 * does not reflow and orphan words ("Take / your time").
 *
 * Stop the game first (single-writer PGlite), then:
 *   deno run -A --unstable-kv --unstable-detect-cjs \
 *     --minimum-dependency-age=0 --import-map=deno.json \
 *     scripts/setup-chargen.ts
 */
import { initConfig, dbojs } from "@ursamu/mush";

const raw = JSON.parse(await Deno.readTextFile("config/config.json"));
await initConfig(raw);

// Hard line breaks with %r. Blank line = empty string in the list
// (becomes %r%r). Do not rely on engine wrap for body prose.
const LINES = [
  "This chamber is half workshop, half waiting room. Corkboards",
  "hold court seals and half-finished notes; chalk tallies crawl",
  "across a slate; brass lamps pool light on a long table where",
  "unfinished character sheets wait beside cold tea and",
  "ink-stained blotters. The air carries the quiet pressure of",
  "becoming someone the freehold will recognize.",
  "",
  "%chCharacter generation happens here.%cn Take your time.",
  "Approval is part of the door into play — not a quiz to rush.",
  "",
  "%chHow to build your character:%cn",
  "  %ch%cy+cg%cn              Stage, budgets, what is left",
  "  %ch%cy+help +cg%cn        Full chargen guide and tips",
  "  %ch%cy+cg/list%cn         Browse seemings, kiths, merits…",
  "  %ch%cy+cg/set <t>=<v>%cn  Spend points and lock choices",
  "",
  "%chWhen you are finished:%cn",
  "  %ch%cy+cg/submit%cn       Open a staff job for review",
  "",
  "Do not jump into full scenes until you are approved. OOC",
  "hanging out and reading help are fine while you wait.",
  "",
  "Staff aim to review chargen jobs within %ch48 hours%cn. If",
  "something is unclear, start with %ch%cy+help +cg%cn, then",
  "page staff or add a note on your job.",
];

const DESC = LINES.join("%r");

const strip = (s: string) =>
  s.replace(/%c[a-zA-Z]/gi, "").replace(/%[rntbR]/gi, "");

let bad = 0;
for (const line of LINES) {
  const n = strip(line).length;
  if (n > 74) {
    console.error("TOO LONG (" + n + "): " + strip(line));
    bad++;
  }
}
if (bad) {
  console.error(bad + " line(s) over 74 — aborting");
  Deno.exit(1);
}

let roomId: string | undefined;
const exit = await dbojs.queryOne({ id: "9" });
const dest = (exit?.data as { destination?: string } | undefined)
  ?.destination;
if (dest) roomId = String(dest);

if (!roomId) {
  const all = await dbojs.query({});
  const hit = all.find((o) => {
    const n = String(
      (o.data as { name?: string } | undefined)?.name ?? "",
    );
    return /^chargen\b/i.test(n.split(";")[0]?.trim() ?? "");
  });
  roomId = hit?.id;
}

if (!roomId) {
  console.error("Chargen room not found");
  Deno.exit(1);
}

await dbojs.modify({ id: roomId }, "$set", {
  "data.description": DESC,
} as never);

const room = await dbojs.queryOne({ id: roomId });
const d = room?.data as { name?: string; description?: string };
console.log(
  "updated #" + roomId,
  d?.name,
  "lines",
  LINES.length,
  "descLen",
  String(d?.description ?? "").length,
);
Deno.exit(0);
