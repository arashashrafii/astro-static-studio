import { mkdir, copyFile } from 'node:fs/promises';
import { build } from 'esbuild';
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'app.mjs', 'worker.mjs', 'engine.mjs']) await copyFile(file, `dist/${file}`);
await copyFile('node_modules/@astrojs/compiler/dist/astro.wasm', 'dist/astro.wasm');
await copyFile('node_modules/esbuild-wasm/esbuild.wasm', 'dist/esbuild.wasm');
await build({ entryPoints: ['node_modules/@astrojs/compiler/dist/browser/index.js'], bundle: true, format: 'esm', platform: 'browser', outfile: 'dist/compiler.mjs' });
await build({ entryPoints: ['node_modules/esbuild-wasm/esm/browser.js'], bundle: true, format: 'esm', platform: 'browser', outfile: 'dist/esbuild.mjs' });
await build({ stdin: { contents: 'export * from "astro/runtime/compiler/index.js"; export function createMetadata(file, metadata) { return { file, ...metadata }; }', resolveDir: process.cwd() }, bundle: true, format: 'esm', platform: 'browser', outfile: 'dist/runtime.mjs' });
