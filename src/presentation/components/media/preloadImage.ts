import type { ImageAsset } from '../../../application/domain/Media';
import { sourceSetsOf } from './imageSources';

/** Hrefs already preloaded, so repeated hovers do not stack up link elements. */
const preloaded = new Set<string>();

/**
 * Starts downloading an image before it is rendered, at the rendition the
 * browser will pick for `sizes`, so it is ready once the screen that shows it
 * mounts.
 *
 * Only the most efficient format is preloaded. The `type` makes browsers that
 * cannot decode it skip the preload rather than fetch the wrong file, and they
 * simply load the image the normal way later.
 */
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
