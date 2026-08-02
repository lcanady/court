// Main entry point for court
// getConfig MUST come from @ursamu/mush (same core instance mu() uses).
// Importing getConfig from @ursamu/core separately can dual-load core
// and return undefined for game.layout, wiping boot templates.
import {
  mu,
  applyLayoutFromConfig,
  getConfig,
} from "@ursamu/mush";

const game = await mu(undefined, undefined, {
  pluginsDir: "",
  // @ursamu/channels seeds plugins.channels.defaults on engine:ready.
  // Disable mush built-in seed to avoid duplicate Public (pub vs public)
  // and bare admin+ locks that block staff auto-join.
  autoCreateDefaultChannels: false,
});

// Ensure game.layout.* mushcode templates (header / divider / footer)
// from config/config.json are loaded into the layout renderer.
applyLayoutFromConfig(
  getConfig<{
    header?: string;
    divider?: string;
    footer?: string;
  }>("game.layout"),
);

console.log(
  `${game.config.get("game.name")} main server is running!`,
);
