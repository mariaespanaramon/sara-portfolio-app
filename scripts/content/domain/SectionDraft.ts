import { FieldReader } from './FieldReader.ts';

/**
 * Changes to a section, or a new one. Files are paths on this computer.
 * Creating a section needs `title`, `order` and `cover`.
 */
export interface SectionDraft {
  title?: string;
  /** Position in the home grid, ascending. */
  order?: number;
  /** Image file for the still cover. */
  cover?: string;
  /** GIF or video file that plays while the cover is hovered. */
  hover?: string;
  /** Takes the hover loop away. */
  removeHover: boolean;
  /** Alternative text for the cover image. */
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

/** Which media of the site itself a file is for. */
export type SiteSlot = 'hero' | 'intro';

export function isSiteSlot(value: string | undefined): value is SiteSlot {
  return value === 'hero' || value === 'intro';
}
