import type { SiteIdentity } from '../../application/domain/SiteIdentity';
import type { SiteIdentityRepository } from '../ports/repositories';
import { CONTENT_KEYS } from '../content/contentSchema';
import { parseSiteDocument } from '../content/contentValidation';
import type { ContentMapper } from '../content/contentMapper';
import type { HttpContentClient } from './HttpContentClient';

export class HttpSiteIdentityRepository implements SiteIdentityRepository {
  constructor(
    private readonly client: HttpContentClient,
    private readonly mapper: ContentMapper
  ) {}

  async get(): Promise<SiteIdentity> {
    const raw = await this.client.get(CONTENT_KEYS.site);
    return raw === null ? {} : this.mapper.toSiteIdentity(parseSiteDocument(raw));
  }
}
