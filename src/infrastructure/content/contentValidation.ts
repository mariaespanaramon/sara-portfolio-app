import {
  CONTENT_SCHEMA_VERSION,
  type SectionsDocument,
  type StoredImage,
  type StoredLoop,
  type StoredMedia,
  type StoredSection,
  type StoredVideo,
  type StoredWorkItem,
  type WorkItemsDocument,
} from './contentSchema.ts';

/**
 * Runtime validation of the stored content documents.
 *
 * They come from outside the bundle, so their shape cannot be trusted at compile
 * time. Each check reports the path of the offending field, which turns a broken
 * upload into an error that says what to fix.
 */

export class InvalidContentError extends Error {
  constructor(path: string, expected: string) {
    super(`Invalid content at ${path}: expected ${expected}`);
    this.name = 'InvalidContentError';
  }
}

type Json = Record<string, unknown>;

function asObject(value: unknown, path: string): Json {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new InvalidContentError(path, 'an object');
  }
  return value as Json;
}

function asArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new InvalidContentError(path, 'an array');
  }
  return value;
}

function asString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw new InvalidContentError(path, 'a string');
  }
  return value;
}

function asNonEmptyString(value: unknown, path: string): string {
  const text = asString(value, path);
  if (text.length === 0) {
    throw new InvalidContentError(path, 'a non-empty string');
  }
  return text;
}

function asOptionalString(value: unknown, path: string): string | undefined {
  return value === undefined ? undefined : asString(value, path);
}

function asPositiveInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new InvalidContentError(path, 'a positive integer');
  }
  return value;
}

function asNonNegativeNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new InvalidContentError(path, 'a non-negative number');
  }
  return value;
}

function asBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') {
    throw new InvalidContentError(path, 'a boolean');
  }
  return value;
}

function checkVersion(json: Json, path: string): void {
  if (json.version !== CONTENT_SCHEMA_VERSION) {
    throw new InvalidContentError(`${path}.version`, `${CONTENT_SCHEMA_VERSION}`);
  }
}

function parseImage(value: unknown, path: string): StoredImage {
  const json = asObject(value, path);
  if (json.kind !== 'image') {
    throw new InvalidContentError(`${path}.kind`, '"image"');
  }

  const widths = asArray(json.widths, `${path}.widths`).map((width, index) =>
    asPositiveInteger(width, `${path}.widths[${index}]`)
  );
  if (widths.length === 0) {
    throw new InvalidContentError(`${path}.widths`, 'at least one width');
  }

  const formats = asArray(json.formats, `${path}.formats`).map((format, index) => {
    if (format !== 'avif' && format !== 'webp') {
      throw new InvalidContentError(`${path}.formats[${index}]`, '"avif" or "webp"');
    }
    return format;
  });
  if (formats.length === 0) {
    throw new InvalidContentError(`${path}.formats`, 'at least one format');
  }

  return {
    kind: 'image',
    key: asNonEmptyString(json.key, `${path}.key`),
    width: asPositiveInteger(json.width, `${path}.width`),
    height: asPositiveInteger(json.height, `${path}.height`),
    widths,
    formats,
    placeholder: asOptionalString(json.placeholder, `${path}.placeholder`),
    alt: asOptionalString(json.alt, `${path}.alt`),
  };
}

function parseVideo(json: Json, path: string): StoredVideo {
  return {
    kind: 'video',
    key: asNonEmptyString(json.key, `${path}.key`),
    width: asPositiveInteger(json.width, `${path}.width`),
    height: asPositiveInteger(json.height, `${path}.height`),
    poster: parseImage(json.poster, `${path}.poster`),
    hasPreview: asBoolean(json.hasPreview, `${path}.hasPreview`),
    durationSeconds: asNonNegativeNumber(json.durationSeconds, `${path}.durationSeconds`),
    hasAudio: asBoolean(json.hasAudio, `${path}.hasAudio`),
  };
}

function parseLoop(value: unknown, path: string): StoredLoop {
  const json = asObject(value, path);
  if (json.kind !== 'loop') {
    throw new InvalidContentError(`${path}.kind`, '"loop"');
  }

  return {
    kind: 'loop',
    key: asNonEmptyString(json.key, `${path}.key`),
    width: asPositiveInteger(json.width, `${path}.width`),
    height: asPositiveInteger(json.height, `${path}.height`),
    poster: parseImage(json.poster, `${path}.poster`),
  };
}

function parseMedia(value: unknown, path: string): StoredMedia {
  const json = asObject(value, path);

  switch (json.kind) {
    case 'image':
      return parseImage(json, path);
    case 'video':
      return parseVideo(json, path);
    case 'loop':
      return parseLoop(json, path);
    default:
      throw new InvalidContentError(`${path}.kind`, '"image", "video" or "loop"');
  }
}

function parseWorkItem(value: unknown, path: string): StoredWorkItem {
  const json = asObject(value, path);

  const media = asArray(json.media, `${path}.media`).map((piece, index) =>
    parseMedia(piece, `${path}.media[${index}]`)
  );
  if (media.length === 0) {
    throw new InvalidContentError(`${path}.media`, 'at least one piece');
  }

  let coverIndex: number | undefined;
  if (json.coverIndex !== undefined) {
    const index = json.coverIndex;
    if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= media.length) {
      throw new InvalidContentError(`${path}.coverIndex`, `an index between 0 and ${media.length - 1}`);
    }
    coverIndex = index;
  }

  return {
    id: asNonEmptyString(json.id, `${path}.id`),
    title: asNonEmptyString(json.title, `${path}.title`),
    category: asString(json.category, `${path}.category`),
    description: asString(json.description, `${path}.description`),
    year: asString(json.year, `${path}.year`),
    tags: asArray(json.tags, `${path}.tags`).map((tag, index) =>
      asString(tag, `${path}.tags[${index}]`)
    ),
    sectionId: asOptionalString(json.sectionId, `${path}.sectionId`),
    coverIndex,
    media,
  };
}

function parseSection(value: unknown, path: string): StoredSection {
  const json = asObject(value, path);

  if (typeof json.order !== 'number' || !Number.isFinite(json.order)) {
    throw new InvalidContentError(`${path}.order`, 'a number');
  }

  return {
    id: asNonEmptyString(json.id, `${path}.id`),
    title: asNonEmptyString(json.title, `${path}.title`),
    order: json.order,
    cover: parseImage(json.cover, `${path}.cover`),
    hover: json.hover === undefined ? undefined : parseLoop(json.hover, `${path}.hover`),
  };
}

export function parseWorkItemsDocument(value: unknown): WorkItemsDocument {
  const json = asObject(value, 'work-items');
  checkVersion(json, 'work-items');

  return {
    version: CONTENT_SCHEMA_VERSION,
    items: asArray(json.items, 'work-items.items').map((item, index) =>
      parseWorkItem(item, `work-items.items[${index}]`)
    ),
  };
}

export function parseSectionsDocument(value: unknown): SectionsDocument {
  const json = asObject(value, 'sections');
  checkVersion(json, 'sections');

  return {
    version: CONTENT_SCHEMA_VERSION,
    sections: asArray(json.sections, 'sections.sections').map((section, index) =>
      parseSection(section, `sections.sections[${index}]`)
    ),
  };
}
