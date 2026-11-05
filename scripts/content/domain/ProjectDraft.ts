import { FieldReader } from './FieldReader.ts';

export interface MediaOptions {
  /** By file name. */
  alts?: Record<string, string>;
  loops?: string[];
  keepTransparency?: string[];
}

export interface ProjectDraft extends MediaOptions {
  title: string;
  category: string;
  year: string;
  description: string;
  tags: string[];
  section: string;
  /** File name. Defaults to the first piece. */
  cover?: string;
}

export interface MediaAddition extends MediaOptions {
  /** 1-based. Defaults to the end. */
  position?: number;
}

/** Pieces are referred to by 1-based position, as people see them on the page. */
export interface ProjectChanges {
  title?: string;
  category?: string;
  year?: string;
  description?: string;
  tags?: string[];
  section?: string;
  cover?: number;
  order?: number[];
  removePieces?: number[];
  alts?: Record<string, string>;
}

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

export function parseMediaAddition(value: unknown): MediaAddition {
  const fields = new FieldReader(value);
  return fields.done({ position: fields.position('position'), ...fields.mediaOptions() });
}

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
