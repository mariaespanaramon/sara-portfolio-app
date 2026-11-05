export interface MediaStore {
  has(key: string): Promise<boolean>;
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  list(): Promise<string[]>;
  uploadedAt(key: string): Promise<Date | null>;
  delete(key: string): Promise<void>;
}

export interface StoredDocument {
  data: unknown;
  etag: string;
}

export type WriteCondition = { ifMatch: string } | { ifNew: true };

export interface ContentStore {
  read(key: string): Promise<StoredDocument | null>;
  /** Resolves false, without writing, when the condition no longer holds. */
  write(key: string, data: unknown, condition: WriteCondition): Promise<boolean>;
  overwrite(key: string, data: unknown): Promise<void>;
}

export interface SourceFile {
  name: string;
  /** Videos are encoded from their path: they can be too large to hold in memory. */
  path: string;
  read(): Promise<Uint8Array>;
}

export interface SourceFolder {
  list(path: string): Promise<SourceFile[] | null>;
  file(path: string): Promise<SourceFile | null>;
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
  placeholder: string;
}

export interface AnimationInfo extends ImageInfo {
  isTransparent: boolean;
}

export interface ImageEncoder {
  /** Bumped when settings change, so re-encoded files get new keys instead of replacing cached ones. */
  readonly version: string;
  inspect(bytes: Uint8Array): Promise<ImageInfo>;
  encode(bytes: Uint8Array): Promise<EncodedImage>;
  inspectAnimation(bytes: Uint8Array): Promise<AnimationInfo>;
  encodeAnimation(bytes: Uint8Array): Promise<EncodedImage>;
}

export interface VideoInfo {
  width: number;
  height: number;
  durationSeconds: number;
  hasSound: boolean;
}

export interface OutputFile {
  /** Relative to the asset's key, such as `v0/seg_000.m4s`. */
  name: string;
  contentType: string;
  size: number;
  read(): Promise<Uint8Array>;
}

export interface Disposable {
  dispose(): Promise<void>;
}

export interface EncodedVideo extends Disposable {
  width: number;
  height: number;
  durationSeconds: number;
  hasAudio: boolean;
  stream: OutputFile[];
  preview: OutputFile;
  posterFrame: Uint8Array;
}

export interface EncodedLoop extends Disposable {
  width: number;
  height: number;
  clip: OutputFile;
  posterFrame: Uint8Array;
}

export interface VideoEncoder {
  readonly version: string;
  inspect(path: string): Promise<VideoInfo>;
  encodeVideo(path: string): Promise<EncodedVideo>;
  encodeLoop(path: string, background: string): Promise<EncodedLoop>;
}

export interface Hasher {
  digest(...parts: (string | Uint8Array)[]): string;
  digestFile(salt: string, path: string): Promise<string>;
}
