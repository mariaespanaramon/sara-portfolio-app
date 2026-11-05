import type { StoredImage, StoredWorkItem } from '../../../src/infrastructure/content/contentSchema.ts';
import { toUrlId } from '../../../src/application/domain/urlId.ts';
import { ContentError } from '../domain/ContentError.ts';
import type { ProjectDraft } from '../domain/ProjectDraft.ts';
import { byDisplayOrder, classify, isIgnored, type SourceKind } from '../domain/sourceFiles.ts';
import { readSections, readWorkItems, updateWorkItems } from './contentDocuments.ts';
import type {
  ContentStore,
  Hasher,
  ImageEncoder,
  MediaStore,
  SourceFile,
  SourceFolder,
} from './ports.ts';

/** Below this width an image starts to look soft on large, high density screens. */
const SOFT_IMAGE_WIDTH = 1600;

const CONTENT_TYPES = { avif: 'image/avif', webp: 'image/webp' } as const;

export interface AddProjectInput {
  folder: string;
  draft: ProjectDraft;
  /** Check everything and report the plan, without encoding or uploading. */
  dryRun: boolean;
}

export interface PlannedPiece {
  file: string;
  kind: SourceKind;
  width: number;
  height: number;
  isCover: boolean;
}

export type Warning =
  | { code: 'LOW_RESOLUTION'; file: string; width: number }
  | { code: 'NO_SECTIONS_YET'; section: string }
  | { code: 'MISSING_ALT'; files: string[] };

export interface AddProjectResult {
  id: string;
  /** Where the project page will live on the site. */
  path: string;
  pieces: PlannedPiece[];
  warnings: Warning[];
  /** Only after a real run. */
  upload?: {
    filesUploaded: number;
    filesAlreadyStored: number;
    bytesUploaded: number;
  };
}

interface Dependencies {
  folders: SourceFolder;
  images: ImageEncoder;
  media: MediaStore;
  content: ContentStore;
  hasher: Hasher;
}

/**
 * Use case: publish a new project from a folder of files and its texts.
 *
 * Media is uploaded before the project is added to the work items document, so
 * the site never lists a project whose files are not there yet. Uploads are
 * idempotent (keys derive from the file's bytes), so a run that fails half way
 * can simply be repeated.
 */
export class AddProject {
  private readonly deps: Dependencies;

  constructor(deps: Dependencies) {
    this.deps = deps;
  }

  async run({ folder, draft, dryRun }: AddProjectInput): Promise<AddProjectResult> {
    const files = await this.listPieces(folder);
    const coverIndex = this.coverIndex(files, draft.cover);
    const id = toUrlId(draft.title);

    await this.checkNotTaken(id, draft.title);
    const warnings = await this.checkSection(draft.section);

    const pieces: PlannedPiece[] = [];
    const contents = new Map<string, Uint8Array>();

    for (const [index, file] of files.entries()) {
      const bytes = await file.read();
      contents.set(file.name, bytes);

      let info;
      try {
        info = await this.deps.images.inspect(bytes);
      } catch {
        throw new ContentError('UNREADABLE_IMAGE', `${file.name} could not be read as an image`, {
          file: file.name,
        });
      }

      if (info.width < SOFT_IMAGE_WIDTH) {
        warnings.push({ code: 'LOW_RESOLUTION', file: file.name, width: info.width });
      }

      pieces.push({ file: file.name, kind: 'image', ...info, isCover: index === coverIndex });
    }

    const withoutAlt = files.map((file) => file.name).filter((name) => !draft.alts?.[name]);
    if (withoutAlt.length > 0) {
      warnings.push({ code: 'MISSING_ALT', files: withoutAlt });
    }

    const result: AddProjectResult = { id, path: `/work/${id}`, pieces, warnings };

    if (dryRun) {
      return result;
    }

    const upload = { filesUploaded: 0, filesAlreadyStored: 0, bytesUploaded: 0 };
    const media: StoredImage[] = [];

    for (const file of files) {
      const stored = await this.uploadImage(contents.get(file.name)!, upload);
      const alt = draft.alts?.[file.name];
      media.push(alt ? { ...stored, alt } : stored);
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

    await updateWorkItems(this.deps.content, (document) => {
      // Checked again here: someone may have added it since the first check.
      if (document.items.some((existing) => existing.id === id)) {
        throw new ContentError('PROJECT_EXISTS', `A project with id ${id} already exists`, { id });
      }
      return { ...document, items: [...document.items, item] };
    });

    return { ...result, upload };
  }

  private async listPieces(folder: string): Promise<SourceFile[]> {
    const listed = await this.deps.folders.list(folder);
    if (!listed) {
      throw new ContentError('FOLDER_NOT_FOUND', `Folder not found: ${folder}`, { folder });
    }

    const files = listed.filter((file) => !isIgnored(file.name));
    if (files.length === 0) {
      throw new ContentError('FOLDER_EMPTY', `No files in ${folder}`, { folder });
    }

    const unsupported = files.flatMap((file) => {
      const classification = classify(file.name);
      return classification.kind === 'unsupported'
        ? [{ file: file.name, reason: classification.reason }]
        : [];
    });
    if (unsupported.length > 0) {
      throw new ContentError(
        'UNSUPPORTED_FILE',
        `Unsupported files: ${unsupported.map((entry) => entry.file).join(', ')}`,
        { files: unsupported }
      );
    }

    return files.sort((a, b) => byDisplayOrder(a.name, b.name));
  }

  private coverIndex(files: SourceFile[], cover: string | undefined): number {
    if (cover === undefined) {
      return 0;
    }

    const index = files.findIndex((file) => file.name === cover);
    if (index === -1) {
      throw new ContentError('COVER_NOT_FOUND', `Cover ${cover} is not in the folder`, {
        cover,
        files: files.map((file) => file.name),
      });
    }
    return index;
  }

  private async checkNotTaken(id: string, title: string): Promise<void> {
    const document = await readWorkItems(this.deps.content);
    // Project pages are addressed by their title, so a title that maps to the
    // same address would make one of the two unreachable.
    const clash = document.items.find(
      (item) => item.id === id || toUrlId(item.title) === id
    );
    if (clash) {
      throw new ContentError('PROJECT_EXISTS', `"${title}" clashes with "${clash.title}"`, {
        id,
        existingTitle: clash.title,
      });
    }
  }

  private async checkSection(section: string): Promise<Warning[]> {
    const document = await readSections(this.deps.content);

    if (!document) {
      return [{ code: 'NO_SECTIONS_YET', section }];
    }

    if (!document.sections.some((candidate) => candidate.id === section)) {
      throw new ContentError('SECTION_NOT_FOUND', `No section with id ${section}`, {
        section,
        sections: document.sections.map(({ id, title }) => ({ id, title })),
      });
    }

    return [];
  }

  private async uploadImage(
    bytes: Uint8Array,
    totals: { filesUploaded: number; filesAlreadyStored: number; bytesUploaded: number }
  ): Promise<StoredImage> {
    const { images, media, hasher } = this.deps;
    const key = `images/${hasher.digest(images.version, bytes)}`;
    const encoded = await images.encode(bytes);

    for (const rendition of encoded.renditions) {
      const renditionKey = `${key}/${rendition.width}.${rendition.format}`;

      if (await media.has(renditionKey)) {
        totals.filesAlreadyStored += 1;
        continue;
      }

      await media.put(renditionKey, rendition.bytes, CONTENT_TYPES[rendition.format]);
      totals.filesUploaded += 1;
      totals.bytesUploaded += rendition.bytes.byteLength;
    }

    const widths = [...new Set(encoded.renditions.map((rendition) => rendition.width))].sort(
      (a, b) => a - b
    );
    const formats = [...new Set(encoded.renditions.map((rendition) => rendition.format))];

    return {
      kind: 'image',
      key,
      width: encoded.width,
      height: encoded.height,
      widths,
      formats,
      placeholder: encoded.placeholder,
    };
  }
}
