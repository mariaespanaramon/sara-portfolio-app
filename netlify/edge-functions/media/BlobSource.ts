/**
 * Port: read access to a blob store.
 *
 * serveBlob only depends on this, so the HTTP behaviour can be exercised without
 * Netlify Blobs behind it.
 */

export interface BlobInfo {
  etag: string;
  /** Set by the content scripts on upload. Missing on blobs uploaded by hand. */
  contentType?: string;
  /** Size in bytes, also set on upload. Without it, ranges are not served. */
  size?: number;
}

export interface BlobSource {
  /** Metadata only, without downloading the blob. Null when the key does not exist. */
  info(key: string): Promise<BlobInfo | null>;
  /** Null when the key does not exist. */
  stream(key: string): Promise<ReadableStream<Uint8Array> | null>;
  /** The whole blob in memory. Only for small blobs, see serveBlob. */
  bytes(key: string): Promise<ArrayBuffer | null>;
}
