import { RANGE_LIMIT_BYTES } from '../../../netlify/edge-functions/media/serveBlob.ts';

const LIKELY_LOOP_MAX_SECONDS = 30;

// Safari needs range requests for MP4, which the Edge Function only serves up to this size.
export const LOOP_MAX_BYTES = RANGE_LIMIT_BYTES;

// MP4 has no transparency. Must match `site.bg` in tailwind.config.js.
export const LOOP_BACKGROUND = '#ffffff';

export const TRANSPARENT_PIXEL_SHARE = 0.001;

export type MovingRole = 'video' | 'loop';

export function suggestRole(durationSeconds: number, hasSound: boolean): MovingRole {
  return !hasSound && durationSeconds <= LIKELY_LOOP_MAX_SECONDS ? 'loop' : 'video';
}
