import { strict as assert } from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import type { StoredWorkItem, WorkItemsDocument } from '../../../src/infrastructure/content/contentSchema.ts';
import { AddMedia } from './AddMedia.ts';
import { AddProject } from './AddProject.ts';
import { cleanMedia } from './cleanMedia.ts';
import { applyChanges, EditProject } from './EditProject.ts';
import { RemoveProject } from './RemoveProject.ts';
import { SetSection } from './SetSection.ts';
import { SetSiteIdentity } from './SetSiteIdentity.ts';
import { UndoLastChange } from './UndoLastChange.ts';
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

const image = (key: string) => ({ kind: 'image' as const, key, width: 10, height: 10, widths: [10], formats: ['avif' as const] });

const sections = {
  version: 1,
  sections: [{ id: '3d-modeling', title: '3D Modeling', order: 1, cover: image('images/section') }],
};

const draft = {
  title: 'Soft Bodies',
  category: 'Blender',
  year: '2025',
  description: '',
  tags: [],
  section: '3d-modeling',
};

function item(media: string[], coverIndex?: number): StoredWorkItem {
  return { id: 'p', title: 'P', category: '', description: '', year: '2025', tags: [], media: media.map(image), coverIndex };
}

describe('content changes', () => {
  let media: MemoryMediaStore;
  let content: MemoryContentStore;
  let videos: FakeVideoEncoder;

  const publishing = (files: Record<string, FakeFile>) => ({
    folders: folderOf(files),
    images: new FakeEncoder(),
    videos,
    media,
    content,
    hasher,
  });

  const workItems = () => content.documents.get('work-items.json')!.data as WorkItemsDocument;

  const ageEverything = () => {
    for (const key of media.uploaded.keys()) media.uploaded.set(key, new Date(0));
  };

  beforeEach(() => {
    media = new MemoryMediaStore();
    content = new MemoryContentStore();
    content.set('sections.json', sections);
    videos = new FakeVideoEncoder();
  });

  it('removes a project, undoes the removal, and redoes it', async () => {
    await new AddProject(publishing({ 'a.jpg': [3000, 2000] })).run({ folder: '/project', draft, dryRun: false });

    await new RemoveProject({ content, media }).run({ id: 'soft-bodies', dryRun: false });
    assert.equal(workItems().items.length, 0);

    const undo = await new UndoLastChange({ content, media }).run({ dryRun: false });
    assert.equal(undo.description, 'remove project "Soft Bodies"');
    assert.equal(workItems().items.length, 1);

    await new UndoLastChange({ content, media }).run({ dryRun: false });
    assert.equal(workItems().items.length, 0);
  });

  it('keeps media an undo may need, and deletes it one change later', async () => {
    await new AddProject(publishing({ 'a.jpg': [3000, 2000] })).run({ folder: '/project', draft, dryRun: false });
    const projectKeys = [...media.blobs.keys()];
    media.blobs.set('unmanaged/thing', new Uint8Array(1));
    ageEverything();

    await new RemoveProject({ content, media }).run({ id: 'soft-bodies', dryRun: false });
    assert.ok(projectKeys.every((key) => media.blobs.has(key)), 'kept for undo');

    await new AddProject(publishing({ 'b.jpg': [2000, 2000] })).run({
      folder: '/project',
      draft: { ...draft, title: 'Other' },
      dryRun: false,
    });
    assert.ok(projectKeys.every((key) => !media.blobs.has(key)), 'deleted once undo can no longer need it');
    assert.ok(media.blobs.has('unmanaged/thing'), 'never touches keys it does not manage');
  });

  it('never deletes media uploaded recently, which an upload in progress may own', async () => {
    media.blobs.set('images/inflight/640.avif', new Uint8Array(1));
    media.uploaded.set('images/inflight/640.avif', new Date());
    const { deleted } = await cleanMedia({ media, content });
    assert.equal(deleted, 0);
  });

  it('refuses to undo when nothing was changed', async () => {
    await rejectsWith(new UndoLastChange({ content, media }).run({ dryRun: false }), 'NOTHING_TO_UNDO');
  });

  it('reorders, removes and relabels pieces, keeping the cover on the same piece', () => {
    const edited = applyChanges(item(['images/a', 'images/b', 'images/c'], 1), {
      order: [3, 2, 1],
      removePieces: [3],
      alts: { '1': 'First' },
    });
    assert.deepEqual(edited.media.map((piece) => piece.key), ['images/b', 'images/a']);
    assert.equal(edited.coverIndex, undefined, 'b was the cover and is now first');
    assert.equal(edited.media[1].kind === 'image' && edited.media[1].alt, 'First');
  });

  it('rejects edits that would leave a project broken', () => {
    const project = item(['images/a', 'images/b']);
    assert.throws(() => applyChanges(project, { order: [1, 1] }));
    assert.throws(() => applyChanges(project, { removePieces: [1, 2] }));
    assert.throws(() => applyChanges(project, { cover: 2, removePieces: [2] }));
  });

  it('refuses a new title that clashes with another project', async () => {
    content.set('work-items.json', {
      version: 1,
      items: [
        { ...item(['images/a']), id: 'one', title: 'One' },
        { ...item(['images/b']), id: 'two', title: 'Two' },
      ],
    });
    await rejectsWith(new EditProject({ content, media }).run({ id: 'two', changes: { title: 'one' }, dryRun: false }), 'PROJECT_EXISTS');
    const renamed = await new EditProject({ content, media }).run({ id: 'two', changes: { title: 'Two Again' }, dryRun: false });
    assert.deepEqual([renamed.path, renamed.pathChanged], ['/work/two-again', true]);
  });

  it('adds pieces at a position and keeps the cover where it was', async () => {
    content.set('work-items.json', { version: 1, items: [item(['images/a', 'images/b'], 1)] });

    await new AddMedia(publishing({ 'new.jpg': [3000, 2000] })).run({
      id: 'p',
      folder: '/project',
      addition: { position: 1 },
      dryRun: false,
    });

    const [project] = workItems().items;
    assert.equal(project.media.length, 3);
    assert.equal(project.media[project.coverIndex ?? 0].key, 'images/b');
  });

  it('creates a section only with title, order and cover, and edits it later', async () => {
    const setSection = () => new SetSection(publishing({ 'cover.jpg': [2000, 3000], 'spin.mp4': '1080x1920/6' }));

    await rejectsWith(setSection().run({ id: 'videoclips', draft: { title: 'Videoclips', removeHover: false }, dryRun: true }), 'INVALID_METADATA');
    await rejectsWith(setSection().run({ id: 'Video Clips', draft: { removeHover: false }, dryRun: true }), 'INVALID_METADATA');

    await setSection().run({
      id: 'videoclips',
      draft: { title: 'Videoclips', order: 2, cover: '/project/cover.jpg', hover: '/project/spin.mp4', removeHover: false },
      dryRun: false,
    });
    await setSection().run({ id: 'videoclips', draft: { title: 'Video Clips', removeHover: false }, dryRun: false });

    const stored = content.documents.get('sections.json')!.data as { sections: { id: string; title: string; hover?: { kind: string } }[] };
    const videoclips = stored.sections.find((section) => section.id === 'videoclips')!;
    assert.equal(videoclips.title, 'Video Clips');
    assert.equal(videoclips.hover?.kind, 'loop', 'a hover video is always a loop');
  });

  it('only takes an image as hero, and keeps a transparent intro when asked', async () => {
    const setSite = () => new SetSiteIdentity(publishing({ 'clip.mp4': '1920x1080/10', 'logo.gif': '800x800+alpha' }));

    await rejectsWith(setSite().run({ slot: 'hero', path: '/project/clip.mp4', keepTransparency: false, dryRun: true }), 'INVALID_METADATA');
    await rejectsWith(setSite().run({ slot: 'hero', path: '/project/missing.jpg', keepTransparency: false, dryRun: true }), 'FILE_NOT_FOUND');

    await setSite().run({ slot: 'intro', path: '/project/logo.gif', keepTransparency: true, dryRun: false });
    const site = content.documents.get('site.json')!.data as { intro: { kind: string; formats: string[] } };
    assert.deepEqual([site.intro.kind, site.intro.formats], ['image', ['webp']]);
  });
});
