import type { BlobSource } from './BlobSource.ts';

/**
 * Turns a request for a blob into an HTTP response: conditional requests,
 * byte ranges for small files, content types and caching.
 *
 * Large files are streamed through untouched. Edge Functions get 50 ms of CPU per
 * request and share 512 MB of memory, so only blobs up to RANGE_LIMIT_BYTES are
 * ever read into memory, and only to answer a range request.
 */

/**
 * Safari refuses to play an MP4 unless its server answers range requests. The
 * clips that need it (previews and loops) are a few MB at most; HLS segments are
 * requested whole and never need ranges.
 */
export const RANGE_LIMIT_BYTES = 16 * 1024 * 1024;

export interface CachePolicy {
  /** For browsers. */
  browser: string;
  /** For Netlify's CDN only. */
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
  /** Inclusive. */
  end: number;
}

/**
 * Parses a single `bytes=` range. Multiple ranges are not supported, and return
 * null like a malformed header would: the full file is then served instead.
 * Returns 'unsatisfiable' when the range lies outside the file.
 */
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
    // Suffix range: the last N bytes.
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

  const info = await source.info(key);
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
    return new Response(null, { status: 304, headers });
  }

  const rangeHeader = request.headers.get('Range');
  if (rangeHeader && canServeRanges && info.size !== undefined) {
    const range = parseRange(rangeHeader, info.size);

    if (range === 'unsatisfiable') {
      headers.set('Content-Range', `bytes */${info.size}`);
      headers.set('Netlify-CDN-Cache-Control', NOT_CACHED);
      return new Response(null, { status: 416, headers });
    }

    if (range) {
      // The CDN cannot key its cache on Range, so partial responses stay out of it.
      headers.set('Netlify-CDN-Cache-Control', NOT_CACHED);
      headers.set('Content-Range', `bytes ${range.start}-${range.end}/${info.size}`);
      headers.set('Content-Length', String(range.end - range.start + 1));

      if (request.method === 'HEAD') {
        return new Response(null, { status: 206, headers });
      }

      const bytes = await source.bytes(key);
      if (!bytes) {
        return new Response('Not found', { status: 404, headers: { 'Cache-Control': NOT_CACHED } });
      }

      return new Response(bytes.slice(range.start, range.end + 1), { status: 206, headers });
    }
  }

  if (info.size !== undefined) {
    headers.set('Content-Length', String(info.size));
  }

  if (request.method === 'HEAD') {
    return new Response(null, { status: 200, headers });
  }

  const body = await source.stream(key);
  if (!body) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': NOT_CACHED } });
  }

  return new Response(body, { status: 200, headers });
}
