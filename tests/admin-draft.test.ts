import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readContentDraft } from '../apps/admin/src/draft.js';
import type { ContentV2 } from '../packages/contracts/src/content-v2.js';

const base: ContentV2 = {
  version: 2,
  site: { name: 'Sample', tagline: '', email: '', phone: '', language: 'en', direction: 'ltr' },
  pages: [],
  collections: [{
    id: '10000000-0000-4000-8000-000000000001', slug: 'works', routeBase: 'portfolio',
    name: 'Works', kind: 'content', listLayout: 'grid', loading: 'show-more', pageSize: 12,
    fields: [{ id: '10000000-0000-4000-8000-000000000003', type: 'gallery', label: 'Gallery', maxItems: 10 }],
  }],
  items: [{
    id: '10000000-0000-4000-8000-000000000002', collectionId: '10000000-0000-4000-8000-000000000001',
    slug: 'sample', title: 'Sample', published: false, description: { source: 'manual', value: 'Description' },
    values: { '10000000-0000-4000-8000-000000000003': [] },
  }],
};

test('valid local draft is parsed and restored', () => {
  const draft = structuredClone(base);
  draft.items[0].description = { source: 'manual', value: 'Saved edit' };
  assert.equal(readContentDraft(JSON.stringify(draft), base).items[0].description.value, 'Saved edit');
});

test('editable draft survives reload with invalid title and media fields', () => {
  const draft = structuredClone(base);
  draft.items[0].title = '';
  draft.items[0].values['10000000-0000-4000-8000-000000000003'] = [{ src: 'https://example.com/not-managed.webp', alt: 'Invalid' }];
  const restored = readContentDraft(JSON.stringify(draft), base);
  assert.equal(restored.items[0].title, '');
  assert.equal((restored.items[0].values['10000000-0000-4000-8000-000000000003'] as Array<{src:string}>)[0].src, 'https://example.com/not-managed.webp');
});

test('malformed or unrelated browser data falls back to the loaded content', () => {
  assert.equal(readContentDraft('{ invalid', base), base);
  assert.equal(readContentDraft(JSON.stringify({ version: 1 }), base), base);
});
