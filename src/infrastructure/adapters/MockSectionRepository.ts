import type { Section } from '../../application/domain/Section';
import type { SectionRepository } from '../ports/repositories';
import { mockLoop, pexelsImage } from './mockMedia';

const SECTION_ASPECT = 3 / 4;

/**
 * Mock data for portfolio sections.
 *
 * TODO: every cover and hover below is a placeholder. Replace them with Sara's own
 * material. The titles, ids and order are final.
 *
 * Both cover shapes are represented on purpose, so the section card can be
 * reviewed against each of them:
 * - image plus a loop on hover (3D Modeling, Videoclips, Black & White, Awards)
 * - image only, no hover playback (Exhibitions)
 */
const MOCK_SECTIONS: Section[] = [
  {
    id: '3d-modeling',
    title: '3D Modeling',
    order: 1,
    cover: pexelsImage(2333332, SECTION_ASPECT),
    hover: mockLoop(
      'https://mdn.github.io/shared-assets/videos/flower.mp4',
      pexelsImage(2333332, SECTION_ASPECT)
    ),
  },
  {
    id: 'videoclips',
    title: 'Videoclips',
    order: 2,
    cover: pexelsImage(3277808, SECTION_ASPECT),
    hover: mockLoop(
      'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
      pexelsImage(3277808, SECTION_ASPECT)
    ),
  },
  {
    id: 'black-and-white',
    title: 'Black & White',
    order: 3,
    cover: pexelsImage(1105766, SECTION_ASPECT),
    hover: mockLoop(
      'https://www.w3schools.com/html/mov_bbb.mp4',
      pexelsImage(1105766, SECTION_ASPECT)
    ),
  },
  {
    id: 'exhibitions',
    title: 'Exhibitions',
    order: 4,
    cover: pexelsImage(2190283, SECTION_ASPECT),
  },
  {
    id: 'awards-and-recognition',
    title: 'Awards & Recognition',
    order: 5,
    cover: pexelsImage(2422588, SECTION_ASPECT),
    hover: mockLoop(
      'https://media.giphy.com/media/3o6nVbF4uoHsV6Vqne/giphy.mp4',
      pexelsImage(2422588, SECTION_ASPECT)
    ),
  },
];

/**
 * Adapter for Section repository - Mock implementation, used in local development.
 * Production reads the content store through HttpSectionRepository.
 * Simulates an asynchronous API call to fetch sections
 */
export class MockSectionRepository implements SectionRepository {
  async getAll(): Promise<Section[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 400));
    return [...MOCK_SECTIONS].sort((a, b) => a.order - b.order);
  }

  async getById(id: string): Promise<Section | null> {
    const sections = await this.getAll();
    return sections.find((section) => section.id === id) ?? null;
  }
}
