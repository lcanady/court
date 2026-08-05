/**
 * Run with: deno test packages/web/ui/src/utils/mushText.test.ts
 * (or via package test runner if wired)
 */
import {
  assertEquals,
  assertStringIncludes,
} from "@std/assert";
import {
  gameLayoutOf,
  hasGameLayout,
  mushTextToHtml,
} from "./mushText.ts";

const OPTS = { sanitizeResources: false, sanitizeOps: false };

Deno.test("mushTextToHtml: escapes HTML", OPTS, () => {
  const h = mushTextToHtml(`<script>alert(1)</script>`);
  assertStringIncludes(h, "&lt;script&gt;");
  assertEquals(h.includes("<script>"), false);
});

Deno.test("mushTextToHtml: colors and bold", OPTS, () => {
  const h = mushTextToHtml("%ch%crHello%cn world");
  assertStringIncludes(h, "<b>");
  assertStringIncludes(h, "color:");
  assertStringIncludes(h, "Hello");
  assertStringIncludes(h, "world");
});

Deno.test("mushTextToHtml: layout %r %t %b", OPTS, () => {
  const h = mushTextToHtml("a%r b%t c%b d");
  assertStringIncludes(h, "\n");
  assertStringIncludes(h, "\t");
  assertStringIncludes(h, "  d") || assertStringIncludes(h, " d");
});

Deno.test("hasGameLayout / gameLayoutOf", OPTS, () => {
  assertEquals(hasGameLayout(undefined), false);
  assertEquals(hasGameLayout({}), false);
  assertEquals(hasGameLayout({ ui: { components: [] } }), true);
  const g = gameLayoutOf({
    ui: {
      type: "layout",
      components: [{ type: "header", content: "Hi" }],
      meta: { type: "staff" },
    },
  });
  assertEquals(g?.components.length, 1);
  assertEquals(g?.meta?.type, "staff");
});
