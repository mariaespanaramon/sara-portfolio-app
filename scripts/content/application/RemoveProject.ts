import { findProject, readWorkItems, updateWorkItems } from './contentDocuments.ts';
import { cleanMedia } from './cleanMedia.ts';
import type { ContentStore, MediaStore } from './ports.ts';

/**
 * Use case: take a project off the site.
 *
 * Its media stays stored until a later change, so the removal can be undone;
 * see cleanMedia.
 */
export class RemoveProject {
  private readonly deps: { content: ContentStore; media: MediaStore };

  constructor(deps: { content: ContentStore; media: MediaStore }) {
    this.deps = deps;
  }

  async run({ id, dryRun }: { id: string; dryRun: boolean }) {
    const { title, media } = findProject(await readWorkItems(this.deps.content), id);
    const result = { id, title, pieces: media.length };

    if (dryRun) {
      return result;
    }

    await updateWorkItems(this.deps.content, `remove project "${title}"`, (document) => {
      findProject(document, id);
      return { ...document, items: document.items.filter((item) => item.id !== id) };
    });
    await cleanMedia(this.deps);

    return result;
  }
}
