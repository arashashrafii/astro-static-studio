import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { exportBackup, restoreBackup, type BackupPaths } from '../apps/api/src/backup.js';

const mediaId = 'd316af54-1fe7-4db9-a86a-3b4dd22114a8';

function fixtureContent(src = `/media/${mediaId}.webp`) {
  return {
    version: 1,
    site: { name: 'Sample', tagline: '', email: 'owner@example.com', phone: '' },
    entries: [{
      id: 'cf8a0acb-a235-4aa8-9741-c68e8b1b46b4', kind: 'project', slug: 'sample', title: 'Sample', summary: '',
      published: true, components: [{ type: 'gallery', images: [{ src, alt: 'Sample image' }] }],
    }],
  };
}

async function setup(t: { after(fn: () => void | Promise<void>): void }, withOriginal = true): Promise<{ root: string; paths: BackupPaths; webp: Buffer; original: Buffer }> {
  const root = await mkdtemp(join(tmpdir(), 'astro-backup-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const paths: BackupPaths = {
    contentPath: join(root, 'content', 'content.json'),
    mediaDirectory: join(root, 'public', 'media'),
    originalsDirectory: join(root, 'originals'),
    tempDirectory: root,
  };
  await mkdir(join(root, 'content'), { recursive: true });
  await mkdir(paths.mediaDirectory, { recursive: true });
  await mkdir(paths.originalsDirectory!, { recursive: true });
  const webp = await sharp({ create: { width: 12, height: 8, channels: 3, background: '#779955' } }).webp().toBuffer();
  const original = await sharp({ create: { width: 12, height: 8, channels: 3, background: '#779955' } }).jpeg().toBuffer();
  await writeFile(paths.contentPath, JSON.stringify(fixtureContent()));
  await writeFile(join(paths.mediaDirectory, `${mediaId}.webp`), webp);
  if (withOriginal) await writeFile(join(paths.originalsDirectory!, `${mediaId}.jpg`), original);
  return { root, paths, webp, original };
}

test('backup round-trip preserves validated content, WebP and its JPEG original', async t => {
  const source = await setup(t);
  const backup = await exportBackup(source.paths);
  const targetRoot = await mkdtemp(join(tmpdir(), 'astro-backup-target-'));
  t.after(() => rm(targetRoot, { recursive: true, force: true }));
  const target: BackupPaths = {
    contentPath: join(targetRoot, 'content', 'content.json'),
    mediaDirectory: join(targetRoot, 'media'),
    originalsDirectory: join(targetRoot, 'originals'),
    tempDirectory: targetRoot,
  };
  await mkdir(join(targetRoot, 'content'), { recursive: true });

  const result = await restoreBackup(backup, target);
  assert.deepEqual(result, { mediaAdded: 1, mediaAlreadyPresent: 0, originalsAdded: 1, originalsAlreadyPresent: 0 });
  assert.deepEqual(JSON.parse(await readFile(target.contentPath, 'utf8')), fixtureContent());
  assert.deepEqual(await readFile(join(target.mediaDirectory, `${mediaId}.webp`)), source.webp);
  assert.deepEqual(await readFile(join(target.originalsDirectory!, `${mediaId}.jpg`)), source.original);
});

test('backup records a missing original as optional', async t => {
  const source = await setup(t, false);
  const backup = JSON.parse((await exportBackup(source.paths)).toString('utf8'));
  assert.equal(backup.media.length, 1);
  assert.equal('original' in backup.media[0], false);
});

test('backup supports legacy media IDs without dashes', async t => {
  const source = await setup(t, false);
  const legacyId = mediaId.replaceAll('-', '');
  const content = fixtureContent(`/media/${legacyId}.webp`);
  await writeFile(source.paths.contentPath, JSON.stringify(content));
  await writeFile(join(source.paths.mediaDirectory, `${legacyId}.webp`), source.webp);
  const backup = JSON.parse((await exportBackup(source.paths)).toString('utf8'));
  assert.equal(backup.content.entries[0].components[0].images[0].src, `/media/${legacyId}.webp`);
});

test('restore rejects a checksum mismatch without changing content or media', async t => {
  const source = await setup(t);
  const backup = JSON.parse((await exportBackup(source.paths)).toString('utf8'));
  const damaged = Buffer.from(backup.media[0].data, 'base64');
  damaged[0] ^= 1;
  backup.media[0].data = damaged.toString('base64');
  const before = await readFile(source.paths.contentPath, 'utf8');
  await assert.rejects(restoreBackup(JSON.stringify(backup), source.paths), /checksum mismatch/);
  assert.equal(await readFile(source.paths.contentPath, 'utf8'), before);
  assert.deepEqual(await readFile(join(source.paths.mediaDirectory, `${mediaId}.webp`)), source.webp);
});

test('restore does not overwrite colliding media and leaves content unchanged', async t => {
  const source = await setup(t);
  const backup = await exportBackup(source.paths);
  await writeFile(source.paths.contentPath, 'existing content');
  const collisionBaseline = await readFile(source.paths.contentPath, 'utf8');
  await writeFile(join(source.paths.mediaDirectory, `${mediaId}.webp`), Buffer.from('different bytes'));
  await assert.rejects(restoreBackup(backup, source.paths), /different contents/);
  assert.equal(await readFile(source.paths.contentPath, 'utf8'), collisionBaseline);
  assert.deepEqual(await readFile(join(source.paths.mediaDirectory, `${mediaId}.webp`)), Buffer.from('different bytes'));
});

test('restore rolls back newly added WebP if an original collides', async t => {
  const source = await setup(t);
  const backup = await exportBackup(source.paths);
  const targetRoot = await mkdtemp(join(tmpdir(), 'astro-backup-target-'));
  t.after(() => rm(targetRoot, { recursive: true, force: true }));
  const target: BackupPaths = {
    contentPath: join(targetRoot, 'content.json'), mediaDirectory: join(targetRoot, 'media'),
    originalsDirectory: join(targetRoot, 'originals'), tempDirectory: targetRoot,
  };
  await mkdir(target.mediaDirectory, { recursive: true });
  await mkdir(target.originalsDirectory!, { recursive: true });
  await writeFile(target.contentPath, 'keep this content');
  await writeFile(join(target.originalsDirectory!, `${mediaId}.jpg`), Buffer.from('different original'));

  await assert.rejects(restoreBackup(backup, target), /Original already exists with different contents/);
  assert.equal(await readFile(target.contentPath, 'utf8'), 'keep this content');
  await assert.rejects(readFile(join(target.mediaDirectory, `${mediaId}.webp`)), { code: 'ENOENT' });
});

test('restore accepts a backup without originals when no originals directory is configured', async t => {
  const source = await setup(t, false);
  const targetRoot = await mkdtemp(join(tmpdir(), 'astro-backup-target-'));
  t.after(() => rm(targetRoot, { recursive: true, force: true }));
  const target: BackupPaths = { contentPath: join(targetRoot, 'content.json'), mediaDirectory: join(targetRoot, 'media'), tempDirectory: targetRoot };
  const result = await restoreBackup(await exportBackup(source.paths), target);
  assert.deepEqual(result, { mediaAdded: 1, mediaAlreadyPresent: 0, originalsAdded: 0, originalsAlreadyPresent: 0 });
});

test('restore requires an originals directory when the bundle carries an original', async t => {
  const source = await setup(t);
  await assert.rejects(restoreBackup(await exportBackup(source.paths), {
    contentPath: source.paths.contentPath,
    mediaDirectory: source.paths.mediaDirectory,
  }), /originals directory is required/);
});
