import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildAndPromote } from '../apps/api/src/build-output.ts';

test('failed build preserves previous output and removes staging files', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'astro-studio-build-'));
  const output = join(parent, 'dist');
  await mkdir(output);
  await writeFile(join(output, 'index.html'), 'previous site');

  try {
    await assert.rejects(buildAndPromote(output, async (staging) => {
      await mkdir(staging);
      await writeFile(join(staging, 'index.html'), 'partial site');
      throw new Error('simulated Astro build failure');
    }), /simulated Astro build failure/);

    assert.equal(await readFile(join(output, 'index.html'), 'utf8'), 'previous site');
    assert.deepEqual(await readdir(parent), ['dist']);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test('successful build replaces output only after staging is ready', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'astro-studio-build-'));
  const output = join(parent, 'dist');
  await mkdir(output);
  await writeFile(join(output, 'index.html'), 'previous site');

  try {
    await buildAndPromote(output, async (staging) => {
      await mkdir(staging);
      await writeFile(join(staging, 'index.html'), 'new site');
    });

    assert.equal(await readFile(join(output, 'index.html'), 'utf8'), 'new site');
    assert.deepEqual(await readdir(parent), ['dist']);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test('failed output install and failed restore still roll back committed metadata', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'astro-studio-build-rollback-'));
  const output = join(parent, 'dist');
  const installError = new Error('simulated staged output install failure');
  const restoreError = new Error('simulated previous output restore failure');
  let renameCount = 0;
  let commitCount = 0;
  let rollbackCount = 0;
  await mkdir(output);
  await writeFile(join(output, 'index.html'), 'previous site');

  try {
    await assert.rejects(buildAndPromote(output, async (staging) => {
      await mkdir(staging);
      await writeFile(join(staging, 'index.html'), 'new site');
    }, parent, {
      commit: async () => { commitCount += 1; },
      rollback: async () => { rollbackCount += 1; },
      renamePath: async (source, destination) => {
        renameCount += 1;
        if (renameCount === 2) throw installError;
        if (renameCount === 3) throw restoreError;
        await rename(source, destination);
      },
    }), (error: unknown) => {
      assert(error instanceof AggregateError);
      assert.deepEqual(error.errors, [installError, restoreError]);
      return true;
    });

    assert.equal(commitCount, 1);
    assert.equal(rollbackCount, 1);
    const remaining = await readdir(parent);
    assert.equal(remaining.some(name => name.startsWith('.dist.backup-')), true);
    assert.equal(remaining.some(name => name.startsWith('.dist.staging-')), false);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});
