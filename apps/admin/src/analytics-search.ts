import type { CollectionItemV2, CollectionV2, ContentV2, PageBlockV2, PageV2, RichTextDocumentV2 } from '@astro-static-studio/contracts/content-v2';

export interface SearchResult {
  id: string;
  target: string;
  kind: 'page' | 'project';
  kindLabel: string;
  title: string;
  slug: string;
  published: boolean;
  matchedIn: 'title' | 'content';
  snippet: string;
}

export interface ContentAnalytics {
  projectWordCount: number;
  pageWordCount: number;
  totalWordCount: number;
  projectCount: number;
  pageCount: number;
  publishedCount: number;
  draftCount: number;
  referencedMediaCount: number;
  averageProjectWords: number;
}

export function countWords(text: string): number {
  const normalized = text.trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/u).filter(Boolean).length;
}

export function extractRichTextV2Plain(document: RichTextDocumentV2 | undefined): string {
  if (!document || !Array.isArray(document.blocks)) return '';
  return document.blocks
    .map((block) => {
      if (block.type === 'gallery') {
        return block.images.map((image) => [image.title, image.alt].filter(Boolean).join(' ')).join(' ');
      }
      return block.children
        .map((node) => (node.type === 'text' ? node.text : [node.media.title, node.media.alt].filter(Boolean).join(' ')))
        .join('');
    })
    .filter(Boolean)
    .join('\n');
}

function extractPageBlockText(block: PageBlockV2): string {
  if (block.type === 'richText') return extractRichTextV2Plain(block.document);
  if (block.type === 'gallery') {
    return block.images.map((image) => [image.title, image.alt].filter(Boolean).join(' ')).filter(Boolean).join(' ');
  }
  if (block.type === 'image' && block.media) {
    return [block.media.title, block.media.alt].filter(Boolean).join(' ');
  }
  return '';
}

export function extractV2PageSearchText(page: PageV2): string {
  const parts: string[] = [];
  if (page.description.source === 'manual' && page.description.value) {
    parts.push(page.description.value);
  }
  for (const block of page.blocks) {
    const text = extractPageBlockText(block);
    if (text) parts.push(text);
  }
  return parts.join('\n');
}

export function extractV2ItemSearchText(item: CollectionItemV2, collection?: CollectionV2): string {
  const parts: string[] = [];
  if (item.description.source === 'manual' && item.description.value) {
    parts.push(item.description.value);
  }
  if (item.coverImage) {
    const coverText = [item.coverImage.title, item.coverImage.alt].filter(Boolean).join(' ');
    if (coverText) parts.push(coverText);
  }
  const fieldsById = new Map((collection?.fields ?? []).map((field) => [field.id, field]));
  for (const [fieldId, value] of Object.entries(item.values)) {
    const field = fieldsById.get(fieldId);
    if (typeof value === 'string') {
      if (value.trim()) parts.push(value);
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value) && (value as { type?: unknown }).type === 'document') {
      const text = extractRichTextV2Plain(value as RichTextDocumentV2);
      if (text) parts.push(text);
      continue;
    }
    if (field?.type === 'category' && Array.isArray(value)) {
      const names = field.categories.filter((cat) => value.includes(cat.id)).map((cat) => cat.name);
      if (names.length) parts.push(names.join(' '));
      continue;
    }
    if (field?.type === 'link' && value && typeof value === 'object') {
      const label = (value as { label?: unknown }).label;
      if (typeof label === 'string' && label.trim()) parts.push(label);
      continue;
    }
    if (Array.isArray(value)) {
      const mediaText = value
        .map((entry) =>
          entry && typeof entry === 'object'
            ? [
                typeof (entry as { title?: unknown }).title === 'string' ? (entry as { title: string }).title : '',
                typeof (entry as { alt?: unknown }).alt === 'string' ? (entry as { alt: string }).alt : '',
              ]
                .filter(Boolean)
                .join(' ')
            : '',
        )
        .filter(Boolean)
        .join(' ');
      if (mediaText) parts.push(mediaText);
    }
  }
  return parts.join('\n');
}

function buildSnippet(content: string, query: string, maxLength = 96): string {
  const clean = content.replace(/\s+/gu, ' ').trim();
  if (!clean) return '';
  const lowerClean = clean.toLocaleLowerCase();
  const lowerQuery = query.toLocaleLowerCase();
  const matchIndex = lowerClean.indexOf(lowerQuery);
  if (matchIndex === -1) {
    const chars = Array.from(clean);
    return chars.length > maxLength ? `${chars.slice(0, maxLength).join('')}…` : clean;
  }
  const start = Math.max(0, matchIndex - 28);
  const slice = clean.slice(start, start + maxLength);
  return `${start > 0 ? '…' : ''}${slice}${start + maxLength < clean.length ? '…' : ''}`;
}

export function searchContentV2(data: ContentV2, rawQuery: string): SearchResult[] {
  const query = rawQuery.trim();
  if (!query) return [];
  const lowerQuery = query.toLocaleLowerCase();
  const collectionsById = new Map(data.collections.map((collection) => [collection.id, collection]));
  const results: SearchResult[] = [];

  for (const page of data.pages) {
    const titleMatch = page.title.toLocaleLowerCase().includes(lowerQuery) || page.slug.toLocaleLowerCase().includes(lowerQuery);
    const body = extractV2PageSearchText(page);
    const bodyMatch = body.toLocaleLowerCase().includes(lowerQuery);
    if (titleMatch || bodyMatch) {
      results.push({
        id: page.id,
        target: `page:${page.id}`,
        kind: 'page',
        kindLabel: 'صفحه',
        title: page.title,
        slug: page.slug,
        published: page.published,
        matchedIn: titleMatch ? 'title' : 'content',
        snippet: buildSnippet(body || page.slug, query),
      });
    }
  }

  for (const item of data.items) {
    const collection = collectionsById.get(item.collectionId);
    const title = item.title?.trim() || item.coverImage?.alt?.trim() || 'مورد بدون عنوان';
    const titleMatch = title.toLocaleLowerCase().includes(lowerQuery) || item.slug.toLocaleLowerCase().includes(lowerQuery);
    const body = extractV2ItemSearchText(item, collection);
    const bodyMatch = body.toLocaleLowerCase().includes(lowerQuery);
    if (titleMatch || bodyMatch) {
      results.push({
        id: item.id,
        target: `item:${item.id}`,
        kind: 'project',
        kindLabel: collection?.name ?? 'پروژه',
        title,
        slug: item.slug,
        published: item.published,
        matchedIn: titleMatch ? 'title' : 'content',
        snippet: buildSnippet(body || item.slug, query),
      });
    }
  }

  return results.sort((a, b) => (a.matchedIn === b.matchedIn ? 0 : a.matchedIn === 'title' ? -1 : 1));
}

function collectMediaSrcsFromV2Block(block: PageBlockV2, media: Set<string>) {
  if (block.type === 'gallery') {
    for (const image of block.images) media.add(image.src);
  } else if (block.type === 'image' && block.media) {
    media.add(block.media.src);
  } else if (block.type === 'richText') {
    for (const richBlock of block.document.blocks) {
      if (richBlock.type === 'gallery') {
        for (const image of richBlock.images) media.add(image.src);
      } else {
        for (const node of richBlock.children) {
          if (node.type === 'image') media.add(node.media.src);
        }
      }
    }
  }
}

export function computeAnalyticsV2(data: ContentV2): ContentAnalytics {
  const collectionsById = new Map(data.collections.map((collection) => [collection.id, collection]));
  const media = new Set<string>();
  let projectWordCount = 0;
  let pageWordCount = 0;
  let publishedCount = 0;
  let draftCount = 0;

  for (const page of data.pages) {
    if (page.published) publishedCount += 1;
    else draftCount += 1;
    const text = [page.title, extractV2PageSearchText(page)].filter(Boolean).join(' ');
    pageWordCount += countWords(text);
    for (const block of page.blocks) collectMediaSrcsFromV2Block(block, media);
  }

  for (const item of data.items) {
    if (item.published) publishedCount += 1;
    else draftCount += 1;
    if (item.coverImage) media.add(item.coverImage.src);
    const collection = collectionsById.get(item.collectionId);
    const text = [item.title ?? '', extractV2ItemSearchText(item, collection)].filter(Boolean).join(' ');
    projectWordCount += countWords(text);
    for (const value of Object.values(item.values)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && (value as { type?: unknown }).type === 'document') {
        const doc = value as RichTextDocumentV2;
        for (const richBlock of doc.blocks) {
          if (richBlock.type === 'gallery') {
            for (const image of richBlock.images) media.add(image.src);
          } else {
            for (const node of richBlock.children) {
              if (node.type === 'image') media.add(node.media.src);
            }
          }
        }
      } else if (Array.isArray(value)) {
        for (const entry of value) {
          if (entry && typeof entry === 'object' && typeof (entry as { src?: unknown }).src === 'string') {
            media.add((entry as { src: string }).src);
          }
        }
      }
    }
  }

  const projectCount = data.items.length;
  return {
    projectWordCount,
    pageWordCount,
    totalWordCount: projectWordCount + pageWordCount,
    projectCount,
    pageCount: data.pages.length,
    publishedCount,
    draftCount,
    referencedMediaCount: media.size,
    averageProjectWords: projectCount ? Math.round(projectWordCount / projectCount) : 0,
  };
}
