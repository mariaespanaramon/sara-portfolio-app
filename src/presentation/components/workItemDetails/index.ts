/**
 * Work Item Details Module
 * 
 * Provides an extensible system for rendering different types of work items.
 * See README.md for documentation on adding new work item types.
 */

export type { IWorkItemDetail } from './IWorkItemDetail';
export { VideoItemDetail } from './VideoItemDetail';
export { ImageItemDetail } from './ImageItemDetail';
export { GalleryItemDetail } from './GalleryItemDetail';
export { WorkItemDetailFactory } from './WorkItemDetailFactory';
