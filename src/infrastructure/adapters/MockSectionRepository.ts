import type { Section } from '../../application/domain/Section';
import type { SectionRepository } from '../ports/repositories';

/**
 * Mock data for portfolio sections.
 *
 * TODO: every coverImageUrl / coverVideoUrl / coverGifUrl below is a placeholder.
 * Replace them with Sara's own material. The titles, slugs and order are final.
 *
 * The three cover shapes are all represented on purpose, so the section card can
 * be reviewed against each of them:
 * - image plus video on hover (3D Modeling, Videoclips, Black & White)
 * - image only, no hover playback (Exhibitions)
 * - image plus gif on hover (Awards & Recognition)
 */
const MOCK_SECTIONS: Section[] = [
  {
    id: '1',
    slug: '3d-modeling',
    title: '3D Modeling',
    order: 1,
    coverImageUrl:
      'https://images.pexels.com/photos/2333332/pexels-photo-2333332.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
    coverVideoUrl:
      'https://mdn.github.io/shared-assets/videos/flower.mp4',
  },
  {
    id: '2',
    slug: 'videoclips',
    title: 'Videoclips',
    order: 2,
    coverImageUrl:
      'https://images.pexels.com/photos/3277808/pexels-photo-3277808.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
    coverVideoUrl:
      'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
  },
  {
    id: '3',
    slug: 'black-and-white',
    title: 'Black & White',
    order: 3,
    coverImageUrl:
      'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
    coverVideoUrl:
      'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    id: '4',
    slug: 'exhibitions',
    title: 'Exhibitions',
    order: 4,
    coverImageUrl:
      'https://images.pexels.com/photos/2190283/pexels-photo-2190283.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
  },
  {
    id: '5',
    slug: 'awards-and-recognition',
    title: 'Awards & Recognition',
    order: 5,
    coverImageUrl:
      'https://images.pexels.com/photos/2422588/pexels-photo-2422588.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
    coverGifUrl: 'https://media.giphy.com/media/3o6nVbF4uoHsV6Vqne/giphy.gif',
  },
];

/**
 * Adapter for Section repository - Mock implementation
 * Simulates an asynchronous API call to fetch sections
 *
 * Once content is finalized, replace with the same backing store used for work
 * items (Netlify Blobs) or an actual API endpoint.
 */
export class MockSectionRepository implements SectionRepository {
  async getAll(): Promise<Section[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 400));
    return [...MOCK_SECTIONS].sort((a, b) => a.order - b.order);
  }

  async getBySlug(slug: string): Promise<Section | null> {
    const sections = await this.getAll();
    return sections.find((section) => section.slug === slug) ?? null;
  }
}
