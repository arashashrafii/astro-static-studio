import type { ThemeCapability, ThemeRouteModel, ThemeAdapterInput } from '../../../../packages/theme/src/contract.js';
import { ContentV2Schema } from '../../../../packages/contracts/src/content-v2.js';

type Page = ReturnType<typeof ContentV2Schema.parse>['pages'][number];
type Collection = ReturnType<typeof ContentV2Schema.parse>['collections'][number];
type Item = ReturnType<typeof ContentV2Schema.parse>['items'][number];

export type FixtureRouteData =
  | { kind: 'home'; siteName: string; title: string; description: string; featured: Item[] }
  | { kind: 'page'; siteName: string; title: string; description: string; copy: string }
  | { kind: 'collection'; siteName: string; title: string; description: string; items: Item[]; page: number; totalPages: number }
  | { kind: 'item'; siteName: string; title: string; description: string; item: Item; details: string };

export type FixtureRoute = Omit<ThemeRouteModel, 'data'> & { data: FixtureRouteData };

function textFromDocument(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const blocks = (value as { blocks?: { type?: string; children?: { text?: string }[] }[] }).blocks ?? [];
  return blocks.flatMap(block => {
    if (block.type !== 'paragraph') throw new Error('Structural fixture supports paragraph rich-text blocks only.');
    return block.children ?? [];
  }).map(child => {
    if (typeof child.text !== 'string') throw new Error('Structural fixture supports text-only rich-text children.');
    return child.text;
  }).join(' ').trim();
}

/** Independent test adapter: maps canonical V2 records to a route model with a different URL and page structure. */
export function mapStructuralFixture(input: ThemeAdapterInput): FixtureRoute[] {
  if (input.content.version !== 2) throw new Error('The structural fixture accepts Content V2 only.');
  const required: ThemeCapability[] = ['content.v2', 'routes.static', 'route.home', 'route.page', 'route.collectionList', 'route.collectionItem', 'field.text', 'field.richText', 'media.webp'];
  const missing = required.filter(capability => !input.availableCapabilities.includes(capability));
  if (missing.length) throw new Error(`Structural fixture requires capabilities: ${missing.join(', ')}.`);
  const content = ContentV2Schema.parse(input.content);
  for (const page of content.pages) for (const block of page.blocks) {
    if (block.type !== 'richText' && block.type !== 'collectionView') throw new Error(`Structural fixture does not support page block ${block.type}.`);
  }
  for (const collection of content.collections) for (const field of collection.fields) {
    if (field.type !== 'text' || field.format !== 'rich') throw new Error(`Structural fixture supports rich text fields only; received ${field.type}${field.type === 'text' ? `/${field.format}` : ''}.`);
  }
  const home = content.pages.find(page => page.slug === 'home' && page.published);
  if (!home) throw new Error('A published home page is required.');
  const routes: FixtureRoute[] = [];
  const add = (role: FixtureRoute['role'], path: string, templateId: string, data: FixtureRouteData) => routes.push({ role, path, templateId, data });
  const publishedItems = (collection: Collection) => content.items.filter(item => item.collectionId === collection.id && item.published);
  const description = (page: Page) => page.description.source === 'manual' ? page.description.value ?? '' : '';

  add('home', '/', 'gallery-home', {
    kind: 'home', siteName: content.site.name, title: home.title ?? content.site.name, description: description(home),
    featured: content.collections.flatMap(collection => publishedItems(collection).slice(0, 2)),
  });
  for (const page of content.pages.filter(candidate => candidate.published)) {
    add('page', `/content/${page.slug}/`, 'editorial-page', {
      kind: 'page', siteName: content.site.name, title: page.title ?? page.slug, description: description(page),
      copy: page.blocks.filter(block => block.type === 'richText').map(block => textFromDocument(block.document)).join(' '),
    });
  }
  for (const collection of content.collections) {
    const items = publishedItems(collection);
    const totalPages = collection.loading === 'pagination' ? Math.max(1, Math.ceil(items.length / collection.pageSize)) : 1;
    for (let page = 1; page <= totalPages; page += 1) {
      const path = page === 1 ? `/collections/${collection.slug}/` : `/collections/${collection.slug}/page/${page}/`;
      add('collectionList', path, 'catalog-index', {
        kind: 'collection', siteName: content.site.name, title: collection.name,
        description: `Page ${page} of ${totalPages}`, items: collection.loading === 'pagination' ? items.slice((page - 1) * collection.pageSize, page * collection.pageSize) : items,
        page, totalPages,
      });
    }
    for (const item of items) {
      const field = collection.fields.find(candidate => candidate.type === 'text' && candidate.format === 'rich');
      const details = field ? textFromDocument(item.values[field.id]) : '';
      add('collectionItem', `/items/${item.slug}/`, 'object-detail', {
        kind: 'item', siteName: content.site.name, title: item.title ?? collection.name,
        description: item.description.source === 'manual' ? item.description.value ?? '' : details.slice(0, 160), item, details,
      });
    }
  }
  return routes;
}
