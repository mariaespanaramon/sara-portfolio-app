import type { IWorkItemCard } from './IWorkItemCard';
import { VideoItemCard } from './VideoItemCard';
import { ImageItemCard } from './ImageItemCard';
import { GalleryItemCard } from './GalleryItemCard';

/**
 * Factory for creating work item card renderers
 * Maps work item types to their corresponding renderer implementations
 */
export class WorkItemCardFactory {
  private static renderers: Map<string, IWorkItemCard> = new Map([
    ['video', new VideoItemCard()],
    ['image', new ImageItemCard()],
    ['gallery', new GalleryItemCard()],
  ]);

  /**
   * Gets the appropriate renderer for a work item type
   * @param type - The work item type
   * @returns The renderer implementation
   * @throws Error if the type is not supported
   */
  static getRenderer(type: string): IWorkItemCard {
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
  static registerRenderer(type: string, renderer: IWorkItemCard): void {
    this.renderers.set(type, renderer);
  }
}
