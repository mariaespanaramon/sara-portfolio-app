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
}
