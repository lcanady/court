/**
 * Unit tests for chargen HTTP helpers (options catalog + pure shapes).
 */
import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { chargenOptions } from "../src/chargen/http.ts";

const OPTS = { sanitizeResources: false, sanitizeOps: false };

Deno.test("chargenOptions virtues", OPTS, async () => {
  const res = await chargenOptions("virtues");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.ok, true);
  assertEquals(Array.isArray(body.items), true);
  assertEquals(body.items.length > 0, true);
  assertExists(body.items[0].name);
});

Deno.test("chargenOptions templates filtered", OPTS, async () => {
  const res = await chargenOptions("templates");
  const body = await res.json();
  const keys = body.items.map((i: { key: string }) => i.key);
  assertEquals(keys.includes("changeling"), true);
  assertEquals(keys.includes("mortal"), true);
});

Deno.test("chargenOptions attributes groups", OPTS, async () => {
  const res = await chargenOptions("attributes");
  const body = await res.json();
  assertEquals(body.mental.length, 3);
  assertEquals(body.physical.length, 3);
  assertEquals(body.social.length, 3);
});

Deno.test("chargenOptions unknown topic 404", OPTS, async () => {
  const res = await chargenOptions("nope");
  assertEquals(res.status, 404);
});

Deno.test("chargenOptions kiths filter", OPTS, async () => {
  const all = await (await chargenOptions("kiths")).json();
  const fairest = await (
    await chargenOptions("kiths", "Fairest")
  ).json();
  assertEquals(all.items.length >= fairest.items.length, true);
  for (const k of fairest.items) {
    assertEquals(
      String(k.seeming).toLowerCase(),
      "fairest",
    );
  }
});
