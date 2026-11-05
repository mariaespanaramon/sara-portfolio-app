import type { StoredMedia, StoredWorkItem } from '../../../src/infrastructure/content/contentSchema.ts';
import { ContentError } from '../domain/ContentError.ts';
import type { ProjectDraft } from '../domain/ProjectDraft.ts';
import {
  assertSectionExists,
  assertTitleFree,
  readSections,
  readWorkItems,
  updateWorkItems,
} from './contentDocuments.ts';
import { cleanMedia } from './cleanMedia.ts';
import {
  emptyTotals,
  MediaPublisher,
  type MediaPublisherDependencies,
  type MediaWarning,
  type PlannedPiece,
  type UploadTotals,
} from './MediaPublisher.ts';
import type { ContentStore } from './ports.ts';

export interface AddProjectInput {
  folder: string;
  draft: ProjectDraft;
  dryRun: boolean;
}

export type Warning = MediaWarning | { code: 'NO_SECTIONS_YET'; section: string };

export interface AddProjectResult {
  id: string;
  path: string;
  pieces: (PlannedPiece & { isCover: boolean })[];
  warnings: Warning[];
  upload?: UploadTotals;
}

interface Dependencies extends MediaPublisherDependencies {
  content: ContentStore;
}

/** Media goes up before the document, so the site never lists a project missing files. */
export class AddProject {
  private readonly deps: Dependencies;
  private readonly publisher: MediaPublisher;

  constructor(deps: Dependencies) {
    this.deps = deps;
    this.publisher = new MediaPublisher(deps);
  }

  async run({ folder, draft, dryRun }: AddProjectInput): Promise<AddProjectResult> {
    const files = await this.publisher.filesIn(folder);
    const coverIndex = this.coverIndex(files.map((file) => file.name), draft.cover);
    const id = assertTitleFree(await readWorkItems(this.deps.content), draft.title);
    const sectionWarnings = await this.checkSection(draft.section);
    const { pieces, warnings } = await this.publisher.plan(files, draft);

    const result: AddProjectResult = {
      id,
      path: `/work/${id}`,
      pieces: pieces.map((piece, index) => ({ ...piece.plan, isCover: index === coverIndex })),
      warnings: [...sectionWarnings, ...warnings],
    };

    if (dryRun) {
      return result;
    }

    const upload = emptyTotals();
    const media: StoredMedia[] = [];
    for (const piece of pieces) {
      media.push(await this.publisher.publish(piece, upload));
    }

    const item: StoredWorkItem = {
      id,
      title: draft.title,
      category: draft.category,
      description: draft.description,
      year: draft.year,
      tags: draft.tags,
      sectionId: draft.section,
      ...(coverIndex === 0 ? {} : { coverIndex }),
      media,
    };

    await updateWorkItems(this.deps.content, `add project "${draft.title}"`, (document) => {
      // Someone may have added it since the first check.
      assertTitleFree(document, draft.title);
      return { ...document, items: [...document.items, item] };
    });
    await cleanMedia(this.deps);

    return { ...result, upload };
  }

  private coverIndex(names: string[], cover: string | undefined): number {
    if (cover === undefined) {
      return 0;
    }

    const index = names.indexOf(cover);
    if (index === -1) {
      throw new ContentError('COVER_NOT_FOUND', `Cover ${cover} is not in the folder`, {
        cover,
        files: names,
      });
    }
    return index;
  }

  private async checkSection(section: string): Promise<Warning[]> {
    const document = await readSections(this.deps.content);

    if (!document) {
      return [{ code: 'NO_SECTIONS_YET', section }];
    }

    assertSectionExists(document, section);
    return [];
  }
}
