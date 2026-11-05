import { FieldReader } from './FieldReader.ts';

/** Creating a section needs `title`, `order` and `cover`. */
export interface SectionDraft {
  title?: string;
  order?: number;
  cover?: string;
  hover?: string;
  removeHover: boolean;
  coverAlt?: string;
}

export function parseSectionDraft(value: unknown): SectionDraft {
  const fields = new FieldReader(value);
  return fields.done({
    title: fields.text('title', false),
    order: fields.number('order'),
    cover: fields.text('cover', false),
    hover: fields.text('hover', false),
    removeHover: fields.flag('removeHover'),
    coverAlt: fields.text('coverAlt', false),
  });
}

export type SiteSlot = 'hero' | 'intro';

export function isSiteSlot(value: string | undefined): value is SiteSlot {
  return value === 'hero' || value === 'intro';
}
