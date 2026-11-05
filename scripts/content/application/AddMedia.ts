import type { StoredMedia } from '../../../src/infrastructure/content/contentSchema.ts';
import { ContentError } from '../domain/ContentError.ts';
import type { MediaAddition } from '../domain/ProjectDraft.ts';
import { findProject, readWorkItems, updateWorkItems } from './contentDocuments.ts';
import { cleanMedia } from './cleanMedia.ts';
import {
  emptyTotals,
  MediaPublisher,
  type MediaPublisherDependencies,
} from './MediaPublisher.ts';
import type { ContentStore } from './ports.ts';

export class AddMedia {
  private readonly deps: MediaPublisherDependencies & { content: ContentStore };
  private readonly publisher: MediaPublisher;

  constructor(deps: MediaPublisherDependencies & { content: ContentStore }) {
    this.deps = deps;
    this.publisher = new MediaPublisher(deps);
  }

  async run({ id, folder, addition, dryRun }: { id: string; folder: string; addition: MediaAddition; dryRun: boolean }) {
    const project = findProject(await readWorkItems(this.deps.content), id);
    const position = addition.position ?? project.media.length + 1;

    if (position > project.media.length + 1) {
      throw new ContentError('INVALID_METADATA', `Invalid metadata: position ${position} is past the end`, {
        problems: [`position must be between 1 and ${project.media.length + 1}`],
      });
    }

    const files = await this.publisher.filesIn(folder);
    const { pieces, warnings } = await this.publisher.plan(files, addition);
    const result = {
      id,
      title: project.title,
      position,
      pieces: pieces.map((piece) => piece.plan),
      warnings,
    };

    if (dryRun) {
      return result;
    }

    const upload = emptyTotals();
    const added: StoredMedia[] = [];
    for (const piece of pieces) {
      added.push(await this.publisher.publish(piece, upload));
    }

    await updateWorkItems(this.deps.content, `add ${added.length} pieces to "${project.title}"`, (document) => {
      const current = findProject(document, id);
      const at = Math.min(position - 1, current.media.length);
      const coverIndex = current.coverIndex ?? 0;
      const media = [...current.media.slice(0, at), ...added, ...current.media.slice(at)];
      const movedCover = coverIndex >= at ? coverIndex + added.length : coverIndex;
      const updated = { ...current, media, ...(movedCover === 0 ? { coverIndex: undefined } : { coverIndex: movedCover }) };
      return { ...document, items: document.items.map((item) => (item.id === id ? updated : item)) };
    });
    await cleanMedia(this.deps);

    return { ...result, upload };
  }
}
