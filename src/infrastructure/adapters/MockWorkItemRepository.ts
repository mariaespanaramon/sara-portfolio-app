import type { WorkItem } from '../../application/domain/WorkItem';
import type { WorkItemRepository } from '../ports/repositories';

/**
 * Mock data for work items
 * In production, this would be replaced with actual API calls to services like:
 * - Contentful
 * - Sanity
 * - Strapi
 * - Custom REST/GraphQL API
 */
const MOCK_WORK_ITEMS: WorkItem[] = [
  {
    id: '1',
    title: 'Brand Identity System',
    category: 'Branding',
    description: 'A comprehensive brand identity system for a leading technology startup, including logo design, color palette, typography, and brand guidelines.',
    year: '2024',
    imageUrl: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&h=800&fit=crop',
    tags: ['Brand Design', 'Identity', 'Visual System'],
  },
  {
    id: '2',
    title: 'E-Commerce Platform',
    category: 'Digital Product',
    description: 'End-to-end design and development of a modern e-commerce platform with seamless user experience and conversion-optimized checkout flow.',
    year: '2024',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop',
    tags: ['UX/UI Design', 'Development', 'E-Commerce'],
  },
  {
    id: '3',
    title: 'Editorial Design',
    category: 'Print',
    description: 'A premium editorial design project featuring minimalist layouts, sophisticated typography, and thoughtful content hierarchy.',
    year: '2023',
    imageUrl: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1200&h=800&fit=crop',
    tags: ['Editorial', 'Typography', 'Layout'],
  },
  {
    id: '4',
    title: 'Mobile Application',
    category: 'Digital Product',
    description: 'Native mobile application design focusing on intuitive interactions, smooth animations, and delightful micro-interactions.',
    year: '2023',
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=800&fit=crop',
    tags: ['Mobile Design', 'UX', 'Prototyping'],
  },
];

/**
 * Adapter for WorkItem repository - Mock implementation
 * Simulates an asynchronous API call to fetch work items
 * 
 * In production, replace with actual API endpoint:
 * const API_KEY = process.env.VITE_CMS_API_KEY;
 * const response = await fetch(`${API_URL}/work-items`, {
 *   headers: { 'Authorization': `Bearer ${API_KEY}` }
 * });
 */
export class MockWorkItemRepository implements WorkItemRepository {
  async getAll(): Promise<WorkItem[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return MOCK_WORK_ITEMS;
  }
}
