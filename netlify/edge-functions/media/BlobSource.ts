export interface BlobInfo {
  etag: string;
  contentType?: string;
  /** Without it, ranges are not served. */
  size?: number;
}

export interface BlobSource {
  info(key: string): Promise<BlobInfo | null>;
  stream(key: string): Promise<ReadableStream<Uint8Array> | null>;
  bytes(key: string): Promise<ArrayBuffer | null>;
}
