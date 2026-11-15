import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseStoredContent, readContent, saveContent } from '../apps/api/src/store.js';

test('store accepts V2 and rejects V1 and unknown versions', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'studio-content-store-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, 'content.json');
  const v1 = { version: 1, site: { name: 'Store test', tagline: '', email: '', phone: '' }, entries: [] };
  const v2 = {
    version: 2,
    site: { name: 'Store test', tagline: '', email: '', phone: '', language: 'en', direction: 'ltr' },
    pages: [{ id: 'a7b1bb0e-92b7-4772-b88e-60389c07c033', slug: 'about', title: 'About', published: true, description: { source: 'manual', value: '' }, blocks: [] }],
    collections: [],
    items: [],
  };
  await mkdir(directory, { recursive: true });
  await writeFile(path, JSON.stringify(v2));
  assert.equal((await readContent(path)).version, 2);
  assert.equal((await saveContent(v2, path)).version, 2);
  await assert.rejects(saveContent(v1, path), /پشتیبانی نمی‌شود/);
  assert.equal(JSON.parse(await readFile(path, 'utf8')).version, 2);
  assert.throws(() => parseStoredContent({ version: 1 }), /پشتیبانی نمی‌شود/);
  assert.throws(() => parseStoredContent({ version: 99 }), /پشتیبانی نمی‌شود/);
});
