import type {
  StoredImage,
  StoredLoop,
  StoredMedia,
  StoredVideo,
} from '../../../src/infrastructure/content/contentSchema.ts';
import { ContentError } from '../domain/ContentError.ts';
import type { MediaOptions } from '../domain/ProjectDraft.ts';
import { LOOP_BACKGROUND, LOOP_MAX_BYTES, suggestRole, type MovingRole } from '../domain/mediaRules.ts';
import { byDisplayOrder, classify, isIgnored, type SourceKind } from '../domain/sourceFiles.ts';
import type {
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
  /** Videos and loops. */
  durationSeconds?: number;
  /** Video files: whether there is sound, a silent track counting as none. */
  hasSound?: boolean;
  /** Video files: what the person would most likely choose, for the skill to propose. */
  suggestedRole?: MovingRole;
  /** GIFs: whether they have transparent areas. */
  isTransparent?: boolean;
}

export type MediaWarning =
  | { code: 'LOW_RESOLUTION'; file: string; width: number }
  | { code: 'MISSING_ALT'; files: string[] }
  | { code: 'TRANSPARENCY_FILLED'; file: string }
  | { code: 'LONG_LOOP'; file: string; durationSeconds: number };

export interface UploadTotals {
  filesUploaded: number;
  filesAlreadyStored: number;
  bytesUploaded: number;
}

export function emptyTotals(): UploadTotals {
  return { filesUploaded: 0, filesAlreadyStored: 0, bytesUploaded: 0 };
}

/** A file checked and ready to publish. */
export interface Piece {
  source: SourceFile;
  kind: SourceKind;
  plan: PlannedPiece;
  alt?: string;
}

export interface MediaPublisherDependencies {
  folders: SourceFolder;
  images: ImageEncoder;
  videos: VideoEncoder;
  media: MediaStore;
  hasher: Hasher;
}

/**
 * Application service shared by every use case that publishes files: checks
 * them, works out how each is published, encodes them and uploads the result.
 *
 * Uploads are idempotent: keys derive from the source bytes and the encoder
 * version, and files already stored are skipped, so a run that fails half way
 * can simply be repeated.
 */
export class MediaPublisher {
  private readonly deps: MediaPublisherDependencies;

  constructor(deps: MediaPublisherDependencies) {
    this.deps = deps;
  }

  /** Every publishable file in a folder, in display order. */
  async filesIn(folder: string): Promise<SourceFile[]> {
    const listed = await this.deps.folders.list(folder);
    if (!listed) {
      throw new ContentError('FOLDER_NOT_FOUND', `Folder not found: ${folder}`, { folder });
    }

    const files = listed.filter((file) => !isIgnored(file.name));
    if (files.length === 0) {
      throw new ContentError('FOLDER_EMPTY', `No files in ${folder}`, { folder });
    }

    this.checkSupported(files);
    return files.sort((a, b) => byDisplayOrder(a.name, b.name));
  }

  /** A single publishable file. */
  async file(path: string): Promise<SourceFile> {
    const file = await this.deps.folders.file(path);
    if (!file) {
      throw new ContentError('FILE_NOT_FOUND', `File not found: ${path}`, { path });
    }
    this.checkSupported([file]);
    return file;
  }

  /** Inspects the files and decides how each is published, without encoding anything. */
  async plan(files: SourceFile[], options: MediaOptions): Promise<{ pieces: Piece[]; warnings: MediaWarning[] }> {
    this.checkFileReferences(files, options);

    const pieces: Piece[] = [];
    const warnings: MediaWarning[] = [];

    for (const source of files) {
      const kind = (classify(source.name) as { kind: SourceKind }).kind;
      const plan = await this.planPiece(source, kind, options);
      warnings.push(...this.warningsFor(plan));
      pieces.push({ source, kind, plan, alt: options.alts?.[source.name] });
    }

    const withoutAlt = files.map((file) => file.name).filter((name) => !options.alts?.[name]);
    if (withoutAlt.length > 0) {
      warnings.push({ code: 'MISSING_ALT', files: withoutAlt });
    }

    return { pieces, warnings };
  }

  async publish(piece: Piece, totals: UploadTotals): Promise<StoredMedia> {
    const { source, kind, plan, alt } = piece;
    const withAlt = (image: StoredImage): StoredImage => (alt ? { ...image, alt } : image);

    switch (plan.role) {
      case 'image':
        return withAlt(await this.publishImage(await source.read(), totals));
      case 'animation':
        return withAlt(await this.publishAnimation(await source.read(), totals));
      case 'loop':
        return this.publishLoop(source, kind, withAlt, totals);
      case 'video':
        return this.publishVideo(source, withAlt, totals);
    }
  }

  private checkSupported(files: SourceFile[]): void {
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
  }

  /** `loops` and `keepTransparency` may only name files of the right kind. */
  private checkFileReferences(files: SourceFile[], options: MediaOptions): void {
    const kindOf = new Map(files.map((file) => [file.name, classify(file.name).kind]));
    const problems = [
      ...(options.loops ?? [])
        .filter((name) => kindOf.get(name) !== 'video')
        .map((name) => `loops names ${name}, which is not one of the videos`),
      ...(options.keepTransparency ?? [])
        .filter((name) => kindOf.get(name) !== 'loop')
        .map((name) => `keepTransparency names ${name}, which is not one of the GIFs`),
    ];

    if (problems.length > 0) {
      throw new ContentError('INVALID_METADATA', `Invalid metadata: ${problems.join('; ')}`, {
        problems,
      });
    }
  }

  private async planPiece(source: SourceFile, kind: SourceKind, options: MediaOptions): Promise<PlannedPiece> {
    const { images, videos } = this.deps;

    if (kind === 'image') {
      const info = await this.readable('UNREADABLE_IMAGE', source, async () =>
        images.inspect(await source.read())
      );
      return { file: source.name, role: 'image', ...info };
    }

    if (kind === 'loop') {
      const { isTransparent, ...size } = await this.readable('UNREADABLE_IMAGE', source, async () =>
        images.inspectAnimation(await source.read())
      );
      const keep = isTransparent && (options.keepTransparency ?? []).includes(source.name);
      return { file: source.name, role: keep ? 'animation' : 'loop', ...size, isTransparent };
    }

    const info = await this.readable('UNREADABLE_VIDEO', source, () => videos.inspect(source.path));
    const isLoop = (options.loops ?? []).includes(source.name);
    return {
      file: source.name,
      role: isLoop ? 'loop' : 'video',
      width: info.width,
      height: info.height,
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

  private warningsFor(plan: PlannedPiece): MediaWarning[] {
    const warnings: MediaWarning[] = [];
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
    source: SourceFile,
    kind: SourceKind,
    withAlt: (image: StoredImage) => StoredImage,
    totals: UploadTotals
  ): Promise<StoredLoop> {
    const { videos, hasher } = this.deps;
    const key = `loops/${await hasher.digestFile(`${videos.version}:loop`, source.path)}`;
    const loop = await this.encoded(source, () => videos.encodeLoop(source.path, LOOP_BACKGROUND));

    try {
      if (loop.clip.size > LOOP_MAX_BYTES) {
        throw new ContentError('LOOP_TOO_LARGE', `${source.name} is too large to play as a loop`, {
          file: source.name,
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
    source: SourceFile,
    withAlt: (image: StoredImage) => StoredImage,
    totals: UploadTotals
  ): Promise<StoredVideo> {
    const { videos, hasher } = this.deps;
    const key = `videos/${await hasher.digestFile(`${videos.version}:video`, source.path)}`;
    const video = await this.encoded(source, () => videos.encodeVideo(source.path));

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

  private async encoded<T>(source: SourceFile, encode: () => Promise<T>): Promise<T> {
    try {
      return await encode();
    } catch (error) {
      if (error instanceof ContentError) throw error;
      throw new ContentError('UNREADABLE_VIDEO', `${source.name} could not be encoded: ${String(error)}`, {
        file: source.name,
      });
    }
  }

  private async storeImage(key: string, encoded: EncodedImage, totals: UploadTotals): Promise<StoredImage> {
    for (const rendition of encoded.renditions) {
      const name = `${rendition.width}.${rendition.format}`;
      await this.storeFile(
        `${key}/${name}`,
        {
          name,
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
