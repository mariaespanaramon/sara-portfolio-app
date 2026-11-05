import { getStore } from '@netlify/blobs';
import type { BlobInfo, BlobSource } from './BlobSource.ts';
import { BLOBS_REGION } from '../../../src/infrastructure/content/blobStores.ts';

// The client honours `region` for site stores, but its types only declare it for deploy stores.
type SiteStoreOptions = Parameters<typeof getStore>[0] & { name: string; region: string };

export class NetlifyBlobSource implements BlobSource {
  private readonly store;

  // One per request: the store holds a per-request token that expires, and there is none at build time.
  constructor(storeName: string) {
    const options: SiteStoreOptions = { name: storeName, region: BLOBS_REGION };
    this.store = getStore(options);
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
    const stream: ReadableStream<Uint8Array> | null = await this.store.get(key, { type: 'stream' });
    return stream ?? null;
  }

  async bytes(key: string): Promise<ArrayBuffer | null> {
    const bytes: ArrayBuffer | null = await this.store.get(key, { type: 'arrayBuffer' });
    return bytes ?? null;
  }
}
