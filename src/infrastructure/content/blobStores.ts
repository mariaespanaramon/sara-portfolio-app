// Shared with the Edge Function bundle and the content scripts: keep it free of imports.

export const BLOB_STORES = {
  media: 'media',
  content: 'content',
} as const;

/** Pass it on every call: without it the client silently reads the empty default region. */
export const BLOBS_REGION = 'eu-central-1';
