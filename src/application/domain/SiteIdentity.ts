import type { ImageAsset, LoopAsset } from './MediaAsset';

export interface SiteIdentity {
  hero?: ImageAsset;
  intro?: LoopAsset | ImageAsset;
}
