import type { SiteMedia } from '../../application/domain/SiteMedia';
import type { SiteMediaRepository } from '../ports/repositories';
import { CONTENT_KEYS } from '../content/contentSchema';
import { parseSiteDocument } from '../content/contentValidation';
import type { ContentMapper } from '../content/contentMapper';
import type { HttpContentClient } from './HttpContentClient';

/**
 * Adapter for SiteMedia repository, reading the site document served from the
 * content store.
 */
export class HttpSiteMediaRepository implements SiteMediaRepository {
  constructor(
    private readonly client: HttpContentClient,
    private readonly mapper: ContentMapper
  ) {}

  async get(): Promise<SiteMedia> {
    const raw = await this.client.get(CONTENT_KEYS.site);
    return raw === null ? {} : this.mapper.toSiteMedia(parseSiteDocument(raw));
  }
}
