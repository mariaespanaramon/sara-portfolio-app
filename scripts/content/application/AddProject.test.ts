import { strict as assert } from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { AddProject } from './AddProject.ts';
import { LAST_CHANGE_KEY } from './contentDocuments.ts';
import type { ProjectDraft } from '../domain/ProjectDraft.ts';
import {
  FakeEncoder,
  FakeVideoEncoder,
  folderOf,
  hasher,
  MemoryContentStore,
  MemoryMediaStore,
  rejectsWith,
  type FakeFile,
} from './testDoubles.ts';

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

describe('AddProject', () => {
  let media: MemoryMediaStore;
  let content: MemoryContentStore;
  let videos: FakeVideoEncoder;

  const useCase = (files: Record<string, FakeFile>) =>
    new AddProject({ folders: folderOf(files), images: new FakeEncoder(), videos, media, content, hasher });

  beforeEach(() => {
    media = new MemoryMediaStore();
    content = new MemoryContentStore();
    content.set('sections.json', sections);
    videos = new FakeVideoEncoder();
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

  it('skips renditions already stored and records the replaced document', async () => {
    await useCase({ 'a.jpg': [3000, 2000] }).run({ folder: '/project', draft, dryRun: false });
    const result = await useCase({ 'a.jpg': [3000, 2000] }).run({
      folder: '/project',
      draft: { ...draft, title: 'Soft Bodies Again' },
      dryRun: false,
    });

    assert.deepEqual(result.upload, { filesUploaded: 0, filesAlreadyStored: 4, bytesUploaded: 0 });
    const lastChange = content.documents.get(LAST_CHANGE_KEY)!.data as { description: string; before: { items: unknown[] } };
    assert.equal(lastChange.before.items.length, 1);
    assert.equal(lastChange.description, 'add project "Soft Bodies Again"');
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
    await rejectsWith(useCase({ 'a.heic': [1, 1], 'b.psd': [1, 1] }).run({ folder: '/project', draft, dryRun: true }), 'UNSUPPORTED_FILE');
    await rejectsWith(useCase({ 'a.mp4': 'garbage' }).run({ folder: '/project', draft, dryRun: true }), 'UNREADABLE_VIDEO');
    await rejectsWith(
      useCase({ 'a.jpg': [3000, 2000] }).run({ folder: '/project', draft: { ...draft, loops: ['a.jpg'] }, dryRun: true }),
      'INVALID_METADATA'
    );
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

  it('publishes a video as a stream with poster and preview, playlists last', async () => {
    const order: string[] = [];
    const put = media.put.bind(media);
    media.put = async (key: string, bytes: Uint8Array) => {
      order.push(key);
      return put(key, bytes);
    };

    const result = await useCase({ 'film.mp4': '1920x1080/90+audio' }).run({ folder: '/project', draft, dryRun: false });

    assert.equal(result.pieces[0].role, 'video');
    assert.equal(result.pieces[0].suggestedRole, 'video');
    const streamKeys = order.filter((key) => key.startsWith('videos/'));
    assert.ok(streamKeys.indexOf('videos/fakevideo-v1:video_1920x1080/90+audio/v0/seg_000.m4s') < streamKeys.indexOf('videos/fakevideo-v1:video_1920x1080/90+audio/master.m3u8'));
    assert.ok(order.some((key) => key.endsWith('/preview.mp4')));
    assert.equal(videos.disposed, 1);

    const stored = content.documents.get('work-items.json')!.data as { items: { media: { kind: string; hasAudio: boolean; poster: { kind: string } }[] }[] };
    assert.equal(stored.items[0].media[0].kind, 'video');
    assert.equal(stored.items[0].media[0].hasAudio, true);
    assert.equal(stored.items[0].media[0].poster.kind, 'image');
  });

  it('suggests a loop for short silent clips and publishes the ones marked as loops', async () => {
    const files = { 'spin.mp4': '1920x1080/8', 'talk.mp4': '1920x1080/8+audio' };
    const planned = await useCase(files).run({ folder: '/project', draft, dryRun: true });
    assert.deepEqual(planned.pieces.map((piece) => piece.suggestedRole), ['loop', 'video']);

    await useCase(files).run({ folder: '/project', draft: { ...draft, loops: ['spin.mp4'] }, dryRun: false });
    const stored = content.documents.get('work-items.json')!.data as { items: { media: { kind: string }[] }[] };
    assert.deepEqual(stored.items[0].media.map((piece) => piece.kind), ['loop', 'video']);
    assert.ok(media.blobs.has('loops/fakevideo-v1:loop_1920x1080/8/loop.mp4'));
  });

  it('turns GIFs into loops, filling transparency unless asked to keep it', async () => {
    const files = { 'logo.gif': '800x800+alpha', 'spin.gif': '800x800' };
    const filled = await useCase(files).run({ folder: '/project', draft, dryRun: true });
    assert.deepEqual(filled.pieces.map((piece) => piece.role), ['loop', 'loop']);
    assert.ok(filled.warnings.some((warning) => warning.code === 'TRANSPARENCY_FILLED' && warning.file === 'logo.gif'));

    await useCase(files).run({ folder: '/project', draft: { ...draft, keepTransparency: ['logo.gif'] }, dryRun: false });
    const stored = content.documents.get('work-items.json')!.data as { items: { media: { kind: string; formats?: string[] }[] }[] };
    assert.deepEqual(stored.items[0].media.map((piece) => piece.kind), ['image', 'loop']);
    assert.deepEqual(stored.items[0].media[0].formats, ['webp']);
  });

  it('refuses a loop too large to play on Safari, without listing the project', async () => {
    videos.loopSize = 17 * 1024 * 1024;
    await rejectsWith(useCase({ 'spin.gif': '800x800' }).run({ folder: '/project', draft, dryRun: false }), 'LOOP_TOO_LARGE');
    assert.equal(content.documents.has('work-items.json'), false);
    assert.equal(videos.disposed, 1);
  });
});
