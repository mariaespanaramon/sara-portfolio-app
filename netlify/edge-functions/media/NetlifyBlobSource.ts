import { getStore } from '@netlify/blobs';
import type { BlobInfo, BlobSource } from './BlobSource.ts';

/**
 * Adapter: BlobSource over a site-wide Netlify Blobs store.
 *
 * Inside an Edge Function the site id and token are provided by Netlify, so
 * nothing secret is configured here.
 */
export class NetlifyBlobSource implements BlobSource {
  private storeInstance?: ReturnType<typeof getStore>;

  constructor(private readonly storeName: string) {}

  /**
   * Created on first use, not in the constructor: the bundler evaluates this
   * module at build time, where the Blobs environment does not exist yet.
   */
  private get store() {
    this.storeInstance ??= getStore(this.storeName);
    return this.storeInstance;
  }

  async info(key: string): Promise<BlobInfo | null> {
    const result = await this.store.getMetadata(key);

    if (!result || !result.etag) {
      return null;
    }

    const { contentType, size } = result.metadata;

    return {
      etag: result.etag,
      contentType: typeof contentType === 'string' ? contentType : undefined,
      size: typeof size === 'number' ? size : undefined,
    };
  }

  async stream(key: string): Promise<ReadableStream<Uint8Array> | null> {
    // Typed as never null, but resolves to null for a missing key.
    const stream: ReadableStream<Uint8Array> | null = await this.store.get(key, { type: 'stream' });
    return stream ?? null;
  }

  async bytes(key: string): Promise<ArrayBuffer | null> {
    const bytes: ArrayBuffer | null = await this.store.get(key, { type: 'arrayBuffer' });
    return bytes ?? null;
  }
}
