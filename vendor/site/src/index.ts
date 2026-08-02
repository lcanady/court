/**
 * @ursamu/site — public game front-end shell (player-facing).
 *
 * Serves layout + design.md tokens + swappable skins under /site/.
 */

import { registerPluginRoute } from "ursamu";
import type { IPlugin } from "ursamu";
import {
  applySkinDefaults,
  readSiteConfig,
} from "./config.ts";
import { setSiteRuntime, siteStaticHandler } from "./static.ts";

async function loadGameConfig(): Promise<unknown> {
  try {
    const raw = await Deno.readTextFile("config/config.json");
    return JSON.parse(raw);
  } catch {
    try {
      const raw = await Deno.readTextFile(
        "config/config.sample.json",
      );
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
}

export const plugin: IPlugin = {
  name: "site",
  version: "0.1.0",
  description:
    "Public front-end shell — layout framing + design tokens + skins.",

  init: async () => {
    const game = await loadGameConfig();
    let cfg = readSiteConfig(game);

    // Default title from game name when unset
    if (!cfg.title) {
      const g = game as { game?: { name?: string } };
      if (g?.game?.name) cfg.title = String(g.game.name);
    }
    if (!cfg.skin && !cfg.skinCss) {
      cfg.skin = "default";
    }

    cfg = applySkinDefaults(cfg);
    setSiteRuntime(cfg);

    const mount = (cfg.mount ?? "/site").replace(/\/$/, "") ||
      "/site";

    // Static tree + config.json
    registerPluginRoute(mount, siteStaticHandler);
    // Always also bind /site for asset URLs in CSS
    if (mount !== "/site") {
      registerPluginRoute("/site", siteStaticHandler);
    }
    if (cfg.serveRoot) {
      registerPluginRoute("/", siteStaticHandler);
    }

    const skinLabel = cfg.skinCss ?? cfg.skin ?? "default";
    console.log(
      `[site] Public FE at ${mount}/ (skin=${skinLabel})`,
    );
    return true;
  },

  remove: () => {
    /* routes are process-lifetime */
  },
};

export default plugin;
