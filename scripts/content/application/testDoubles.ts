import { ContentError } from '../domain/ContentError.ts';
import type {
  AnimationInfo,
  ContentStore,
  EncodedImage,
  EncodedLoop,
  EncodedVideo,
  Hasher,
  ImageEncoder,
  ImageInfo,
  MediaStore,
  OutputFile,
  SourceFile,
  SourceFolder,
  StoredDocument,
  VideoEncoder,
  VideoInfo,
  WriteCondition,
} from './ports.ts';
import { strict as assert } from 'node:assert';

export class MemoryMediaStore implements MediaStore {
  readonly blobs = new Map<string, Uint8Array>();
  readonly uploaded = new Map<string, Date>();
  async has(key: string) {
    return this.blobs.has(key);
  }
  async put(key: string, bytes: Uint8Array) {
    this.blobs.set(key, bytes);
    this.uploaded.set(key, new Date());
  }
  async list() {
    return [...this.blobs.keys()];
  }
  async uploadedAt(key: string) {
    return this.uploaded.get(key) ?? null;
  }
  async delete(key: string) {
    this.blobs.delete(key);
    this.uploaded.delete(key);
  }
}

export class MemoryContentStore implements ContentStore {
  readonly documents = new Map<string, { data: unknown; etag: string }>();
  private version = 0;
  /** Runs once before the next conditional write, to simulate a concurrent upload. */
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

/** A fake file's bytes are its spec: `WxH`, `WxH+alpha` (GIF), `WxH/seconds[+audio]` (video) or `garbage`. */
export type FakeFile = [number, number] | 'garbage' | string;

function fakeFile(name: string, spec: FakeFile): SourceFile {
  const text = Array.isArray(spec) ? spec.join('x') : spec;
  return { name, path: text, read: async () => new TextEncoder().encode(text) };
}

export function folderOf(files: Record<string, FakeFile>): SourceFolder {
  return {
    async list(path: string) {
      if (path !== '/project') return null;
      return Object.entries(files).map(([name, spec]) => fakeFile(name, spec));
    },
    async file(path: string) {
      const name = path.replace('/project/', '');
      return name in files ? fakeFile(name, files[name]) : null;
    },
  };
}

function output(name: string, size: number): OutputFile {
  return { name, contentType: 'video/mp4', size, read: async () => new Uint8Array(size) };
}

export class FakeEncoder implements ImageEncoder {
  readonly version = 'fake-v1';
  async inspect(bytes: Uint8Array): Promise<ImageInfo> {
    const text = new TextDecoder().decode(bytes);
    const match = /^(\d+)x(\d+)/.exec(text);
    if (!match) throw new Error('not an image');
    return { width: Number(match[1]), height: Number(match[2]) };
  }
  async inspectAnimation(bytes: Uint8Array): Promise<AnimationInfo> {
    const info = await this.inspect(bytes);
    return { ...info, isTransparent: new TextDecoder().decode(bytes).endsWith('+alpha') };
  }
  async encodeAnimation(bytes: Uint8Array): Promise<EncodedImage> {
    const { width, height } = await this.inspect(bytes);
    return {
      width,
      height,
      placeholder: 'data:image/webp;base64,AAAA',
      renditions: [{ width, format: 'webp', bytes: new Uint8Array(50) }],
    };
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

export const hasher: Hasher = {
  digest: (...parts) => parts.map((part) => (typeof part === 'string' ? part : new TextDecoder().decode(part))).join('_'),
  digestFile: async (salt, path) => `${salt}_${path}`,
};

export class FakeVideoEncoder implements VideoEncoder {
  readonly version = 'fakevideo-v1';
  disposed = 0;
  loopSize = 1000;

  async inspect(path: string): Promise<VideoInfo> {
    const match = /^(\d+)x(\d+)\/([\d.]+)(\+audio)?$/.exec(path);
    if (!match) throw new Error('not a video');
    return {
      width: Number(match[1]),
      height: Number(match[2]),
      durationSeconds: Number(match[3]),
      hasSound: Boolean(match[4]),
    };
  }
  async encodeVideo(path: string): Promise<EncodedVideo> {
    const info = await this.inspect(path);
    return {
      width: info.width,
      height: info.height,
      durationSeconds: info.durationSeconds,
      hasAudio: info.hasSound,
      stream: [output('master.m3u8', 1), output('v0/index.m3u8', 1), output('v0/seg_000.m4s', 100)],
      preview: output('preview.mp4', 10),
      posterFrame: new TextEncoder().encode(`${info.width}x${info.height}`),
      dispose: async () => {
        this.disposed += 1;
      },
    };
  }
  async encodeLoop(path: string): Promise<EncodedLoop> {
    const match = /^(\d+)x(\d+)/.exec(path)!;
    return {
      width: Number(match[1]),
      height: Number(match[2]),
      clip: output('loop.mp4', this.loopSize),
      posterFrame: new TextEncoder().encode(`${match[1]}x${match[2]}`),
      dispose: async () => {
        this.disposed += 1;
      },
    };
  }
}

export async function rejectsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error) => error instanceof ContentError && error.code === code);
}
