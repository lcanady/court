// Main entry point for court
import { mu } from "@ursamu/ursamu";
import { applyLayoutFromConfig } from "@ursamu/mush";
import { getConfig } from "@ursamu/core";

const game = await mu(undefined, undefined, {
  pluginsDir: "",
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
