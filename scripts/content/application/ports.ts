/**
 * Ports the content use cases depend on. Adapters live in ../infrastructure, so
 * the use cases never touch sharp, Netlify Blobs or the file system directly.
 */

/** Write access to the media store. */
export interface MediaStore {
  has(key: string): Promise<boolean>;
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
}

export interface StoredDocument {
  data: unknown;
  /** Identifies this exact version, for conditional writes. */
  etag: string;
}

export type WriteCondition =
  /** Only if the document is still at this version. */
  | { ifMatch: string }
  /** Only if the document does not exist yet. */
  | { ifNew: true };

/** Read and write access to the content documents. */
export interface ContentStore {
  read(key: string): Promise<StoredDocument | null>;
  /** Resolves false, without writing, when the condition no longer holds. */
  write(key: string, data: unknown, condition: WriteCondition): Promise<boolean>;
  /** Unconditional, for backups. */
  overwrite(key: string, data: unknown): Promise<void>;
}

export interface SourceFile {
  /** File name only, used for ordering and in messages. */
  name: string;
  /**
   * Where the file can be opened. Videos are handed to their encoder by path,
   * since they can be far too large to hold in memory.
   */
  path: string;
  read(): Promise<Uint8Array>;
}

/** The folder a project is uploaded from. */
export interface SourceFolder {
  /** Every file directly inside the folder. Null when the folder does not exist. */
  list(path: string): Promise<SourceFile[] | null>;
}

export interface ImageInfo {
  width: number;
  height: number;
}

export type EncodedFormat = 'avif' | 'webp';

export interface EncodedRendition {
  width: number;
  format: EncodedFormat;
  bytes: Uint8Array;
}

export interface EncodedImage extends ImageInfo {
  renditions: EncodedRendition[];
  /** Tiny blurred preview, as a data URI. */
  placeholder: string;
}

export interface AnimationInfo extends ImageInfo {
  /** Whether a meaningful share of pixels is transparent in any frame. */
  isTransparent: boolean;
}

export interface ImageEncoder {
  /**
   * Bumped whenever encoding settings change, so re-encoded files get new keys
   * instead of silently replacing immutable, cached ones.
   */
  readonly version: string;
  /** Fails for anything that is not a decodable image. */
  inspect(bytes: Uint8Array): Promise<ImageInfo>;
  encode(bytes: Uint8Array): Promise<EncodedImage>;
  /** For animated images such as GIFs. */
  inspectAnimation(bytes: Uint8Array): Promise<AnimationInfo>;
  /**
   * Keeps an animation as an animated image, transparency included. Only used
   * when transparency matters: a video is far smaller and can be paused.
   */
  encodeAnimation(bytes: Uint8Array): Promise<EncodedImage>;
}

export interface VideoInfo {
  width: number;
  height: number;
  durationSeconds: number;
  /** Has an audio track that is not silence. */
  hasSound: boolean;
}

/** A file an encoder produced, read only when it is uploaded. */
export interface OutputFile {
  /** Path relative to the asset's key, such as `v0/seg_000.m4s`. */
  name: string;
  contentType: string;
  size: number;
  read(): Promise<Uint8Array>;
}

/** Encoders work in scratch space, which the caller frees once done uploading. */
export interface Disposable {
  dispose(): Promise<void>;
}

export interface EncodedVideo extends Disposable {
  width: number;
  height: number;
  durationSeconds: number;
  /** False when the source had no audio, or only silence. */
  hasAudio: boolean;
  /** The HLS playlists and segments, `master.m3u8` included. */
  stream: OutputFile[];
  /** Short muted clip for previews. */
  preview: OutputFile;
  /** A still frame, to be encoded as the poster image. */
  posterFrame: Uint8Array;
}

export interface EncodedLoop extends Disposable {
  width: number;
  height: number;
  clip: OutputFile;
  posterFrame: Uint8Array;
}

export interface VideoEncoder {
  /** Bumped whenever encoding settings change. See ImageEncoder.version. */
  readonly version: string;
  /** Fails for anything ffmpeg cannot read. */
  inspect(path: string): Promise<VideoInfo>;
  encodeVideo(path: string): Promise<EncodedVideo>;
  /** Animated GIFs and short clips alike. Transparent pixels are filled with `background`. */
  encodeLoop(path: string, background: string): Promise<EncodedLoop>;
}

export interface Hasher {
  /** A short, stable digest of the given parts. */
  digest(...parts: (string | Uint8Array)[]): string;
  /** Same digest as `digest(salt, contents)`, streaming the file instead of loading it. */
  digestFile(salt: string, path: string): Promise<string>;
}
