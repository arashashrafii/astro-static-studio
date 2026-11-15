import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import test from 'node:test';
import sharp from 'sharp';
import { ContentV2Schema } from '../packages/contracts/src/content-v2.js';
import { atelierManifest } from '../packages/theme/src/atelier-manifest.js';
import { ThemeConfigurationV1Schema } from '../packages/theme/src/contract.js';
import { exportBackup } from '../apps/api/src/backup.js';
import { buildAndPromote } from '../apps/api/src/build-output.js';
import {
  defaultThemeConfiguration,
  readThemeConfiguration,
  validateThemeConfiguration,
  writeThemeConfiguration,
} from '../apps/api/src/theme-settings.js';

function contentFixture() {
  return ContentV2Schema.parse({
    version: 2,
    site: { name: 'Theme settings', tagline: '', email: '', phone: '', language: 'en', direction: 'ltr' },
    pages: [{
      id: '51000000-0000-4000-8000-000000000001',
      slug: 'home',
      title: 'Home',
      published: true,
      description: { source: 'manual', value: '' },
      blocks: [{
        type: 'richText',
        placementId: '51000000-0000-4000-8000-000000000002',
        document: {
          type: 'document',
          blocks: [{ type: 'paragraph', size: 'normal', align: 'start', children: [{ type: 'text', text: 'Hello', marks: [] }] }],
        },
      }],
    }],
    collections: [],
    items: [],
  });
}

function contentV2Fixture(src: string) {
  return ContentV2Schema.parse({
    version: 2,
    site: { name: 'V2 theme settings', tagline: '', email: '', phone: '', language: 'en', direction: 'ltr' },
    pages: [{
      id: '52000000-0000-4000-8000-000000000001', slug: 'home', title: 'Home', published: true,
      description: { source: 'manual', value: 'Portfolio home' },
      blocks: [{ type: 'gallery', placementId: '52000000-0000-4000-8000-000000000002', images: [{ src, alt: 'Sample artwork' }], layout: 'grid' }],
    }],
    collections: [], items: [],
  });
}

test('theme config is versioned and validates selected theme and settings separately from content', () => {
  const content = contentFixture();
  const configuration = defaultThemeConfiguration(content);
  assert.deepEqual(ThemeConfigurationV1Schema.parse(configuration), configuration);
  assert.deepEqual(configuration.selectedTheme, { id: 'atelier', version: atelierManifest.version });
  assert.equal(configuration.perThemeSettings.atelier.themeId, 'atelier');
  assert.deepEqual(validateThemeConfiguration(configuration, content).diagnostics.filter(item => item.severity === 'error'), []);

  const unavailable = validateThemeConfiguration({ ...configuration, selectedTheme: { id: 'not-installed', version: '1.0.0' } }, content);
  assert(unavailable.diagnostics.some(item => item.code === 'theme.selection.unavailable' && item.severity === 'error'));
  const malformed = validateThemeConfiguration({ ...configuration, configVersion: 9 }, content);
  assert.equal(malformed.configuration, undefined);
  assert(malformed.diagnostics.some(item => item.code === 'theme.config.invalid'));
});

test('missing or invalid persisted configuration remains repairable with Atelier defaults', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'astro-theme-settings-'));
  const path = join(directory, 'theme-settings.json');
  try {
    const missing = await readThemeConfiguration(path, contentFixture());
    assert.equal(missing.exists, false);
    assert.deepEqual(missing.diagnostics.filter(item => item.severity === 'error'), []);
    assert.equal(missing.configuration.selectedTheme.id, 'atelier');
    await writeFile(path, '{ invalid json');
    const invalid = await readThemeConfiguration(path, contentFixture());
    assert.equal(invalid.exists, true);
    assert(invalid.diagnostics.some(item => item.severity === 'error'));
    assert.equal(invalid.configuration.selectedTheme.id, 'atelier');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('failed theme build preserves prior output and persisted configuration', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'astro-theme-rollback-'));
  const output = join(directory, 'dist');
  const configPath = join(directory, 'content', 'theme-settings.json');
  const content = contentFixture();
  const original = defaultThemeConfiguration(content);
  const candidate = { ...original, perThemeSettings: { ...original.perThemeSettings, atelier: { ...original.perThemeSettings.atelier, tokens: { ...original.perThemeSettings.atelier.tokens, accent: '#112233' } } } };
  try {
    await mkdir(output, { recursive: true });
    await writeFile(join(output, 'index.html'), 'last-good-site');
    await writeThemeConfiguration(configPath, original);
    const previousConfig = await readFile(configPath, 'utf8');
    let commitCount = 0;
    await assert.rejects(buildAndPromote(output, async (staging) => {
      await mkdir(staging, { recursive: true });
      await writeFile(join(staging, 'index.html'), 'broken-site');
      throw new Error('simulated theme build failure');
    }, directory, {
      commit: async () => { commitCount += 1; await writeThemeConfiguration(configPath, candidate); },
      rollback: async () => { await writeFile(configPath, previousConfig); },
    }), /simulated theme build failure/);
    assert.equal(commitCount, 0);
    assert.equal(await readFile(join(output, 'index.html'), 'utf8'), 'last-good-site');
    assert.equal(await readFile(configPath, 'utf8'), previousConfig);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('theme config writes preserve Content V2 IDs, slugs, WebP, original media, and backup bytes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'astro-theme-backup-'));
  const contentPath = join(directory, 'content', 'content.json');
  const mediaDirectory = join(directory, 'public', 'media');
  const originalsDirectory = join(directory, 'originals');
  const configPath = join(directory, 'content', 'theme-settings.json');
  const mediaId = '52000000-0000-4000-8000-000000000003';
  const src = `/media/${mediaId}.webp`;
  const content = contentV2Fixture(src);
  const contentBytes = Buffer.from(JSON.stringify(content, null, 2));
  const webp = await sharp({ create: { width: 9, height: 7, channels: 3, background: '#927755' } }).webp().toBuffer();
  const original = await sharp({ create: { width: 9, height: 7, channels: 3, background: '#927755' } }).jpeg().toBuffer();
  try {
    await mkdir(join(directory, 'content'), { recursive: true });
    await mkdir(mediaDirectory, { recursive: true });
    await mkdir(originalsDirectory, { recursive: true });
    await writeFile(contentPath, contentBytes);
    await writeFile(join(mediaDirectory, `${mediaId}.webp`), webp);
    await writeFile(join(originalsDirectory, `${mediaId}.jpg`), original);
    const paths = { contentPath, mediaDirectory, originalsDirectory };
    const before = await exportBackup(paths);
    const backupDigestBefore = createHash('sha256').update(before).digest('hex');
    await writeThemeConfiguration(configPath, defaultThemeConfiguration(content));
    assert.deepEqual(await readFile(contentPath), contentBytes);
    assert.deepEqual(JSON.parse(await readFile(contentPath, 'utf8')), content);
    assert.deepEqual(await readFile(join(mediaDirectory, `${mediaId}.webp`)), webp);
    assert.deepEqual(await readFile(join(originalsDirectory, `${mediaId}.jpg`)), original);
    const after = await exportBackup(paths);
    assert.deepEqual(after, before);
    assert.equal(createHash('sha256').update(after).digest('hex'), backupDigestBefore);
    assert.equal(JSON.parse(after.toString('utf8')).content.pages[0].slug, 'home');
    assert.equal(JSON.parse(after.toString('utf8')).content.pages[0].id, content.pages[0].id);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
