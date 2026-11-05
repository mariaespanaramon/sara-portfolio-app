import { RANGE_LIMIT_BYTES } from '../../../netlify/edge-functions/media/serveBlob.ts';

/**
 * Rules that decide how a moving piece is published.
 */

/** Clips up to this long, without sound, are most likely meant as loops. */
const LIKELY_LOOP_MAX_SECONDS = 30;

/**
 * Safari only plays an MP4 when its server answers range requests, and the
 * media Edge Function only does so up to this size. A loop above it would not
 * play there.
 */
export const LOOP_MAX_BYTES = RANGE_LIMIT_BYTES;

/**
 * What transparent pixels become in a loop, since MP4 has no transparency. Must
 * match the site background, `site.bg` in tailwind.config.js, to go unnoticed.
 */
export const LOOP_BACKGROUND = '#ffffff';

/** Below this share of transparent pixels, filling the background changes nothing visible. */
export const TRANSPARENT_PIXEL_SHARE = 0.001;

export type MovingRole = 'video' | 'loop';

/** What to propose for a video file. The person always gets the final say. */
export function suggestRole(durationSeconds: number, hasSound: boolean): MovingRole {
  return !hasSound && durationSeconds <= LIKELY_LOOP_MAX_SECONDS ? 'loop' : 'video';
}
