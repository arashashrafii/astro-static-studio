import { initialize, transform } from './compiler.mjs';
import * as esbuild from './esbuild.mjs';
import { compilePage, renderPage } from './engine.mjs';
const ready = Promise.all([
  initialize({ wasmURL: new URL('./astro.wasm', import.meta.url) }),
  esbuild.initialize({ wasmURL: new URL('./esbuild.wasm', import.meta.url), worker: false })
]);
self.onmessage = async ({ data: source }) => {
  const started = performance.now();
  let url;
  try {
    await ready;
    const code = await compilePage(source, { transform, transpile: async (code) => {
      const runtimeURL = new URL('./runtime.mjs', import.meta.url).href;
      const output = await esbuild.build({ stdin: { contents: code, loader: 'ts' }, bundle: true, write: false, format: 'esm', plugins: [{ name: 'only-runtime', setup(build) {
        build.onResolve({ filter: /.*/ }, args => args.path === runtimeURL ? { path: args.path, external: true } : { errors: [{ text: `Unsupported import: ${args.path}` }] });
      } }] });
      return { code: output.outputFiles[0].text };
    }, runtimeURL: new URL('./runtime.mjs', import.meta.url).href });
    url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    const { default: Page } = await import(url);
    const html = await renderPage(Page);
    self.postMessage({ html, ms: performance.now() - started, bytes: new TextEncoder().encode(html).length });
  } catch (error) { self.postMessage({ error: error.message }); }
  finally { if (url) URL.revokeObjectURL(url); }
};
