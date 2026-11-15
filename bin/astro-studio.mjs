#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureWorkspacePackages } from '../scripts/link-workspaces.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Astro Static Studio CLI

Usage:
  astro-studio [--port 3000]

Options:
  -p, --port <number>   Port to run the local studio server (default: 3000)
  -v, --version         Show version
  -h, --help            Show help
`);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  const pkg = require(resolve(root, 'package.json'));
  console.log(pkg.version);
  process.exit(0);
}

let port = process.env.PORT || '3000';
const portFlagIndex = args.findIndex((arg) => arg === '--port' || arg === '-p');
if (portFlagIndex !== -1 && args[portFlagIndex + 1]) {
  port = args[portFlagIndex + 1];
}

try {
  ensureWorkspacePackages();
} catch (error) {
  console.warn('هشدار آماده‌سازی پکیج‌های داخلی:', error instanceof Error ? error.message : error);
}

const tsxCli = require.resolve('tsx/cli');
const serverEntry = resolve(root, 'apps/api/src/server.ts');
const adminDist = resolve(root, 'apps/admin/dist/index.html');

if (!existsSync(adminDist)) {
  console.warn('توجه: خروجی پنل مدیریت (apps/admin/dist) یافت نشد. در حال ادامه با سرور API...');
}

console.log('\n  ★ Astro Static Studio');
console.log('  ----------------------------------------');
console.log('  محیط مدیریت محتوای استاتیک ۱۰۰٪ آفلاین');
console.log(`  پلتفرم: ${process.platform} (${process.arch})`);
console.log(`  نشانی محلی: http://localhost:${port}`);
console.log('  برای توقف Ctrl+C را بزنید.\n');

const child = spawn(process.execPath, [tsxCli, serverEntry], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: String(port),
  },
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal);
  });
}

child.on('error', (err) => {
  console.error('خطا در اجرای سرور:', err.message);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
