import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ContentV2Schema } from '../packages/contracts/src/content-v2.js';
import { ensureV2PlacementIdsV1 } from '../packages/contracts/src/content-migration.js';
import { atelierManifest } from '../packages/theme/src/atelier-manifest.js';
import {
  effectiveThemeCapabilities,
  ThemeSettingsV1Schema,
  validateThemeManifest,
  validateThemeSettings,
  type ThemeRuntimeTarget,
} from '../packages/theme/src/contract.js';

const ids = {
  page: '51000000-0000-4000-8000-000000000001',
  collection: '51000000-0000-4000-8000-000000000002',
  categoryField: '51000000-0000-4000-8000-000000000003',
  category: '51000000-0000-4000-8000-000000000004',
  placement: '51000000-0000-4000-8000-000000000005',
  missing: '51000000-0000-4000-8000-000000000099',
};

function contentFixture() {
  return ContentV2Schema.parse({
    version: 2,
    site: { name: 'Theme contract', tagline: '', email: '', phone: '', language: 'en', direction: 'ltr' },
    pages: [{
      id: ids.page,
      slug: 'home',
      title: 'Home',
      published: true,
      description: { source: 'manual', value: '' },
      blocks: [{ type: 'collectionView', placementId: ids.placement, collectionId: ids.collection, view: 'grid', categoryIds: [], sort: 'manual', limit: 12 }],
    }],
    collections: [{
      id: ids.collection, slug: 'works', routeBase: 'portfolio', name: 'Works', kind: 'content',
      listLayout: 'grid', loading: 'show-more', pageSize: 12,
      fields: [{ id: ids.categoryField, type: 'category', label: 'Tags', categories: [{ id: ids.category, slug: 'design', name: 'Design' }] }],
    }],
    items: [],
  });
}

function settingsFixture() {
  return ThemeSettingsV1Schema.parse({
    settingsVersion: 1,
    themeId: atelierManifest.id,
    themeVersion: atelierManifest.version,
    templates: atelierManifest.templates.map(template => ({ role: template.role, templateId: template.id })),
    tokens: { background: '#f5f2eb', foreground: '#272b27', accent: '#9b4937' },
    placements: [{ placementId: ids.placement, sectionId: 'collection-list', collectionId: ids.collection, optionalFieldIds: [ids.categoryField] }],
  });
}

const runtime: ThemeRuntimeTarget = {
  contractVersion: 1,
  contentVersion: 2,
  astroVersion: '7.4.2',
  nodeVersion: '24.13.0',
  availableCapabilities: [
    'content.v2', 'routes.static', 'route.home', 'route.page', 'route.collectionList',
    'route.collectionItem', 'field.text', 'field.richText', 'field.category', 'field.gallery', 'field.link', 'media.webp', 'direction.ltr', 'direction.rtl',
  ],
};

test('Atelier manifest records the verified contract, desktop runtime, and MIT license', () => {
  assert.equal(atelierManifest.manifestVersion, 1);
  assert.equal(atelierManifest.contractVersion, 1);
  assert.equal(atelierManifest.compatibility.astro.testedVersion, '7.4.2');
  assert.equal(atelierManifest.compatibility.node.testedVersion, '24.13.0');
  assert.deepEqual(atelierManifest.localization.directions, ['ltr', 'rtl']);
  assert.deepEqual(atelierManifest.license, { status: 'verified', spdx: 'MIT', sourceFile: 'LICENSE' });
  assert.equal(atelierManifest.adapter.entryPoint, './studio/adapter.ts');
  assert.equal(atelierManifest.adapter.exportName, 'createThemeAdapter');
  assert.equal(atelierManifest.localization.contentLocalePolicy, 'any-bcp47-pass-through');
  assert.deepEqual(validateThemeManifest(atelierManifest, runtime), []);
});

test('Atelier dependency claims match the workspace declarations and lockfile resolutions', async () => {
  const site = JSON.parse(await readFile(new URL('../apps/site/package.json', import.meta.url), 'utf8')) as { dependencies: Record<string, string> };
  const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8')) as { packages: Record<string, { version?: string }> };
  for (const dependency of atelierManifest.dependencies.packages) {
    assert.equal(site.dependencies[dependency.name], dependency.declaredRange);
    const lockKey = dependency.name.startsWith('@astro-static-studio/')
      ? `packages/${dependency.name.slice('@astro-static-studio/'.length)}`
      : `node_modules/${dependency.name}`;
    assert.equal(lock.packages[lockKey]?.version, dependency.resolvedVersion);
  }
});

test('theme compatibility reports unknown versions, incompatible runtimes, and missing required capabilities', () => {
  const unknown = validateThemeManifest({ ...atelierManifest, manifestVersion: 2 }, runtime);
  assert.equal(unknown[0].code, 'theme.manifest.unknown-version');

  const unknownCapability = validateThemeManifest({ ...atelierManifest, capabilities: { ...atelierManifest.capabilities, required: ['unknown.capability'] } }, runtime);
  assert.equal(unknownCapability[0].code, 'theme.manifest.invalid');
  assert.match(unknownCapability[0].message, /required/);

  const escapedEntryPoint = validateThemeManifest({ ...atelierManifest, adapter: { ...atelierManifest.adapter, entryPoint: '././' } }, runtime);
  assert(escapedEntryPoint.some(diagnostic => diagnostic.code === 'theme.manifest.invalid' && diagnostic.message.includes('entryPoint')));

  const incompatible = validateThemeManifest(atelierManifest, { ...runtime, contractVersion: 2, contentVersion: 3, astroVersion: '8.0.0', nodeVersion: '25.0.0' });
  assert.deepEqual(incompatible.map(diagnostic => diagnostic.code), [
    'theme.contract.incompatible', 'theme.content.incompatible', 'theme.astro.incompatible', 'theme.node.incompatible',
  ]);

  const missingRequired = validateThemeManifest(atelierManifest, { ...runtime, availableCapabilities: ['content.v2'] });
  assert(missingRequired.some(diagnostic => diagnostic.code === 'theme.capability.required' && diagnostic.severity === 'error'));
});

test('optional capabilities warn while required capabilities block compatibility', () => {
  const availableCapabilities = runtime.availableCapabilities.filter(capability => capability !== 'field.category' && capability !== 'route.collectionList');
  const unlicensedTheme = { ...atelierManifest, license: { status: 'unknown', reason: 'No license declared.' } };
  const diagnostics = validateThemeManifest(unlicensedTheme, { ...runtime, availableCapabilities });
  assert.equal(diagnostics.some(diagnostic => diagnostic.severity === 'error'), false);
  assert(diagnostics.some(diagnostic => diagnostic.code === 'theme.capability.optional' && diagnostic.message.includes('field.category')));
  assert(diagnostics.some(diagnostic => diagnostic.code === 'theme.capability.optional' && diagnostic.message.includes('route.collectionList')));
  assert(diagnostics.some(diagnostic => diagnostic.code === 'theme.license.unknown'));

  const optionalSettings = validateThemeSettings(settingsFixture(), atelierManifest, contentFixture(), availableCapabilities);
  assert(optionalSettings.some(diagnostic => diagnostic.code === 'theme.settings.optional-field-omitted' && diagnostic.severity === 'warning'));
  assert(optionalSettings.some(diagnostic => diagnostic.code === 'theme.settings.optional-placement-omitted' && diagnostic.severity === 'warning'));
  assert(!effectiveThemeCapabilities(atelierManifest, { ...runtime, availableCapabilities }).includes('field.category'));
});

test('theme settings validate template, token, stable placement, collection, and optional field IDs', () => {
  const content = contentFixture();
  assert.deepEqual(validateThemeSettings(settingsFixture(), atelierManifest, content, runtime.availableCapabilities), []);

  const unknownVersion = validateThemeSettings({ ...settingsFixture(), settingsVersion: 2 }, atelierManifest, content, runtime.availableCapabilities);
  assert.equal(unknownVersion[0].code, 'theme.settings.unknown-version');

  const broken = settingsFixture();
  broken.placements[0].optionalFieldIds[0] = ids.missing;
  const diagnostics = validateThemeSettings(broken, atelierManifest, content, runtime.availableCapabilities);
  assert(diagnostics.some(diagnostic => diagnostic.code === 'theme.settings.field-missing'));

  const noPlacement = contentFixture();
  delete noPlacement.pages[0].blocks[0].placementId;
  const missingPlacement = validateThemeSettings(settingsFixture(), atelierManifest, noPlacement, runtime.availableCapabilities);
  assert(missingPlacement.some(diagnostic => diagnostic.code === 'theme.settings.placement-missing'));

  const rtl = contentFixture();
  rtl.site.direction = 'rtl';
  assert.deepEqual(validateThemeSettings(settingsFixture(), atelierManifest, rtl, runtime.availableCapabilities), []);
  const ltrOnlyManifest = structuredClone(atelierManifest);
  ltrOnlyManifest.localization.directions = ['ltr'];
  ltrOnlyManifest.capabilities.required = ltrOnlyManifest.capabilities.required.filter(capability => capability !== 'direction.rtl');
  const unsupportedDirection = validateThemeSettings(settingsFixture(), ltrOnlyManifest, rtl, runtime.availableCapabilities);
  assert(unsupportedDirection.some(diagnostic => diagnostic.code === 'theme.direction.unsupported'));

  const badLocale = contentFixture();
  badLocale.site.language = 'english_us';
  const invalidLocale = validateThemeSettings(settingsFixture(), atelierManifest, badLocale, runtime.availableCapabilities);
  assert(invalidLocale.some(diagnostic => diagnostic.code === 'theme.locale.invalid'));

  const emptyV2 = ContentV2Schema.parse({ version: 2, site: { name: 'Empty', tagline: '', email: '', phone: '', language: 'en', direction: 'ltr' }, pages: [], collections: [], items: [] });
  const emptySettings = settingsFixture();
  emptySettings.placements = [];
  assert.deepEqual(validateThemeSettings(emptySettings, atelierManifest, emptyV2, runtime.availableCapabilities), []);

  const incompatibleSection = settingsFixture();
  incompatibleSection.placements[0].sectionId = 'gallery';
  const sectionMismatch = validateThemeSettings(incompatibleSection, atelierManifest, content, runtime.availableCapabilities);
  assert(sectionMismatch.some(diagnostic => diagnostic.code === 'theme.settings.section-incompatible'));

  const routeOnlyManifest = structuredClone(atelierManifest);
  routeOnlyManifest.sections.push({ id: 'detail-only', blockTypes: ['collectionView'], routeRoles: ['collectionItem'] });
  const wrongRouteSection = settingsFixture();
  wrongRouteSection.placements[0].sectionId = 'detail-only';
  const routeMismatch = validateThemeSettings(wrongRouteSection, routeOnlyManifest, content, runtime.availableCapabilities);
  assert(routeMismatch.some(diagnostic => diagnostic.code === 'theme.settings.section-role-incompatible'));

  const noCategorySupport = structuredClone(atelierManifest);
  noCategorySupport.capabilities.optional = noCategorySupport.capabilities.optional.filter(capability => capability !== 'field.category');
  const unsupportedField = validateThemeSettings(settingsFixture(), noCategorySupport, content, runtime.availableCapabilities);
  assert(unsupportedField.some(diagnostic => diagnostic.code === 'theme.settings.capability-unsupported'));
});

test('placement migration assigns deterministic IDs, preserves assigned IDs, and rejects duplicates', () => {
  const legacy = contentFixture();
  delete legacy.pages[0].blocks[0].placementId;
  const once = ensureV2PlacementIdsV1(legacy);
  const twice = ensureV2PlacementIdsV1(legacy);
  const placementId = once.pages[0].blocks[0].placementId;
  assert.match(placementId ?? '', /^[0-9a-f-]{36}$/);
  assert.equal(twice.pages[0].blocks[0].placementId, placementId);

  const reassigned = ensureV2PlacementIdsV1(once);
  assert.equal(reassigned.pages[0].blocks[0].placementId, placementId);

  const duplicate = structuredClone(once);
  duplicate.pages[0].blocks.push({ ...duplicate.pages[0].blocks[0], type: 'image' });
  assert.equal(ContentV2Schema.safeParse(duplicate).success, false);

  const deterministic = contentFixture();
  deterministic.pages[0].blocks = [{
    type: 'richText',
    document: { type: 'document', blocks: [{ type: 'paragraph', size: 'normal', align: 'start', children: [{ type: 'text', text: 'Welcome', marks: [] }] }] },
  }];
  const assigned = ensureV2PlacementIdsV1(deterministic);
  const assignedAgain = ensureV2PlacementIdsV1(deterministic);
  assert.match(assigned.pages[0].blocks[0].placementId ?? '', /^[0-9a-f-]{36}$/);
  assert.equal(assigned.pages[0].blocks[0].placementId?.[14], '8', 'custom SHA-256 placement IDs use the UUIDv8 version nibble');
  assert.equal(assigned.pages[0].blocks[0].placementId, assignedAgain.pages[0].blocks[0].placementId);

  const legacyText = contentFixture();
  legacyText.pages[0].blocks = [{
    type: 'richText',
    document: { type: 'document', blocks: [{ type: 'paragraph', size: 'normal', align: 'start', children: [{ type: 'text', text: 'original', marks: [] }] }] },
  }];
  const originalId = ensureV2PlacementIdsV1(legacyText).pages[0].blocks[0].placementId;
  const editedBeforeMigration = structuredClone(legacyText);
  editedBeforeMigration.pages[0].blocks.unshift({
    type: 'richText',
    document: { type: 'document', blocks: [{ type: 'paragraph', size: 'normal', align: 'start', children: [{ type: 'text', text: 'inserted', marks: [] }] }] },
  });
  const afterInsertion = ensureV2PlacementIdsV1(editedBeforeMigration);
  assert.equal(afterInsertion.pages[0].blocks[1].placementId, originalId, 'inserting a different same-type block must not reuse the prior ID');

  const identical = structuredClone(legacyText);
  identical.pages[0].blocks.push(structuredClone(identical.pages[0].blocks[0]));
  const identicalWithIds = ensureV2PlacementIdsV1(identical);
  assert.notEqual(identicalWithIds.pages[0].blocks[0].placementId, identicalWithIds.pages[0].blocks[1].placementId);

  const partiallyMigrated = structuredClone(identical);
  partiallyMigrated.pages[0].blocks[0].placementId = originalId;
  const partiallyMigratedIds = ensureV2PlacementIdsV1(partiallyMigrated);
  assert.equal(partiallyMigratedIds.pages[0].blocks[0].placementId, originalId);
  assert.notEqual(partiallyMigratedIds.pages[0].blocks[0].placementId, partiallyMigratedIds.pages[0].blocks[1].placementId);
});
