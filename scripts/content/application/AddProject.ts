import type {
  StoredImage,
  StoredLoop,
  StoredMedia,
  StoredVideo,
  StoredWorkItem,
} from '../../../src/infrastructure/content/contentSchema.ts';
import { toUrlId } from '../../../src/application/domain/urlId.ts';
import { ContentError } from '../domain/ContentError.ts';
import type { ProjectDraft } from '../domain/ProjectDraft.ts';
import { LOOP_BACKGROUND, LOOP_MAX_BYTES, suggestRole, type MovingRole } from '../domain/mediaRules.ts';
import { byDisplayOrder, classify, isIgnored, type SourceKind } from '../domain/sourceFiles.ts';
import { readSections, readWorkItems, updateWorkItems } from './contentDocuments.ts';
import type {
  ContentStore,
  EncodedImage,
  Hasher,
  ImageEncoder,
  MediaStore,
  OutputFile,
  SourceFile,
  SourceFolder,
  VideoEncoder,
} from './ports.ts';

/** Below these widths a piece starts to look soft on large, high density screens. */
const SOFT_IMAGE_WIDTH = 1600;
const SOFT_VIDEO_WIDTH = 1280;

/** Loops this long get heavy, since a loop is a single file played in full. */
const LONG_LOOP_SECONDS = 30;

const IMAGE_CONTENT_TYPES = { avif: 'image/avif', webp: 'image/webp' } as const;

export interface AddProjectInput {
  folder: string;
  draft: ProjectDraft;
  /** Check everything and report the plan, without encoding or uploading. */
  dryRun: boolean;
}

/**
 * How a piece is published:
 * - image: responsive AVIF and WebP renditions.
 * - video: adaptive stream with controls, poster and a muted preview.
 * - loop: a muted MP4 that plays on its own, for GIFs and short clips.
 * - animation: an animated WebP, only for GIFs whose transparency must survive.
 */
export type PieceRole = 'image' | 'video' | 'loop' | 'animation';

export interface PlannedPiece {
  file: string;
  role: PieceRole;
  width: number;
  height: number;
  isCover: boolean;
  /** Videos and loops. */
  durationSeconds?: number;
  /** Video files: whether there is sound, a silent track counting as none. */
  hasSound?: boolean;
  /** Video files: what the person would most likely choose, for the skill to propose. */
  suggestedRole?: MovingRole;
  /** GIFs: whether they have transparent areas. */
  isTransparent?: boolean;
}

export type Warning =
  | { code: 'LOW_RESOLUTION'; file: string; width: number }
  | { code: 'NO_SECTIONS_YET'; section: string }
  | { code: 'MISSING_ALT'; files: string[] }
  | { code: 'TRANSPARENCY_FILLED'; file: string }
  | { code: 'LONG_LOOP'; file: string; durationSeconds: number };

export interface AddProjectResult {
  id: string;
  /** Where the project page will live on the site. */
  path: string;
  pieces: PlannedPiece[];
  warnings: Warning[];
  /** Only after a real run. */
  upload?: UploadTotals;
}

interface UploadTotals {
  filesUploaded: number;
  filesAlreadyStored: number;
  bytesUploaded: number;
}

interface Dependencies {
  folders: SourceFolder;
  images: ImageEncoder;
  videos: VideoEncoder;
  media: MediaStore;
  content: ContentStore;
  hasher: Hasher;
}

interface Piece {
  file: SourceFile;
  kind: SourceKind;
  plan: PlannedPiece;
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
    const files = await this.listFiles(folder);
    this.checkFileReferences(files, draft);
    const coverIndex = this.coverIndex(files, draft.cover);
    const id = toUrlId(draft.title);

    await this.checkNotTaken(id, draft.title);
    const warnings = await this.checkSection(draft.section);

    const pieces: Piece[] = [];
    for (const [index, file] of files.entries()) {
      const kind = (classify(file.name) as { kind: SourceKind }).kind;
      const plan = await this.plan(file, kind, draft, index === coverIndex);
      warnings.push(...this.warningsFor(plan));
      pieces.push({ file, kind, plan });
    }

    const withoutAlt = files.map((file) => file.name).filter((name) => !draft.alts?.[name]);
    if (withoutAlt.length > 0) {
      warnings.push({ code: 'MISSING_ALT', files: withoutAlt });
    }

    const result: AddProjectResult = {
      id,
      path: `/work/${id}`,
      pieces: pieces.map((piece) => piece.plan),
      warnings,
    };

    if (dryRun) {
      return result;
    }

    const upload: UploadTotals = { filesUploaded: 0, filesAlreadyStored: 0, bytesUploaded: 0 };
    const media: StoredMedia[] = [];

    for (const piece of pieces) {
      media.push(await this.publish(piece, draft.alts?.[piece.file.name], upload));
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

  private async listFiles(folder: string): Promise<SourceFile[]> {
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

  /** `loops` and `keepTransparency` may only name files of the right kind. */
  private checkFileReferences(files: SourceFile[], draft: ProjectDraft): void {
    const kindOf = new Map(files.map((file) => [file.name, classify(file.name).kind]));
    const problems = [
      ...(draft.loops ?? [])
        .filter((name) => kindOf.get(name) !== 'video')
        .map((name) => `loops names ${name}, which is not a video in the folder`),
      ...(draft.keepTransparency ?? [])
        .filter((name) => kindOf.get(name) !== 'loop')
        .map((name) => `keepTransparency names ${name}, which is not a GIF in the folder`),
    ];

    if (problems.length > 0) {
      throw new ContentError('INVALID_METADATA', `Invalid project metadata: ${problems.join('; ')}`, {
        problems,
      });
    }
  }

  private async plan(
    file: SourceFile,
    kind: SourceKind,
    draft: ProjectDraft,
    isCover: boolean
  ): Promise<PlannedPiece> {
    const { images, videos } = this.deps;

    if (kind === 'image') {
      const info = await this.readable('UNREADABLE_IMAGE', file, async () =>
        images.inspect(await file.read())
      );
      return { file: file.name, role: 'image', ...info, isCover };
    }

    if (kind === 'loop') {
      const { isTransparent, ...size } = await this.readable('UNREADABLE_IMAGE', file, async () =>
        images.inspectAnimation(await file.read())
      );
      const keep = isTransparent && (draft.keepTransparency ?? []).includes(file.name);
      return { file: file.name, role: keep ? 'animation' : 'loop', ...size, isCover, isTransparent };
    }

    const info = await this.readable('UNREADABLE_VIDEO', file, () => videos.inspect(file.path));
    const isLoop = (draft.loops ?? []).includes(file.name);
    return {
      file: file.name,
      role: isLoop ? 'loop' : 'video',
      width: info.width,
      height: info.height,
      isCover,
      durationSeconds: info.durationSeconds,
      hasSound: info.hasSound,
      suggestedRole: suggestRole(info.durationSeconds, info.hasSound),
    };
  }

  private async readable<T>(
    code: 'UNREADABLE_IMAGE' | 'UNREADABLE_VIDEO',
    file: SourceFile,
    read: () => Promise<T>
  ): Promise<T> {
    try {
      return await read();
    } catch {
      throw new ContentError(code, `${file.name} could not be read`, { file: file.name });
    }
  }

  private warningsFor(plan: PlannedPiece): Warning[] {
    const warnings: Warning[] = [];
    const softWidth = plan.role === 'image' ? SOFT_IMAGE_WIDTH : SOFT_VIDEO_WIDTH;

    if (plan.width < softWidth) {
      warnings.push({ code: 'LOW_RESOLUTION', file: plan.file, width: plan.width });
    }
    if (plan.role === 'loop' && plan.isTransparent) {
      warnings.push({ code: 'TRANSPARENCY_FILLED', file: plan.file });
    }
    if (plan.role === 'loop' && (plan.durationSeconds ?? 0) > LONG_LOOP_SECONDS) {
      warnings.push({ code: 'LONG_LOOP', file: plan.file, durationSeconds: plan.durationSeconds! });
    }

    return warnings;
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

  private async publish(piece: Piece, alt: string | undefined, totals: UploadTotals): Promise<StoredMedia> {
    const { file, kind, plan } = piece;
    const withAlt = (image: StoredImage): StoredImage => (alt ? { ...image, alt } : image);

    switch (plan.role) {
      case 'image':
        return withAlt(await this.publishImage(await file.read(), totals));
      case 'animation':
        return withAlt(await this.publishAnimation(await file.read(), totals));
      case 'loop':
        return this.publishLoop(file, kind, withAlt, totals);
      case 'video':
        return this.publishVideo(file, withAlt, totals);
    }
  }

  private async publishImage(bytes: Uint8Array, totals: UploadTotals): Promise<StoredImage> {
    const { images, hasher } = this.deps;
    const key = `images/${hasher.digest(images.version, bytes)}`;
    return this.storeImage(key, await images.encode(bytes), totals);
  }

  private async publishAnimation(bytes: Uint8Array, totals: UploadTotals): Promise<StoredImage> {
    const { images, hasher } = this.deps;
    const key = `images/${hasher.digest(`${images.version}:animation`, bytes)}`;
    return this.storeImage(key, await images.encodeAnimation(bytes), totals);
  }

  private async publishLoop(
    file: SourceFile,
    kind: SourceKind,
    withAlt: (image: StoredImage) => StoredImage,
    totals: UploadTotals
  ): Promise<StoredLoop> {
    const { videos, hasher } = this.deps;
    const key = `loops/${await hasher.digestFile(`${videos.version}:loop`, file.path)}`;
    const loop = await this.encoded('UNREADABLE_VIDEO', file, () =>
      videos.encodeLoop(file.path, LOOP_BACKGROUND)
    );

    try {
      if (loop.clip.size > LOOP_MAX_BYTES) {
        throw new ContentError('LOOP_TOO_LARGE', `${file.name} is too large to play as a loop`, {
          file: file.name,
          sizeMB: Math.round((loop.clip.size / 1024 / 1024) * 10) / 10,
          maxMB: LOOP_MAX_BYTES / 1024 / 1024,
          isGif: kind === 'loop',
        });
      }

      await this.storeFile(`${key}/loop.mp4`, loop.clip, totals);
      const poster = withAlt(await this.publishImage(loop.posterFrame, totals));

      return { kind: 'loop', key, width: loop.width, height: loop.height, poster };
    } finally {
      await loop.dispose();
    }
  }

  private async publishVideo(
    file: SourceFile,
    withAlt: (image: StoredImage) => StoredImage,
    totals: UploadTotals
  ): Promise<StoredVideo> {
    const { videos, hasher } = this.deps;
    const key = `videos/${await hasher.digestFile(`${videos.version}:video`, file.path)}`;
    const video = await this.encoded('UNREADABLE_VIDEO', file, () => videos.encodeVideo(file.path));

    try {
      // Segments before playlists: a playlist must never point at a missing file.
      const playlists = video.stream.filter((output) => output.name.endsWith('.m3u8'));
      const rest = video.stream.filter((output) => !output.name.endsWith('.m3u8'));
      for (const output of [...rest, ...playlists]) {
        await this.storeFile(`${key}/${output.name}`, output, totals);
      }
      await this.storeFile(`${key}/preview.mp4`, video.preview, totals);
      const poster = withAlt(await this.publishImage(video.posterFrame, totals));

      return {
        kind: 'video',
        key,
        width: video.width,
        height: video.height,
        poster,
        hasPreview: true,
        durationSeconds: video.durationSeconds,
        hasAudio: video.hasAudio,
      };
    } finally {
      await video.dispose();
    }
  }

  private async encoded<T>(
    code: 'UNREADABLE_VIDEO',
    file: SourceFile,
    encode: () => Promise<T>
  ): Promise<T> {
    try {
      return await encode();
    } catch (error) {
      if (error instanceof ContentError) throw error;
      throw new ContentError(code, `${file.name} could not be encoded: ${String(error)}`, {
        file: file.name,
      });
    }
  }

  private async storeImage(key: string, encoded: EncodedImage, totals: UploadTotals): Promise<StoredImage> {
    for (const rendition of encoded.renditions) {
      await this.storeFile(
        `${key}/${rendition.width}.${rendition.format}`,
        {
          name: `${rendition.width}.${rendition.format}`,
          contentType: IMAGE_CONTENT_TYPES[rendition.format],
          size: rendition.bytes.byteLength,
          read: async () => rendition.bytes,
        },
        totals
      );
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

  private async storeFile(key: string, output: OutputFile, totals: UploadTotals): Promise<void> {
    const { media } = this.deps;

    if (await media.has(key)) {
      totals.filesAlreadyStored += 1;
      return;
    }

    await media.put(key, await output.read(), output.contentType);
    totals.filesUploaded += 1;
    totals.bytesUploaded += output.size;
  }
}
