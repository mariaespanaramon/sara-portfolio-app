import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ContentError } from '../domain/ContentError.ts';
import { NetlifyBlobsContentStore } from './NetlifyBlobsStores.ts';
import { resolveNetlifyCredentials } from './netlifyCredentials.ts';

const run = promisify(execFile);

// Node runs TypeScript directly from 22.18.
const MIN_NODE = [22, 18];

export type CheckName = 'node' | 'ffmpeg' | 'ffprobe' | 'sharp' | 'netlify-link' | 'netlify-login' | 'blobs';

export interface Check {
  name: CheckName;
  ok: boolean;
  detail: string;
}

async function tool(name: 'ffmpeg' | 'ffprobe'): Promise<Check> {
  try {
    const { stdout } = await run(name, ['-version']);
    return { name, ok: true, detail: stdout.split('\n')[0] };
  } catch {
    return { name, ok: false, detail: 'not installed' };
  }
}

/** Reports every check rather than stopping at the first failure, so all fixes can be explained at once. */
export async function checkSetup(projectRoot: string): Promise<{ allPassed: boolean; checks: Check[] }> {
  const checks: Check[] = [];

  const [major, minor] = process.versions.node.split('.').map(Number);
  const nodeOk = major > MIN_NODE[0] || (major === MIN_NODE[0] && minor >= MIN_NODE[1]);
  checks.push({ name: 'node', ok: nodeOk, detail: process.versions.node });

  checks.push(await tool('ffmpeg'), await tool('ffprobe'));

  try {
    const { default: sharp } = await import('sharp');
    checks.push({ name: 'sharp', ok: true, detail: sharp.versions.sharp ?? 'loaded' });
  } catch {
    checks.push({ name: 'sharp', ok: false, detail: 'dependencies not installed' });
  }

  try {
    const credentials = await resolveNetlifyCredentials(projectRoot);
    checks.push({ name: 'netlify-link', ok: true, detail: credentials.siteID });
    checks.push({ name: 'netlify-login', ok: true, detail: 'logged in' });

    try {
      await new NetlifyBlobsContentStore(credentials).read('sections.json');
      checks.push({ name: 'blobs', ok: true, detail: 'reachable' });
    } catch (error) {
      checks.push({ name: 'blobs', ok: false, detail: error instanceof Error ? error.message : String(error) });
    }
  } catch (error) {
    const code = error instanceof ContentError ? error.code : 'UNEXPECTED';
    checks.push({ name: 'netlify-link', ok: code !== 'SITE_NOT_LINKED', detail: code === 'SITE_NOT_LINKED' ? 'not linked' : 'linked' });
    checks.push({ name: 'netlify-login', ok: false, detail: code === 'NOT_LOGGED_IN' ? 'not logged in' : 'unknown' });
  }

  return { allPassed: checks.every((check) => check.ok), checks };
}
