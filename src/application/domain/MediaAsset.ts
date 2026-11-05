// URLs arrive already resolved: where media is hosted is an infrastructure concern.

export type ImageFormat = 'avif' | 'webp' | 'jpeg';

export interface ImageSource {
  format: ImageFormat;
  width: number;
  url: string;
}

export interface ImageAsset {
  kind: 'image';
  width: number;
  height: number;
  sources: ImageSource[];
  /** Blurred data URI shown while loading. */
  placeholder?: string;
  alt?: string;
}

export interface VideoAsset {
  kind: 'video';
  width: number;
  height: number;
  /** HLS playlist or a progressive file such as MP4. */
  url: string;
  poster: ImageAsset;
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

export function stillOf(asset: MediaAsset): ImageAsset {
  return asset.kind === 'image' ? asset : asset.poster;
}
