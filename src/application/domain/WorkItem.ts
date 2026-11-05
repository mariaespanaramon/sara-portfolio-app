import type { MediaAsset } from './Media';

/**
 * Core domain interface representing a portfolio work item.
 *
 * A project is an ordered list of media pieces, which can mix images, videos and
 * loops freely.
 */
export interface WorkItem {
  id: string;
  title: string;
  category: string;
  description: string;
  year: string;
  tags: string[];
  /**
   * Key of the Section this item belongs to. An item without a section simply
   * does not show up on any section page.
   */
  sectionId?: string;
  /** Stands for the project on section pages. One of `media`, usually the first. */
  cover: MediaAsset;
  /** The project's content, in display order. Never empty. */
  media: MediaAsset[];
}
