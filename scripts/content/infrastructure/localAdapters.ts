import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { Hasher, SourceFile, SourceFolder } from '../application/ports.ts';

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
      .map((entry) => sourceFile(join(path, entry.name)));
  }

  async file(path: string): Promise<SourceFile | null> {
    try {
      return (await stat(path)).isFile() ? sourceFile(path) : null;
    } catch {
      return null;
    }
  }
}

function sourceFile(path: string): SourceFile {
  return {
    name: basename(path),
    path,
    read: async () => new Uint8Array(await readFile(path)),
  };
}

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
