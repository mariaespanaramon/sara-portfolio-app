import type { WorkItem } from '../../application/domain/WorkItem';
import type { Section } from '../../application/domain/Section';
import type { AboutContent } from '../../application/domain/AboutContent';
import type { ContactDetails } from '../../application/domain/ContactDetails';

/**
 * Port (Interface) for WorkItem repository
 * Defines the contract for data access operations
 */
export interface WorkItemRepository {
  getAll(): Promise<WorkItem[]>;
}

/**
 * Port (Interface) for Section repository
 * Defines the contract for data access operations
 */
export interface SectionRepository {
  getAll(): Promise<Section[]>;
  getBySlug(slug: string): Promise<Section | null>;
}

/**
 * Port (Interface) for AboutContent repository
 * Defines the contract for data access operations
 */
export interface AboutContentRepository {
  get(): Promise<AboutContent>;
}

/**
 * Port (Interface) for ContactDetails repository
 * Defines the contract for data access operations
 */
export interface ContactDetailsRepository {
  get(): Promise<ContactDetails>;
}
