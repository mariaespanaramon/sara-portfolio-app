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
    title: 'Nostalgic City',
    category: 'Photography',
    description: 'A compelling series of nostalgic black and white photography, capturing fleeting moments of memory and time.\nThe collection features intimate portraiture, timeless urban landscapes, subtle grain textures, with use of chiaroscuro to evoke a sense of history and reflection.',
    year: '2025',
    imageUrl: 'https://images.pexels.com/photos/17932022/pexels-photo-17932022.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tags: ['Photography', 'Black and White', 'Portraiture'],
  },
  {
    id: '2',
    title: 'Playing With Colors',
    category: 'Rendering',
    description: 'A vibrant and hyper-realistic rendering project, exploring the intersection of digital texture and dynamic color fields.\nThe work features complex geometric structures, a rich and saturated color palette, advanced lighting simulations, and a sharp attention to material reflectivity to create an immersive visual impact.',
    year: '2024',
    imageUrl: 'https://images.pexels.com/photos/15863496/pexels-photo-15863496.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    tags: ['3D', 'Design'],
  },
  {
    id: '3',
    title: 'A Modern Editorial',
    category: 'Print',
    description: 'A premium editorial design project featuring minimalist layouts, sophisticated typography, and thoughtful content hierarchy.',
    year: '2023',
    imageUrl: 'https://images.pexels.com/photos/2333332/pexels-photo-2333332.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    tags: ['Editorial', 'Typography', 'Layout'],
  },
  {
    id: '4',
    title: 'Mobile Application',
    category: 'Digital Product',
    description: 'Native mobile application design focusing on intuitive interactions, smooth animations, and delightful micro-interactions.',
    year: '2023',
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=800&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    tags: ['Mobile Design', 'UX', 'Prototyping'],
  },
];

/**
 * Adapter for WorkItem repository - Mock implementation
 * Simulates an asynchronous API call to fetch work items
 * 
 * Once content is finalized, replace with actual API endpoint:
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
