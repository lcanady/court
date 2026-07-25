/**
 * One-shot repair: ensure an OOC Lounge room exists and every player
 * is located in a real room (not in themselves).
 *
 *   deno run -A --unstable-kv --unstable-detect-cjs \
 *     scripts/repair-world.ts
 */
import { initConfig, DBO, setConfig } from "@ursamu/core";

await initConfig();

const dbojs = new DBO<Record<string, unknown> & {
  id: string;
  flags?: string;
  location?: string;
  data?: Record<string, unknown>;
}>("server.db");

const counters = new DBO<{
  id: string;
  value?: number;
  seq?: number;
}>("server.counters");

const all = await dbojs.all();
console.log(`[repair] objects before: ${all.length}`);

const isRoom = (o: { flags?: string }) =>
  /\broom\b/i.test(String(o.flags ?? ""));

let rooms = all.filter(isRoom);

if (!rooms.length) {
  // Never overwrite id 1 if a player already owns it.
  const idOne = all.find((o) => o.id === "1");
  const roomId = idOne && !isRoom(idOne) ? "2" : "1";
  await dbojs.create({
    id: roomId,
    flags: "room safe",
    data: {
      name: "OOC Lounge",
      description:
        "A comfortable out-of-character lounge. Soft chairs, " +
        "quiet conversation, and a place to catch your breath " +
        "between scenes.",
    },
  });
  console.log(`[repair] created OOC Lounge (#${roomId})`);
  rooms = (await dbojs.all()).filter(isRoom);
  setConfig("game.playerStart", roomId);
}

const start =
  rooms.find((r) => r.id === "1") ?? rooms[0];
const roomIds = new Set(rooms.map((r) => r.id));

let moved = 0;
for (const o of await dbojs.all()) {
  if (!/\bplayer\b/i.test(String(o.flags ?? ""))) continue;
  const loc = o.location;
  if (loc && roomIds.has(loc) && loc !== o.id) continue;
  await dbojs.modify({ id: o.id }, "$set", {
    location: start.id,
  });
  moved++;
  console.log(
    `[repair] moved player #${o.id} → #${start.id}`,
  );
}

// Keep objid counter ahead of every existing id.
const maxId = Math.max(
  0,
  ...(await dbojs.all()).map((o) => Number(o.id) || 0),
);
const ctr = await counters.queryOne({ id: "objid" });
if (!ctr) {
  await counters.create({
    id: "objid",
    value: maxId,
    seq: maxId,
  });
} else {
  const cur = Number(ctr.value ?? ctr.seq ?? 0) || 0;
  if (cur < maxId) {
    await counters.modify({ id: "objid" }, "$set", {
      value: maxId,
      seq: maxId,
    });
  }
}

console.log(
  `[repair] done. rooms=${rooms.length} moved=${moved} ` +
    `start=#${start.id} maxId=${maxId}`,
);
await DBO.close();
