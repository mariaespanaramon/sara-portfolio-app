import type { WorkItem } from '../../application/domain/WorkItem';
import type { WorkItemRepository } from '../ports/repositories';
import { CONTENT_KEYS } from '../content/contentSchema';
import { parseWorkItemsDocument } from '../content/contentValidation';
import type { ContentMapper } from '../content/contentMapper';
import type { HttpContentClient } from './HttpContentClient';

/**
 * Adapter for WorkItem repository, reading the work items document served from
 * the content store.
 */
export class HttpWorkItemRepository implements WorkItemRepository {
  constructor(
    private readonly client: HttpContentClient,
    private readonly mapper: ContentMapper
  ) {}

  async getAll(): Promise<WorkItem[]> {
    const document = parseWorkItemsDocument(await this.client.get(CONTENT_KEYS.workItems));
    return document.items.map((item) => this.mapper.toWorkItem(item));
  }
}
