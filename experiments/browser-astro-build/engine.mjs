// This engine accepts trusted experimental source only. It executes frontmatter.
export async function compilePage(source, { transform, transpile, runtimeURL }) {
  if (typeof source !== 'string' || new TextEncoder().encode(source).length > 65536) throw new Error('Source must be text of at most 64 KiB.');
  const result = await transform(source, { filename: '/src/pages/index.astro', internalURL: runtimeURL });
  const error = result.diagnostics?.find(d => d.severity === 1);
  if (error) throw new Error(error.text);
  if (result.css.length || result.scripts.length) throw new Error('Style and script blocks are outside this spike. Use plain HTML for this test.');
  // TypeScript frontmatter is lowered to browser JavaScript.
  const parsed = await transpile(result.code, { loader: 'ts', format: 'esm' });
  return parsed.code;
}
export async function renderPage(Page) {
  const result = { clientDirectives: new Set(), createAstro: (props, slots) => ({ props, slots, url: new URL('https://spike.invalid/') }) };
  const template = Page(result, {}, {});
  let html = '';
  await template.render({ write(chunk) {
    if (chunk && typeof chunk === 'object' && chunk[Symbol.for('astro:render')]) {
      if (chunk.type === 'head' || chunk.type === 'maybe-head') return;
      throw new Error(`Unsupported render instruction: ${chunk.type}`);
    }
    html += chunk instanceof Uint8Array ? new TextDecoder().decode(chunk) : String(chunk);
  } });
  return `<!doctype html>\n${html}`;
}
