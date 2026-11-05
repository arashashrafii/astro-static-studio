import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ContentSchema } from '../packages/contracts/src/index.js';
import { ContentV2Schema } from '../packages/contracts/src/content-v2.js';
import { atelierManifest } from '../packages/theme/src/atelier-manifest.js';
import {
  assertUniqueRoutes,
  createAtelierDefaultSettings,
  createThemeAdapter,
  type AtelierRouteData,
} from '../packages/theme/src/studio/adapter.js';
import { validateThemeSettings, type ThemeAdapterInput, type ThemeCapability, type ThemeRouteModel } from '../packages/theme/src/contract.js';

const ids = {
  homePage: '52000000-0000-4000-8000-000000000001',
  aboutPage: '52000000-0000-4000-8000-000000000002',
  collection: '52000000-0000-4000-8000-000000000003',
  textField: '52000000-0000-4000-8000-000000000004',
  richField: '52000000-0000-4000-8000-000000000005',
  categoryField: '52000000-0000-4000-8000-000000000006',
  galleryField: '52000000-0000-4000-8000-000000000007',
  itemOne: '52000000-0000-4000-8000-000000000008',
  itemTwo: '52000000-0000-4000-8000-000000000009',
  category: '52000000-0000-4000-8000-000000000010',
  placement: '52000000-0000-4000-8000-000000000011',
  itemThree: '52000000-0000-4000-8000-000000000012',
  itemFour: '52000000-0000-4000-8000-000000000013',
  itemFive: '52000000-0000-4000-8000-000000000014',
  image: '52000000-0000-4000-8000-000000000015',
};
const mediaSrc = `/media/${ids.image}.webp`;

function v2Fixture() {
  return ContentV2Schema.parse({
    version: 2,
    site: { name: 'Adapter test', tagline: 'Site tagline', email: '', phone: '', language: 'en', direction: 'ltr' },
    pages: [
      {
        id: ids.homePage, slug: 'home', title: 'Home', published: true,
        description: { source: 'manual', value: '' },
        blocks: [{ type: 'collectionView', placementId: ids.placement, collectionId: ids.collection, view: 'grid', categoryIds: [], sort: 'manual', limit: 12 }],
      },
      {
        id: ids.aboutPage, slug: 'about', title: 'About', published: true,
        description: { source: 'manual', value: '' },
        blocks: [{ type: 'richText', document: { type: 'document', blocks: [{ type: 'paragraph', size: 'normal', align: 'start', children: [{ type: 'text', text: 'About content', marks: [] }, { type: 'image', media: { src: mediaSrc, alt: 'Inline artwork' } }] }] } }],
      },
    ],
    collections: [{
      id: ids.collection, slug: 'works', routeBase: 'portfolio', name: 'Works', kind: 'content',
      listLayout: 'grid', loading: 'pagination', pageSize: 4, presetId: 'project', excerptSourceFieldId: ids.textField,
      fields: [
        { id: ids.textField, type: 'text', label: 'Summary', format: 'plain' },
        { id: ids.richField, type: 'text', label: 'Details', format: 'rich' },
        { id: ids.categoryField, type: 'category', label: 'Categories', categories: [{ id: ids.category, slug: 'art', name: 'Art' }] },
        { id: ids.galleryField, type: 'gallery', label: 'Images', maxItems: 5 },
      ],
    }],
    items: [
      { id: ids.itemOne, collectionId: ids.collection, slug: 'first', published: true, title: 'First', description: { source: 'manual', value: '' }, values: { [ids.textField]: 'One', [ids.richField]: { type: 'document', blocks: [{ type: 'paragraph', size: 'normal', align: 'start', children: [{ type: 'text', text: 'Item details', marks: [] }, { type: 'image', media: { src: mediaSrc, alt: 'Item artwork' } }] }, { type: 'gallery', images: [{ src: mediaSrc, alt: 'Gallery artwork' }] }] }, [ids.galleryField]: [{ src: mediaSrc, alt: 'Cover artwork' }] } },
      { id: ids.itemTwo, collectionId: ids.collection, slug: 'second', published: true, title: 'Second', description: { source: 'manual', value: '' }, values: { [ids.textField]: 'Two' } },
      { id: ids.itemThree, collectionId: ids.collection, slug: 'third', published: true, title: 'Third', description: { source: 'manual', value: '' }, values: { [ids.textField]: 'Three' } },
      { id: ids.itemFour, collectionId: ids.collection, slug: 'fourth', published: true, title: 'Fourth', description: { source: 'manual', value: '' }, values: { [ids.textField]: 'Four' } },
      { id: ids.itemFive, collectionId: ids.collection, slug: 'fifth', published: true, title: 'Fifth', description: { source: 'manual', value: '' }, values: { [ids.textField]: 'Five' } },
    ],
  });
}

function v1Fixture() {
  return ContentSchema.parse({
    version: 1,
    site: { name: 'Legacy', tagline: '', email: '', phone: '' },
    entries: [
      { id: '53000000-0000-4000-8000-000000000001', kind: 'page', slug: 'about', title: 'About', summary: '', published: true, components: [{ type: 'text', body: 'About text' }] },
      { id: '53000000-0000-4000-8000-000000000002', kind: 'project', slug: 'sculpture', title: 'Sculpture', summary: 'A piece', published: true, components: [{ type: 'text', body: 'Details' }] },
    ],
  });
}

const allCapabilities: ThemeCapability[] = [
  'content.v1', 'content.v2', 'routes.static', 'route.home', 'route.page', 'route.collectionList', 'route.collectionItem',
  'field.text', 'field.richText', 'field.category', 'field.gallery', 'field.link', 'media.webp', 'direction.ltr', 'direction.rtl',
];

function map(content: ThemeAdapterInput['content'], capabilities: readonly ThemeCapability[] = allCapabilities) {
  return createThemeAdapter().map({
    content,
    manifest: atelierManifest,
    settings: createAtelierDefaultSettings(content),
    availableCapabilities: capabilities,
  });
}

function routeData(route: ThemeRouteModel): AtelierRouteData {
  return route.data as AtelierRouteData;
}

test('Atelier maps V2 home, pages, paginated Collection lists, and item details without editing source content', () => {
  const content = v2Fixture();
  const original = structuredClone(content);
  const routes = map(content);

  assert.deepEqual(routes.map(route => route.path), [
    '/', '/home/', '/about/', '/works/', '/works/page/2/', '/portfolio/first/', '/portfolio/second/', '/portfolio/third/', '/portfolio/fourth/', '/portfolio/fifth/',
  ]);
  assert.deepEqual(routes.map(route => route.role), ['home', 'page', 'page', 'collectionList', 'collectionList', 'collectionItem', 'collectionItem', 'collectionItem', 'collectionItem', 'collectionItem']);
  assert(routes.every(route => route.templateId === atelierManifest.templates.find(template => template.role === route.role)?.id));
  assert.deepEqual(routes.slice(3, 5).map(route => routeData(route).resource), ['collection', 'collection']);
  const itemRoutes = routes.filter(route => route.role === 'collectionItem');
  const firstItem = routeData(itemRoutes[0]);
  assert.equal(firstItem.resource, 'item');
  assert.equal(firstItem.resource === 'item' ? firstItem.nextItem?.slug : undefined, 'second');
  assert.deepEqual(content, original, 'adapter mapping must not persist generated placement IDs or rewrite content');
});

test('default settings use stable block IDs and preserve IDs already present on V2 content', () => {
  const content = v2Fixture();
  delete content.pages[1].blocks[0].placementId;
  const before = structuredClone(content);
  const first = createAtelierDefaultSettings(content);
  const second = createAtelierDefaultSettings(content);
  assert.deepEqual(first, second);
  assert.equal(first.placements.find(placement => placement.placementId === ids.placement)?.sectionId, 'collection-list');
  assert.equal(first.placements.length, 2);
  assert.deepEqual(content, before);
});

test('Atelier maps V1 home, page, legacy list, and project detail routes', () => {
  const routes = map(v1Fixture());
  assert.deepEqual(routes.map(route => route.path), ['/', '/about/', '/portfolio/sculpture/', '/projects/']);
  assert.deepEqual(routes.map(route => route.role), ['home', 'page', 'collectionItem', 'collectionList']);
});

test('invalid required mappings stop route generation with an actionable diagnostic', () => {
  const content = v2Fixture();
  const settings = createAtelierDefaultSettings(content);
  settings.placements[0].sectionId = 'missing-section';
  assert.throws(
    () => createThemeAdapter().map({ content, settings, manifest: atelierManifest, availableCapabilities: allCapabilities }),
    /\[theme\.settings\.section-unknown\]/,
  );
  assert.throws(() => map(content, allCapabilities.filter(capability => capability !== 'route.home')), /requires unavailable capabilities:.*route\.home/);
});

test('unsupported optional Collection capabilities omit Collection routes and placements from view models', () => {
  const content = v2Fixture();
  const capabilities = allCapabilities.filter(capability => capability !== 'route.collectionList' && capability !== 'route.collectionItem');
  const routes = map(content, capabilities);
  assert.deepEqual(routes.map(route => route.path), ['/', '/home/', '/about/']);
  const home = routeData(routes[0]);
  assert.equal(home.resource, 'home-v2');
  assert.equal(home.resource === 'home-v2' ? home.page?.blocks.length : -1, 0);
});

test('unsupported optional field capabilities are omitted from projected Collections', () => {
  const routes = map(v2Fixture(), allCapabilities.filter(capability => capability !== 'field.category' && capability !== 'field.richText'));
  const list = routes.find(route => route.role === 'collectionList');
  assert(list);
  const data = routeData(list);
  assert.equal(data.resource, 'collection');
  assert.deepEqual(data.resource === 'collection' ? data.collection.fields.map(field => field.id) : [], [ids.textField, ids.galleryField]);
});

test('Collection view omission reports the missing item route capability too', () => {
  const content = v2Fixture();
  const settings = createAtelierDefaultSettings(content);
  const capabilities = allCapabilities.filter(capability => capability !== 'route.collectionItem');
  const diagnostics = validateThemeSettings(settings, atelierManifest, content, capabilities);
  assert(diagnostics.some(diagnostic => diagnostic.code === 'theme.settings.optional-placement-omitted' && diagnostic.message.includes('route.collectionItem')));
  assert.deepEqual(map(content, capabilities).filter(route => route.role === 'collectionList' || route.role === 'collectionItem'), []);
});

test('media-less view models remove Gallery fields and nested rich-text media references', () => {
  const routes = map(v2Fixture(), allCapabilities.filter(capability => capability !== 'media.webp'));
  assert(!JSON.stringify(routes).includes(ids.image));
  const about = routeData(routes.find(route => route.path === '/about/')!);
  assert.equal(about.resource, 'page');
  assert.equal(about.resource === 'page' ? about.page.blocks[0].type : undefined, 'richText');
  const list = routeData(routes.find(route => route.role === 'collectionList')!);
  assert.equal(list.resource, 'collection');
  assert.equal(list.resource === 'collection' ? list.collection.fields.some(field => field.type === 'gallery') : true, false);
  const item = routeData(routes.find(route => route.path === '/portfolio/first/')!);
  assert.equal(item.resource, 'item');
  if (item.resource === 'item') assert(!JSON.stringify(item.item.values).includes(ids.image));
});

test('duplicate output paths fail with a diagnostic', () => {
  const route: ThemeRouteModel = { role: 'page', path: '/about/', templateId: 'atelier-page', data: {} };
  assert.throws(() => assertUniqueRoutes([route, { ...route }]), /duplicate route \/about\//);
});
