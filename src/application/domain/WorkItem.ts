/**
 * Core domain interface representing a portfolio work item
 */
export interface WorkItem {
  id: string;
  title: string;
  category: string;
  description: string;
  year: string;
  imageUrl: string;
  tags: string[];
}
