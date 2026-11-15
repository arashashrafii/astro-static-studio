import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scopeDir = resolve(root, 'node_modules', '@astro-static-studio');

export function ensureWorkspacePackages() {
  const packages = [
    { name: 'contracts', source: resolve(root, 'packages', 'contracts') },
    { name: 'theme', source: resolve(root, 'packages', 'theme') },
  ];

  mkdirSync(scopeDir, { recursive: true });

  for (const pkg of packages) {
    const target = resolve(scopeDir, pkg.name);
    const sourceEntry = resolve(pkg.source, 'package.json');
    const targetEntry = resolve(target, 'package.json');
    if (!existsSync(sourceEntry) || existsSync(targetEntry)) continue;
    rmSync(target, { recursive: true, force: true });
    cpSync(pkg.source, target, { recursive: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    ensureWorkspacePackages();
  } catch (error) {
    console.warn('Warning: could not link workspace packages automatically:', error instanceof Error ? error.message : error);
  }
}
