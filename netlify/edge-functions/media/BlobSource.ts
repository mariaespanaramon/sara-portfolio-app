export interface BlobInfo {
  etag: string;
  contentType?: string;
  /** Without it, ranges are not served. */
  size?: number;
}

export interface OpenBlob {
  info: BlobInfo;
  body: ReadableStream<Uint8Array>;
}

export interface BlobSource {
  info(key: string): Promise<BlobInfo | null>;
  /** Metadata and contents in one round trip. */
  open(key: string): Promise<OpenBlob | null>;
}
