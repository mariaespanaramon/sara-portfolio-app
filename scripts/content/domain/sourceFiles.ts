/**
 * Rules for the files Sara drops into a project folder.
 */

/**
 * What a file is by its format. A video file can still end up as a loop: that
 * is the person's choice, not something the format tells.
 */
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

  // iPhone photos. The image library cannot decode them, but every app can
  // export them as JPEG, so this gets its own reason and advice.
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

/** Hidden and system files that end up in folders without anyone adding them. */
export function isIgnored(fileName: string): boolean {
  return fileName.startsWith('.') || fileName === 'Thumbs.db' || fileName === 'desktop.ini';
}

/**
 * Display order of a project's pieces: by file name, with numbers compared as
 * numbers, so `2-…` comes before `10-…` without zero padding.
 */
export function byDisplayOrder(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
