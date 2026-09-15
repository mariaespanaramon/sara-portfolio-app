/**
 * Core domain interface representing a portfolio section.
 *
 * A section groups work items under a theme and is what the home page lists,
 * instead of listing every project directly. Work items point at their section
 * through WorkItem.sectionId.
 */
export interface Section {
  /**
   * Identifier and URL segment, e.g. `3d-modeling`. Lower case, dash separated.
   * Authored rather than generated, so renaming a section's title does not change
   * the address it lives at.
   */
  id: string;
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
