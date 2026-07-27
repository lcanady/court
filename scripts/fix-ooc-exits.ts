/**
 * Ensure OOC Lounge (#1) has full exit set, including Quiet Room.
 *
 * Stop the game first, then:
 *   deno run -A --unstable-kv --unstable-detect-cjs \
 *     --minimum-dependency-age=0 --import-map=deno.json \
 *     scripts/fix-ooc-exits.ts
 */
import { initConfig, dbojs, counters } from "@ursamu/mush";

const raw = JSON.parse(await Deno.readTextFile("config/config.json"));
await initConfig(raw);

const OOC = "1";
const fromOoc = await dbojs.query({ location: OOC });
const exits = fromOoc.filter((o) =>
  /\bexit\b/i.test(String(o.flags || ""))
);

console.log("OOC exits before:");
for (const e of exits) {
  const d = e.data as { name?: string; destination?: string };
  console.log(" ", e.id, d?.name, "->", d?.destination, e.flags);
}

// Quiet Room #16 has Out→1; ensure reverse Quiet Room;QR from OOC.
const qrId = "16";
const qr = await dbojs.queryOne({ id: qrId });
if (!qr) {
  console.log("Quiet Room #16 missing — skip QR link");
} else {
  const hasToQr = exits.some((e) =>
    String((e.data as { destination?: string })?.destination) === qrId
  );
  if (!hasToQr) {
    const id = String(await counters.atomicIncrement("objid"));
    await dbojs.create({
      id,
      flags: "exit",
      location: OOC,
      data: {
        name: "Quiet Room;QR;quiet",
        destination: qrId,
        owner: "2",
      },
    } as never);
    console.log("created exit #" + id + " Quiet Room from OOC");
  } else {
    console.log("Quiet Room exit from OOC already exists");
  }
}

// Ensure known exits are not dark and have exit flag clean.
for (const e of exits) {
  const fl = new Set(
    String(e.flags || "").split(/\s+/).filter(Boolean),
  );
  fl.add("exit");
  fl.delete("dark");
  await dbojs.modify({ id: e.id }, "$set", {
    flags: [...fl].join(" "),
  } as never);
}

const after = (await dbojs.query({ location: OOC })).filter((o) =>
  /\bexit\b/i.test(String(o.flags || ""))
);
console.log("OOC exits after:", after.length);
for (const e of after) {
  const d = e.data as { name?: string; destination?: string };
  console.log(" ", e.id, d?.name, "->", d?.destination, e.flags);
}
Deno.exit(0);
