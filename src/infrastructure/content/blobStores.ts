/**
 * Where content lives in Netlify Blobs. Shared by the media Edge Function, which
 * reads the stores, and the content scripts, which write them, so both always
 * point at the same data.
 *
 * Imported by the Edge Function bundle too, so it must stay free of imports.
 */

export const BLOB_STORES = {
  /** Images and videos, under content-hashed keys. */
  media: 'media',
  /** The JSON documents listed in CONTENT_KEYS. */
  content: 'content',
} as const;

/**
 * Most visitors are expected in Europe, so the stores live in Frankfurt rather
 * than the default us-east-2. Every read and write must pass it: without it the
 * client silently uses the default region and finds the stores empty.
 */
export const BLOBS_REGION = 'eu-central-1';
