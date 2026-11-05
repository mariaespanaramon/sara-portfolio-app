/**
 * Shape of the content documents stored in the `content` blob store.
 *
 * This is the persisted format, not the domain model: media are referenced by
 * key and their URLs are derived (see contentMapper.ts). Keeping it compact and
 * URL-free means the delivery path can change without rewriting stored content.
 *
 * The content scripts write these documents and the HTTP adapters read them, so
 * both sides import the types from here. The scripts run on Node without a build
 * step, so this file and contentValidation.ts must only use erasable TypeScript
 * and import with explicit `.ts` extensions.
 */

export const CONTENT_SCHEMA_VERSION = 1;

export type StoredImageFormat = 'avif' | 'webp';

export interface StoredImage {
  kind: 'image';
  /** Key prefix in the media store. Renditions live at `${key}/${width}.${format}`. */
  key: string;
  width: number;
  height: number;
  /** Widths that were generated, ascending. */
  widths: number[];
  formats: StoredImageFormat[];
  placeholder?: string;
  alt?: string;
}

export interface StoredVideo {
  kind: 'video';
  /** Key prefix. Holds `master.m3u8` and its renditions, plus `preview.mp4` if any. */
  key: string;
  width: number;
  height: number;
  poster: StoredImage;
  hasPreview: boolean;
  durationSeconds: number;
  hasAudio: boolean;
}

export interface StoredLoop {
  kind: 'loop';
  /** Key prefix. Holds `loop.mp4`. */
  key: string;
  width: number;
  height: number;
  poster: StoredImage;
}

export type StoredMedia = StoredImage | StoredVideo | StoredLoop;

export interface StoredWorkItem {
  id: string;
  title: string;
  category: string;
  description: string;
  year: string;
  tags: string[];
  sectionId?: string;
  /** Index into `media` of the piece used as cover. Defaults to 0. */
  coverIndex?: number;
  media: StoredMedia[];
}

export interface StoredSection {
  id: string;
  title: string;
  order: number;
  cover: StoredImage;
  hover?: StoredLoop;
}

/** Media that belong to the site itself rather than to a project or section. */
export interface SiteDocument {
  version: typeof CONTENT_SCHEMA_VERSION;
  /** Background of the home page hero. */
  hero?: StoredImage;
  /**
   * The intro splash animation: a loop, or an animated image when it needs
   * transparency, as a logo usually does.
   */
  intro?: StoredLoop | StoredImage;
}

export interface WorkItemsDocument {
  version: typeof CONTENT_SCHEMA_VERSION;
  items: StoredWorkItem[];
}

export interface SectionsDocument {
  version: typeof CONTENT_SCHEMA_VERSION;
  sections: StoredSection[];
}

/** Keys of the documents inside the `content` store. */
export const CONTENT_KEYS = {
  workItems: 'work-items.json',
  sections: 'sections.json',
  site: 'site.json',
} as const;
