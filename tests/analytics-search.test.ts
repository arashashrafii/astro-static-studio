import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAnalyticsV2,
  countWords,
  searchContentV2,
} from '../apps/admin/src/analytics-search.js';
import type { ContentV2 } from '../packages/contracts/src/content-v2.js';

const sampleV2: ContentV2 = {
  version: 2,
  site: {
    name: 'Studio Sample',
    tagline: 'Architecture',
    email: 'hello@example.com',
    phone: '',
    language: 'fa',
    direction: 'rtl',
  },
  pages: [
    {
      id: '10000000-0000-4000-8000-000000000001',
      slug: 'about',
      title: 'درباره ما',
      published: true,
      description: { source: 'manual', value: 'شرح صفحه درباره' },
      blocks: [
        {
          type: 'richText',
          document: {
            type: 'document',
            blocks: [
              {
                type: 'paragraph',
                size: 'normal',
                align: 'start',
                children: [{ type: 'text', text: 'متن درباره استودیو طراحی', marks: [] }],
              },
            ],
          },
        },
      ],
    },
  ],
  collections: [
    {
      id: '20000000-0000-4000-8000-000000000001',
      slug: 'projects',
      routeBase: 'portfolio',
      name: 'پروژه‌ها',
      kind: 'content',
      listLayout: 'grid',
      loading: 'show-more',
      pageSize: 12,
      fields: [
        { id: '30000000-0000-4000-8000-000000000001', type: 'text', label: 'متن', format: 'rich' },
        { id: '30000000-0000-4000-8000-000000000002', type: 'gallery', label: 'گالری', maxItems: 20 },
      ],
    },
  ],
  items: [
    {
      id: '40000000-0000-4000-8000-000000000001',
      collectionId: '20000000-0000-4000-8000-000000000001',
      slug: 'timber-bridge',
      title: 'پل چوبی',
      published: true,
      coverImage: { src: '/media/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp', alt: 'نمای پل' },
      description: { source: 'manual', value: 'سازه چوبی سبک' },
      values: {
        '30000000-0000-4000-8000-000000000001': {
          type: 'document',
          blocks: [
            {
              type: 'paragraph',
              size: 'normal',
              align: 'start',
              children: [{ type: 'text', text: 'اتصال چوب و فولاد در دهانه رودخانه', marks: [] }],
            },
          ],
        },
        '30000000-0000-4000-8000-000000000002': [
          { src: '/media/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp', alt: 'نمای پل' },
          { src: '/media/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.webp', alt: 'جزئیات سازه' },
        ],
      },
    },
    {
      id: '40000000-0000-4000-8000-000000000002',
      collectionId: '20000000-0000-4000-8000-000000000001',
      slug: 'stone-gallery',
      title: 'گالری سنگی',
      published: false,
      description: { source: 'manual', value: '' },
      values: {
        '30000000-0000-4000-8000-000000000001': {
          type: 'document',
          blocks: [
            {
              type: 'paragraph',
              size: 'normal',
              align: 'start',
              children: [{ type: 'text', text: 'نورپردازی غیرمستقیم و دیوار سنگی', marks: [] }],
            },
          ],
        },
      },
    },
  ],
};

test('countWords handles empty, whitespace, and multilingual text', () => {
  assert.equal(countWords('   '), 0);
  assert.equal(countWords('one  two\nthree'), 3);
  assert.equal(countWords('کوشک آجری در تهران'), 4);
});

test('searchContentV2 filters pages and collection items by title and rich content', () => {
  const titleHits = searchContentV2(sampleV2, 'چوبی');
  assert.equal(titleHits[0].target, 'item:40000000-0000-4000-8000-000000000001');
  assert.equal(titleHits[0].matchedIn, 'title');

  const contentHits = searchContentV2(sampleV2, 'نورپردازی');
  assert.equal(contentHits.length, 1);
  assert.equal(contentHits[0].target, 'item:40000000-0000-4000-8000-000000000002');
  assert.equal(contentHits[0].matchedIn, 'content');

  const pageHits = searchContentV2(sampleV2, 'استودیو');
  assert.equal(pageHits.length, 1);
  assert.equal(pageHits[0].target, 'page:10000000-0000-4000-8000-000000000001');
});

test('computeAnalyticsV2 computes word counts, published counts, and unique media', () => {
  const a2 = computeAnalyticsV2(sampleV2);
  assert.equal(a2.pageCount, 1);
  assert.equal(a2.projectCount, 2);
  assert.equal(a2.publishedCount, 2);
  assert.equal(a2.draftCount, 1);
  assert.equal(a2.referencedMediaCount, 2);
  assert.ok(a2.projectWordCount > 0);
  assert.equal(a2.totalWordCount, a2.projectWordCount + a2.pageWordCount);
});
