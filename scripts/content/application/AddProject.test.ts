import { strict as assert } from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { AddProject } from './AddProject.ts';
import { PREVIOUS_WORK_ITEMS_KEY } from './contentDocuments.ts';
import { ContentError } from '../domain/ContentError.ts';
import type { ProjectDraft } from '../domain/ProjectDraft.ts';
import type {
  ContentStore,
  EncodedImage,
  Hasher,
  ImageEncoder,
  ImageInfo,
  MediaStore,
  SourceFile,
  SourceFolder,
  StoredDocument,
  WriteCondition,
} from './ports.ts';

class MemoryMediaStore implements MediaStore {
  readonly blobs = new Map<string, Uint8Array>();
  async has(key: string) {
    return this.blobs.has(key);
  }
  async put(key: string, bytes: Uint8Array) {
    this.blobs.set(key, bytes);
  }
}

class MemoryContentStore implements ContentStore {
  readonly documents = new Map<string, { data: unknown; etag: string }>();
  private version = 0;
  /** Runs once, right before the next conditional write, to simulate a concurrent upload. */
  beforeNextWrite?: () => void;

  async read(key: string): Promise<StoredDocument | null> {
    const document = this.documents.get(key);
    return document ? structuredClone(document) : null;
  }
  async write(key: string, data: unknown, condition: WriteCondition) {
    const hook = this.beforeNextWrite;
    this.beforeNextWrite = undefined;
    hook?.();

    const current = this.documents.get(key);
    const allowed = 'ifMatch' in condition ? current?.etag === condition.ifMatch : !current;
    if (allowed) {
      this.set(key, data);
    }
    return allowed;
  }
  async overwrite(key: string, data: unknown) {
    this.set(key, data);
  }
  set(key: string, data: unknown) {
    this.version += 1;
    this.documents.set(key, { data: structuredClone(data), etag: `v${this.version}` });
  }
}

/** Files whose bytes are their size: `[width, height]` as text. */
function folderOf(files: Record<string, [number, number] | 'garbage'>): SourceFolder {
  return {
    async list(path: string) {
      if (path !== '/project') return null;
      return Object.entries(files).map(
        ([name, size]): SourceFile => ({
          name,
          read: async () => new TextEncoder().encode(size === 'garbage' ? 'garbage' : size.join('x')),
        })
      );
    },
  };
}

class FakeEncoder implements ImageEncoder {
  readonly version = 'fake-v1';
  async inspect(bytes: Uint8Array): Promise<ImageInfo> {
    const text = new TextDecoder().decode(bytes);
    const match = /^(\d+)x(\d+)$/.exec(text);
    if (!match) throw new Error('not an image');
    return { width: Number(match[1]), height: Number(match[2]) };
  }
  async encode(bytes: Uint8Array): Promise<EncodedImage> {
    const { width, height } = await this.inspect(bytes);
    const small = Math.min(width, 640);
    return {
      width,
      height,
      placeholder: 'data:image/webp;base64,AAAA',
      renditions: [
        { width: small, format: 'avif', bytes: new Uint8Array(10) },
        { width: small, format: 'webp', bytes: new Uint8Array(20) },
        { width, format: 'avif', bytes: new Uint8Array(30) },
        { width, format: 'webp', bytes: new Uint8Array(40) },
      ],
    };
  }
}

const hasher: Hasher = {
  digest: (...parts) => parts.map((part) => (typeof part === 'string' ? part : new TextDecoder().decode(part))).join('_'),
};

const draft: ProjectDraft = {
  title: 'Soft Bodies',
  category: 'Blender',
  year: '2025',
  description: 'A study.',
  tags: ['3D'],
  section: '3d-modeling',
};

const sections = {
  version: 1,
  sections: [
    {
      id: '3d-modeling',
      title: '3D Modeling',
      order: 1,
      cover: { kind: 'image', key: 'images/x', width: 10, height: 10, widths: [10], formats: ['avif'] },
    },
  ],
};

async function rejectsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error) => error instanceof ContentError && error.code === code);
}

describe('AddProject', () => {
  let media: MemoryMediaStore;
  let content: MemoryContentStore;

  const useCase = (files: Record<string, [number, number] | 'garbage'>) =>
    new AddProject({ folders: folderOf(files), images: new FakeEncoder(), media, content, hasher });

  beforeEach(() => {
    media = new MemoryMediaStore();
    content = new MemoryContentStore();
    content.set('sections.json', sections);
  });

  it('uploads every rendition and appends the project, in file name order', async () => {
    const result = await useCase({
      '10-detail.png': [2000, 1000],
      '2-wide.jpg': [3000, 2000],
      '.DS_Store': [1, 1],
    }).run({ folder: '/project', draft, dryRun: false });

    assert.equal(result.id, 'soft-bodies');
    assert.deepEqual(result.pieces.map((piece) => piece.file), ['2-wide.jpg', '10-detail.png']);
    assert.equal(media.blobs.size, 8);
    assert.deepEqual(result.upload, { filesUploaded: 8, filesAlreadyStored: 0, bytesUploaded: 200 });

    const stored = content.documents.get('work-items.json')!.data as {
      items: { id: string; coverIndex?: number; media: { key: string; widths: number[] }[] }[];
    };
    assert.equal(stored.items.length, 1);
    assert.equal(stored.items[0].coverIndex, undefined);
    assert.deepEqual(stored.items[0].media[0].widths, [640, 3000]);
    assert.ok(stored.items[0].media[0].key.startsWith('images/fake-v1_'));
  });

  it('touches nothing on a dry run', async () => {
    const result = await useCase({ 'a.jpg': [3000, 2000] }).run({ folder: '/project', draft, dryRun: true });

    assert.equal(result.upload, undefined);
    assert.equal(media.blobs.size, 0);
    assert.equal(content.documents.has('work-items.json'), false);
  });

  it('skips renditions already stored and backs up the replaced document', async () => {
    await useCase({ 'a.jpg': [3000, 2000] }).run({ folder: '/project', draft, dryRun: false });
    const result = await useCase({ 'a.jpg': [3000, 2000] }).run({
      folder: '/project',
      draft: { ...draft, title: 'Soft Bodies Again' },
      dryRun: false,
    });

    assert.deepEqual(result.upload, { filesUploaded: 0, filesAlreadyStored: 4, bytesUploaded: 0 });
    const previous = content.documents.get(PREVIOUS_WORK_ITEMS_KEY)!.data as { items: unknown[] };
    assert.equal(previous.items.length, 1);
  });

  it('honours a chosen cover', async () => {
    await useCase({ 'a.jpg': [3000, 2000], 'b.jpg': [3000, 2000] }).run({
      folder: '/project',
      draft: { ...draft, cover: 'b.jpg' },
      dryRun: false,
    });
    const stored = content.documents.get('work-items.json')!.data as { items: { coverIndex?: number }[] };
    assert.equal(stored.items[0].coverIndex, 1);
  });

  it('keeps a project added concurrently', async () => {
    content.set('work-items.json', { version: 1, items: [] });
    content.beforeNextWrite = () =>
      content.set('work-items.json', {
        version: 1,
        items: [{ id: 'other', title: 'Other', category: '', description: '', year: '2024', tags: [], media: [sections.sections[0].cover] }],
      });

    await useCase({ 'a.jpg': [3000, 2000] }).run({ folder: '/project', draft, dryRun: false });

    const stored = content.documents.get('work-items.json')!.data as { items: { id: string }[] };
    assert.deepEqual(stored.items.map((item) => item.id), ['other', 'soft-bodies']);
  });

  it('warns about small images and missing alt texts', async () => {
    const result = await useCase({ 'a.jpg': [1200, 800] }).run({ folder: '/project', draft, dryRun: true });
    assert.deepEqual(result.warnings.map((warning) => warning.code), ['LOW_RESOLUTION', 'MISSING_ALT']);
  });

  it('rejects what it cannot publish', async () => {
    await rejectsWith(useCase({}).run({ folder: '/missing', draft, dryRun: true }), 'FOLDER_NOT_FOUND');
    await rejectsWith(useCase({ '.DS_Store': [1, 1] }).run({ folder: '/project', draft, dryRun: true }), 'FOLDER_EMPTY');
    await rejectsWith(useCase({ 'a.heic': [1, 1], 'b.mov': [1, 1] }).run({ folder: '/project', draft, dryRun: true }), 'UNSUPPORTED_FILE');
    await rejectsWith(useCase({ 'a.jpg': 'garbage' }).run({ folder: '/project', draft, dryRun: true }), 'UNREADABLE_IMAGE');
    await rejectsWith(
      useCase({ 'a.jpg': [3000, 2000] }).run({ folder: '/project', draft: { ...draft, cover: 'z.jpg' }, dryRun: true }),
      'COVER_NOT_FOUND'
    );
    await rejectsWith(
      useCase({ 'a.jpg': [3000, 2000] }).run({ folder: '/project', draft: { ...draft, section: 'nope' }, dryRun: true }),
      'SECTION_NOT_FOUND'
    );

    await useCase({ 'a.jpg': [3000, 2000] }).run({ folder: '/project', draft, dryRun: false });
    await rejectsWith(
      useCase({ 'a.jpg': [3000, 2000] }).run({ folder: '/project', draft: { ...draft, title: 'soft  bodies' }, dryRun: true }),
      'PROJECT_EXISTS'
    );
  });
});
