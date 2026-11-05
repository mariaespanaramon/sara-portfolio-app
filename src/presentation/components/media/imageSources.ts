import type { ImageAsset, ImageFormat, ImageSource } from '../../../application/domain/MediaAsset';

/** Most efficient first. The last format present is the `<img>` fallback. */
const FORMAT_PREFERENCE: ImageFormat[] = ['avif', 'webp', 'jpeg'];

const MIME_TYPES: Record<ImageFormat, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
};

export interface SourceSet {
  format: ImageFormat;
  type: string;
  srcSet: string;
}

export function sourceSetsOf(image: ImageAsset): SourceSet[] {
  return FORMAT_PREFERENCE.flatMap((format) => {
    const sources = image.sources
      .filter((source) => source.format === format)
      .sort((a, b) => a.width - b.width);

    if (sources.length === 0) {
      return [];
    }

    return [
      {
        format,
        type: MIME_TYPES[format],
        srcSet: sources.map((source) => `${source.url} ${source.width}w`).join(', '),
      },
    ];
  });
}

/** For single-URL slots such as a video poster: prefers formats every browser decodes. */
export function pickSource(image: ImageAsset, minWidth: number): ImageSource | undefined {
  const universal = image.sources.filter((source) => source.format !== 'avif');
  const candidates = (universal.length > 0 ? universal : image.sources)
    .slice()
    .sort((a, b) => a.width - b.width);

  return candidates.find((source) => source.width >= minWidth) ?? candidates[candidates.length - 1];
}
