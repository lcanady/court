/**
 * Court: Chargen room (#8 via CG exit #9) coaching description.
 *
 *   deno run -A --unstable-kv --unstable-detect-cjs \
 *     --minimum-dependency-age=0 --import-map=deno.json \
 *     scripts/setup-chargen.ts
 *
 * Stop the game server before running (single-writer PGlite).
 */
import { initConfig, dbojs } from "@ursamu/mush";

const raw = JSON.parse(await Deno.readTextFile("config/config.json"));
await initConfig(raw);

// Continuous prose; engine wraps. %r%r between paragraphs.
const DESC = [
  "This chamber is half workshop, half waiting room. Corkboards hold court seals and half-finished notes; chalk tallies crawl across a slate; brass lamps pool light on a long table where unfinished character sheets wait beside cold tea and ink-stained blotters. The air carries the quiet pressure of becoming someone the freehold will recognize.",
  "%chCharacter generation happens here.%cn Take your time. Approval is part of the door into play — not a quiz to rush through.",
  "%chHow to build your character:%cn Type %ch%cy+cg%cn to see your current stage, point budgets, and what is left to spend. Read %ch%cy+help +cg%cn for the full chargen guide (stages, syntax, and tips). Use %ch%cy+cg/list%cn to browse options (seemings, kiths, merits, and more), and %ch%cy+cg/set <trait>=<value>%cn to spend points and lock in choices as you go.",
  "%chWhen you are finished:%cn Type %ch%cy+cg/submit%cn to open a staff job for review. Do not jump into full scenes until you are approved — OOC hanging out and reading help are fine while you wait.",
  "Staff aim to review chargen jobs within %ch48 hours%cn. If something is unclear, start with %ch%cy+help +cg%cn, then page staff or add a note on your job.",
].join("%r%r");

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
  "descLen",
  String(d?.description ?? "").length,
);
Deno.exit(0);
