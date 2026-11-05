import type { Config } from '@netlify/edge-functions';
import { NetlifyBlobSource } from './NetlifyBlobSource.ts';
import { serveBlob, type CachePolicy } from './serveBlob.ts';
import { BLOB_STORES } from '../../../src/infrastructure/content/blobStores.ts';

interface Route {
  storeName: string;
  cache: CachePolicy;
}

const ROUTES: Record<string, Route> = {
  media: {
    storeName: BLOB_STORES.media,
    // Keys are content hashes.
    cache: {
      browser: 'public, max-age=31536000, immutable',
      cdn: 'public, max-age=31536000, immutable',
    },
  },
  content: {
    storeName: BLOB_STORES.content,
    cache: {
      browser: 'public, max-age=0, must-revalidate',
      cdn: 'public, max-age=60, stale-while-revalidate=300',
    },
  },
};

export default async function handler(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  const [, routeName, ...rest] = pathname.split('/');
  const route = ROUTES[routeName];
  const key = decodeURIComponent(rest.join('/'));

  if (!route || key === '' || key.split('/').some((part) => part === '' || part === '..')) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  return serveBlob(request, new NetlifyBlobSource(route.storeName), key, route.cache);
}

export const config: Config = {
  path: ['/media/*', '/content/*'],
  cache: 'manual',
};
