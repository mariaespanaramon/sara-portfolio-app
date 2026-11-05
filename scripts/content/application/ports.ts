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

export interface ImageEncoder {
  /**
   * Bumped whenever encoding settings change, so re-encoded files get new keys
   * instead of silently replacing immutable, cached ones.
   */
  readonly version: string;
  /** Fails for anything that is not a decodable image. */
  inspect(bytes: Uint8Array): Promise<ImageInfo>;
  encode(bytes: Uint8Array): Promise<EncodedImage>;
}

export interface Hasher {
  /** A short, stable digest of the given parts. */
  digest(...parts: (string | Uint8Array)[]): string;
}
