import { ThemeManifestV1Schema } from './contract.js';

/** Contract fixture based only on verified Atelier source and #13/#17 build evidence. */
export const atelierManifest = ThemeManifestV1Schema.parse({
  manifestVersion: 1,
  contractVersion: 1,
  id: 'atelier',
  name: 'Atelier',
  version: '1.0.0',
  adapter: { entryPoint: './studio/adapter.ts', exportName: 'createThemeAdapter' },
  compatibility: {
    contentVersions: [1, 2],
    astro: { range: { minInclusive: '7.4.2', maxExclusive: '7.4.3' }, testedVersion: '7.4.2' },
    node: { range: { minInclusive: '24.13.0', maxExclusive: '24.13.1' }, testedVersion: '24.13.0' },
  },
  templates: [
    { id: 'atelier-home', role: 'home' },
    { id: 'atelier-page', role: 'page' },
    { id: 'atelier-collection-list', role: 'collectionList' },
    { id: 'atelier-collection-item', role: 'collectionItem' },
  ],
  sections: [
    { id: 'hero', blockTypes: ['richText'], routeRoles: ['home'] },
    { id: 'content', blockTypes: ['richText'], routeRoles: ['home', 'page'] },
    { id: 'gallery', blockTypes: ['gallery', 'image'], routeRoles: ['home', 'page'] },
    { id: 'collection-list', blockTypes: ['collectionView'], routeRoles: ['home', 'page'] },
  ],
  capabilities: {
    required: ['content.v1', 'content.v2', 'routes.static', 'route.home', 'route.page', 'field.text', 'field.gallery', 'direction.ltr', 'direction.rtl'],
    optional: ['route.collectionList', 'route.collectionItem', 'field.richText', 'field.category', 'field.link', 'media.webp'],
  },
  localization: { contentLocalePolicy: 'any-bcp47-pass-through', directions: ['ltr', 'rtl'] },
  designTokens: {
    background: { type: 'color', default: '#f5f2eb' },
    foreground: { type: 'color', default: '#272b27' },
    accent: { type: 'color', default: '#9b4937' },
  },
  license: { status: 'unknown', reason: 'The repository has no root LICENSE file or internal theme package license metadata; redistribution rights have not been asserted.' },
  dependencies: {
    lockfile: 'package-lock.json',
    packages: [
      { name: 'astro', declaredRange: '^7.4.2', resolvedVersion: '7.4.2' },
      { name: '@astro-static-studio/contracts', declaredRange: '*', resolvedVersion: '0.1.0' },
      { name: '@astro-static-studio/theme', declaredRange: '*', resolvedVersion: '0.1.0' },
    ],
  },
});
