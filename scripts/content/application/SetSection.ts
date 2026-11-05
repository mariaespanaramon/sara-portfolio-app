import type { StoredImage, StoredLoop, StoredSection } from '../../../src/infrastructure/content/contentSchema.ts';
import { ContentError } from '../domain/ContentError.ts';
import type { SectionDraft } from '../domain/SectionDraft.ts';
import { classify } from '../domain/sourceFiles.ts';
import { readDocument, updateDocument } from './contentDocuments.ts';
import { cleanMedia } from './cleanMedia.ts';
import {
  emptyTotals,
  MediaPublisher,
  type MediaPublisherDependencies,
  type Piece,
} from './MediaPublisher.ts';
import type { ContentStore } from './ports.ts';

/** Section ids are also their address, so they stay simple: `3d-modeling`. */
const SECTION_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function invalid(problems: string[]): never {
  throw new ContentError('INVALID_METADATA', `Invalid metadata: ${problems.join('; ')}`, { problems });
}

/** Use case: create a section, or change its title, order, cover or hover loop. */
export class SetSection {
  private readonly deps: MediaPublisherDependencies & { content: ContentStore };
  private readonly publisher: MediaPublisher;

  constructor(deps: MediaPublisherDependencies & { content: ContentStore }) {
    this.deps = deps;
    this.publisher = new MediaPublisher(deps);
  }

  async run({ id, draft, dryRun }: { id: string; draft: SectionDraft; dryRun: boolean }) {
    if (!SECTION_ID.test(id)) {
      invalid(['id must be lower case words joined by dashes, such as 3d-modeling']);
    }

    const existing = (await readDocument(this.deps.content, 'sections'))?.sections.find(
      (section) => section.id === id
    );
    if (!existing) {
      const missing = (['title', 'order', 'cover'] as const).filter((field) => draft[field] === undefined);
      if (missing.length > 0) invalid(missing.map((field) => `${field} is needed to create a section`));
    }

    const cover = draft.cover ? await this.planFile(draft.cover, 'image', draft.coverAlt) : undefined;
    const hover = draft.hover ? await this.planFile(draft.hover, 'loop') : undefined;
    const result = {
      id,
      isNew: !existing,
      pieces: [cover, hover].flatMap((planned) => (planned ? [planned.piece.plan] : [])),
      warnings: [...(cover?.warnings ?? []), ...(hover?.warnings ?? [])],
    };

    if (dryRun) {
      return result;
    }

    const upload = emptyTotals();
    const coverImage = cover && ((await this.publisher.publish(cover.piece, upload)) as StoredImage);
    const hoverLoop = hover && ((await this.publisher.publish(hover.piece, upload)) as StoredLoop);

    await updateDocument(this.deps.content, 'sections', `${existing ? 'edit' : 'add'} section "${draft.title ?? existing?.title}"`, (document) => {
      const current = document.sections.find((section) => section.id === id);
      const next: StoredSection = {
        id,
        title: draft.title ?? current!.title,
        order: draft.order ?? current!.order,
        cover: coverImage ?? current!.cover,
        hover: draft.removeHover ? undefined : hoverLoop ?? current?.hover,
      };
      const others = document.sections.filter((section) => section.id !== id);
      return { ...document, sections: [...others, next].sort((a, b) => a.order - b.order) };
    });
    await cleanMedia(this.deps);

    return { ...result, upload };
  }

  /**
   * A cover must be an image. A hover must move: a GIF or a video, always
   * published as a loop, with any transparency filled.
   */
  private async planFile(path: string, as: 'image' | 'loop', alt?: string): Promise<{ piece: Piece; warnings: unknown[] }> {
    const file = await this.publisher.file(path);
    const kind = classify(file.name).kind;
    const fits = as === 'image' ? kind === 'image' : kind === 'video' || kind === 'loop';
    if (!fits) {
      invalid([as === 'image' ? 'cover must be an image' : 'hover must be a GIF or a video']);
    }

    const { pieces, warnings } = await this.publisher.plan([file], {
      loops: as === 'loop' && kind === 'video' ? [file.name] : undefined,
      alts: alt ? { [file.name]: alt } : undefined,
    });
    // Hover loops are muted clips with no alternative text of their own.
    return { piece: pieces[0], warnings: warnings.filter((warning) => as === 'image' || warning.code !== 'MISSING_ALT') };
  }
}
