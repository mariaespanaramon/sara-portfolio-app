import { getStore } from '@netlify/blobs';
import type { BlobInfo, BlobSource, OpenBlob } from './BlobSource.ts';
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
    return result?.etag ? toInfo(result.etag, result.metadata) : null;
  }

  async open(key: string): Promise<OpenBlob | null> {
    const result = await this.store.getWithMetadata(key, { type: 'stream' });
    return result?.etag ? { info: toInfo(result.etag, result.metadata), body: result.data } : null;
  }
}

function toInfo(etag: string, metadata: Record<string, unknown>): BlobInfo {
  const { contentType, size } = metadata;
  return {
    etag,
    contentType: typeof contentType === 'string' ? contentType : undefined,
    size: typeof size === 'number' ? size : undefined,
  };
}
