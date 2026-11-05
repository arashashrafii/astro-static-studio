import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { PublisherInterface } from '@astro-static-studio/contracts';
import { readContent, root } from './store.js';
import { buildAndPromote } from './build-output.js';
import { defaultThemeConfiguration, readThemeConfiguration, themeConfigPath, writeThemeConfiguration } from './theme-settings.js';
import type { ThemeConfigurationV1 } from '../../../packages/theme/src/contract.js';

async function buildSite(configPath?: string, hooks: { commit?: () => Promise<void>; rollback?: () => Promise<void> } = {}) {
  const outputDirectory = resolve(root, 'apps/site/dist');
  // Keep generated files outside apps/site so Astro's dev watcher does not treat build output as source changes.
  await buildAndPromote(outputDirectory, async (stagingDirectory) => {
    await new Promise<void>((resolveBuild, rejectBuild) => {
      const child = spawn(
        process.platform === 'win32' ? 'npm.cmd' : 'npm',
        ['run', 'build', '-w', 'apps/site', '--', '--outDir', stagingDirectory],
        { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...(configPath ? { STUDIO_THEME_CONFIG_PATH: configPath } : {}) } },
      );
      let log = '';
      child.stdout.on('data', (data) => { log = (log + data).slice(-6000); });
      child.stderr.on('data', (data) => { log = (log + data).slice(-6000); });
      child.on('error', rejectBuild);
      child.on('close', (code) => code === 0 ? resolveBuild() : rejectBuild(new Error(log)));
    });
  }, resolve(root, 'apps'), hooks);
  return { outputDirectory: 'apps/site/dist', builtAt: new Date().toISOString() };
}

export async function applyThemeConfiguration(configuration: ThemeConfigurationV1) {
  const tempConfigPath = resolve(dirname(themeConfigPath), `.theme-settings-build-${randomUUID()}.json`);
  await writeFile(tempConfigPath, JSON.stringify(configuration), { flag: 'wx' });
  let previous: Buffer | undefined;
  try { previous = await readFile(themeConfigPath); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  let committed = false;
  try {
    const build = await buildSite(tempConfigPath, {
      commit: async () => { await writeThemeConfiguration(themeConfigPath, configuration); committed = true; },
      rollback: async () => {
        if (!committed) return;
        if (previous) await writeFile(themeConfigPath, previous);
        else await rm(themeConfigPath, { force: true });
      },
    });
    return build;
  } finally {
    await rm(tempConfigPath, { force: true });
  }
}

export const localPublisher: PublisherInterface = {
  id: 'local-static',
  async publish() {
    const content = await readContent();
    const stored = await readThemeConfiguration(themeConfigPath, content);
    if (stored.diagnostics.some(diagnostic => diagnostic.severity === 'error')) {
      throw new Error(stored.diagnostics.filter(diagnostic => diagnostic.severity === 'error').map(diagnostic => diagnostic.message).join('\n'));
    }
    if (!stored.exists) {
      const config = defaultThemeConfiguration(content);
      const tempConfigPath = resolve(dirname(themeConfigPath), `.theme-settings-build-${randomUUID()}.json`);
      await writeFile(tempConfigPath, JSON.stringify(config), { flag: 'wx' });
      try { return await buildSite(tempConfigPath); } finally { await rm(tempConfigPath, { force: true }); }
    }
    return await buildSite(themeConfigPath);
  },
};
