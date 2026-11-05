import { ContentSchema, type Content, type RichText } from '@astro-static-studio/contracts';
import {
  ContentV2Schema,
  type ContentV2,
  type RichTextDocumentV2,
} from '@astro-static-studio/contracts/content-v2';
import { ensureV2PlacementIdsV1 } from '@astro-static-studio/contracts/migration';
import { atelierManifest } from '../atelier-manifest.js';
import {
  THEME_CONTRACT_VERSION,
  ThemeSettingsV1Schema,
  validateThemeSettings,
  type StudioThemeAdapter,
  type ThemeAdapterInput,
  type ThemeCapability,
  type ThemeManifestV1,
  type ThemeRouteModel,
  type ThemeRouteRole,
  type ThemeSettingsV1,
} from '../contract.js';

type ContentInput = Content | ContentV2;
type ContentPageV2 = ContentV2['pages'][number];
type CollectionV2 = ContentV2['collections'][number];
type CollectionItemV2 = ContentV2['items'][number];

export type AtelierRouteData =
  | { resource: 'home-v1'; content: Content }
  | { resource: 'v1-entry'; content: Content; entry: Content['entries'][number] }
  | { resource: 'v1-projects'; content: Content; entries: Content['entries'] }
  | { resource: 'home-v2'; content: ContentV2; page?: ContentPageV2 }
  | { resource: 'page'; content: ContentV2; page: ContentPageV2 }
  | { resource: 'collection'; content: ContentV2; collection: CollectionV2; items: CollectionItemV2[]; page: number; totalPages: number }
  | { resource: 'item'; content: ContentV2; collection: CollectionV2; item: CollectionItemV2; previousItem?: CollectionItemV2; nextItem?: CollectionItemV2 };

const OPTIONAL_FIELD_CAPABILITY: Record<string, ThemeCapability> = {
  category: 'field.category',
  gallery: 'field.gallery',
  link: 'field.link',
  text: 'field.text',
};

function blockSectionId(type: ContentV2['pages'][number]['blocks'][number]['type']): string {
  if (type === 'richText') return 'content';
  if (type === 'collectionView') return 'collection-list';
  return 'gallery';
}

/** Make the current Atelier choices from the contract and content. The returned settings are ephemeral until #32 adds persistence. */
export function createAtelierDefaultSettings(input: ContentInput, manifest: ThemeManifestV1 = atelierManifest): ThemeSettingsV1 {
  const content = input.version === 1
    ? ContentSchema.parse(input)
    : ensureV2PlacementIdsV1(ContentV2Schema.parse(input));
  const placements = content.version === 2
    ? content.pages.flatMap(page => page.blocks.map(block => {
      const collection = block.type === 'collectionView'
        ? content.collections.find(candidate => candidate.id === block.collectionId)
        : undefined;
      return {
        placementId: block.placementId!,
        sectionId: blockSectionId(block.type),
        ...(collection ? { collectionId: collection.id, optionalFieldIds: collection.fields.map(field => field.id) } : { optionalFieldIds: [] }),
      };
    }))
    : [];

  return ThemeSettingsV1Schema.parse({
    settingsVersion: 1,
    themeId: manifest.id,
    themeVersion: manifest.version,
    templates: manifest.templates.map(template => ({ role: template.role, templateId: template.id })),
    tokens: Object.fromEntries(Object.entries(manifest.designTokens).map(([id, token]) => [id, token.default])),
    placements,
  });
}

function supports(capabilities: readonly ThemeCapability[], capability: ThemeCapability): boolean {
  return capabilities.includes(capability);
}

function omitV1RichMedia(document: RichText): RichText {
  return {
    ...document,
    blocks: document.blocks.map(block => ({ ...block, content: block.content.filter(node => node.type !== 'image') })),
  };
}

function omitV2RichMedia(document: RichTextDocumentV2): RichTextDocumentV2 {
  return {
    ...document,
    blocks: document.blocks.flatMap(block => {
      if (block.type === 'gallery') return [];
      return [{ ...block, children: block.children.filter(node => node.type !== 'image') }];
    }),
  };
}

function projectV1(content: Content, capabilities: readonly ThemeCapability[]): Content {
  if (supports(capabilities, 'media.webp') && supports(capabilities, 'field.richText')) return content;
  return {
    ...content,
    entries: content.entries.map(entry => ({
      ...entry,
      components: entry.components.flatMap(component => {
        if (component.type === 'gallery' && !supports(capabilities, 'media.webp')) return [];
        if (component.type === 'text' && component.richText && !supports(capabilities, 'field.richText')) {
          return [{ type: 'text' as const, body: component.body }];
        }
        if (component.type === 'text' && component.richText && !supports(capabilities, 'media.webp')) {
          return [{ ...component, richText: omitV1RichMedia(component.richText) }];
        }
        return [component];
      }),
    })),
  };
}

function projectV2(content: ContentV2, capabilities: readonly ThemeCapability[]): ContentV2 {
  const canRenderCollections = supports(capabilities, 'route.collectionList') && supports(capabilities, 'route.collectionItem');
  const collections = content.collections.map(collection => {
    const fields = collection.fields.filter(field => {
      if (field.type === 'gallery' && !supports(capabilities, 'media.webp')) return false;
      const capability = field.type === 'text' && field.format === 'rich'
        ? 'field.richText'
        : OPTIONAL_FIELD_CAPABILITY[field.type];
      return supports(capabilities, capability);
    });
    return { ...collection, fields };
  });
  const allowedFieldIds = new Map(collections.map(collection => [collection.id, new Set(collection.fields.map(field => field.id))]));
  const items = content.items.map(item => {
    const fieldIds = allowedFieldIds.get(item.collectionId) ?? new Set<string>();
    const collection = content.collections.find(candidate => candidate.id === item.collectionId);
    const values = Object.fromEntries(Object.entries(item.values)
      .filter(([fieldId]) => fieldIds.has(fieldId))
      .map(([fieldId, value]) => {
        const field = collection?.fields.find(candidate => candidate.id === fieldId);
        if (!supports(capabilities, 'media.webp') && field?.type === 'text' && field.format === 'rich') {
          return [fieldId, omitV2RichMedia(value as RichTextDocumentV2)];
        }
        return [fieldId, value];
      }));
    return {
      ...item,
      ...(supports(capabilities, 'media.webp') ? {} : { coverImage: undefined }),
      values,
    };
  });
  const pages = content.pages.map(page => {
    const blocks: ContentPageV2['blocks'] = [];
    for (const block of page.blocks) {
      if (block.type === 'collectionView') {
        if (canRenderCollections) blocks.push(block);
      } else if (block.type === 'richText') {
        if (!supports(capabilities, 'field.richText')) continue;
        blocks.push(supports(capabilities, 'media.webp') ? block : { ...block, document: omitV2RichMedia(block.document) });
      } else if (block.type === 'gallery') {
        if (supports(capabilities, 'media.webp') && supports(capabilities, 'field.gallery')) blocks.push(block);
      } else if (supports(capabilities, 'media.webp')) blocks.push(block);
    }
    return { ...page, blocks };
  });
  return { ...content, collections, items, pages };
}

function failOnDiagnostics(diagnostics: ReturnType<typeof validateThemeSettings>): void {
  const errors = diagnostics.filter(diagnostic => diagnostic.severity === 'error');
  if (errors.length) {
    throw new Error(`Atelier theme settings are invalid: ${errors.map(error => `[${error.code}] ${error.message}`).join(' ')}`);
  }
}

function pathForPage(slug: string): string {
  return `/${slug}/`;
}

function pathForCollectionPage(slug: string, page: number): string {
  return page === 1 ? pathForPage(slug) : `/${slug}/page/${page}/`;
}

function assertUniqueRoutes(routes: ThemeRouteModel[]): ThemeRouteModel[] {
  const seen = new Set<string>();
  for (const route of routes) {
    if (seen.has(route.path)) throw new Error(`Atelier cannot map duplicate route ${route.path}. Check page, Collection, and item slugs.`);
    seen.add(route.path);
  }
  return routes;
}

function buildRoutes(content: ContentInput, settings: ThemeSettingsV1, manifest: ThemeManifestV1, capabilities: readonly ThemeCapability[]): ThemeRouteModel[] {
  const templateIds = new Map(settings.templates.map(template => [template.role, template.templateId]));
  const route = (role: ThemeRouteRole, path: string, data: AtelierRouteData): ThemeRouteModel => {
    const templateId = templateIds.get(role);
    if (!templateId) throw new Error(`Atelier has no selected ${role} template for route ${path}.`);
    return { role, path, templateId, data };
  };

  if (content.version === 1) {
    const projected = projectV1(content, capabilities);
    const routes: ThemeRouteModel[] = [route('home', '/', { resource: 'home-v1', content: projected })];
    for (const entry of projected.entries.filter(candidate => candidate.published)) {
      if (entry.kind === 'project') {
        if (supports(capabilities, 'route.collectionItem')) routes.push(route('collectionItem', `/portfolio/${entry.slug}/`, { resource: 'v1-entry', content: projected, entry }));
      } else {
        routes.push(route('page', pathForPage(entry.slug), { resource: 'v1-entry', content: projected, entry }));
      }
    }
    if (supports(capabilities, 'route.collectionList') && supports(capabilities, 'route.collectionItem')) {
      routes.push(route('collectionList', '/projects/', { resource: 'v1-projects', content: projected, entries: projected.entries.filter(entry => entry.kind === 'project' && entry.published) }));
    }
    return assertUniqueRoutes(routes);
  }

  const normalized = ensureV2PlacementIdsV1(ContentV2Schema.parse(content));
  const diagnostics = validateThemeSettings(settings, manifest, normalized, capabilities);
  failOnDiagnostics(diagnostics);
  const projected = projectV2(normalized, capabilities);
  const routes: ThemeRouteModel[] = [];
  const homePage = projected.pages.find(page => page.slug === 'home' && page.published);
  routes.push(route('home', '/', { resource: 'home-v2', content: projected, page: homePage }));
  for (const page of projected.pages.filter(candidate => candidate.published)) {
    routes.push(route('page', pathForPage(page.slug), { resource: 'page', content: projected, page }));
  }

  const canRenderCollections = supports(capabilities, 'route.collectionList') && supports(capabilities, 'route.collectionItem');
  if (canRenderCollections) {
    for (const collection of projected.collections) {
      const publishedItems = projected.items.filter(item => item.collectionId === collection.id && item.published);
      const pageCount = collection.loading === 'pagination'
        ? Math.max(1, Math.ceil(publishedItems.length / collection.pageSize))
        : 1;
      for (let page = 1; page <= pageCount; page += 1) {
        const items = collection.loading === 'pagination'
          ? publishedItems.slice((page - 1) * collection.pageSize, page * collection.pageSize)
          : publishedItems;
        routes.push(route('collectionList', pathForCollectionPage(collection.slug, page), {
          resource: 'collection', content: projected, collection, items, page, totalPages: pageCount,
        }));
      }
      for (const [index, item] of publishedItems.entries()) {
        routes.push(route('collectionItem', `/${collection.routeBase}/${item.slug}/`, {
          resource: 'item', content: projected, collection, item,
          previousItem: publishedItems[index - 1], nextItem: publishedItems[index + 1],
        }));
      }
    }
  }
  return assertUniqueRoutes(routes);
}

export function createThemeAdapter(manifest: ThemeManifestV1 = atelierManifest): StudioThemeAdapter {
  return {
    contractVersion: THEME_CONTRACT_VERSION,
    map(input: ThemeAdapterInput): ThemeRouteModel[] {
      if (manifest.contractVersion !== THEME_CONTRACT_VERSION) {
        throw new Error(`Atelier requires theme contract ${manifest.contractVersion}; this adapter provides ${THEME_CONTRACT_VERSION}.`);
      }
      const missingRequired = manifest.capabilities.required.filter(capability => !input.availableCapabilities.includes(capability));
      if (missingRequired.length) {
        throw new Error(`Atelier requires unavailable capabilities: ${missingRequired.join(', ')}.`);
      }
      const content = input.content.version === 1
        ? ContentSchema.parse(input.content)
        : ensureV2PlacementIdsV1(ContentV2Schema.parse(input.content));
      const diagnostics = validateThemeSettings(input.settings, manifest, content, input.availableCapabilities);
      failOnDiagnostics(diagnostics);
      return buildRoutes(content, input.settings, manifest, input.availableCapabilities);
    },
  };
}

export { assertUniqueRoutes };
