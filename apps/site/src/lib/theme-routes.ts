import {
  atelierManifest,
} from '@astro-static-studio/theme/atelier-manifest';
import {
  createAtelierDefaultSettings,
  createThemeAdapter,
} from '@astro-static-studio/theme/studio/adapter';
import { ThemeConfigurationV1Schema, validateThemeSettings } from '@astro-static-studio/theme/contract';
import type { ContentV2 } from '@astro-static-studio/contracts/content-v2';
import { ensureV2PlacementIdsV1 } from '@astro-static-studio/contracts/migration';
import type { ThemeCapability, ThemeRouteModel } from '@astro-static-studio/theme/contract';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const adapter = createThemeAdapter();

const availableCapabilities: ThemeCapability[] = [
  'content.v2', 'routes.static', 'route.home', 'route.page',
  'route.collectionList', 'route.collectionItem', 'field.text', 'field.richText',
  'field.category', 'field.gallery', 'field.link', 'media.webp', 'direction.ltr', 'direction.rtl',
];

/** Resolve validated Content V2 into the route view models consumed by Astro pages. */
export function atelierRoutes(content: ContentV2): ThemeRouteModel[] {
  const configuredPath = process.env.STUDIO_THEME_CONFIG_PATH;
  const projectRoot = fileURLToPath(new URL('../../../../', import.meta.url));
  const persistedConfigPath = resolve(projectRoot, 'content/theme-settings.json');
  const configPath = configuredPath ?? (existsSync(persistedConfigPath) ? persistedConfigPath : undefined);
  let settings = createAtelierDefaultSettings(content);
  if (configPath) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(configPath, 'utf8'));
    } catch (error) {
      throw new Error(`Could not read selected theme configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
    const configuration = ThemeConfigurationV1Schema.parse(parsed);
    if (configuration.selectedTheme.id !== atelierManifest.id || configuration.selectedTheme.version !== atelierManifest.version) {
      throw new Error(`Selected theme ${configuration.selectedTheme.id}@${configuration.selectedTheme.version} is not available in this build.`);
    }
    const selectedSettings = configuration.perThemeSettings[atelierManifest.id];
    if (!selectedSettings) throw new Error('Theme settings for Atelier are missing. Apply Atelier from Settings > Theme and try again.');
    const normalizedContent = ensureV2PlacementIdsV1(content);
    const diagnostics = validateThemeSettings(selectedSettings, atelierManifest, normalizedContent, availableCapabilities);
    const errors = diagnostics.filter(diagnostic => diagnostic.severity === 'error');
    if (errors.length) throw new Error(errors.map(diagnostic => diagnostic.message).join('\n'));
    settings = selectedSettings;
  }
  return adapter.map({
    content,
    manifest: atelierManifest,
    settings,
    availableCapabilities,
  });
}
