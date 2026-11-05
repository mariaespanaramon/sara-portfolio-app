import type { Config } from '@netlify/edge-functions';
import { NetlifyBlobSource } from './NetlifyBlobSource.ts';
import { serveBlob, type CachePolicy } from './serveBlob.ts';

/**
 * Serves the `media` and `content` blob stores over HTTP.
 *
 * Blobs have no public URL of their own, so this is the site's only way out for
 * them. It also keeps the Blobs token server side, where Netlify injects it.
 *
 *   /media/<key>    → store "media"    (images, videos; content-hashed, immutable)
 *   /content/<key>  → store "content"  (the JSON documents; change without deploys)
 */

interface Route {
  storeName: string;
  cache: CachePolicy;
}

const ROUTES: Record<string, Route> = {
  media: {
    storeName: 'media',
    // Keys change whenever the file does, so a key's bytes never change.
    cache: {
      browser: 'public, max-age=31536000, immutable',
      cdn: 'public, max-age=31536000, immutable',
    },
  },
  content: {
    storeName: 'content',
    // Browsers always revalidate (cheap, thanks to the ETag); the CDN holds a
    // copy for a minute, so an upload shows up within about that long.
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

  // Keys are written by the content scripts and never contain these; anything
  // else is a guess at another key and is not worth a store lookup.
  if (!route || key === '' || key.split('/').some((part) => part === '' || part === '..')) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  return serveBlob(request, new NetlifyBlobSource(route.storeName), key, route.cache);
}

export const config: Config = {
  path: ['/media/*', '/content/*'],
  cache: 'manual',
};
