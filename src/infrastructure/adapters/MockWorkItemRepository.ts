import type { WorkItem } from '../../application/domain/WorkItem';
import type { WorkItemRepository } from '../ports/repositories';
import type { MediaAsset } from '../../application/domain/MediaAsset';
import { mockLoop, mockVideo, pexelsImage } from './mockMedia';

const WORK_ASPECT = 3 / 2;

function withMedia(media: MediaAsset[], coverIndex = 0): Pick<WorkItem, 'cover' | 'media'> {
  return { cover: media[coverIndex], media };
}

/**
 * Mock data for work items
 *
 * TODO: the sectionId of every item below is provisional. These are placeholder
 * projects, so they were matched to the closest section by category; Sara needs to
 * confirm the real mapping. Keys must match MockSectionRepository.
 */
const MOCK_WORK_ITEMS: WorkItem[] = [
  {
    id: '1',
    title: 'Nostalgic City',
    category: 'Photography',
    description: 'A compelling series of nostalgic black and white photography, capturing fleeting moments of memory and time.\nThe collection features intimate portraiture, timeless urban landscapes, subtle grain textures, with use of chiaroscuro to evoke a sense of history and reflection.',
    year: '2025',
    ...withMedia([
      mockVideo('https://www.w3schools.com/html/mov_bbb.mp4', pexelsImage(325185, WORK_ASPECT)),
    ]),
    tags: ['Photography', 'Black and White', 'Portraiture'],
    sectionId: 'black-and-white',
  },
  {
    id: '2',
    title: 'Playing With Colors',
    category: 'Rendering',
    description: 'A vibrant and hyper-realistic rendering project, exploring the intersection of digital texture and dynamic color fields.\nThe work features complex geometric structures, a rich and saturated color palette, advanced lighting simulations, and a sharp attention to material reflectivity to create an immersive visual impact.',
    year: '2024',
    ...withMedia([
      mockVideo('https://mdn.github.io/shared-assets/videos/flower.mp4', pexelsImage(2088205, WORK_ASPECT)),
    ]),
    tags: ['3D', 'Design'],
    sectionId: '3d-modeling',
  },
  {
    id: '3',
    title: 'A Modern Editorial',
    category: 'Print',
    description: 'A premium editorial design project featuring minimalist layouts, sophisticated typography, and thoughtful content hierarchy.',
    year: '2023',
    ...withMedia([
      pexelsImage(2333332, WORK_ASPECT),
    ]),
    tags: ['Editorial', 'Typography', 'Layout'],
    sectionId: 'exhibitions',
  },
  {
    id: '4',
    title: 'Mobile Application',
    category: 'Digital Product',
    description: 'Native mobile application design focusing on intuitive interactions, smooth animations, and delightful micro-interactions.',
    year: '2023',
    ...withMedia([
      mockVideo('https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4', pexelsImage(1144176, WORK_ASPECT)),
    ]),
    tags: ['Mobile Design', 'UX', 'Prototyping'],
    sectionId: 'awards-and-recognition',
  },
  {
    id: '5',
    title: 'Urban Exploration',
    category: 'Photography Series',
    description: 'A visual journey through modern architecture and urban landscapes. This collection captures the essence of contemporary cities, featuring geometric patterns, bold contrasts, and the interplay between natural and artificial light in metropolitan environments.',
    year: '2024',
    ...withMedia([
      pexelsImage(1105766, WORK_ASPECT),
      pexelsImage(3277808, WORK_ASPECT),
      pexelsImage(325185, WORK_ASPECT),
      pexelsImage(2246476, WORK_ASPECT),
      pexelsImage(2088205, WORK_ASPECT),
      pexelsImage(1105766, WORK_ASPECT),
      pexelsImage(2190283, WORK_ASPECT),
      pexelsImage(1144176, WORK_ASPECT),
      pexelsImage(3889742, WORK_ASPECT),
      pexelsImage(2422588, WORK_ASPECT),
    ]),
    tags: ['Photography', 'Architecture', 'Urban', 'Series'],
    sectionId: 'black-and-white',
  },
  {
    id: '6',
    title: 'Neon Rehearsal',
    category: 'Videoclip',
    description: 'A music video built around a single continuous take, lit entirely with practical neon sources.\nThe piece leans on choreography and in-camera transitions rather than post-production effects.',
    year: '2025',
    ...withMedia([
      mockVideo('https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4', pexelsImage(3889742, WORK_ASPECT)),
    ]),
    tags: ['Videoclip', 'Music', 'Direction'],
    sectionId: 'videoclips',
  },
  {
    id: '7',
    title: 'Soft Bodies',
    category: 'Blender',
    description: 'A study in soft-body simulation, exploring how cloth and gel behave under shifting gravity.\nRendered in Blender with a deliberately limited palette so the motion carries the piece.',
    year: '2025',
    ...withMedia([
      pexelsImage(2246476, WORK_ASPECT),
      mockLoop('https://media.giphy.com/media/3o6nVbF4uoHsV6Vqne/giphy.mp4', pexelsImage(2246476, WORK_ASPECT)),
    ], 1),
    tags: ['3D', 'Blender', 'Simulation'],
    sectionId: '3d-modeling',
  },
];

/**
 * Adapter for WorkItem repository - Mock implementation
 * Simulates an asynchronous API call to fetch work items
 */
export class MockWorkItemRepository implements WorkItemRepository {
  async getAll(): Promise<WorkItem[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return MOCK_WORK_ITEMS;
  }
}
