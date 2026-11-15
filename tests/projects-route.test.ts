import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ContentV2Schema } from '../packages/contracts/src/content-v2.js';
import { projectsIndexView } from '../apps/site/src/lib/projects-route.js';

const collectionId = '20000000-0000-4000-8000-000000000001';
const textFieldId = '30000000-0000-4000-8000-000000000001';

const content = ContentV2Schema.parse({
  version: 2,
  site: { name: 'Route test', tagline: '', email: '', phone: '', language: 'en', direction: 'ltr' },
  pages: [
    { id: 'a7b1bb0e-92b7-4772-b88e-60389c07c033', slug: 'about', title: 'About', published: true, description: { source: 'manual', value: '' }, blocks: [] },
  ],
  collections: [
    {
      id: collectionId,
      slug: 'projects',
      routeBase: 'portfolio',
      name: 'پروژه‌ها',
      kind: 'content',
      listLayout: 'grid',
      loading: 'show-more',
      pageSize: 12,
      presetId: 'project',
      excerptSourceFieldId: textFieldId,
      fields: [{ id: textFieldId, type: 'text', label: 'جزئیات', format: 'plain' }],
    },
  ],
  items: [
    {
      id: '9e9eeb74-5df7-4c51-9de7-d6e45b239074',
      collectionId,
      slug: 'sample',
      title: 'Sample project',
      published: true,
      description: { source: 'manual', value: 'A saved project' },
      values: { [textFieldId]: 'Details' },
    },
  ],
});

test('/projects/ resolves the V2 Projects collection', () => {
  const v2View = projectsIndexView(content);
  assert.equal(v2View.kind, 'collection');
  assert.equal(v2View.collection?.slug, 'projects');
  assert.equal(v2View.collection?.routeBase, 'portfolio');
  assert.deepEqual(
    v2View.items.filter(item => item.collectionId === v2View.collection?.id && item.published).map(item => item.slug),
    ['sample'],
  );
});
