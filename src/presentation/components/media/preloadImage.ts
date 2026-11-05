import type { ImageAsset } from '../../../application/domain/MediaAsset';
import { sourceSetsOf } from './imageSources';

const preloaded = new Set<string>();

/** Preloads the rendition `sizes` will pick. `type` makes browsers that cannot decode it skip it. */
export function preloadImage(image: ImageAsset, sizes: string): void {
  const [best] = sourceSetsOf(image);
  if (!best || preloaded.has(best.srcSet)) {
    return;
  }

  preloaded.add(best.srcSet);

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.type = best.type;
  link.imageSrcset = best.srcSet;
  link.imageSizes = sizes;
  document.head.appendChild(link);
}
