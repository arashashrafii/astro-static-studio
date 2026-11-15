import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { ContentV2Schema, type ContentV2 } from '../../../packages/contracts/src/content-v2.js';
import { contentPath, root, saveContent } from './store.js';

export const setupPath = resolve(root, 'content/.studio-site.json');

export type SetupMode = 'sample' | 'new-site';

export async function getSetupState(path = setupPath): Promise<{ initialized: boolean; mode?: SetupMode }> {
  try {
    const value = JSON.parse(await readFile(path, 'utf8')) as { mode?: unknown };
    return { initialized: true, mode: value.mode === 'new-site' ? 'new-site' : 'sample' };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { initialized: false };
    throw error;
  }
}

export async function initializeSite(
  mode: SetupMode,
  siteName: string,
  options: { setupFile?: string; contentFile?: string; save?: (content: ContentV2) => Promise<unknown> } = {},
): Promise<ContentV2> {
  const setupFile = options.setupFile ?? setupPath;
  const contentFile = options.contentFile ?? contentPath;
  if ((await getSetupState(setupFile)).initialized) throw new Error('تنظیم اولیه قبلاً انجام شده است.');

  let content: ContentV2;
  if (mode === 'new-site') {
    const name = siteName.trim();
    if (!name || name.length > 200) throw new Error('نام سایت را وارد کنید (حداکثر ۲۰۰ نویسه).');
    content = ContentV2Schema.parse({
      version: 2,
      site: { name, tagline: '', email: '', phone: '', language: 'en', direction: 'ltr' },
      pages: [],
      collections: [],
      items: [],
    });
    await mkdir(dirname(contentFile), { recursive: true });
    await (options.save ?? saveContent)(content);
  } else {
    content = ContentV2Schema.parse(JSON.parse(await readFile(contentFile, 'utf8')));
  }

  await mkdir(dirname(setupFile), { recursive: true });
  const temporaryPath = `${setupFile}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify({ mode, initializedAt: new Date().toISOString() }), { flag: 'w' });
  await rename(temporaryPath, setupFile);
  return content;
}
