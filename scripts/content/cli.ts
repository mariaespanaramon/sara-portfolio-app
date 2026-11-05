/**
 *   npm run --silent content -- <command> [options]
 *
 *   check-setup
 *   list-sections | list-projects
 *   add-project      --folder <dir> --metadata <file.json> [--dry-run]
 *   add-media        --id <project> --folder <dir> --metadata <file.json> [--dry-run]
 *   edit-project     --id <project> --metadata <file.json> [--dry-run]
 *   remove-project   --id <project> [--dry-run]
 *   set-section      --id <section> --metadata <file.json> [--dry-run]
 *   set-site-identity   --slot hero|intro --file <path> [--alt <text>] [--keep-transparency] [--dry-run]
 *   undo-last-change [--dry-run]
 *
 * Prints one JSON document: `{ "ok": true, ... }` or `{ "ok": false, "error": { code, message, details } }`.
 */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { AddMedia } from './application/AddMedia.ts';
import { AddProject } from './application/AddProject.ts';
import { EditProject } from './application/EditProject.ts';
import { listProjects, listSections } from './application/listContent.ts';
import { RemoveProject } from './application/RemoveProject.ts';
import { SetSection } from './application/SetSection.ts';
import { SetSiteIdentity } from './application/SetSiteIdentity.ts';
import { UndoLastChange } from './application/UndoLastChange.ts';
import { ContentError } from './domain/ContentError.ts';
import { parseMediaAddition, parseProjectChanges, parseProjectDraft } from './domain/ProjectDraft.ts';
import { isSiteSlot, parseSectionDraft } from './domain/SectionDraft.ts';
import { checkSetup } from './infrastructure/checkSetup.ts';
import { FfmpegVideoEncoder } from './infrastructure/FfmpegVideoEncoder.ts';
import { LocalSourceFolder, Sha256Hasher } from './infrastructure/localAdapters.ts';
import { NetlifyBlobsContentStore, NetlifyBlobsMediaStore } from './infrastructure/NetlifyBlobsStores.ts';
import { resolveNetlifyCredentials } from './infrastructure/netlifyCredentials.ts';
import { SharpImageEncoder } from './infrastructure/SharpImageEncoder.ts';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const COMMANDS = [
  'check-setup',
  'list-sections',
  'list-projects',
  'add-project',
  'add-media',
  'edit-project',
  'remove-project',
  'set-section',
  'set-site-identity',
  'undo-last-change',
];

async function readMetadata(path: string | undefined): Promise<unknown> {
  if (!path) {
    throw new ContentError('INVALID_ARGUMENTS', 'This command needs --metadata');
  }
  try {
    return JSON.parse(await readFile(resolve(path), 'utf8'));
  } catch (error) {
    throw new ContentError('INVALID_METADATA', `Could not read metadata file ${path}`, {
      problems: [error instanceof Error ? error.message : String(error)],
    });
  }
}

function required(value: string | undefined, option: string): string {
  if (!value) {
    throw new ContentError('INVALID_ARGUMENTS', `This command needs --${option}`);
  }
  return value;
}

async function connect() {
  const credentials = await resolveNetlifyCredentials(PROJECT_ROOT);
  const content = new NetlifyBlobsContentStore(credentials);
  const media = new NetlifyBlobsMediaStore(credentials);
  return {
    content,
    media,
    publishing: {
      folders: new LocalSourceFolder(),
      images: new SharpImageEncoder(),
      videos: new FfmpegVideoEncoder(),
      media,
      content,
      hasher: new Sha256Hasher(),
    },
  };
}

async function run(argv: string[]): Promise<unknown> {
  const [command, ...rest] = argv;
  const { values } = parseArgs({
    args: rest,
    options: {
      id: { type: 'string' },
      folder: { type: 'string' },
      metadata: { type: 'string' },
      file: { type: 'string' },
      slot: { type: 'string' },
      alt: { type: 'string' },
      'keep-transparency': { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
    },
  });
  const dryRun = values['dry-run'];

  if (command === 'check-setup') {
    return checkSetup(PROJECT_ROOT);
  }
  if (!command || !COMMANDS.includes(command)) {
    throw new ContentError('INVALID_ARGUMENTS', `Unknown command: ${command ?? '(none)'}`, { commands: COMMANDS });
  }

  const { content, media, publishing } = await connect();

  switch (command) {
    case 'list-sections':
      return { sections: await listSections(content) };

    case 'list-projects':
      return { projects: await listProjects(content) };

    case 'add-project':
      return new AddProject(publishing).run({
        folder: resolve(required(values.folder, 'folder')),
        draft: parseProjectDraft(await readMetadata(values.metadata)),
        dryRun,
      });

    case 'add-media':
      return new AddMedia(publishing).run({
        id: required(values.id, 'id'),
        folder: resolve(required(values.folder, 'folder')),
        addition: parseMediaAddition(await readMetadata(values.metadata)),
        dryRun,
      });

    case 'edit-project':
      return new EditProject({ content, media }).run({
        id: required(values.id, 'id'),
        changes: parseProjectChanges(await readMetadata(values.metadata)),
        dryRun,
      });

    case 'remove-project':
      return new RemoveProject({ content, media }).run({ id: required(values.id, 'id'), dryRun });

    case 'set-section':
      return new SetSection(publishing).run({
        id: required(values.id, 'id'),
        draft: parseSectionDraft(await readMetadata(values.metadata)),
        dryRun,
      });

    case 'set-site-identity': {
      const slot = values.slot;
      if (!isSiteSlot(slot)) {
        throw new ContentError('INVALID_ARGUMENTS', 'set-site-identity needs --slot hero or --slot intro');
      }
      return new SetSiteIdentity(publishing).run({
        slot,
        path: resolve(required(values.file, 'file')),
        alt: values.alt,
        keepTransparency: values['keep-transparency'],
        dryRun,
      });
    }

    case 'undo-last-change':
      return new UndoLastChange({ content, media }).run({ dryRun });
  }
}

try {
  const result = await run(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify({ ok: true, ...(result as object) }, null, 2)}\n`);
} catch (error) {
  const body =
    error instanceof ContentError
      ? { code: error.code, message: error.message, details: error.details }
      : {
          code: 'UNEXPECTED',
          message: error instanceof Error ? error.message : String(error),
          details: {},
        };
  process.stdout.write(`${JSON.stringify({ ok: false, error: body }, null, 2)}\n`);
  process.exitCode = 1;
}
