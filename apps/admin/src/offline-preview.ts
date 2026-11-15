import type { ContentV2, PageBlockV2, RichTextDocumentV2 } from '@astro-static-studio/contracts/content-v2';
import { resolveMediaSrc } from './offline-media.js';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderRichText(doc: RichTextDocumentV2): string {
  return doc.blocks
    .map((block) => {
      if (block.type === 'gallery') {
        const imgs = block.images
          .map((img) => `<figure class="gallery-item"><img src="${escapeHtml(resolveMediaSrc(img.src))}" alt="${escapeHtml(img.alt)}" />${img.title ? `<figcaption>${escapeHtml(img.title)}</figcaption>` : ''}</figure>`)
          .join('');
        return `<div class="gallery-grid">${imgs}</div>`;
      }
      const tag = block.type === 'heading' ? `h${block.level ?? 2}` : 'p';
      const inner = block.children
        .map((node) => {
          if (node.type === 'image') {
            return `<img class="inline-img" src="${escapeHtml(resolveMediaSrc(node.media.src))}" alt="${escapeHtml(node.media.alt)}" />`;
          }
          let html = escapeHtml(node.text).replaceAll('\n', '<br />');
          if (node.marks.includes('bold')) html = `<strong>${html}</strong>`;
          if (node.marks.includes('italic')) html = `<em>${html}</em>`;
          return html;
        })
        .join('');
      return `<${tag} style="text-align:${block.align === 'center' ? 'center' : block.align === 'end' ? 'end' : 'start'}">${inner}</${tag}>`;
    })
    .join('\n');
}

function renderBlock(block: PageBlockV2, data: ContentV2): string {
  if (block.type === 'richText') return `<div class="prose">${renderRichText(block.document)}</div>`;
  if (block.type === 'image' && block.media) {
    return `<figure class="single-image align-${block.align ?? 'center'}"><img src="${escapeHtml(resolveMediaSrc(block.media.src))}" alt="${escapeHtml(block.media.alt)}" />${block.media.title ? `<figcaption>${escapeHtml(block.media.title)}</figcaption>` : ''}</figure>`;
  }
  if (block.type === 'gallery') {
    const imgs = block.images
      .map((img) => `<figure class="gallery-item"><img src="${escapeHtml(resolveMediaSrc(img.src))}" alt="${escapeHtml(img.alt)}" />${img.title ? `<figcaption>${escapeHtml(img.title)}</figcaption>` : ''}</figure>`)
      .join('');
    return `<div class="gallery-grid layout-${block.layout ?? 'grid'}">${imgs}</div>`;
  }
  if (block.type === 'collectionView') {
    const collection = data.collections.find((c) => c.id === block.collectionId);
    if (!collection) return '';
    const items = data.items
      .filter((item) => item.collectionId === collection.id && item.published)
      .slice(0, block.limit ?? 12);
    return `<section class="collection-block"><h3>${escapeHtml(collection.name)}</h3><div class="collection-cards">${items
      .map((item) => {
        const thumb = item.coverImage?.src;
        return `<article class="card">${thumb ? `<img src="${escapeHtml(resolveMediaSrc(thumb))}" alt="${escapeHtml(item.title || '')}" />` : ''}<h4>${escapeHtml(item.title || 'بدون عنوان')}</h4>${item.description.source === 'manual' && item.description.value ? `<p>${escapeHtml(item.description.value)}</p>` : ''}</article>`;
      })
      .join('')}</div></section>`;
  }
  return '';
}

export function buildOfflinePreviewHtml(data: ContentV2): string {
  const dir = data.site.direction === 'rtl' ? 'rtl' : 'ltr';
  const lang = data.site.language || (dir === 'rtl' ? 'fa' : 'en');
  const pages = data.pages.filter((p) => p.published);
  const nav = pages.map((p) => `<a href="#page-${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a>`).join('');
  const pageSections = pages
    .map(
      (page) => `<section id="page-${escapeHtml(page.slug)}" class="site-page"><h2>${escapeHtml(page.title)}</h2>${page.blocks.map((block) => renderBlock(block, data)).join('\n')}</section>`,
    )
    .join('\n');

  const collectionsSection = data.collections
    .map((collection) => {
      const items = data.items.filter((i) => i.collectionId === collection.id && i.published);
      if (!items.length) return '';
      return `<section class="site-page"><h2>${escapeHtml(collection.name)}</h2><div class="collection-cards">${items
        .map((item) => {
          const galleryField = collection.fields.find((f) => f.type === 'gallery');
          const galleryImgs = galleryField && Array.isArray(item.values[galleryField.id]) ? (item.values[galleryField.id] as { src: string; alt: string }[]) : [];
          const cover = item.coverImage?.src ?? galleryImgs[0]?.src;
          return `<article class="card">${cover ? `<img src="${escapeHtml(resolveMediaSrc(cover))}" alt="${escapeHtml(item.title || '')}" />` : ''}<h4>${escapeHtml(item.title || 'مورد')}</h4></article>`;
        })
        .join('')}</div></section>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="${escapeHtml(lang)}" dir="${dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(data.site.name)}</title>
<style>
  :root { --bg: #f5f2eb; --fg: #272b27; --accent: #9b4937; --border: rgba(39,43,39,.14); }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--fg); line-height: 1.7; padding: 24px 16px 56px; }
  .wrap { max-width: 920px; margin: 0 auto; }
  header { border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 28px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 12px; }
  header h1 { margin: 0; font-size: 1.65rem; font-family: Georgia, serif; }
  header p { margin: 4px 0 0; opacity: .75; font-size: .95rem; }
  nav { display: flex; flex-wrap: wrap; gap: 14px; }
  nav a { color: var(--accent); text-decoration: none; font-weight: 600; font-size: .95rem; }
  .site-page { margin-bottom: 36px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
  .site-page h2 { font-size: 1.3rem; margin: 0 0 14px; color: var(--accent); }
  .prose img, .single-image img, .gallery-item img, .card img { max-width: 100%; height: auto; border-radius: 6px; display: block; }
  .gallery-grid, .collection-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-top: 12px; }
  figure { margin: 0; }
  figcaption { font-size: .85rem; opacity: .75; margin-top: 6px; }
  .card { background: rgba(255,255,255,.55); border: 1px solid var(--border); border-radius: 8px; padding: 12px; }
  .card h4 { margin: 8px 0 4px; font-size: 1rem; }
  .empty { opacity: .65; font-style: italic; }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div>
        <h1>${escapeHtml(data.site.name)}</h1>
        ${data.site.tagline ? `<p>${escapeHtml(data.site.tagline)}</p>` : ''}
      </div>
      <nav>${nav}</nav>
    </header>
    ${pageSections || '<p class="empty">هنوز صفحهٔ منتشرشده‌ای وجود ندارد.</p>'}
    ${collectionsSection}
  </div>
</body>
</html>`;
}
