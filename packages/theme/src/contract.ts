import { z } from 'zod';
import type { Content } from '@astro-static-studio/contracts';
import type { ContentV2, PageBlockV2 } from '@astro-static-studio/contracts/content-v2';

export const THEME_CONTRACT_VERSION = 1 as const;

export const ThemeRouteRoleSchema = z.enum(['home', 'page', 'collectionList', 'collectionItem']);
export type ThemeRouteRole = z.infer<typeof ThemeRouteRoleSchema>;

export const ThemeCapabilitySchema = z.enum([
  'content.v1', 'content.v2', 'routes.static', 'route.home', 'route.page',
  'route.collectionList', 'route.collectionItem', 'field.text', 'field.richText',
  'field.category', 'field.gallery', 'field.link', 'media.webp', 'direction.ltr', 'direction.rtl',
]);
export type ThemeCapability = z.infer<typeof ThemeCapabilitySchema>;

const IdentifierSchema = z.string().regex(/^[a-z][a-zA-Z0-9]*(?:[.-][a-zA-Z0-9]+)*$/);
const SemverSchema = z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
const VersionRangeSchema = z.object({ minInclusive: SemverSchema, maxExclusive: SemverSchema }).strict().superRefine((range, ctx) => {
  if (compareVersion(range.minInclusive, range.maxExclusive) >= 0) {
    ctx.addIssue({ code: 'custom', path: ['maxExclusive'], message: 'Maximum exclusive version must be greater than minimum.' });
  }
});

const RuntimeCompatibilitySchema = z.object({ range: VersionRangeSchema, testedVersion: SemverSchema }).strict().superRefine((value, ctx) => {
  if (!inRange(value.testedVersion, value.range)) {
    ctx.addIssue({ code: 'custom', path: ['testedVersion'], message: 'Tested version must be inside the declared compatibility range.' });
  }
});

const CapabilitySetSchema = z.object({
  required: z.array(ThemeCapabilitySchema),
  optional: z.array(ThemeCapabilitySchema),
}).strict().superRefine((set, ctx) => {
  const required = new Set(set.required);
  set.optional.forEach((capability, index) => {
    if (required.has(capability)) ctx.addIssue({ code: 'custom', path: ['optional', index], message: `Capability ${capability} cannot be both required and optional.` });
  });
  const seen = new Set<string>();
  for (const [key, capabilities] of Object.entries(set)) capabilities.forEach((capability, index) => {
    if (seen.has(capability)) ctx.addIssue({ code: 'custom', path: [key, index], message: `Duplicate capability ${capability}.` });
    seen.add(capability);
  });
});

const LicenseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('verified'), spdx: z.string().min(1), sourceFile: z.string().min(1) }).strict(),
  z.object({ status: z.literal('unknown'), reason: z.string().min(1) }).strict(),
]);

const ThemeSectionSchema = z.object({
  id: IdentifierSchema,
  blockTypes: z.array(z.enum(['richText', 'gallery', 'image', 'collectionView'])).min(1),
  routeRoles: z.array(ThemeRouteRoleSchema).min(1),
}).strict();

const ThemeDependencySchema = z.object({
  name: z.string().min(1),
  declaredRange: z.string().min(1),
  resolvedVersion: SemverSchema,
}).strict();
const AdapterEntryPointSchema = z.string().regex(/^\.\/[A-Za-z0-9._/-]+$/).refine(value => {
  const segments = value.slice(2).split('/');
  return segments.every(segment => segment.length > 0 && segment !== '.' && segment !== '..');
}, 'Adapter entry points must stay inside the theme package.');

export const ThemeManifestV1Schema = z.object({
  manifestVersion: z.literal(1),
  /** Version of the Studio adapter API, independent of the manifest shape version. */
  contractVersion: z.number().int().positive(),
  id: IdentifierSchema,
  name: z.string().trim().min(1).max(100),
  version: SemverSchema,
  adapter: z.object({ entryPoint: AdapterEntryPointSchema, exportName: IdentifierSchema }).strict(),
  compatibility: z.object({
    contentVersions: z.array(z.union([z.literal(1), z.literal(2)])).min(1),
    astro: RuntimeCompatibilitySchema,
    node: RuntimeCompatibilitySchema,
  }).strict(),
  templates: z.array(z.object({ id: IdentifierSchema, role: ThemeRouteRoleSchema }).strict()).min(1),
  sections: z.array(ThemeSectionSchema),
  capabilities: CapabilitySetSchema,
  localization: z.object({ contentLocalePolicy: z.literal('any-bcp47-pass-through'), directions: z.array(z.enum(['ltr', 'rtl'])).min(1) }).strict(),
  designTokens: z.record(IdentifierSchema, z.object({ type: z.literal('color'), default: z.string().regex(/^#[0-9a-fA-F]{6}$/) }).strict()),
  license: LicenseSchema,
  dependencies: z.object({ lockfile: z.string().min(1), packages: z.array(ThemeDependencySchema) }).strict(),
}).strict().superRefine((manifest, ctx) => {
  const templateIds = new Set<string>();
  const roles = new Set<string>();
  manifest.templates.forEach((template, index) => {
    if (templateIds.has(template.id)) ctx.addIssue({ code: 'custom', path: ['templates', index, 'id'], message: 'Template IDs must be unique.' });
    if (roles.has(template.role)) ctx.addIssue({ code: 'custom', path: ['templates', index, 'role'], message: 'A manifest may declare one template per route role.' });
    templateIds.add(template.id);
    roles.add(template.role);
  });
  if (new Set(manifest.sections.map(section => section.id)).size !== manifest.sections.length) {
    ctx.addIssue({ code: 'custom', path: ['sections'], message: 'Section IDs must be unique.' });
  }
  const templateRoles = new Set(manifest.templates.map(template => template.role));
  manifest.sections.forEach((section, index) => {
    if (section.routeRoles.some(role => !templateRoles.has(role))) ctx.addIssue({ code: 'custom', path: ['sections', index, 'routeRoles'], message: `Section ${section.id} names a route role without a declared template.` });
    if (new Set(section.routeRoles).size !== section.routeRoles.length) ctx.addIssue({ code: 'custom', path: ['sections', index, 'routeRoles'], message: `Section ${section.id} has duplicate route roles.` });
  });
  if (new Set(manifest.compatibility.contentVersions).size !== manifest.compatibility.contentVersions.length) {
    ctx.addIssue({ code: 'custom', path: ['compatibility', 'contentVersions'], message: 'Content versions must be unique.' });
  }
  if (new Set(manifest.dependencies.packages.map(dependency => dependency.name)).size !== manifest.dependencies.packages.length) {
    ctx.addIssue({ code: 'custom', path: ['dependencies', 'packages'], message: 'Dependency names must be unique.' });
  }
});

export type ThemeManifestV1 = z.infer<typeof ThemeManifestV1Schema>;

export const ThemeSettingsV1Schema = z.object({
  settingsVersion: z.literal(1),
  themeId: IdentifierSchema,
  themeVersion: SemverSchema,
  templates: z.array(z.object({ role: ThemeRouteRoleSchema, templateId: IdentifierSchema }).strict()),
  tokens: z.record(IdentifierSchema, z.string()),
  placements: z.array(z.object({
    placementId: z.string().uuid(),
    sectionId: IdentifierSchema,
    collectionId: z.string().uuid().optional(),
    optionalFieldIds: z.array(z.string().uuid()),
  }).strict()),
}).strict().superRefine((settings, ctx) => {
  const roles = new Set<string>();
  settings.templates.forEach((template, index) => {
    if (roles.has(template.role)) ctx.addIssue({ code: 'custom', path: ['templates', index, 'role'], message: 'Theme settings may select one template per route role.' });
    roles.add(template.role);
  });
  const placements = new Set<string>();
  settings.placements.forEach((placement, index) => {
    if (placements.has(placement.placementId)) ctx.addIssue({ code: 'custom', path: ['placements', index, 'placementId'], message: 'A placement may be mapped only once per theme.' });
    placements.add(placement.placementId);
    if (new Set(placement.optionalFieldIds).size !== placement.optionalFieldIds.length) {
      ctx.addIssue({ code: 'custom', path: ['placements', index, 'optionalFieldIds'], message: 'Optional field IDs must be unique.' });
    }
  });
});

export type ThemeSettingsV1 = z.infer<typeof ThemeSettingsV1Schema>;

export interface ThemeAdapterInput {
  content: Content | ContentV2;
  settings: ThemeSettingsV1;
  manifest: ThemeManifestV1;
  availableCapabilities: readonly ThemeCapability[];
}

export interface ThemeRouteModel {
  role: ThemeRouteRole;
  path: string;
  templateId: string;
  data: unknown;
}

export interface StudioThemeAdapter {
  contractVersion: typeof THEME_CONTRACT_VERSION;
  map(input: ThemeAdapterInput): ThemeRouteModel[];
}

export interface ThemeDiagnostic {
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

export interface ThemeRuntimeTarget {
  contractVersion: number;
  contentVersion: number;
  astroVersion: string;
  nodeVersion: string;
  availableCapabilities: readonly ThemeCapability[];
}

export function validateThemeManifest(input: unknown, target: ThemeRuntimeTarget): ThemeDiagnostic[] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return [{ severity: 'error', code: 'theme.manifest.invalid', message: 'Theme manifest must be a JSON object.' }];
  }
  const raw = input as Record<string, unknown>;
  if (raw.manifestVersion !== 1) {
    return [{ severity: 'error', code: 'theme.manifest.unknown-version', message: `Theme manifest version ${String(raw.manifestVersion)} is not supported. Expected version 1.` }];
  }
  const parsed = ThemeManifestV1Schema.safeParse(input);
  if (!parsed.success) {
    return parsed.error.issues.map(issue => ({
      severity: 'error',
      code: 'theme.manifest.invalid',
      message: `${issue.path.join('.') || 'manifest'}: ${issue.message}`,
    }));
  }
  const manifest = parsed.data;
  const diagnostics: ThemeDiagnostic[] = [];
  if (manifest.contractVersion !== target.contractVersion) diagnostics.push({ severity: 'error', code: 'theme.contract.incompatible', message: `Theme requires Studio theme contract ${manifest.contractVersion}; this build provides ${target.contractVersion}.` });
  if (!manifest.compatibility.contentVersions.includes(target.contentVersion as 1 | 2)) diagnostics.push({ severity: 'error', code: 'theme.content.incompatible', message: `Theme ${manifest.id} does not support Content V${target.contentVersion}.` });
  if (!inRange(target.astroVersion, manifest.compatibility.astro.range)) diagnostics.push({ severity: 'error', code: 'theme.astro.incompatible', message: `Theme ${manifest.id} requires Astro ${formatRange(manifest.compatibility.astro.range)}; found ${target.astroVersion}.` });
  if (!inRange(target.nodeVersion, manifest.compatibility.node.range)) diagnostics.push({ severity: 'error', code: 'theme.node.incompatible', message: `Theme ${manifest.id} requires Node ${formatRange(manifest.compatibility.node.range)}; found ${target.nodeVersion}.` });
  for (const capability of manifest.capabilities.required) {
    if (!target.availableCapabilities.includes(capability)) diagnostics.push({ severity: 'error', code: 'theme.capability.required', message: `Theme ${manifest.id} requires unsupported capability ${capability}.` });
  }
  for (const capability of manifest.capabilities.optional) {
    if (!target.availableCapabilities.includes(capability)) diagnostics.push({ severity: 'warning', code: 'theme.capability.optional', message: `Theme ${manifest.id} will omit optional capability ${capability}.` });
  }
  if (manifest.license.status === 'unknown') diagnostics.push({ severity: 'warning', code: 'theme.license.unknown', message: `License metadata for theme ${manifest.id} is unknown; do not assume redistribution rights.` });
  return diagnostics;
}

export function effectiveThemeCapabilities(manifest: ThemeManifestV1, target: ThemeRuntimeTarget): ThemeCapability[] {
  return [...manifest.capabilities.required, ...manifest.capabilities.optional]
    .filter(capability => target.availableCapabilities.includes(capability));
}

export function validateThemeSettings(input: unknown, manifest: ThemeManifestV1, content: Content | ContentV2, availableCapabilities: readonly ThemeCapability[]): ThemeDiagnostic[] {
  if (!input || typeof input !== 'object' || Array.isArray(input) || (input as Record<string, unknown>).settingsVersion !== 1) {
    const version = input && typeof input === 'object' ? String((input as Record<string, unknown>).settingsVersion) : 'missing';
    return [{ severity: 'error', code: 'theme.settings.unknown-version', message: `Theme settings version ${version} is not supported. Expected version 1.` }];
  }
  const parsed = ThemeSettingsV1Schema.safeParse(input);
  if (!parsed.success) return parsed.error.issues.map(issue => ({ severity: 'error', code: 'theme.settings.invalid', message: `${issue.path.join('.') || 'settings'}: ${issue.message}` }));
  const settings = parsed.data;
  const diagnostics: ThemeDiagnostic[] = [];
  if (settings.themeId !== manifest.id || settings.themeVersion !== manifest.version) diagnostics.push({ severity: 'error', code: 'theme.settings.theme-mismatch', message: `Settings target ${settings.themeId}@${settings.themeVersion}, but manifest is ${manifest.id}@${manifest.version}.` });
  const direction = content.version === 1 ? 'ltr' : content.site.direction;
  if (!manifest.localization.directions.includes(direction)) diagnostics.push({ severity: 'error', code: 'theme.direction.unsupported', message: `Theme ${manifest.id} does not declare ${direction.toUpperCase()} direction support.` });
  if (content.version === 2 && !isLanguageTag(content.site.language)) diagnostics.push({ severity: 'error', code: 'theme.locale.invalid', message: `Content locale ${content.site.language} is not a valid BCP 47 language tag.` });
  const templates = new Map(manifest.templates.map(template => [template.role, template.id]));
  settings.templates.forEach(template => {
    if (templates.get(template.role) !== template.templateId) diagnostics.push({ severity: 'error', code: 'theme.settings.template-unknown', message: `Template ${template.templateId} is not declared for route role ${template.role}.` });
  });
  for (const template of manifest.templates) {
    if (!settings.templates.some(selected => selected.role === template.role)) diagnostics.push({ severity: 'error', code: 'theme.settings.template-missing', message: `Theme settings must select a template for route role ${template.role}.` });
  }
  for (const [tokenId, value] of Object.entries(settings.tokens)) {
    if (!manifest.designTokens[tokenId]) diagnostics.push({ severity: 'error', code: 'theme.settings.token-unknown', message: `Design token ${tokenId} is not declared by theme ${manifest.id}.` });
    else if (!/^#[0-9a-fA-F]{6}$/.test(value)) diagnostics.push({ severity: 'error', code: 'theme.settings.token-invalid', message: `Design token ${tokenId} must be a six-digit hex color.` });
  }
  const v2Content = content.version === 2 ? content : undefined;
  const blocks = new Map<string, { block: PageBlockV2; role: 'home' | 'page' }>();
  for (const page of v2Content?.pages ?? []) {
    const role: 'home' | 'page' = page.slug === 'home' ? 'home' : 'page';
    for (const block of page.blocks) if (block.placementId) blocks.set(block.placementId, { block, role });
  }
  const collections = new Map(v2Content?.collections.map(collection => [collection.id, collection]) ?? []);
  for (const placement of settings.placements) {
    const section = manifest.sections.find(candidate => candidate.id === placement.sectionId);
    if (!section) diagnostics.push({ severity: 'error', code: 'theme.settings.section-unknown', message: `Section ${placement.sectionId} is not declared by theme ${manifest.id}.` });
    const resolvedPlacement = blocks.get(placement.placementId);
    if (!resolvedPlacement) {
      diagnostics.push({ severity: 'error', code: 'theme.settings.placement-missing', message: `Placement ${placement.placementId} is not in Content V2. Run placement identity migration before applying theme settings.` });
      continue;
    }
    const { block, role } = resolvedPlacement;
    if (section && !section.blockTypes.includes(block.type)) diagnostics.push({ severity: 'error', code: 'theme.settings.section-incompatible', message: `Section ${section.id} cannot render ${block.type} placements.` });
    if (section && !section.routeRoles.includes(role)) diagnostics.push({ severity: 'error', code: 'theme.settings.section-role-incompatible', message: `Section ${section.id} cannot be used by the ${role} route template.` });
    if (block.type === 'collectionView' && !placement.collectionId) {
      diagnostics.push({ severity: 'error', code: 'theme.settings.collection-missing', message: `Collection placement ${placement.placementId} must name its Collection ID.` });
      continue;
    }
    if (block.type === 'collectionView') {
      // A Collection view links to the Collection list and item routes. Both route
      // capabilities are dependencies of this one placement in the first renderer.
      for (const capability of ['route.collectionList', 'route.collectionItem'] as const) {
        const declared = [...manifest.capabilities.required, ...manifest.capabilities.optional].includes(capability);
        if (!declared) {
          diagnostics.push({ severity: 'error', code: 'theme.settings.capability-unsupported', message: `Theme ${manifest.id} does not declare support for ${capability}.` });
        } else if (!availableCapabilities.includes(capability)) {
          const required = manifest.capabilities.required.includes(capability);
          diagnostics.push({
            severity: required ? 'error' : 'warning',
            code: required ? 'theme.settings.required-placement-unavailable' : 'theme.settings.optional-placement-omitted',
            message: required
              ? `Required Collection placement capability ${capability} is unavailable for theme ${manifest.id}.`
              : `Collection placement ${placement.placementId} will be omitted because capability ${capability} is unavailable.`,
          });
        }
      }
    }
    if (placement.collectionId) {
      if (block.type !== 'collectionView' || block.collectionId !== placement.collectionId) {
        diagnostics.push({ severity: 'error', code: 'theme.settings.collection-mismatch', message: `Placement ${placement.placementId} does not reference Collection ${placement.collectionId}.` });
        continue;
      }
      const collection = collections.get(placement.collectionId);
      if (!collection) {
        diagnostics.push({ severity: 'error', code: 'theme.settings.collection-missing', message: `Collection ${placement.collectionId} does not exist.` });
        continue;
      }
      for (const fieldId of placement.optionalFieldIds) {
        const field = collection.fields.find(candidate => candidate.id === fieldId);
        if (!field) {
          diagnostics.push({ severity: 'error', code: 'theme.settings.field-missing', message: `Optional field ${fieldId} is not declared in Collection ${collection.id}.` });
          continue;
        }
        const capability: ThemeCapability = field.type === 'text'
          ? field.format === 'rich' ? 'field.richText' : 'field.text'
          : field.type === 'category' ? 'field.category'
            : field.type === 'gallery' ? 'field.gallery' : 'field.link';
        if (![...manifest.capabilities.required, ...manifest.capabilities.optional].includes(capability)) {
          diagnostics.push({ severity: 'error', code: 'theme.settings.capability-unsupported', message: `Theme ${manifest.id} does not declare support for field capability ${capability}.` });
        } else if (!availableCapabilities.includes(capability)) {
          const required = manifest.capabilities.required.includes(capability);
          diagnostics.push({
            severity: required ? 'error' : 'warning',
            code: required ? 'theme.settings.required-field-unavailable' : 'theme.settings.optional-field-omitted',
            message: required
              ? `Required field capability ${capability} is unavailable for theme ${manifest.id}.`
              : `Optional field ${fieldId} will be omitted because capability ${capability} is unavailable.`,
          });
        }
      }
    } else if (placement.optionalFieldIds.length) {
      diagnostics.push({ severity: 'error', code: 'theme.settings.field-without-collection', message: `Placement ${placement.placementId} names optional fields but no Collection.` });
    }
  }
  return diagnostics;
}

function parseVersion(value: string): [number, number, number] {
  return value.split('.').map(Number) as [number, number, number];
}

function compareVersion(left: string, right: string): number {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let index = 0; index < 3; index += 1) if (a[index] !== b[index]) return a[index] - b[index];
  return 0;
}

function inRange(version: string, range: z.infer<typeof VersionRangeSchema>): boolean {
  const normalized = version.startsWith('v') ? version.slice(1) : version;
  return SemverSchema.safeParse(normalized).success && compareVersion(normalized, range.minInclusive) >= 0 && compareVersion(normalized, range.maxExclusive) < 0;
}

function formatRange(range: z.infer<typeof VersionRangeSchema>): string {
  return `>=${range.minInclusive} <${range.maxExclusive}`;
}

function isLanguageTag(value: string): boolean {
  try {
    return Intl.getCanonicalLocales(value).length === 1;
  } catch {
    return false;
  }
}
