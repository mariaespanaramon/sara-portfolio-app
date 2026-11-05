// Node scripts import this file and contentValidation.ts unbuilt: erasable TypeScript and `.ts` imports only.

export const CONTENT_SCHEMA_VERSION = 1;

export type StoredImageFormat = 'avif' | 'webp';

export interface StoredImage {
  kind: 'image';
  /** Renditions live at `${key}/${width}.${format}`. */
  key: string;
  width: number;
  height: number;
  widths: number[];
  formats: StoredImageFormat[];
  placeholder?: string;
  alt?: string;
}

export interface StoredVideo {
  kind: 'video';
  /** Holds `master.m3u8`, its renditions and `preview.mp4`. */
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
  /** Holds `loop.mp4`. */
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
  /** Defaults to 0. */
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

export interface SiteDocument {
  version: typeof CONTENT_SCHEMA_VERSION;
  hero?: StoredImage;
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

export const CONTENT_KEYS = {
  workItems: 'work-items.json',
  sections: 'sections.json',
  site: 'site.json',
} as const;
