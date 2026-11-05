import { ContentError } from './ContentError.ts';

/**
 * The texts of a new project, as gathered by the skill before anything is
 * processed or uploaded.
 */
export interface ProjectDraft {
  title: string;
  category: string;
  year: string;
  description: string;
  tags: string[];
  /** Id of the section the project is listed under. */
  section: string;
  /** File name of the piece used as cover. Defaults to the first piece. */
  cover?: string;
  /** Alternative text per file name, for visitors using screen readers. */
  alts?: Record<string, string>;
}

/**
 * Validates the metadata file the skill writes. Reports every problem at once,
 * so they can all be fixed in one go.
 */
export function parseProjectDraft(value: unknown): ProjectDraft {
  const problems: string[] = [];
  const json = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;

  const text = (field: string, required: boolean): string => {
    const raw = json[field];
    if (raw === undefined && !required) return '';
    if (typeof raw !== 'string' || (required && raw.trim() === '')) {
      problems.push(`${field} must be ${required ? 'a non-empty' : 'a'} string`);
      return '';
    }
    return raw.trim();
  };

  const title = text('title', true);
  const category = text('category', true);
  const year = text('year', true);
  const description = text('description', false);
  const section = text('section', true);

  if (year && !/^\d{4}$/.test(year)) {
    problems.push('year must be four digits, such as 2025');
  }

  let tags: string[] = [];
  if (json.tags !== undefined) {
    if (!Array.isArray(json.tags) || !json.tags.every((tag) => typeof tag === 'string')) {
      problems.push('tags must be a list of strings');
    } else {
      tags = json.tags.map((tag) => tag.trim()).filter((tag) => tag !== '');
    }
  }

  let cover: string | undefined;
  if (json.cover !== undefined) {
    if (typeof json.cover !== 'string' || json.cover.trim() === '') {
      problems.push('cover must be a file name');
    } else {
      cover = json.cover.trim();
    }
  }

  let alts: Record<string, string> | undefined;
  if (json.alts !== undefined) {
    const raw = json.alts;
    if (
      typeof raw !== 'object' ||
      raw === null ||
      Array.isArray(raw) ||
      !Object.values(raw).every((alt) => typeof alt === 'string')
    ) {
      problems.push('alts must map file names to texts');
    } else {
      alts = raw as Record<string, string>;
    }
  }

  if (problems.length > 0) {
    throw new ContentError('INVALID_METADATA', `Invalid project metadata: ${problems.join('; ')}`, {
      problems,
    });
  }

  return { title, category, year, description, tags, section, cover, alts };
}
