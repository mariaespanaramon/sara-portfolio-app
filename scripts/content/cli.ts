/**
 * Command line entry point for managing the site's content in Netlify Blobs.
 * Meant to be driven by the Claude Code skills in .claude/skills, which turn its
 * output into plain language.
 *
 *   npm run --silent content -- add-project --folder <dir> --metadata <file.json> [--dry-run]
 *   npm run --silent content -- list-sections
 *   npm run --silent content -- list-projects
 *
 * Output is always one JSON document on stdout: `{ "ok": true, ... }`, or
 * `{ "ok": false, "error": { "code", "message", "details" } }` with exit code 1.
 */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { AddProject } from './application/AddProject.ts';
import { listProjects, listSections } from './application/listContent.ts';
import { ContentError } from './domain/ContentError.ts';
import { parseProjectDraft } from './domain/ProjectDraft.ts';
import { NetlifyBlobsContentStore, NetlifyBlobsMediaStore } from './infrastructure/NetlifyBlobsStores.ts';
import { LocalSourceFolder, Sha256Hasher } from './infrastructure/localAdapters.ts';
import { resolveNetlifyCredentials } from './infrastructure/netlifyCredentials.ts';
import { SharpImageEncoder } from './infrastructure/SharpImageEncoder.ts';
import { FfmpegVideoEncoder } from './infrastructure/FfmpegVideoEncoder.ts';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function readMetadata(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new ContentError('INVALID_METADATA', `Could not read metadata file ${path}`, {
      problems: [error instanceof Error ? error.message : String(error)],
    });
  }
}

async function run(argv: string[]): Promise<unknown> {
  const [command, ...rest] = argv;
  const { values } = parseArgs({
    args: rest,
    options: {
      folder: { type: 'string' },
      metadata: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
    },
  });

  const credentials = await resolveNetlifyCredentials(PROJECT_ROOT);
  const content = new NetlifyBlobsContentStore(credentials);

  switch (command) {
    case 'add-project': {
      if (!values.folder || !values.metadata) {
        throw new ContentError('INVALID_ARGUMENTS', 'add-project needs --folder and --metadata');
      }

      const addProject = new AddProject({
        folders: new LocalSourceFolder(),
        images: new SharpImageEncoder(),
        videos: new FfmpegVideoEncoder(),
        media: new NetlifyBlobsMediaStore(credentials),
        content,
        hasher: new Sha256Hasher(),
      });

      return addProject.run({
        folder: resolve(values.folder),
        draft: parseProjectDraft(await readMetadata(resolve(values.metadata))),
        dryRun: values['dry-run'],
      });
    }

    case 'list-sections':
      return { sections: await listSections(content) };

    case 'list-projects':
      return { projects: await listProjects(content) };

    default:
      throw new ContentError('INVALID_ARGUMENTS', `Unknown command: ${command ?? '(none)'}`, {
        commands: ['add-project', 'list-sections', 'list-projects'],
      });
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
