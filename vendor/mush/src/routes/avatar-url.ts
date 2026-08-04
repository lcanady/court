/**
 * Resolve public avatar URL for a player.
 *
 * @avatar stores files at data/avatars/{id}.{ext} and sets
 * data.avatarExt. Legacy DB field data.image may hold an external
 * or relative URL. Prefer the local file when present.
 */

const AVATARS_DIR = "data/avatars";
const EXT_RE = /^[a-z0-9]{1,8}$/i;

/** Strip leading # from dbref-style ids. */
export function barePlayerId(id: string | number): string {
  return String(id ?? "").replace(/^#/, "").trim();
}

/**
 * Synchronous path when avatarExt or image is already known.
 * Does not touch the filesystem.
 */
export function avatarUrlFromData(
  playerId: string | number,
  data?: Record<string, unknown> | null,
): string | null {
  const bare = barePlayerId(playerId);
  if (!bare) return null;

  const ext = data?.avatarExt;
  if (typeof ext === "string" && EXT_RE.test(ext)) {
    return `/avatars/${bare}.${ext.toLowerCase()}`;
  }

  const img = data?.image;
  if (typeof img === "string") {
    const s = img.trim();
    if (!s) return null;
    // Relative local avatar or absolute http(s)
    if (s.startsWith("/avatars/")) return s;
    if (/^https?:\/\//i.test(s)) return s;
    // Bare filename stored by mistake
    if (/^[a-zA-Z0-9_-]+\.(png|jpe?g|gif|webp)$/i.test(s)) {
      return `/avatars/${s}`;
    }
  }
  return null;
}

/**
 * Prefer data fields; if missing, look for data/avatars/{id}.*
 */
export async function resolveAvatarUrl(
  playerId: string | number,
  data?: Record<string, unknown> | null,
): Promise<string | null> {
  const fromData = avatarUrlFromData(playerId, data);
  if (fromData) return fromData;

  const bare = barePlayerId(playerId);
  if (!bare) return null;

  try {
    for await (const entry of Deno.readDir(AVATARS_DIR)) {
      if (!entry.isFile) continue;
      if (!entry.name.startsWith(bare + ".")) continue;
      return `/avatars/${entry.name}`;
    }
  } catch {
    // no avatars dir yet
  }
  return null;
}
