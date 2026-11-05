import type { StoredImage, StoredLoop } from '../../../src/infrastructure/content/contentSchema.ts';
import { ContentError } from '../domain/ContentError.ts';
import type { SiteSlot } from '../domain/SectionDraft.ts';
import { classify } from '../domain/sourceFiles.ts';
import { updateDocument } from './contentDocuments.ts';
import { cleanMedia } from './cleanMedia.ts';
import { emptyTotals, MediaPublisher, type MediaPublisherDependencies } from './MediaPublisher.ts';
import type { ContentStore } from './ports.ts';

function invalid(problem: string): never {
  throw new ContentError('INVALID_METADATA', `Invalid metadata: ${problem}`, { problems: [problem] });
}

/**
 * Use case: replace the hero image or the intro splash animation.
 *
 * The hero must be an image. The intro can be an image, a video or a GIF; moving
 * ones become a loop, or stay an animated image when their transparency must
 * survive, which a logo over the page usually needs.
 */
export class SetSiteMedia {
  private readonly deps: MediaPublisherDependencies & { content: ContentStore };
  private readonly publisher: MediaPublisher;

  constructor(deps: MediaPublisherDependencies & { content: ContentStore }) {
    this.deps = deps;
    this.publisher = new MediaPublisher(deps);
  }

  async run({ slot, path, alt, keepTransparency, dryRun }: {
    slot: SiteSlot;
    path: string;
    alt?: string;
    keepTransparency: boolean;
    dryRun: boolean;
  }) {
    const file = await this.publisher.file(path);
    const kind = classify(file.name).kind;

    if (slot === 'hero' && kind !== 'image') {
      invalid('the hero must be an image');
    }

    const { pieces, warnings } = await this.publisher.plan([file], {
      alts: alt ? { [file.name]: alt } : undefined,
      loops: kind === 'video' ? [file.name] : undefined,
      keepTransparency: keepTransparency && kind === 'loop' ? [file.name] : undefined,
    });
    const result = { slot, piece: pieces[0].plan, warnings };

    if (dryRun) {
      return result;
    }

    const upload = emptyTotals();
    const published = await this.publisher.publish(pieces[0], upload);

    await updateDocument(this.deps.content, 'site', `replace the ${slot}`, (document) =>
      slot === 'hero'
        ? { ...document, hero: published as StoredImage }
        : { ...document, intro: published as StoredLoop | StoredImage }
    );
    await cleanMedia(this.deps);

    return { ...result, upload };
  }
}
