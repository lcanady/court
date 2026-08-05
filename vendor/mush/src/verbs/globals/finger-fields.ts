/**
 * +finger field keys, attribute mapping, and readers.
 */
import type { IDBObj } from "../../commands/types.ts";

export const FINGER_PREFIX = "FINGER-";
export const ALIAS_FIELD = "alias";

/** [display_label, field_key, attr_name | null for special] */
export const DEFAULT_FIELDS: Array<[string, string, string | null]> = [
  ["Alias", "alias", null],
  ["Online Times", "online_times", "ONLINE-TIMES"],
  ["Pronouns", "pronouns", "PRONOUNS"],
  ["RP Preferences", "rp_preferences", "RP-PREFERENCES"],
  ["Character Quote", "character_quote", "CHARACTER-QUOTE"],
  ["Position", "position", "POSITION"],
];

export function attrFor(field: string): string {
  for (const [, key, attr] of DEFAULT_FIELDS) {
    if (key === field && attr) return attr;
  }
  return FINGER_PREFIX + field.toUpperCase().replace(/_/g, "-");
}

export function humanize(key: string): string {
  return key
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function readAttr(
  obj: IDBObj,
  name: string,
): string | undefined {
  const attrs =
    (obj.state?.attributes as
      | Array<{ name: string; value: string }>
      | undefined) ?? [];
  const hit = attrs.find(
    (a) => a.name.toUpperCase() === name.toUpperCase(),
  );
  return hit?.value;
}

export function readFingerField(
  obj: IDBObj,
  field: string,
): string | undefined {
  if (field === ALIAS_FIELD) {
    const a = obj.state?.alias as string | undefined;
    return a == null || a === "" ? undefined : a;
  }
  return readAttr(obj, attrFor(field));
}

export function readCustomFinger(
  obj: IDBObj,
): Array<[string, string]> {
  const attrs =
    (obj.state?.attributes as
      | Array<{ name: string; value: string }>
      | undefined) ?? [];
  return attrs
    .filter((a) =>
      a.name.toUpperCase().startsWith(FINGER_PREFIX),
    )
    .map(
      (a) =>
        [a.name.slice(FINGER_PREFIX.length), a.value] as [
          string,
          string,
        ],
    );
}

const COLON_COL = 22;

export function dotLine(label: string, value: string): string {
  const pre = ` ${label} `;
  const dotsNeeded = Math.max(1, COLON_COL - pre.length);
  const dots = ".".repeat(dotsNeeded);
  return `${pre}${dots}: ${value}`;
}
