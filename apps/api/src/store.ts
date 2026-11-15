import { readFile, writeFile, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { ContentV2Schema, type ContentV2 } from '../../../packages/contracts/src/content-v2.js';

export const root = fileURLToPath(new URL('../../../', import.meta.url));
export const contentPath = resolve(root, 'content/content.json');
export type StoredContent = ContentV2;

export function parseStoredContent(input: unknown): StoredContent {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('محتوای سایت معتبر نیست.');
  const version = (input as { version?: unknown }).version;
  if (version === 2) return ContentV2Schema.parse(input);
  throw new Error(`نسخهٔ محتوای سایت پشتیبانی نمی‌شود: ${String(version)}.`);
}

export async function readContent(path = contentPath): Promise<StoredContent> {
  return parseStoredContent(JSON.parse(await readFile(path, 'utf8')));
}

export async function saveContent(input: unknown, path = contentPath): Promise<StoredContent> {
  const data = parseStoredContent(input);
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(data, null, 2), { flag: 'wx' });
  await rename(temporary, path);
  return data;
}
