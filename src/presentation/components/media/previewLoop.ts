import type { LoopAsset, MediaAsset } from '../../../application/domain/Media';

/**
 * The muted clip that stands for a piece where it is only previewed, such as a
 * section row: the loop itself, or a video's short preview played as a loop.
 * Null for images and for videos without a preview.
 */
export function previewLoopOf(asset: MediaAsset): LoopAsset | null {
  if (asset.kind === 'loop') {
    return asset;
  }

  if (asset.kind === 'video' && asset.previewUrl) {
    return {
      kind: 'loop',
      width: asset.width,
      height: asset.height,
      url: asset.previewUrl,
      poster: asset.poster,
    };
  }

  return null;
}
