import type { SiteMedia } from '../../application/domain/SiteMedia';
import type { SiteMediaRepository } from '../ports/repositories';
import { mockLoop, pexelsImage } from './mockMedia';

/** TODO: placeholders. Replace with Sara's hero image and logo animation. */
const MOCK_SITE_MEDIA: SiteMedia = {
  hero: pexelsImage(28843650, 3 / 2),
  intro: mockLoop('https://media.giphy.com/media/3o6nVbF4uoHsV6Vqne/giphy.mp4', pexelsImage(28843650, 1)),
};

/**
 * Adapter for SiteMedia repository - Mock implementation, used in local
 * development. Production reads the content store through HttpSiteMediaRepository.
 */
export class MockSiteMediaRepository implements SiteMediaRepository {
  async get(): Promise<SiteMedia> {
    return MOCK_SITE_MEDIA;
  }
}
