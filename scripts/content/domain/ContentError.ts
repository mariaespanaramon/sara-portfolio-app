/** Codes are stable so the skills can explain each one; messages are for developers. */
export type ContentErrorCode =
  | 'INVALID_ARGUMENTS'
  | 'INVALID_METADATA'
  | 'FOLDER_NOT_FOUND'
  | 'FOLDER_EMPTY'
  | 'FILE_NOT_FOUND'
  | 'UNSUPPORTED_FILE'
  | 'UNREADABLE_IMAGE'
  | 'UNREADABLE_VIDEO'
  | 'LOOP_TOO_LARGE'
  | 'COVER_NOT_FOUND'
  | 'PROJECT_EXISTS'
  | 'PROJECT_NOT_FOUND'
  | 'NOTHING_TO_UNDO'
  | 'SECTION_NOT_FOUND'
  | 'NOT_LOGGED_IN'
  | 'SITE_NOT_LINKED'
  | 'CONTENT_CHANGED'
  | 'INVALID_STORED_CONTENT';

export class ContentError extends Error {
  readonly code: ContentErrorCode;
  readonly details: Record<string, unknown>;

  constructor(code: ContentErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ContentError';
    this.code = code;
    this.details = details;
  }
}
