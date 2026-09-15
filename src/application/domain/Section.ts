/**
 * Core domain interface representing a portfolio section.
 *
 * A section groups work items under a theme and is what the home page lists,
 * instead of listing every project directly. Work items point at their section
 * through WorkItem.sectionSlug.
 */
export interface Section {
  id: string;
  /** URL segment used by the /section/:slug route. Lower case, dash separated. */
  slug: string;
  title: string;
  /** Position in the home grid, ascending. */
  order: number;
  /** Static image shown at rest. */
  coverImageUrl: string;
  /** Plays while the cover is hovered. Takes precedence over coverGifUrl. */
  coverVideoUrl?: string;
  /** Alternative to coverVideoUrl for the hover state. */
  coverGifUrl?: string;
}
