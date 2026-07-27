/**
 * Court: name + description for the IC hub (#14 The Grid → Blackfriars).
 * Also seeds plugins.cofd.icHub / oocRoom in config if missing.
 *
 * Stop the game first, then:
 *   deno run -A --unstable-kv --unstable-detect-cjs \
 *     --minimum-dependency-age=0 --import-map=deno.json \
 *     scripts/setup-ic-hub.ts
 */
import { initConfig, dbojs } from "@ursamu/mush";

const raw = JSON.parse(await Deno.readTextFile("config/config.json"));
await initConfig(raw);

const HUB_ID = "14";
const NAME = "Blackfriars Circus;IC;hub";

// Continuous paragraphs only — look wraps.
const DESC = [
  "Blackfriars Circus opens under a ceiling of coal-smoke and gaslight. Iron rails ring the roundabout; hansoms and ghost-pale omnibuses circle a bronze angel whose wings have gone green with the damp. Beyond the fog-choked arches, every road of the city seems to begin — east toward the river's black glitter, west into the shop-front maze, north up the hill of church spires, south into alleys that smell of tar and rain.",
  "This is not London, though it wears London's coat. The bricks are a shade too dark, the lamps burn a little too low, and the fog never quite lifts. Still, if you know the way — or if the city knows you — you can reach almost anywhere from here: clubs and rookeries, market squares and quiet courts, the places the freehold calls home.",
  "Coaches idle at the curb. A newspaper boy cries headlines no living paper ever printed. Somewhere a clock tower strikes a hour that may not be yours. When you are ready to leave the scene of play, %ch%cy+ooc%cn will take you to the lounge; %ch%cy+ic%cn brings you back to where you left, or here if you have no marker.",
].join("%r%r");

const room = await dbojs.queryOne({ id: HUB_ID });
if (!room) {
  console.error("IC hub #" + HUB_ID + " missing");
  Deno.exit(1);
}

const flags = new Set(
  String(room.flags || "").split(/\s+/).filter(Boolean),
);
flags.add("room");
flags.add("safe");
flags.add("ic"); // IC play space — +ooc bookmarks rooms with this flag

await dbojs.modify({ id: HUB_ID }, "$set", {
  flags: [...flags].join(" "),
  "data.name": NAME,
  "data.description": DESC,
} as never);

// Ensure OOC → IC exit still points here and is named cleanly.
const fromOoc = await dbojs.queryOne({ id: "15" });
if (fromOoc) {
  await dbojs.modify({ id: "15" }, "$set", {
    "data.name": "In Character;IC;grid;circus",
    "data.destination": HUB_ID,
    location: "1",
  } as never);
  console.log("updated exit #15 → hub");
}

console.log("updated hub #" + HUB_ID, NAME);
console.log("paras", DESC.split("%r%r").length);
Deno.exit(0);
