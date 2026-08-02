/**
 * @module @ursamu/site
 *
 * Generic UrsaMU public front-end: court-template framing +
 * design.md tokens + swappable CSS skins.
 */

export { plugin as default } from "./src/index.ts";
export { plugin } from "./src/index.ts";
export {
  readSiteConfig,
  normalizeMount,
  resolveSkinHref,
  applySkinDefaults,
} from "./src/config.ts";
export type {
  SitePluginConfig,
  SiteNavItem,
} from "./src/config.ts";
export { injectSiteHtml } from "./src/html.ts";
export {
  siteStaticHandler,
  setSiteRuntime,
  getSiteRuntime,
  siteConfigResponse,
} from "./src/static.ts";
