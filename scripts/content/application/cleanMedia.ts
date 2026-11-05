import type { StoredMedia } from '../../../src/infrastructure/content/contentSchema.ts';
import { parseSectionsDocument, parseSiteDocument, parseWorkItemsDocument } from '../../../src/infrastructure/content/contentValidation.ts';
import { mediaKeysOf, readDocument, readLastChange, type Documents } from './contentDocuments.ts';
import type { ContentStore, MediaStore } from './ports.ts';

// An upload in progress stores its files before the document that references them.
const GRACE_HOURS = 24;

const MANAGED_PREFIXES = /^(images|videos|loops)\/[^/]+\//;

function mediaOf(documents: Partial<Documents>): StoredMedia[] {
  const { workItems, sections, site } = documents;
  return [
    ...(workItems?.items.flatMap((item) => item.media) ?? []),
    ...(sections?.sections.flatMap((section) => [section.cover, ...(section.hover ? [section.hover] : [])]) ?? []),
    ...(site ? [site.hero, site.intro].filter((piece): piece is NonNullable<typeof piece> => Boolean(piece)) : []),
  ];
}

const PARSERS = {
  workItems: parseWorkItemsDocument,
  sections: parseSectionsDocument,
  site: parseSiteDocument,
} as const;

/** Keeps what the last change replaced too, since undo may bring it back. */
export async function cleanMedia({ media, content }: { media: MediaStore; content: ContentStore }) {
  const [workItems, sections, site, lastChange] = await Promise.all([
    readDocument(content, 'workItems'),
    readDocument(content, 'sections'),
    readDocument(content, 'site'),
    readLastChange(content),
  ]);

  const current: Partial<Documents> = {
    workItems: workItems ?? undefined,
    sections: sections ?? undefined,
    site: site ?? undefined,
  };
  const previous: Partial<Documents> = {};
  if (lastChange?.before) {
    // Rather keep everything than risk deleting what an unreadable backup needs.
    try {
      Object.assign(previous, { [lastChange.document]: PARSERS[lastChange.document](lastChange.before) });
    } catch {
      return { deleted: 0 };
    }
  }

  const referenced = new Set([...mediaOf(current), ...mediaOf(previous)].flatMap(mediaKeysOf));
  const cutoff = Date.now() - GRACE_HOURS * 60 * 60 * 1000;
  let deleted = 0;

  for (const key of await media.list()) {
    const prefix = MANAGED_PREFIXES.exec(key)?.[0].slice(0, -1);
    if (!prefix || referenced.has(prefix)) {
      continue;
    }

    const uploadedAt = await media.uploadedAt(key);
    if (uploadedAt === null || uploadedAt.getTime() > cutoff) {
      continue;
    }

    await media.delete(key);
    deleted += 1;
  }

  return { deleted };
}
