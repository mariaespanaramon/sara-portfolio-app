import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Hasher, SourceFile, SourceFolder } from '../application/ports.ts';

/** Adapter: SourceFolder over the local file system. Does not descend into subfolders. */
export class LocalSourceFolder implements SourceFolder {
  async list(path: string): Promise<SourceFile[] | null> {
    let entries;
    try {
      entries = await readdir(path, { withFileTypes: true });
    } catch {
      return null;
    }

    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const filePath = join(path, entry.name);
        return {
          name: entry.name,
          path: filePath,
          read: async () => new Uint8Array(await readFile(filePath)),
        };
      });
  }
}

/** Adapter: Hasher over SHA-256, truncated to 16 hex characters (64 bits). */
export class Sha256Hasher implements Hasher {
  digest(...parts: (string | Uint8Array)[]): string {
    const hash = createHash('sha256');
    for (const part of parts) {
      hash.update(part);
    }
    return hash.digest('hex').slice(0, 16);
  }

  async digestFile(salt: string, path: string): Promise<string> {
    const hash = createHash('sha256');
    hash.update(salt);
    for await (const chunk of createReadStream(path)) {
      hash.update(chunk as Buffer);
    }
    return hash.digest('hex').slice(0, 16);
  }
}
