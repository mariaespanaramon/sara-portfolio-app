/**
 * Core domain interface representing a portfolio work item
 */
export interface WorkItem {
  id: string;
  title: string;
  category: string;
  description: string;
  year: string;
  type: 'image' | 'video' | 'gallery';
  imageUrl?: string;
  videoUrl?: string;
  galleryImages?: string[];
  tags: string[];
  /**
   * Slug of the Section this item belongs to.
   *
   * Optional on purpose: the items.json already published to Netlify Blobs does
   * not carry it, and making it required would break that deployment. An item
   * without a section simply does not show up on any section page.
   */
  sectionSlug?: string;
  /** Animated preview, used instead of a still on section pages (3D work). */
  gifUrl?: string;
}
