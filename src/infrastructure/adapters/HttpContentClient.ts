/** Fetches each document once per page load; a missing document is null, not an error. */
export class HttpContentClient {
  private readonly documents = new Map<string, Promise<unknown | null>>();

  constructor(private readonly contentBaseUrl: string) {}

  get(key: string): Promise<unknown | null> {
    let document = this.documents.get(key);

    if (!document) {
      document = this.fetchDocument(key);
      document.catch(() => this.documents.delete(key));
      this.documents.set(key, document);
    }

    return document;
  }

  private async fetchDocument(key: string): Promise<unknown | null> {
    const response = await fetch(`${this.contentBaseUrl}/${key}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch ${key}: HTTP ${response.status}`);
    }

    return response.json();
  }
}
