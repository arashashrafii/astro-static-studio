import type { ContentV2, CollectionV2 } from '@astro-static-studio/contracts/content-v2';

export type ProjectsIndexView = {
  kind: 'collection';
  collection: CollectionV2 | undefined;
  items: ContentV2['items'];
};

/** Resolve the fixed /projects/ route for the V2 preset collection. */
export function projectsIndexView(data: ContentV2): ProjectsIndexView {
  return {
    kind: 'collection',
    collection: data.collections.find(collection => collection.slug === 'projects'),
    items: data.items,
  };
}
