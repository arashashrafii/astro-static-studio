import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { exportBackup, restoreBackup, type BackupPaths } from '../apps/api/src/backup.js';
import { ContentV2Schema, collectionItemDescription, type ContentV2 } from '../packages/contracts/src/content-v2.js';

const ids = {
  page: '40000000-0000-4000-8000-000000000001',
  collection: '40000000-0000-4000-8000-000000000002',
  item: '40000000-0000-4000-8000-000000000003',
  categoryField: '40000000-0000-4000-8000-000000000004',
  category: '40000000-0000-4000-8000-000000000005',
  richTextField: '40000000-0000-4000-8000-000000000006',
  missing: '40000000-0000-4000-8000-000000000099',
};

const ThemeMappingSettingsSchema = z.object({
  version: z.literal(1),
  themeId: z.literal('atelier'),
  placements: z.array(z.object({
    pageId: z.string().uuid(),
    blockIndex: z.number().int().nonnegative(),
    collectionId: z.string().uuid(),
    section: z.enum(['featured', 'recent']),
    displayPreset: z.enum(['featured-grid', 'compact-list']),
    optionalCategoryFieldId: z.string().uuid(),
  })).min(1),
});

type ThemeMappingSettings = z.infer<typeof ThemeMappingSettingsSchema>;

function fixture(): ContentV2 {
  return ContentV2Schema.parse({
    version: 2,
    site: { name: 'Mapping PoC', tagline: '', email: '', phone: '', language: 'en', direction: 'ltr' },
    pages: [{
      id: ids.page, slug: 'home', title: 'Home', published: true,
      description: { source: 'manual', value: '' },
      blocks: [
        { type: 'collectionView', collectionId: ids.collection, view: 'grid', categoryIds: [], sort: 'manual', limit: 12 },
        { type: 'collectionView', collectionId: ids.collection, view: 'grid', categoryIds: [], sort: 'manual', limit: 12 },
      ],
    }],
    collections: [{
      id: ids.collection, slug: 'works', routeBase: 'portfolio', name: 'Works',
      kind: 'content', listLayout: 'grid', loading: 'show-more', pageSize: 12,
      excerptSourceFieldId: ids.richTextField,
      fields: [
        { id: ids.categoryField, type: 'category', label: 'Tags', categories: [{ id: ids.category, slug: 'design', name: 'Design' }] },
        { id: ids.richTextField, type: 'text', format: 'rich', label: 'Details' },
      ],
    }],
    items: [{
      id: ids.item, collectionId: ids.collection, slug: 'sample', title: 'Sample item', published: true,
      description: { source: 'auto' },
      values: {
        [ids.categoryField]: [ids.category],
        [ids.richTextField]: { type: 'document', blocks: [{ type: 'paragraph', size: 'normal', align: 'start', children: [{ type: 'text', text: 'One source record', marks: [] }] }] },
      },
    }],
  });
}

function mappingSettings(): ThemeMappingSettings {
  return ThemeMappingSettingsSchema.parse({
    version: 1,
    themeId: 'atelier',
    placements: [
      { pageId: ids.page, blockIndex: 0, collectionId: ids.collection, section: 'featured', displayPreset: 'featured-grid', optionalCategoryFieldId: ids.categoryField },
      { pageId: ids.page, blockIndex: 1, collectionId: ids.collection, section: 'recent', displayPreset: 'compact-list', optionalCategoryFieldId: ids.categoryField },
    ],
  });
}

function mapPlacement(content: ContentV2, settings: ThemeMappingSettings, placementIndex: number) {
  const placement = settings.placements[placementIndex];
  if (!placement) throw new Error(`Unknown placement at index ${placementIndex}.`);
  const page = content.pages.find(candidate => candidate.id === placement.pageId);
  const block = page?.blocks[placement.blockIndex];
  if (block?.type !== 'collectionView' || block.collectionId !== placement.collectionId) {
    throw new Error(`Placement ${placement.section} does not reference its configured Collection.`);
  }
  const collection = content.collections.find(candidate => candidate.id === placement.collectionId);
  if (!collection) throw new Error(`Unknown Collection ${placement.collectionId}.`);
  const optionalField = collection.fields.find(candidate => candidate.id === placement.optionalCategoryFieldId);
  if (!optionalField || optionalField.type !== 'category') {
    throw new Error(`Unknown Category field ${placement.optionalCategoryFieldId} in Collection ${collection.id}.`);
  }
  return {
    section: placement.section,
    displayPreset: placement.displayPreset,
    cards: content.items.filter(item => item.collectionId === collection.id && item.published).map(item => ({
      source: item,
      id: item.id,
      title: item.title ?? '',
      coverImage: item.coverImage,
      description: collectionItemDescription(collection, item),
      optionalCategories: ((item.values[optionalField.id] ?? []) as string[])
        .map(categoryId => optionalField.categories.find(category => category.id === categoryId)?.name)
        .filter((name): name is string => Boolean(name)),
    })),
  };
}

test('PoC maps one Collection into two template sections without copying records', () => {
  const content = fixture();
  const before = JSON.stringify(content);
  const settings = mappingSettings();
  const featured = mapPlacement(content, settings, 0);
  const recent = mapPlacement(content, settings, 1);

  assert.equal(featured.displayPreset, 'featured-grid');
  assert.equal(recent.displayPreset, 'compact-list');
  assert.deepEqual(featured.cards.map(card => card.id), recent.cards.map(card => card.id));
  assert.strictEqual(featured.cards[0].source, recent.cards[0].source);
  assert.deepEqual({ title: featured.cards[0].title, description: featured.cards[0].description, tags: featured.cards[0].optionalCategories }, {
    title: 'Sample item', description: 'One source record', tags: ['Design'],
  });
  assert.equal(JSON.stringify(content), before, 'mapping must not mutate canonical content');

  content.items[0].title = 'Edited once';
  assert.equal(mapPlacement(content, settings, 0).cards[0].title, 'Edited once');
  assert.equal(mapPlacement(content, settings, 1).cards[0].title, 'Edited once');
});

test('PoC rejects unknown fields and invalid or unsupported placements clearly', () => {
  const content = fixture();
  const settings = mappingSettings();
  settings.placements[0].optionalCategoryFieldId = ids.missing;
  assert.throws(() => mapPlacement(content, settings, 0), /Unknown Category field/);

  const invalidReference = structuredClone(content);
  const block = invalidReference.pages[0].blocks[0];
  if (block.type === 'collectionView') block.collectionId = ids.missing;
  assert.equal(ContentV2Schema.safeParse(invalidReference).success, false);

  const unsupportedBlock = structuredClone(content) as unknown as { pages: Array<{ blocks: unknown[] }> };
  unsupportedBlock.pages[0].blocks[0] = { type: 'customMarkup' };
  assert.equal(ContentV2Schema.safeParse(unsupportedBlock).success, false);
});

test('PoC sidecar preserves external mappings through a backup and restore round-trip', async t => {
  const root = await mkdtemp(join(tmpdir(), 'astro-collection-mapping-poc-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source: BackupPaths = { contentPath: join(root, 'source', 'content.json'), mediaDirectory: join(root, 'source', 'media'), tempDirectory: root };
  const target: BackupPaths = { contentPath: join(root, 'target', 'content.json'), mediaDirectory: join(root, 'target', 'media'), tempDirectory: root };
  await mkdir(join(root, 'source'), { recursive: true });
  const content = fixture();
  const settings = mappingSettings();

  // Current Studio backups cover canonical content and media; this wrapper is the isolated settings-bundle PoC.
  const envelope = JSON.stringify({
    format: 'astro-static-studio-theme-settings-poc',
    version: 1,
    siteBackup: JSON.parse((await exportBackup(source, content)).toString('utf8')),
    themeSettings: settings,
  });
  const restored = JSON.parse(envelope) as { siteBackup: Buffer | string; themeSettings: unknown };
  await mkdir(join(root, 'target'), { recursive: true });
  await restoreBackup(JSON.stringify(restored.siteBackup), target);
  const restoredContent = ContentV2Schema.parse(JSON.parse(await readFile(target.contentPath, 'utf8')));
  const restoredSettings = ThemeMappingSettingsSchema.parse(restored.themeSettings);
  assert.deepEqual(restoredSettings, settings);
  assert.deepEqual(mapPlacement(restoredContent, restoredSettings, 0).cards.map(card => card.id), [ids.item]);
  assert.deepEqual(mapPlacement(restoredContent, restoredSettings, 1).cards.map(card => card.id), [ids.item]);
});
