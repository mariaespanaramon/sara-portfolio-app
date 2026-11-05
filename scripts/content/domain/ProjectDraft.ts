import { FieldReader } from './FieldReader.ts';

/** How the pieces in a folder are to be published, beyond what their files tell. */
export interface MediaOptions {
  /** Alternative text per file name, for visitors using screen readers. */
  alts?: Record<string, string>;
  /** Video files to publish as muted loops rather than as videos with controls. */
  loops?: string[];
  /** Transparent GIFs to keep transparent, as animated images, instead of filling the background. */
  keepTransparency?: string[];
}

/**
 * The texts of a new project, as gathered by the skill before anything is
 * processed or uploaded.
 */
export interface ProjectDraft extends MediaOptions {
  title: string;
  category: string;
  year: string;
  description: string;
  tags: string[];
  /** Id of the section the project is listed under. */
  section: string;
  /** File name of the piece used as cover. Defaults to the first piece. */
  cover?: string;
}

/** Pieces to add to an existing project. */
export interface MediaAddition extends MediaOptions {
  /** 1-based position the first new piece takes. Defaults to the end. */
  position?: number;
}

/**
 * Changes to an existing project. Pieces are referred to by their 1-based
 * position, as people see them on the page.
 */
export interface ProjectChanges {
  title?: string;
  category?: string;
  year?: string;
  description?: string;
  tags?: string[];
  section?: string;
  /** Position of the piece to use as cover. */
  cover?: number;
  /** Every current position, in the new order. */
  order?: number[];
  /** Positions of pieces to take out of the project. */
  removePieces?: number[];
  /** New alternative text per position. */
  alts?: Record<string, string>;
}

/** Validates the metadata file the add-project skill writes. */
export function parseProjectDraft(value: unknown): ProjectDraft {
  const fields = new FieldReader(value);

  return fields.done({
    title: fields.text('title', true),
    category: fields.text('category', true),
    year: fields.year('year', true) ?? '',
    description: fields.text('description', false) ?? '',
    tags: fields.tags('tags') ?? [],
    section: fields.text('section', true),
    cover: fields.text('cover', false),
    ...fields.mediaOptions(),
  });
}

/** Validates the metadata file the add-media skill writes. */
export function parseMediaAddition(value: unknown): MediaAddition {
  const fields = new FieldReader(value);
  return fields.done({ position: fields.position('position'), ...fields.mediaOptions() });
}

/** Validates the changes file the edit-project skill writes. */
export function parseProjectChanges(value: unknown): ProjectChanges {
  const fields = new FieldReader(value);

  return fields.done({
    title: fields.text('title', false),
    category: fields.text('category', false),
    year: fields.year('year', false),
    description: fields.text('description', false),
    tags: fields.tags('tags'),
    section: fields.text('section', false),
    cover: fields.position('cover'),
    order: fields.positions('order'),
    removePieces: fields.positions('removePieces'),
    alts: fields.textMap('alts'),
  });
}
