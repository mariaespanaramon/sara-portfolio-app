import type { SiteIdentity } from '../../application/domain/SiteIdentity';
import type { SiteIdentityRepository } from '../ports/repositories';
import { mockLoop, pexelsImage } from './mockMedia';

/** TODO: placeholders. Replace with Sara's hero image and logo animation. */
const MOCK_SITE_IDENTITY: SiteIdentity = {
  hero: pexelsImage(28843650, 3 / 2),
  intro: mockLoop('https://media.giphy.com/media/3o6nVbF4uoHsV6Vqne/giphy.mp4', pexelsImage(28843650, 1)),
};

export class MockSiteIdentityRepository implements SiteIdentityRepository {
  async get(): Promise<SiteIdentity> {
    return MOCK_SITE_IDENTITY;
  }
}
