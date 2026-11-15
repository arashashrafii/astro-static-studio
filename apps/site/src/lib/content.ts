import bundledData from '../../../../content/content.json';
import { ContentV2Schema } from '@astro-static-studio/contracts/content-v2';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export async function content() {
  const fixturePath = process.env.STUDIO_THEME_COMPATIBILITY_CONTENT_PATH;
  const data: unknown = fixturePath
    ? JSON.parse(readFileSync(resolve(fixturePath), 'utf8'))
    : bundledData;
  const version = (data as { version?: unknown }).version;
  if (version === 2) return ContentV2Schema.parse(data);
  throw new Error(`Unsupported content version: ${String(version)}`);
}
