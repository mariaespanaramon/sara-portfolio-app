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
    type: 'video',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tags: ['Photography', 'Black and White', 'Portraiture'],
  },
  {
    id: '2',
    title: 'Playing With Colors',
    category: 'Rendering',
    description: 'A vibrant and hyper-realistic rendering project, exploring the intersection of digital texture and dynamic color fields.\nThe work features complex geometric structures, a rich and saturated color palette, advanced lighting simulations, and a sharp attention to material reflectivity to create an immersive visual impact.',
    year: '2024',
    type: 'video',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    tags: ['3D', 'Design'],
  },
  {
    id: '3',
    title: 'A Modern Editorial',
    category: 'Print',
    description: 'A premium editorial design project featuring minimalist layouts, sophisticated typography, and thoughtful content hierarchy.',
    year: '2023',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/2333332/pexels-photo-2333332.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
    tags: ['Editorial', 'Typography', 'Layout'],
  },
  {
    id: '4',
    title: 'Mobile Application',
    category: 'Digital Product',
    description: 'Native mobile application design focusing on intuitive interactions, smooth animations, and delightful micro-interactions.',
    year: '2023',
    type: 'video',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    tags: ['Mobile Design', 'UX', 'Prototyping'],
  },
  {
    id: '5',
    title: 'Urban Exploration',
    category: 'Photography Series',
    description: 'A visual journey through modern architecture and urban landscapes. This collection captures the essence of contemporary cities, featuring geometric patterns, bold contrasts, and the interplay between natural and artificial light in metropolitan environments.',
    year: '2024',
    type: 'gallery',
    galleryImages: [
      'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
      'https://images.pexels.com/photos/3277808/pexels-photo-3277808.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
      'https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
      'https://images.pexels.com/photos/2246476/pexels-photo-2246476.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
      'https://images.pexels.com/photos/2088205/pexels-photo-2088205.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
      'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
      'https://images.pexels.com/photos/2190283/pexels-photo-2190283.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
      'https://images.pexels.com/photos/1144176/pexels-photo-1144176.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
      'https://images.pexels.com/photos/3889742/pexels-photo-3889742.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
      'https://images.pexels.com/photos/2422588/pexels-photo-2422588.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
    ],
    tags: ['Photography', 'Architecture', 'Urban', 'Series'],
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
