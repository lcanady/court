/**
 * +glance — one-line-per-occupant room scan.
 */
import { addCmd } from "../../commands/addCmd.ts";
import type { IUrsamuSDK, IDBObj } from "../../commands/types.ts";
import { divider } from "../../format/handlers.ts";
import { fmtIdle } from "./time-fmt.ts";

function shortDesc(obj: IDBObj): string {
  const attrs =
    (obj.state?.attributes as
      | Array<{ name?: string; value?: string }>
      | undefined) ?? [];
  return (
    attrs.find((a) => {
      const n = (a.name ?? "").toLowerCase();
      return n === "short-desc" || n === "shortdesc";
    })?.value ?? ""
  );
}

export async function execGlance(u: IUrsamuSDK): Promise<void> {
  const here = u.here;
  if (!here?.id) {
    u.send("You aren't anywhere.");
    return;
  }

  const players = (here.contents ?? []).filter(
    (o: IDBObj) =>
      o.flags.has("player") && o.flags.has("connected"),
  );

  const roomName = here.name ?? "here";
  const lines: string[] = [];
  lines.push(divider(`At a glance around ${roomName}`));

  if (players.length === 0) {
    lines.push("  No one else is here.");
  } else {
    for (const p of players) {
      const name = u.util.displayName(p, u.me).slice(0, 28);
      const idle = fmtIdle(p.state?.lastCommand);
      const desc = shortDesc(p);
      lines.push(
        ` ${name.padEnd(28)} ${idle.padStart(4)}  ${desc}`,
      );
    }
  }
  lines.push(divider());
  u.send(lines.join("%r"));
}

addCmd({
  name: "+glance",
  pattern: /^\+glance$/i,
  lock: "connected",
  category: "Social",
  help: `+glance  — One-line-per-occupant scan of the room.

Shows each connected player's name, idle, and short-desc.

Examples:
  +glance`,
  exec: execGlance,
});
