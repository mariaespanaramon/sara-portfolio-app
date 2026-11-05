import type { MediaAsset } from './MediaAsset';

/**
 * Core domain interface representing a portfolio work item
 */
export interface WorkItem {
  id: string;
  title: string;
  category: string;
  description: string;
  year: string;
  tags: string[];
  /** An item without a section does not show up on any section page. */
  sectionId?: string;
  /** One of `media`, usually the first. */
  cover: MediaAsset;
  media: MediaAsset[];
}
