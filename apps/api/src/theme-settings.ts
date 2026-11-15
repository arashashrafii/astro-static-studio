import { randomUUID } from 'node:crypto';
import { readFile, rename, rm, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import type { ContentV2 } from '../../../packages/contracts/src/content-v2.js';
import { ensureV2PlacementIdsV1 } from '../../../packages/contracts/src/content-migration.js';
import { atelierManifest } from '../../../packages/theme/src/atelier-manifest.js';
import {
  ThemeConfigurationV1Schema,
  type ThemeConfigurationV1,
  type ThemeDiagnostic,
  type ThemeSettingsV1,
  validateThemeManifest,
  validateThemeSettings,
  type ThemeCapability,
} from '../../../packages/theme/src/contract.js';
import { createAtelierDefaultSettings } from '../../../packages/theme/src/studio/adapter.js';
import { root as projectRoot } from './store.js';

export type ThemeContent = ContentV2;
export const themeConfigPath = resolve(projectRoot, 'content/theme-settings.json');
const astroRuntimeVersion = (() => {
  for (const candidate of ['apps/site/node_modules/astro/package.json', 'node_modules/astro/package.json']) {
    try { return JSON.parse(readFileSync(resolve(projectRoot, candidate), 'utf8')).version as string; }
    catch {}
  }
  return atelierManifest.compatibility.astro.testedVersion;
})();

// This list describes capabilities implemented by the bundled Atelier renderer.
export const atelierAvailableCapabilities: ThemeCapability[] = [
  'content.v2', 'routes.static', 'route.home', 'route.page',
  'route.collectionList', 'route.collectionItem', 'field.text', 'field.richText',
  'field.category', 'field.gallery', 'field.link', 'media.webp', 'direction.ltr', 'direction.rtl',
];

export interface ThemeState {
  selectedTheme: { id: string; name: string; version: string };
  installedThemes: { id: string; name: string; version: string }[];
  warnings: { severity: 'warning' | 'error'; message: string }[];
  configAvailable: boolean;
}

export function defaultThemeConfiguration(content: ThemeContent): ThemeConfigurationV1 {
  const settings = createAtelierDefaultSettings(content);
  return ThemeConfigurationV1Schema.parse({
    configVersion: 1,
    selectedTheme: { id: atelierManifest.id, version: atelierManifest.version },
    perThemeSettings: { [atelierManifest.id]: settings },
  });
}

export function validateThemeConfiguration(input: unknown, content: ThemeContent, runtime = {
  contractVersion: 1,
  contentVersion: content.version,
  astroVersion: astroRuntimeVersion,
  nodeVersion: process.version,
  availableCapabilities: atelierAvailableCapabilities,
}) : { configuration?: ThemeConfigurationV1; diagnostics: ThemeDiagnostic[] } {
  const parsed = ThemeConfigurationV1Schema.safeParse(input);
  if (!parsed.success) return {
    diagnostics: parsed.error.issues.map(issue => ({ severity: 'error', code: 'theme.config.invalid', message: `${issue.path.join('.') || 'configuration'}: ${issue.message}` })),
  };
  const configuration = parsed.data;
  const diagnostics = validateThemeManifest(atelierManifest, runtime);
  const selected = configuration.selectedTheme;
  if (selected.id !== atelierManifest.id || selected.version !== atelierManifest.version) {
    diagnostics.push({ severity: 'error', code: 'theme.selection.unavailable', message: `Selected theme ${selected.id}@${selected.version} is not installed. Choose Atelier to restore a supported theme.` });
  }
  const settings: ThemeSettingsV1 | undefined = configuration.perThemeSettings[selected.id];
  const normalizedContent = ensureV2PlacementIdsV1(content);
  if (settings) diagnostics.push(...validateThemeSettings(settings, atelierManifest, normalizedContent, runtime.availableCapabilities));
  else diagnostics.push({ severity: 'error', code: 'theme.settings.missing', message: `Settings for selected theme ${selected.id} are missing.` });
  return { configuration, diagnostics };
}

export function diagnosticsForState(diagnostics: ThemeDiagnostic[]) {
  return diagnostics.map(({ severity, message }) => ({ severity, message }));
}

export function themeState(configuration: ThemeConfigurationV1, warnings: ThemeState['warnings'], configAvailable: boolean): ThemeState {
  const selectedTheme = configuration.selectedTheme;
  return {
    selectedTheme: { ...selectedTheme, name: atelierManifest.name },
    installedThemes: [{ id: atelierManifest.id, name: atelierManifest.name, version: atelierManifest.version }],
    warnings,
    configAvailable,
  };
}

export async function readThemeConfiguration(path: string, content: ThemeContent): Promise<{ configuration: ThemeConfigurationV1; exists: boolean; diagnostics: ThemeDiagnostic[] }> {
  let input: unknown;
  let exists = true;
  let bytes: string | undefined;
  try {
    bytes = await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    exists = false;
  }
  if (bytes !== undefined) {
    try { input = JSON.parse(bytes); }
    catch { return { configuration: defaultThemeConfiguration(content), exists, diagnostics: [{ severity: 'error', code: 'theme.config.invalid-json', message: 'The saved theme configuration is not valid JSON. Reapply Atelier to rebuild and repair the configuration.' }] }; }
  } else input = defaultThemeConfiguration(content);
  const result = validateThemeConfiguration(input, content);
  if (!result.configuration || result.diagnostics.some(diagnostic => diagnostic.severity === 'error')) {
    return { configuration: result.configuration ?? defaultThemeConfiguration(content), exists, diagnostics: result.diagnostics };
  }
  return { configuration: result.configuration, exists, diagnostics: result.diagnostics };
}

export async function writeThemeConfiguration(path: string, configuration: ThemeConfigurationV1): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(configuration, null, 2), { flag: 'wx' });
  try {
    await rename(temporaryPath, path);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}
