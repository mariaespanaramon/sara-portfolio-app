import type { LoopAsset, MediaAsset } from '../../../application/domain/MediaAsset';

/** A loop, or a video's preview played as one. Null when there is neither. */
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
