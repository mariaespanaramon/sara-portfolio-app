import type { IWorkItemDetail } from './IWorkItemDetail';
import { VideoItemDetail } from './VideoItemDetail';
import { ImageItemDetail } from './ImageItemDetail';
import { GalleryItemDetail } from './GalleryItemDetail';

/**
 * Factory for creating work item detail renderers
 * Maps work item types to their corresponding renderer implementations
 */
export class WorkItemDetailFactory {
  private static renderers: Map<string, IWorkItemDetail> = new Map([
    ['video', new VideoItemDetail()],
    ['image', new ImageItemDetail()],
    ['gallery', new GalleryItemDetail()],
  ]);

  /**
   * Gets the appropriate renderer for a work item type
   * @param type - The work item type
   * @returns The renderer implementation
   * @throws Error if the type is not supported
   */
  static getRenderer(type: string): IWorkItemDetail {
    const renderer = this.renderers.get(type);
    if (!renderer) {
      throw new Error(`Unsupported work item type: ${type}`);
    }
    return renderer;
  }

  /**
   * Registers a new renderer for a work item type
   * Allows extending the system with new types at runtime
   * @param type - The work item type
   * @param renderer - The renderer implementation
   */
  static registerRenderer(type: string, renderer: IWorkItemDetail): void {
    this.renderers.set(type, renderer);
  }
}
