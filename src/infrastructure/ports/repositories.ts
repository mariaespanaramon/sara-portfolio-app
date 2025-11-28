import type { WorkItem } from '../../application/domain/WorkItem';
import type { AboutContent } from '../../application/domain/AboutContent';

/**
 * Port (Interface) for WorkItem repository
 * Defines the contract for data access operations
 */
export interface WorkItemRepository {
  getAll(): Promise<WorkItem[]>;
}

/**
 * Port (Interface) for AboutContent repository
 * Defines the contract for data access operations
 */
export interface AboutContentRepository {
  get(): Promise<AboutContent>;
}
