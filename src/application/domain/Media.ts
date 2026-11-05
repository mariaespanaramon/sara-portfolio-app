/**
 * Core domain types for the media a project or section is made of.
 *
 * Every asset carries the URLs it is reachable at, already resolved. Where those
 * URLs come from (Netlify Blobs, a CDN, placeholders) is an infrastructure
 * concern and never leaks into the domain.
 */

export type ImageFormat = 'avif' | 'webp' | 'jpeg';

/** One encoded rendition of an image. */
export interface ImageSource {
  format: ImageFormat;
  /** Intrinsic width of this rendition, in pixels. */
  width: number;
  url: string;
}

export interface ImageAsset {
  kind: 'image';
  /** Intrinsic size of the largest rendition. Reserves space before loading. */
  width: number;
  height: number;
  /** Every rendition available, in any order. */
  sources: ImageSource[];
  /** Tiny blurred preview as a data URI, shown while the image loads. */
  placeholder?: string;
  alt?: string;
}

export interface VideoAsset {
  kind: 'video';
  width: number;
  height: number;
  /** HLS playlist (.m3u8) or a progressive file such as MP4. */
  url: string;
  poster: ImageAsset;
  /** Short muted clip, used where the video is only previewed. */
  previewUrl?: string;
  durationSeconds?: number;
  hasAudio?: boolean;
}

/** A short muted clip that plays on a loop. Replaces GIFs. */
export interface LoopAsset {
  kind: 'loop';
  width: number;
  height: number;
  url: string;
  poster: ImageAsset;
}

export type MediaAsset = ImageAsset | VideoAsset | LoopAsset;

/** The still that stands for any asset: the image itself, or a clip's poster. */
export function stillOf(asset: MediaAsset): ImageAsset {
  return asset.kind === 'image' ? asset : asset.poster;
}
