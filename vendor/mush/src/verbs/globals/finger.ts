/**
 * +finger / +finger/set — character profile card.
 */
import { addCmd } from "../../commands/addCmd.ts";
import type { IUrsamuSDK, IDBObj } from "../../commands/types.ts";
import { header, divider, footer } from "../../format/handlers.ts";
import { fmtIdle, isStaffFlags } from "./time-fmt.ts";
import {
  DEFAULT_FIELDS,
  readFingerField,
  readCustomFinger,
  dotLine,
  humanize,
} from "./finger-fields.ts";
import { doFingerSet } from "./finger-set.ts";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findPlayer(
  u: IUrsamuSDK,
  name: string,
): Promise<IDBObj | null> {
  if (name.toLowerCase() === "me") return u.me;
  const escaped = escapeRegex(name);
  const byName = await u.db.search({
    "data.name": new RegExp(`^${escaped}$`, "i"),
  });
  let target = byName.find((r) => r.flags.has("player"));
  if (target) return target;

  const all = await u.db.search({ flags: /player/i });
  target = all.find((r) => {
    const alias = String(r.state?.alias ?? "");
    return alias.toLowerCase() === name.toLowerCase();
  });
  return target ?? null;
}

function statusLine(char: IDBObj): string {
  if (isStaffFlags(char.flags)) return "%ch%ccStaff%cn";
  if (char.state?.approved || char.state?.APPROVED) {
    return "%ch%cgApproved Player%cn";
  }
  return "Unapproved";
}

async function doFingerDisplay(
  u: IUrsamuSDK,
  char: IDBObj,
): Promise<void> {
  const charName = String(
    char.state?.name || char.name || "Unknown",
  );
  const lastCmd =
    (char.state?.lastCommand as number | undefined) || undefined;
  const isConnected = char.flags.has("connected");
  const fullName = String(
    char.state?.fullname || char.state?.FULLNAME || charName,
  );
  const idle = isConnected ? fmtIdle(lastCmd) : "Offline";

  const lines: string[] = [];
  lines.push(header(`${charName}'s +finger`));
  const left = ` Full Name: ${fullName}`;
  lines.push(`${left.padEnd(36)}| Idle: ${idle}`);
  lines.push(divider());
  lines.push(` Status: ${statusLine(char)}`);
  lines.push(divider());
  lines.push("");

  for (const [label, fkey] of DEFAULT_FIELDS) {
    const val = readFingerField(char, fkey);
    if (val === "@@") continue;
    lines.push(dotLine(label, val ?? ""));
  }

  const customs = readCustomFinger(char)
    .filter(([, v]) => v !== "@@")
    .sort(([a], [b]) => a.localeCompare(b));
  for (const [key, val] of customs) {
    lines.push(dotLine(humanize(key), val));
  }

  lines.push("");
  lines.push(footer());
  u.send(lines.join("%r"));
}

export async function execFinger(u: IUrsamuSDK): Promise<void> {
  const sw = (u.cmd.args[0] || "").toLowerCase();
  const rawArgs = (u.cmd.args[1] || "").trim();

  if (sw === "set") {
    await doFingerSet(u, rawArgs);
    return;
  }
  if (rawArgs) {
    const target = await findPlayer(u, rawArgs);
    if (!target) {
      u.send(`No character found matching '${rawArgs}'.`);
      return;
    }
    await doFingerDisplay(u, target);
    return;
  }
  await doFingerDisplay(u, u.me);
}

addCmd({
  name: "+finger",
  pattern: /^\+finger(?:\/(\w+))?\s*(.*)/i,
  lock: "connected",
  category: "Social",
  help: `+finger [<player>]            — Show a profile card.
+finger/set <field>=<value>   — Set a field on yourself.
+finger/set <field>=          — Clear a field.
+finger/set <field>=@@        — Hide field from display.

Default fields: alias, online_times, pronouns,
rp_preferences, character_quote, position.
Custom fields use FINGER-<NAME> attributes.

Examples:
  +finger
  +finger Alice
  +finger/set pronouns=she/her
  +finger/set position=`,
  exec: execFinger,
});
