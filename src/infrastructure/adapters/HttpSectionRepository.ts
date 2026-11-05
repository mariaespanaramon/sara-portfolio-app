import type { Section } from '../../application/domain/Section';
import type { SectionRepository } from '../ports/repositories';
import { CONTENT_KEYS } from '../content/contentSchema';
import { parseSectionsDocument } from '../content/contentValidation';
import type { ContentMapper } from '../content/contentMapper';
import type { HttpContentClient } from './HttpContentClient';

export class HttpSectionRepository implements SectionRepository {
  constructor(
    private readonly client: HttpContentClient,
    private readonly mapper: ContentMapper
  ) {}

  async getAll(): Promise<Section[]> {
    const raw = await this.client.get(CONTENT_KEYS.sections);
    if (raw === null) {
      return [];
    }

    const document = parseSectionsDocument(raw);
    return document.sections
      .map((section) => this.mapper.toSection(section))
      .sort((a, b) => a.order - b.order);
  }

  async getById(id: string): Promise<Section | null> {
    const sections = await this.getAll();
    return sections.find((section) => section.id === id) ?? null;
  }
}
