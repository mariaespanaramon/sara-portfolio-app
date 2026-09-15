/**
 * Derives the URL id a work item is reachable at from its title.
 *
 * Lives in one place on purpose: the links into a project page and the lookup
 * that resolves them back to an item have to agree, and this expression was
 * previously duplicated at both ends.
 */
export function toUrlId(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-');
}
