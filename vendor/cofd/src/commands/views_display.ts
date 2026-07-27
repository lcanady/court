// +views list / single-entry display.

import { header, footer, divider, type IUrsamuSDK } from "@ursamu/ursamu";
import {
  getRoomViews,
  viewSlug,
  type RoomView,
  type RoomViews,
} from "../views/index.ts";
import { canSeeView, visibleViews, type Place } from "./views_lib.ts";

function fmtDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export async function showViewList(
  u: IUrsamuSDK,
  place: Place,
): Promise<void> {
  const visible = await visibleViews(u, place);
  const name = u.util.displayName(place as never, u.me);
  const lines: string[] = [];
  lines.push(await header(`Views: ${name}`));
  if (visible.length === 0) {
    lines.push("No views are available here.");
  } else {
    lines.push(
      "  %chName%cn                                   %chLock%cn",
    );
    lines.push(await divider());
    for (const v of visible) {
      const lock = v.lock?.trim()
        ? v.lock.trim().slice(0, 28)
        : "(open)";
      lines.push(`  ${v.name.padEnd(40)}  ${lock}`);
    }
    lines.push("");
    lines.push("  Type %ch%cy+views <name>%cn to read a view.");
  }
  lines.push(await footer());
  u.send(lines.join("\n"));
}

export async function showOneView(
  u: IUrsamuSDK,
  place: Place,
  slug: string,
): Promise<void> {
  const views = getRoomViews(place);
  const view = views[slug];
  if (!view || !(await canSeeView(u, place, view))) {
    u.send("No such view.");
    return;
  }
  const where = u.util.displayName(place as never, u.me);
  const lines: string[] = [];
  lines.push(await header(`${where} / ${view.name}`));
  if (view.lock?.trim()) {
    lines.push(`  Lock: ${view.lock.trim()}`);
  }
  lines.push(`  Updated: ${fmtDate(view.updatedAt)}`);
  lines.push(await divider());
  lines.push(view.text);
  lines.push(await footer());
  u.send(lines.join("\n"));
}

export type { RoomView, RoomViews };
export { viewSlug };
