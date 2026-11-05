import type { BlobSource } from './BlobSource.ts';

// Safari only plays MP4 with range support; ranges are buffered in memory, so only small files get them.
export const RANGE_LIMIT_BYTES = 16 * 1024 * 1024;

export interface CachePolicy {
  browser: string;
  cdn: string;
}

const CONTENT_TYPES: Record<string, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  mp4: 'video/mp4',
  m4s: 'video/iso.segment',
  m3u8: 'application/vnd.apple.mpegurl',
  json: 'application/json; charset=utf-8',
};

function contentTypeFor(key: string, stored?: string): string {
  if (stored) {
    return stored;
  }

  const extension = key.split('.').pop()?.toLowerCase() ?? '';
  return CONTENT_TYPES[extension] ?? 'application/octet-stream';
}

function matchesEtag(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) {
    return false;
  }

  const strip = (tag: string) => tag.trim().replace(/^W\//, '');
  return ifNoneMatch.split(',').some((tag) => tag.trim() === '*' || strip(tag) === strip(etag));
}

interface ByteRange {
  start: number;
  end: number;
}

/** Single ranges only; anything else serves the full file. */
function parseRange(header: string, size: number): ByteRange | 'unsatisfiable' | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) {
    return null;
  }

  const [, startText, endText] = match;

  if (startText === '' && endText === '') {
    return null;
  }

  if (startText === '') {
    const length = Number(endText);
    if (length === 0) {
      return 'unsatisfiable';
    }
    return { start: Math.max(size - length, 0), end: size - 1 };
  }

  const start = Number(startText);
  const end = endText === '' ? size - 1 : Math.min(Number(endText), size - 1);

  if (start >= size || start > end) {
    return 'unsatisfiable';
  }

  return { start, end };
}

const NOT_CACHED = 'no-store';

export async function serveBlob(
  request: Request,
  source: BlobSource,
  key: string,
  cache: CachePolicy
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD', 'Cache-Control': NOT_CACHED },
    });
  }

  const opened = request.method === 'HEAD' ? null : await source.open(key);
  const info = opened?.info ?? (request.method === 'HEAD' ? await source.info(key) : null);
  if (!info) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': NOT_CACHED } });
  }

  const canServeRanges = info.size !== undefined && info.size <= RANGE_LIMIT_BYTES;

  const headers = new Headers({
    'Content-Type': contentTypeFor(key, info.contentType),
    ETag: info.etag,
    'Cache-Control': cache.browser,
    'Netlify-CDN-Cache-Control': cache.cdn,
    'Accept-Ranges': canServeRanges ? 'bytes' : 'none',
  });

  if (matchesEtag(request.headers.get('If-None-Match'), info.etag)) {
    await opened?.body.cancel();
    return new Response(null, { status: 304, headers });
  }

  const rangeHeader = request.headers.get('Range');
  if (rangeHeader && canServeRanges && info.size !== undefined) {
    const range = parseRange(rangeHeader, info.size);

    if (range === 'unsatisfiable') {
      await opened?.body.cancel();
      headers.set('Content-Range', `bytes */${info.size}`);
      headers.set('Netlify-CDN-Cache-Control', NOT_CACHED);
      return new Response(null, { status: 416, headers });
    }

    if (range) {
      // The CDN cannot vary on Range, so partial responses stay out of it.
      headers.set('Netlify-CDN-Cache-Control', NOT_CACHED);
      headers.set('Content-Range', `bytes ${range.start}-${range.end}/${info.size}`);
      headers.set('Content-Length', String(range.end - range.start + 1));

      if (!opened) {
        return new Response(null, { status: 206, headers });
      }

      const bytes = await new Response(opened.body).arrayBuffer();
      return new Response(bytes.slice(range.start, range.end + 1), { status: 206, headers });
    }
  }

  if (info.size !== undefined) {
    headers.set('Content-Length', String(info.size));
  }

  return new Response(opened?.body ?? null, { status: 200, headers });
}
