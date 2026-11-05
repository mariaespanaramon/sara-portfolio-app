/** By format only: whether a video is published as a loop is the person's choice. */
export type SourceKind = 'image' | 'video' | 'loop';

export type Classification =
  | { kind: SourceKind }
  | { kind: 'unsupported'; reason: 'unknown-format' | 'heic' };

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'tif', 'tiff']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'webm']);
const LOOP_EXTENSIONS = new Set(['gif']);

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase();
}

export function classify(fileName: string): Classification {
  const extension = extensionOf(fileName);

  // iPhone photos: sharp cannot decode them, so they get their own advice.
  if (extension === 'heic' || extension === 'heif') {
    return { kind: 'unsupported', reason: 'heic' };
  }

  let kind: SourceKind | undefined;
  if (IMAGE_EXTENSIONS.has(extension)) kind = 'image';
  else if (VIDEO_EXTENSIONS.has(extension)) kind = 'video';
  else if (LOOP_EXTENSIONS.has(extension)) kind = 'loop';

  if (!kind) {
    return { kind: 'unsupported', reason: 'unknown-format' };
  }

  return { kind };
}

export function isIgnored(fileName: string): boolean {
  return fileName.startsWith('.') || fileName === 'Thumbs.db' || fileName === 'desktop.ini';
}

/** Numbers compare as numbers, so `2-…` comes before `10-…`. */
export function byDisplayOrder(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
