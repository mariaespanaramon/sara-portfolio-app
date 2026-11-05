/**
 * Fetches content documents over HTTP, once per page load.
 *
 * Several screens ask for the same document (a section page and a project page
 * both need every work item), so the in-flight request is shared and its result
 * kept. A failed request is forgotten, so the next caller retries.
 */
export class HttpContentClient {
  private readonly documents = new Map<string, Promise<unknown>>();

  /** @param contentBaseUrl - Where the content store is served, without a trailing slash. */
  constructor(private readonly contentBaseUrl: string) {}

  get(key: string): Promise<unknown> {
    let document = this.documents.get(key);

    if (!document) {
      document = this.fetchDocument(key);
      document.catch(() => this.documents.delete(key));
      this.documents.set(key, document);
    }

    return document;
  }

  private async fetchDocument(key: string): Promise<unknown> {
    const response = await fetch(`${this.contentBaseUrl}/${key}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${key}: HTTP ${response.status}`);
    }

    return response.json();
  }
}
