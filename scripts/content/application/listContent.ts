import { readSections, readWorkItems } from './contentDocuments.ts';
import type { ContentStore } from './ports.ts';

/**
 * Read-only use cases, so a skill can offer the existing sections and projects
 * as choices instead of asking for ids.
 */

export async function listSections(content: ContentStore) {
  const document = await readSections(content);
  return (document?.sections ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(({ id, title }) => ({ id, title }));
}

export async function listProjects(content: ContentStore) {
  const document = await readWorkItems(content);
  return document.items.map(({ id, title, sectionId, media }) => ({
    id,
    title,
    section: sectionId,
    pieces: media.length,
  }));
}
