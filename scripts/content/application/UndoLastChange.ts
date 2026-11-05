import { ContentError } from '../domain/ContentError.ts';
import { readLastChange, restoreDocument } from './contentDocuments.ts';
import { cleanMedia } from './cleanMedia.ts';
import type { ContentStore, MediaStore } from './ports.ts';

export class UndoLastChange {
  private readonly deps: { content: ContentStore; media: MediaStore };

  constructor(deps: { content: ContentStore; media: MediaStore }) {
    this.deps = deps;
  }

  async run({ dryRun }: { dryRun: boolean }) {
    const change = await readLastChange(this.deps.content);
    if (!change) {
      throw new ContentError('NOTHING_TO_UNDO', 'No change has been recorded yet');
    }

    const result = { description: change.description, changedAt: change.changedAt };

    if (dryRun) {
      return result;
    }

    await restoreDocument(this.deps.content, change);
    await cleanMedia(this.deps);

    return result;
  }
}
