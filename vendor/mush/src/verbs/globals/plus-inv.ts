/**
 * +i / +inv <player> — inspect another player's carried items.
 */
import { addCmd } from "../../commands/addCmd.ts";
import type { IUrsamuSDK, IDBObj } from "../../commands/types.ts";
import { header, divider, footer } from "../../format/handlers.ts";

function visibleItems(
  raw: IDBObj[],
  canEdit: boolean,
): IDBObj[] {
  return raw.filter((o: IDBObj) => {
    if (o.flags.has("exit") || o.flags.has("player")) {
      return false;
    }
    if (canEdit) return true;
    return !o.flags.has("dark") && !o.flags.has("opaque");
  });
}

function renderInv(who: string, items: IDBObj[]): string {
  const lines: string[] = [];
  lines.push(header(`Carried by ${who}`));
  if (items.length === 0) {
    lines.push("  Nothing.");
  } else {
    for (const o of items) {
      const name =
        (o.state?.name as string) || o.name || "(unknown)";
      lines.push(`  ${name}`);
    }
  }
  lines.push(divider());
  const n = items.length;
  lines.push(`  ${n} item${n === 1 ? "" : "s"}.`);
  lines.push(footer());
  return lines.join("%r");
}

export async function execPlusInv(u: IUrsamuSDK): Promise<void> {
  const ref = u.util.stripSubs(u.cmd.args[0] ?? "").trim();
  if (!ref) {
    u.send("Usage: +i <player>");
    return;
  }

  const target = await u.util.target(u.me, ref, true);
  if (!target) {
    u.send(`No one found matching '${ref}'.`);
    return;
  }
  if (!target.flags.has("player")) {
    u.send(
      `${u.util.displayName(target, u.me)} isn't a player.`,
    );
    return;
  }

  const canEdit = await u.canEdit(u.me, target);
  const sameRoom =
    !!target.location &&
    !!u.here?.id &&
    target.location === u.here.id;
  if (!sameRoom && !canEdit) {
    u.send(
      `${u.util.displayName(target, u.me)} isn't here.`,
    );
    return;
  }

  const raw = await u.db.search({ location: target.id });
  const items = visibleItems(raw, canEdit);
  const who = u.util.displayName(target, u.me);
  u.send(renderInv(who, items));
}

addCmd({
  name: "+i",
  pattern: /^\+(?:i|inv)(?:\s+(.*))?$/i,
  lock: "connected",
  category: "Social",
  help: `+i <player>  — See what another player is carrying.

Same-room for anyone; staff (canEdit) can inspect remotely.
Dark/opaque items are staff-only. Own inventory: inventory

  +inv is an alias for +i.

Examples:
  +i Alice
  +inv Bob`,
  exec: execPlusInv,
});
