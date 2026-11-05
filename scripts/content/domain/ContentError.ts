/**
 * Every failure the content scripts report on purpose.
 *
 * The code is stable and machine readable, so the skills can explain each case
 * to someone without a programming background. The message is for developers.
 */
export type ContentErrorCode =
  | 'INVALID_ARGUMENTS'
  | 'INVALID_METADATA'
  | 'FOLDER_NOT_FOUND'
  | 'FOLDER_EMPTY'
  | 'UNSUPPORTED_FILE'
  | 'UNREADABLE_IMAGE'
  | 'UNREADABLE_VIDEO'
  | 'LOOP_TOO_LARGE'
  | 'COVER_NOT_FOUND'
  | 'PROJECT_EXISTS'
  | 'SECTION_NOT_FOUND'
  | 'NOT_LOGGED_IN'
  | 'SITE_NOT_LINKED'
  | 'CONTENT_CHANGED'
  | 'INVALID_STORED_CONTENT';

export class ContentError extends Error {
  readonly code: ContentErrorCode;
  /** Specifics the skill can quote back, such as the offending file names. */
  readonly details: Record<string, unknown>;

  constructor(code: ContentErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ContentError';
    this.code = code;
    this.details = details;
  }
}
