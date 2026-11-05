import { readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = 'dist';
const files = [];

async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const full = join(path, entry.name);
    if (entry.isDirectory()) await walk(full);
    else files.push(`/${full.slice(root.length + 1).replaceAll('\\', '/')}`);
  }
}

await walk(root);
files.push('/asset-manifest.json');
await writeFile(join(root, 'asset-manifest.json'), JSON.stringify(files));
