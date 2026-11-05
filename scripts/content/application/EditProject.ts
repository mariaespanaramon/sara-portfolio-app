import type { StoredMedia, StoredWorkItem } from '../../../src/infrastructure/content/contentSchema.ts';
import { toUrlId } from '../../../src/application/domain/urlId.ts';
import { ContentError } from '../domain/ContentError.ts';
import type { ProjectChanges } from '../domain/ProjectDraft.ts';
import {
  assertSectionExists,
  assertTitleFree,
  findProject,
  readSections,
  readWorkItems,
  updateWorkItems,
} from './contentDocuments.ts';
import { cleanMedia } from './cleanMedia.ts';
import type { ContentStore, MediaStore } from './ports.ts';

function invalid(problem: string): never {
  throw new ContentError('INVALID_METADATA', `Invalid metadata: ${problem}`, { problems: [problem] });
}

function withAlt(piece: StoredMedia, alt: string): StoredMedia {
  return piece.kind === 'image' ? { ...piece, alt } : { ...piece, poster: { ...piece.poster, alt } };
}

/**
 * Applies changes to a project. Positions in `changes` all refer to the pieces
 * as they are now, before any reordering or removal.
 */
export function applyChanges(item: StoredWorkItem, changes: ProjectChanges): StoredWorkItem {
  const count = item.media.length;
  const inRange = (position: number) => position >= 1 && position <= count;

  let positions = item.media.map((_, index) => index + 1);

  if (changes.order) {
    const sorted = [...changes.order].sort((a, b) => a - b);
    if (sorted.length !== count || sorted.some((position, index) => position !== index + 1)) {
      invalid(`order must list every position from 1 to ${count} exactly once`);
    }
    positions = changes.order;
  }

  const removed = new Set(changes.removePieces ?? []);
  if ([...removed].some((position) => !inRange(position))) {
    invalid(`removePieces must be positions between 1 and ${count}`);
  }
  positions = positions.filter((position) => !removed.has(position));
  if (positions.length === 0) {
    invalid('a project needs at least one piece; remove the whole project instead');
  }

  const coverPosition = changes.cover ?? (item.coverIndex ?? 0) + 1;
  if (!inRange(coverPosition) || removed.has(coverPosition)) {
    invalid('cover must be the position of a piece that stays in the project');
  }

  for (const position of Object.keys(changes.alts ?? {}).map(Number)) {
    if (!inRange(position)) invalid(`alts must be keyed by positions between 1 and ${count}`);
  }

  const media = positions.map((position) => {
    const alt = changes.alts?.[String(position)];
    const piece = item.media[position - 1];
    return alt === undefined ? piece : withAlt(piece, alt);
  });
  const coverIndex = positions.indexOf(coverPosition);

  return {
    ...item,
    title: changes.title ?? item.title,
    category: changes.category ?? item.category,
    year: changes.year ?? item.year,
    description: changes.description ?? item.description,
    tags: changes.tags ?? item.tags,
    sectionId: changes.section ?? item.sectionId,
    coverIndex: coverIndex === 0 ? undefined : coverIndex,
    media,
  };
}

/** Use case: change a project's texts, section, cover, order or pieces. */
export class EditProject {
  private readonly deps: { content: ContentStore; media: MediaStore };

  constructor(deps: { content: ContentStore; media: MediaStore }) {
    this.deps = deps;
  }

  async run({ id, changes, dryRun }: { id: string; changes: ProjectChanges; dryRun: boolean }) {
    const document = await readWorkItems(this.deps.content);
    const project = findProject(document, id);

    if (changes.title !== undefined) {
      assertTitleFree(document, changes.title, id);
    }
    if (changes.section !== undefined) {
      assertSectionExists(await readSections(this.deps.content), changes.section);
    }

    const updated = applyChanges(project, changes);
    const result = {
      id,
      title: updated.title,
      // The page address follows the title, so a new title moves the page.
      path: `/work/${toUrlId(updated.title)}`,
      pathChanged: toUrlId(updated.title) !== toUrlId(project.title),
      pieces: updated.media.length,
    };

    if (dryRun) {
      return result;
    }

    await updateWorkItems(this.deps.content, `edit project "${project.title}"`, (latest) => {
      const current = findProject(latest, id);
      if (changes.title !== undefined) assertTitleFree(latest, changes.title, id);
      const next = applyChanges(current, changes);
      return { ...latest, items: latest.items.map((item) => (item.id === id ? next : item)) };
    });
    await cleanMedia(this.deps);

    return result;
  }
}
