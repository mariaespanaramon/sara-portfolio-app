import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { ContentError } from '../domain/ContentError.ts';

export interface NetlifyCredentials {
  siteID: string;
  token: string;
}

/** Where the Netlify CLI keeps its login, per platform. */
function cliConfigPaths(): string[] {
  const home = homedir();
  return [
    join(home, 'Library', 'Preferences', 'netlify', 'config.json'),
    join(home, '.config', 'netlify', 'config.json'),
    join(process.env.APPDATA ?? join(home, 'AppData', 'Roaming'), 'netlify', 'Config', 'config.json'),
  ];
}

async function readJson(path: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function tokenFromCli(): Promise<string | null> {
  for (const path of cliConfigPaths()) {
    const config = await readJson(path);
    const userId = config?.userId;
    const users = config?.users as Record<string, { auth?: { token?: unknown } }> | undefined;
    const token = typeof userId === 'string' ? users?.[userId]?.auth?.token : undefined;
    if (typeof token === 'string' && token !== '') {
      return token;
    }
  }
  return null;
}

/**
 * Finds the site and login the scripts write with, reusing what `netlify link`
 * and `netlify login` already stored, so there is no separate secret to set up.
 * NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN take precedence when set.
 */
export async function resolveNetlifyCredentials(projectRoot: string): Promise<NetlifyCredentials> {
  const state = await readJson(join(projectRoot, '.netlify', 'state.json'));
  const siteID = process.env.NETLIFY_SITE_ID ?? (state?.siteId as string | undefined);
  if (!siteID) {
    throw new ContentError('SITE_NOT_LINKED', 'This folder is not linked to a Netlify site');
  }

  const token = process.env.NETLIFY_AUTH_TOKEN ?? (await tokenFromCli());
  if (!token) {
    throw new ContentError('NOT_LOGGED_IN', 'No Netlify login found');
  }

  return { siteID, token };
}
