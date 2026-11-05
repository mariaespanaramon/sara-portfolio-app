import {
  CONTENT_KEYS,
  CONTENT_SCHEMA_VERSION,
  type SectionsDocument,
  type WorkItemsDocument,
} from '../../../src/infrastructure/content/contentSchema.ts';
import {
  InvalidContentError,
  parseSectionsDocument,
  parseWorkItemsDocument,
} from '../../../src/infrastructure/content/contentValidation.ts';
import { ContentError } from '../domain/ContentError.ts';
import type { ContentStore } from './ports.ts';

/** The work items document as it was before the last change, for undo. */
export const PREVIOUS_WORK_ITEMS_KEY = 'work-items.previous.json';

function parseOrFail<T>(parse: (value: unknown) => T, value: unknown, key: string): T {
  try {
    return parse(value);
  } catch (error) {
    if (error instanceof InvalidContentError) {
      throw new ContentError('INVALID_STORED_CONTENT', `${key} is invalid: ${error.message}`, { key });
    }
    throw error;
  }
}

function emptyWorkItems(): WorkItemsDocument {
  return { version: CONTENT_SCHEMA_VERSION, items: [] };
}

export async function readSections(store: ContentStore): Promise<SectionsDocument | null> {
  const stored = await store.read(CONTENT_KEYS.sections);
  return stored && parseOrFail(parseSectionsDocument, stored.data, CONTENT_KEYS.sections);
}

export async function readWorkItems(store: ContentStore): Promise<WorkItemsDocument> {
  const stored = await store.read(CONTENT_KEYS.workItems);
  return stored
    ? parseOrFail(parseWorkItemsDocument, stored.data, CONTENT_KEYS.workItems)
    : emptyWorkItems();
}

/**
 * Applies a change to the work items document without losing anyone else's.
 *
 * The write only lands if the document is still the version that was read; if
 * another upload got there first, the change is reapplied on top of it a few
 * times before giving up. The version replaced is kept as a backup, and the
 * result is validated with the same rules the site uses before it is written.
 */
export async function updateWorkItems(
  store: ContentStore,
  change: (document: WorkItemsDocument) => WorkItemsDocument
): Promise<WorkItemsDocument> {
  const attempts = 3;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const stored = await store.read(CONTENT_KEYS.workItems);
    const current = stored
      ? parseOrFail(parseWorkItemsDocument, stored.data, CONTENT_KEYS.workItems)
      : emptyWorkItems();

    const next = parseOrFail(parseWorkItemsDocument, change(current), CONTENT_KEYS.workItems);

    const written = await store.write(
      CONTENT_KEYS.workItems,
      next,
      stored ? { ifMatch: stored.etag } : { ifNew: true }
    );

    if (written) {
      if (stored) {
        await store.overwrite(PREVIOUS_WORK_ITEMS_KEY, stored.data);
      }
      return next;
    }
  }

  throw new ContentError(
    'CONTENT_CHANGED',
    `The work items document kept changing during the update; gave up after ${attempts} attempts`
  );
}
