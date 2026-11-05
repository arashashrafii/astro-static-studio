import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  output: 'static',
  publicDir: fileURLToPath(new URL('../../apps/site/public/', import.meta.url)),
  devToolbar: { enabled: false },
});
