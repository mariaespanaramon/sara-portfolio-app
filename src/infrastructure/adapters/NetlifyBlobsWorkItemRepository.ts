import { getStore } from '@netlify/blobs';
import type { WorkItem } from '../../application/domain/WorkItem';
import type { WorkItemRepository } from '../ports/repositories';
import type { NetlifyBlobsConfig } from '../config/netlify.config';

/**
 * Netlify Blobs adapter for WorkItem repository
 */
export class NetlifyBlobsWorkItemRepository implements WorkItemRepository {
  private readonly storeName: string;
  private readonly config: NetlifyBlobsConfig;

  /**
   * @param config - Netlify Blobs configuration with authentication token
   * @param storeName - Name of the blob store (default: 'work-items')
   */
  constructor(config: NetlifyBlobsConfig, storeName: string = 'work-items') {
    this.config = config;
    this.storeName = storeName;
  }

  /**
   * Retrieves all work items from Netlify Blobs
   * 
   * Expected blob structure:
   * - Store name: 'work-items' (or custom)
   * - Blob key: 'items.json'
   * - Content: JSON array of WorkItem objects
   * 
   * @returns Promise resolving to array of WorkItem objects
   * @throws Error if blob fetch fails or data is invalid
   */
  async getAll(): Promise<WorkItem[]> {
    try {
      const store = getStore({
        name: this.storeName,
        token: this.config.token,
        siteID: this.config.siteId,
      });

      // Fetch the work items blob
      const blob = await store.get('items.json', { type: 'json' });

      if (!blob) {
        console.warn(
          `No work items found in Netlify Blobs store '${this.storeName}'. ` +
          'Returning empty array.'
        );
        return [];
      }

      // Validate that the blob contains an array
      if (!Array.isArray(blob)) {
        throw new Error(
          'Invalid data structure in Netlify Blobs: Expected array of work items'
        );
      }

      // Validate each item has required WorkItem fields
      const validatedItems = this.validateWorkItems(blob);
      
      return validatedItems;
    } catch (error) {
      // Enhanced error handling with context
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      throw new Error(
        `Failed to fetch work items from Netlify Blobs: ${errorMessage}. ` +
        'Please check your VITE_NETLIFY_BLOB_ACCESS token and blob store configuration.'
      );
    }
  }

  /**
   * Validates work items data structure
   * Ensures type safety and data integrity
   * 
   * @private
   */
  private validateWorkItems(items: unknown[]): WorkItem[] {
    return items.map((item, index) => {
      if (!this.isValidWorkItem(item)) {
        throw new Error(
          `Invalid work item at index ${index}: Missing required fields. ` +
          'Expected: id, title, category, description, year, imageUrl, gifUrl, tags'
        );
      }
      return item as WorkItem;
    });
  }

  /**
   * Type guard to validate WorkItem structure
   * 
   * @private
   */
  private isValidWorkItem(item: unknown): item is WorkItem {
    if (typeof item !== 'object' || item === null) {
      return false;
    }

    const workItem = item as Record<string, unknown>;

    return (
      typeof workItem.id === 'string' &&
      typeof workItem.title === 'string' &&
      typeof workItem.category === 'string' &&
      typeof workItem.description === 'string' &&
      typeof workItem.year === 'string' &&
      typeof workItem.imageUrl === 'string' &&
      typeof workItem.gifUrl === 'string' &&
      Array.isArray(workItem.tags) &&
      workItem.tags.every((tag) => typeof tag === 'string')
    );
  }
}
