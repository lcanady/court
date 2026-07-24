// Main entry point for cor
import { mu } from "ursamu";

// game.layout.* mushcode templates (header / divider / footer) are
// loaded by the engine from config/config.json at startup. No need to
// call registerHeader / registerDivider / registerFooter here.

const game = await mu(undefined, undefined, {
  pluginsDir: "",
});

console.log(
  `${game.config.get("game.name")} main server is running!`,
);
