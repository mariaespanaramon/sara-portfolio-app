import {
  CONTENT_KEYS,
  CONTENT_SCHEMA_VERSION,
  type SectionsDocument,
  type SiteDocument,
  type StoredMedia,
  type WorkItemsDocument,
} from '../../../src/infrastructure/content/contentSchema.ts';
import {
  InvalidContentError,
  parseSectionsDocument,
  parseSiteDocument,
  parseWorkItemsDocument,
} from '../../../src/infrastructure/content/contentValidation.ts';
import { toUrlId } from '../../../src/application/domain/urlId.ts';
import { ContentError } from '../domain/ContentError.ts';
import type { ContentStore } from './ports.ts';

export interface Documents {
  workItems: WorkItemsDocument;
  sections: SectionsDocument;
  site: SiteDocument;
}

export type DocumentName = keyof Documents;

interface DocumentType<T> {
  key: string;
  parse: (value: unknown) => T;
  empty: () => T;
}

const DOCUMENTS: { [Name in DocumentName]: DocumentType<Documents[Name]> } = {
  workItems: {
    key: CONTENT_KEYS.workItems,
    parse: parseWorkItemsDocument,
    empty: () => ({ version: CONTENT_SCHEMA_VERSION, items: [] }),
  },
  sections: {
    key: CONTENT_KEYS.sections,
    parse: parseSectionsDocument,
    empty: () => ({ version: CONTENT_SCHEMA_VERSION, sections: [] }),
  },
  site: {
    key: CONTENT_KEYS.site,
    parse: parseSiteDocument,
    empty: () => ({ version: CONTENT_SCHEMA_VERSION }),
  },
};

export const LAST_CHANGE_KEY = 'last-change.json';

export interface LastChange {
  document: DocumentName;
  description: string;
  changedAt: string;
  before: unknown | null;
}

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

export async function readDocument<Name extends DocumentName>(
  store: ContentStore,
  name: Name
): Promise<Documents[Name] | null> {
  const type = DOCUMENTS[name];
  const stored = await store.read(type.key);
  return stored && parseOrFail(type.parse, stored.data, type.key);
}

export async function readSections(store: ContentStore): Promise<SectionsDocument | null> {
  return readDocument(store, 'sections');
}

export async function readWorkItems(store: ContentStore): Promise<WorkItemsDocument> {
  return (await readDocument(store, 'workItems')) ?? DOCUMENTS.workItems.empty();
}

export async function readLastChange(store: ContentStore): Promise<LastChange | null> {
  const stored = await store.read(LAST_CHANGE_KEY);
  return stored ? (stored.data as LastChange) : null;
}

/** Retries when another change lands first, and records the replaced version for undo. */
export async function updateDocument<Name extends DocumentName>(
  store: ContentStore,
  name: Name,
  description: string,
  change: (document: Documents[Name]) => Documents[Name]
): Promise<Documents[Name]> {
  const type = DOCUMENTS[name];
  const attempts = 3;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const stored = await store.read(type.key);
    const current = stored ? parseOrFail(type.parse, stored.data, type.key) : type.empty();
    const next = parseOrFail(type.parse, change(current), type.key);

    const written = await store.write(
      type.key,
      next,
      stored ? { ifMatch: stored.etag } : { ifNew: true }
    );

    if (written) {
      const record: LastChange = {
        document: name,
        description,
        changedAt: new Date().toISOString(),
        before: stored?.data ?? null,
      };
      await store.overwrite(LAST_CHANGE_KEY, record);
      return next;
    }
  }

  throw new ContentError(
    'CONTENT_CHANGED',
    `${type.key} kept changing during the update; gave up after ${attempts} attempts`
  );
}

export function updateWorkItems(
  store: ContentStore,
  description: string,
  change: (document: WorkItemsDocument) => WorkItemsDocument
): Promise<WorkItemsDocument> {
  return updateDocument(store, 'workItems', description, change);
}

/** The undone version becomes the new last change, so undoing twice redoes. */
export async function restoreDocument(store: ContentStore, change: LastChange): Promise<void> {
  const type = DOCUMENTS[change.document] as DocumentType<unknown>;
  const stored = await store.read(type.key);
  const restored = parseOrFail(type.parse, change.before ?? type.empty(), type.key);

  const written = await store.write(
    type.key,
    restored,
    stored ? { ifMatch: stored.etag } : { ifNew: true }
  );
  if (!written) {
    throw new ContentError('CONTENT_CHANGED', `${type.key} changed while undoing`);
  }

  const record: LastChange = {
    document: change.document,
    description: `undo: ${change.description}`,
    changedAt: new Date().toISOString(),
    before: stored?.data ?? null,
  };
  await store.overwrite(LAST_CHANGE_KEY, record);
}

export function mediaKeysOf(piece: StoredMedia): string[] {
  return piece.kind === 'image' ? [piece.key] : [piece.key, piece.poster.key];
}

/** Project pages are addressed by title, so two titles with the same address would clash. */
export function assertTitleFree(document: WorkItemsDocument, title: string, exceptId?: string): string {
  const id = toUrlId(title);
  const clash = document.items.find(
    (item) => item.id !== exceptId && (item.id === id || toUrlId(item.title) === id)
  );
  if (clash) {
    throw new ContentError('PROJECT_EXISTS', `"${title}" clashes with "${clash.title}"`, {
      id,
      existingTitle: clash.title,
    });
  }
  return id;
}

export function assertSectionExists(document: SectionsDocument | null, section: string): void {
  if (document && !document.sections.some((candidate) => candidate.id === section)) {
    throw new ContentError('SECTION_NOT_FOUND', `No section with id ${section}`, {
      section,
      sections: document.sections.map(({ id, title }) => ({ id, title })),
    });
  }
}

export function findProject(document: WorkItemsDocument, id: string) {
  const item = document.items.find((candidate) => candidate.id === id);
  if (!item) {
    throw new ContentError('PROJECT_NOT_FOUND', `No project with id ${id}`, {
      id,
      projects: document.items.map(({ id: projectId, title }) => ({ id: projectId, title })),
    });
  }
  return item;
}
