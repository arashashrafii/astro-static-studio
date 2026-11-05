import type { ThemeInterface } from '@astro-static-studio/contracts';
import { atelierManifest } from './atelier-manifest.js';

export const theme = {
  id: atelierManifest.id,
  name: atelierManifest.name,
  version: atelierManifest.version,
  components: ['text', 'gallery'],
  tokens: {
    background: atelierManifest.designTokens.background.default,
    foreground: atelierManifest.designTokens.foreground.default,
    accent: atelierManifest.designTokens.accent.default,
  },
} satisfies ThemeInterface;
