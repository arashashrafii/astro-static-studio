import type { Content } from '@astro-static-studio/contracts';
import type { ContentV2, CollectionV2 } from '@astro-static-studio/contracts/content-v2';

export type ProjectsIndexView =
  | { kind: 'legacy'; entries: Content['entries'] }
  | { kind: 'collection'; collection: CollectionV2 | undefined; items: ContentV2['items'] };

/** Resolve the fixed /projects/ route for both the legacy site and V2 preset collection. */
export function projectsIndexView(data: Content | ContentV2): ProjectsIndexView {
  if (data.version === 1) {
    return { kind: 'legacy', entries: data.entries.filter(entry => entry.kind === 'project' && entry.published) };
  }
  return {
    kind: 'collection',
    collection: data.collections.find(collection => collection.slug === 'projects'),
    items: data.items,
  };
}
