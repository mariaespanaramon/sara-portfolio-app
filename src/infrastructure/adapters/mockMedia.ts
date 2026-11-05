import type { ImageAsset, LoopAsset, VideoAsset } from '../../application/domain/MediaAsset';

// Pexels resizes on the fly, so placeholders exercise the responsive image path.
const PLACEHOLDER_WIDTHS = [640, 1024, 1600];

/** @param aspect - Width over height of the crop. */
export function pexelsImage(photoId: number, aspect: number): ImageAsset {
  const largest = PLACEHOLDER_WIDTHS[PLACEHOLDER_WIDTHS.length - 1];

  return {
    kind: 'image',
    width: largest,
    height: Math.round(largest / aspect),
    sources: PLACEHOLDER_WIDTHS.map((width) => ({
      format: 'jpeg',
      width,
      url:
        `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg` +
        `?auto=compress&cs=tinysrgb&fit=crop&w=${width}&h=${Math.round(width / aspect)}`,
    })),
  };
}

export function mockVideo(url: string, poster: ImageAsset): VideoAsset {
  return {
    kind: 'video',
    width: poster.width,
    height: poster.height,
    url,
    poster,
    previewUrl: url,
  };
}

export function mockLoop(url: string, poster: ImageAsset): LoopAsset {
  return {
    kind: 'loop',
    width: poster.width,
    height: poster.height,
    url,
    poster,
  };
}
