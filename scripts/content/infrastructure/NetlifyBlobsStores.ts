import { getStore } from '@netlify/blobs';
import { BLOB_STORES, BLOBS_REGION } from '../../../src/infrastructure/content/blobStores.ts';
import type {
  ContentStore,
  MediaStore,
  StoredDocument,
  WriteCondition,
} from '../application/ports.ts';
import type { NetlifyCredentials } from './netlifyCredentials.ts';

// The client honours `region` for site stores, but these types only declare it for deploy stores.
type SiteStoreOptions = Parameters<typeof getStore>[0] & { name: string; region: string };

function openStore(name: string, credentials: NetlifyCredentials) {
  const options: SiteStoreOptions = { name, region: BLOBS_REGION, ...credentials };
  return getStore(options);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer as ArrayBuffer;
}

export class NetlifyBlobsMediaStore implements MediaStore {
  private readonly store;

  constructor(credentials: NetlifyCredentials) {
    this.store = openStore(BLOB_STORES.media, credentials);
  }

  async has(key: string): Promise<boolean> {
    return (await this.store.getMetadata(key)) !== null;
  }

  async put(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
    await this.store.set(key, toArrayBuffer(bytes), {
      metadata: { contentType, size: bytes.byteLength, uploadedAt: new Date().toISOString() },
    });
  }

  async uploadedAt(key: string): Promise<Date | null> {
    const uploadedAt = (await this.store.getMetadata(key))?.metadata.uploadedAt;
    return typeof uploadedAt === 'string' ? new Date(uploadedAt) : null;
  }

  async list(): Promise<string[]> {
    const { blobs } = await this.store.list();
    return blobs.map((blob) => blob.key);
  }

  async delete(key: string): Promise<void> {
    await this.store.delete(key);
  }
}

const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';

export class NetlifyBlobsContentStore implements ContentStore {
  private readonly store;

  constructor(credentials: NetlifyCredentials) {
    this.store = openStore(BLOB_STORES.content, credentials);
  }

  async read(key: string): Promise<StoredDocument | null> {
    const result = await this.store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
    if (!result || !result.etag) {
      return null;
    }
    return { data: result.data, etag: result.etag };
  }

  async write(key: string, data: unknown, condition: WriteCondition): Promise<boolean> {
    const body = JSON.stringify(data, null, 2);
    const metadata = { contentType: JSON_CONTENT_TYPE, size: new TextEncoder().encode(body).byteLength };
    const result =
      'ifMatch' in condition
        ? await this.store.set(key, body, { metadata, onlyIfMatch: condition.ifMatch })
        : await this.store.set(key, body, { metadata, onlyIfNew: true });
    return result.modified;
  }

  async overwrite(key: string, data: unknown): Promise<void> {
    const body = JSON.stringify(data, null, 2);
    const metadata = { contentType: JSON_CONTENT_TYPE, size: new TextEncoder().encode(body).byteLength };
    await this.store.set(key, body, { metadata });
  }
}
