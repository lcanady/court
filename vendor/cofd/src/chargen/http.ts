/**
 * Chargen HTTP helpers — pure request handlers used by routes.ts.
 * Auth is already gated (userId non-null) before these run.
 */

import { dbojs } from "@ursamu/ursamu";
import {
  COFD_ATTRIBUTES,
  COFD_MENTAL_SKILLS,
  COFD_PHYSICAL_SKILLS,
  COFD_SOCIAL_SKILLS,
  COFD_VIRTUE_NAMES,
  COFD_VICE_NAMES,
  CTL_SEEMING_NAMES,
  CTL_COURT_NAMES,
  CTL_REGALIA_NAMES,
  CTL_KITHS,
  kithsForSeeming,
  MENTAL_ATTRIBUTES,
  PHYSICAL_ATTRIBUTES,
  SOCIAL_ATTRIBUTES,
} from "../dictionary/index.ts";
import { COFD_TEMPLATES } from "../gamelines/templates.ts";
import {
  initCgState,
  getStageName,
  maxStageFor,
  updateCgState,
  type CofdCgState,
} from "./state.ts";
import { validateCurrentStage } from "./validate.ts";
import {
  addContract,
  removeContract,
  contractStageProgress,
} from "./contracts.ts";

const STAFF = new Set([
  "superuser",
  "admin",
  "wizard",
  "builder",
  "staff",
  "storyteller",
]);

function flagsOf(raw: unknown): Set<string> {
  if (raw instanceof Set) return raw as Set<string>;
  if (Array.isArray(raw)) return new Set(raw.map(String));
  return new Set(
    String(raw ?? "").split(/[,\s]+/).filter(Boolean),
  );
}

function isStaff(flags: Set<string>): boolean {
  for (const f of flags) {
    if (STAFF.has(f.toLowerCase())) return true;
  }
  return false;
}

function isApproved(actor: Actor): boolean {
  const f = flagsOf(actor.flags);
  if (f.has("approved")) return true;
  const bag = playerBag(actor);
  return !!bag.cofd;
}

/**
 * dbojs.queryOne returns storage shape (flags string, data bag).
 * SDK hydrate() maps data → state; HTTP handlers must accept both.
 */
type Actor = {
  id: string;
  name?: string;
  flags?: unknown;
  state?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

async function loadActor(userId: string): Promise<Actor | null> {
  const row = await dbojs.queryOne({ id: userId });
  if (!row) return null;
  return row as unknown as Actor;
}

/** Player bag: hydrated `state` or raw KV `data`. */
function playerBag(actor: Actor): Record<string, unknown> {
  const s = actor.state && typeof actor.state === "object"
    ? actor.state
    : null;
  const d = actor.data && typeof actor.data === "object"
    ? actor.data
    : null;
  // Prefer the bag that actually holds chargen draft
  if (s && s.cofd_cg != null) return s;
  if (d && d.cofd_cg != null) return d;
  // Live sheet may only live on one side
  if (s && s.cofd != null) return s;
  if (d && d.cofd != null) return d;
  return s || d || {};
}

function readCg(actor: Actor): CofdCgState | null {
  const bag = playerBag(actor);
  const raw = bag.cofd_cg;
  if (!raw || typeof raw !== "object") return null;
  return raw as CofdCgState;
}

async function saveCg(
  userId: string,
  cg: CofdCgState,
): Promise<void> {
  // Storage path is data.* (same as +cg / u.db.modify)
  await dbojs.modify({ id: userId }, "$set", {
    "data.cofd_cg": cg,
  });
}

function stageLabels(max: number): { stage: number; name: string; short: string }[] {
  const shorts: Record<number, string> = {
    1: "Concept",
    2: "Template",
    3: "Detail",
    4: "Attrs",
    5: "Skills",
    6: "Merits",
    7: "Powers",
    8: "Gifts",
  };
  const out = [];
  for (let s = 1; s <= max; s++) {
    out.push({
      stage: s,
      name: getStageName(s),
      short: shorts[s] ?? `Stage ${s}`,
    });
  }
  return out;
}

function publicState(cg: CofdCgState) {
  const max = maxStageFor(cg.sheet.template);
  const val = validateCurrentStage(cg);
  return {
    // FE gate: missing `started` was treated as "Begin chargen"
    // after every /set /next /back — looked like a full restart.
    started: true,
    stage: cg.stage,
    maxStage: max,
    stageName: getStageName(cg.stage),
    stages: stageLabels(max),
    sheet: cg.sheet,
    isSubmitted: !!cg.isSubmitted,
    isApproved: !!cg.isApproved,
    submittedJob: cg.submittedJob ?? null,
    canAdvance: val.valid,
    validationError: val.valid ? null : (val.error ?? "Invalid"),
    templateMeta: templateMeta(cg.sheet.template),
  };
}

function templateMeta(key: string) {
  const t = COFD_TEMPLATES[key.toLowerCase().trim()];
  if (!t) {
    return {
      key: "mortal",
      name: "Mortal",
      customFields: [] as string[],
    };
  }
  return {
    key: t.key,
    name: t.name,
    customFields: [...t.customFields],
    moralityName: t.moralityName,
    powerStatName: t.powerStatName,
  };
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

/** GET /api/v1/cofd/chargen — current session + stage chrome. */
export async function getChargen(
  userId: string,
): Promise<Response> {
  const actor = await loadActor(userId);
  if (!actor) return json({ error: "Forbidden" }, 403);

  if (isApproved(actor) && !isStaff(flagsOf(actor.flags))) {
    return json({
      ok: true,
      closed: true,
      reason: "Character already approved. Chargen is closed.",
    });
  }

  let cg = readCg(actor);
  if (!cg) {
    return json({
      ok: true,
      started: false,
      stages: stageLabels(6),
      templates: Object.values(COFD_TEMPLATES).map((t) => ({
        key: t.key,
        name: t.name,
      })),
    });
  }

  return json({ ok: true, started: true, ...publicState(cg) });
}

/** POST /api/v1/cofd/chargen/start — begin or soft-reset draft. */
export async function startChargen(
  userId: string,
  body: { reset?: boolean } = {},
): Promise<Response> {
  const actor = await loadActor(userId);
  if (!actor) return json({ error: "Forbidden" }, 403);

  if (isApproved(actor) && !isStaff(flagsOf(actor.flags))) {
    return json({
      error: "Character already approved.",
    }, 403);
  }

  if (body.reset || !readCg(actor)) {
    const cg = initCgState();
    await saveCg(userId, cg);
    return json({ ok: true, started: true, ...publicState(cg) });
  }

  const cg = readCg(actor)!;
  return json({ ok: true, started: true, ...publicState(cg) });
}

/** POST /api/v1/cofd/chargen/set — { trait, value }. */
export async function setChargenTrait(
  userId: string,
  body: { trait?: string; value?: string },
): Promise<Response> {
  const actor = await loadActor(userId);
  if (!actor) return json({ error: "Forbidden" }, 403);
  if (isApproved(actor) && !isStaff(flagsOf(actor.flags))) {
    return json({ error: "Chargen closed." }, 403);
  }

  let cg = readCg(actor);
  if (!cg) {
    cg = initCgState();
  }
  if (cg.isSubmitted) {
    return json({
      error: "Application pending review. Contact staff to reopen.",
    }, 409);
  }

  const trait = String(body.trait ?? "").trim();
  const value = String(body.value ?? "").trim();
  if (!trait) return json({ error: "trait required" }, 400);

  try {
    cg = updateCgState(cg, trait, value);
    await saveCg(userId, cg);
    return json({ ok: true, ...publicState(cg) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 400);
  }
}

/** POST /api/v1/cofd/chargen/next | /back */
export async function stepChargen(
  userId: string,
  dir: "next" | "back",
): Promise<Response> {
  const actor = await loadActor(userId);
  if (!actor) return json({ error: "Forbidden" }, 403);
  if (isApproved(actor) && !isStaff(flagsOf(actor.flags))) {
    return json({ error: "Chargen closed." }, 403);
  }

  let cg = readCg(actor);
  if (!cg) return json({ error: "Start chargen first." }, 400);
  if (cg.isSubmitted && dir === "next") {
    return json({
      error: "Already submitted for review.",
      ...publicState(cg),
    }, 409);
  }

  if (dir === "back") {
    if (cg.stage <= 1) {
      return json({ error: "Already at first stage." }, 400);
    }
    cg = { ...cg, stage: cg.stage - 1 };
    await saveCg(userId, cg);
    return json({ ok: true, ...publicState(cg) });
  }

  const val = validateCurrentStage(cg);
  if (!val.valid) {
    return json({
      error: val.error ?? "Stage incomplete",
      ...publicState(cg),
    }, 400);
  }

  const max = maxStageFor(cg.sheet.template);
  if (cg.stage >= max) {
    // Mark ready-to-submit; full job submit stays in-game for now
    // or via /submit.
    return json({
      ok: true,
      readyToSubmit: true,
      ...publicState(cg),
    });
  }

  cg = { ...cg, stage: cg.stage + 1 };
  await saveCg(userId, cg);
  return json({ ok: true, ...publicState(cg) });
}

/** POST /api/v1/cofd/chargen/contract — add/remove CtL contract. */
export async function contractChargen(
  userId: string,
  body: { action?: string; name?: string },
): Promise<Response> {
  const actor = await loadActor(userId);
  if (!actor) return json({ error: "Forbidden" }, 403);
  let cg = readCg(actor);
  if (!cg) return json({ error: "Start chargen first." }, 400);

  const name = String(body.name ?? "").trim();
  if (!name) return json({ error: "name required" }, 400);
  const action = String(body.action ?? "add").toLowerCase();

  try {
    cg = action === "remove"
      ? removeContract(cg, name)
      : addContract(cg, name);
    await saveCg(userId, cg);
    const prog = contractStageProgress(cg.sheet);
    return json({
      ok: true,
      progress: prog,
      ...publicState(cg),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 400);
  }
}

/** GET /api/v1/cofd/chargen/options?topic= */
export async function chargenOptions(
  topicRaw: string,
  seeming?: string,
): Promise<Response> {
  const topic = topicRaw.toLowerCase().trim();

  if (topic === "virtues") {
    return json({
      ok: true,
      topic,
      items: COFD_VIRTUE_NAMES.map((n) => ({ name: n })),
    });
  }
  if (topic === "vices") {
    return json({
      ok: true,
      topic,
      items: COFD_VICE_NAMES.map((n) => ({ name: n })),
    });
  }
  if (topic === "templates") {
    return json({
      ok: true,
      topic,
      items: Object.values(COFD_TEMPLATES)
        .filter((t) =>
          ["mortal", "changeling", "werewolf"].includes(t.key)
        )
        .map((t) => ({ key: t.key, name: t.name })),
    });
  }
  if (topic === "seemings") {
    return json({
      ok: true,
      topic,
      items: CTL_SEEMING_NAMES.map((n) => ({ name: n })),
    });
  }
  if (topic === "courts") {
    return json({
      ok: true,
      topic,
      items: CTL_COURT_NAMES.map((n) => ({ name: n })),
    });
  }
  if (topic === "regalia" || topic === "favored") {
    return json({
      ok: true,
      topic,
      items: CTL_REGALIA_NAMES.map((n) => ({ name: n })),
    });
  }
  if (topic === "kiths") {
    const list = seeming
      ? kithsForSeeming(seeming)
      : CTL_KITHS;
    return json({
      ok: true,
      topic,
      items: list.map((k) => ({
        name: k.name,
        seeming: k.seeming ?? "",
      })),
    });
  }
  if (topic === "attributes") {
    return json({
      ok: true,
      topic,
      mental: [...MENTAL_ATTRIBUTES],
      physical: [...PHYSICAL_ATTRIBUTES],
      social: [...SOCIAL_ATTRIBUTES],
      all: [...COFD_ATTRIBUTES],
    });
  }
  if (topic === "skills") {
    return json({
      ok: true,
      topic,
      mental: [...COFD_MENTAL_SKILLS],
      physical: [...COFD_PHYSICAL_SKILLS],
      social: [...COFD_SOCIAL_SKILLS],
    });
  }

  return json({ error: `Unknown topic: ${topic}` }, 404);
}
