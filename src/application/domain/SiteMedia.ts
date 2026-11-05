import type { ImageAsset, LoopAsset } from './Media';

/**
 * Media that belong to the site itself rather than to a project or section.
 * Both are optional: a site without them simply goes without.
 */
export interface SiteMedia {
  /** Background of the home page hero. */
  hero?: ImageAsset;
  /** The intro splash animation; an animated image when it needs transparency. */
  intro?: LoopAsset | ImageAsset;
}
