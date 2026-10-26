# Content model and simple dashboard — proposed design

**Status: product/architecture proposal, 2026-10-26. NOT IMPLEMENTED.**
This document records the agreed direction for Astro Static Studio and compares it with the actual desktop baseline. It is not a replacement for the active `ContentSchema` v1 in `packages/contracts/src/index.ts`. Nothing in this document approves a destructive migration.

## 1. Verified starting point (commit fdb3701)

- Local React/TypeScript/Vite dashboard + PWA shell (`apps/admin`) and loopback-only Node API (`apps/api`).
- `content/content.json` validated with Zod v1: site name/tagline/email/phone, up to 500 entries of kind `page` or `project`; entry components are only `text` or `gallery`.
- `apps/site/src/lib/content.ts` imports the JSON directly; there is **no Astro Content Layer collection** currently configured.
- `apps/site/src/pages/[...slug].astro` builds pages/project details with `getStaticPaths()`. `Projects.astro` renders a client-side category filter over all passed cards; no static list pagination exists.
- `apps/site/src/layouts/Layout.astro` hardcodes `lang="en" dir="ltr"`. Theme selection and an RTL/LTR switch are **not** implemented.
- Owner can edit content, upload images, backup/restore, build static output and use Cloudflare Pages Direct Upload; real QA preview was owner-confirmed accessible. Production publication is not validated. Android full Astro build remains unproven.

## 2. Non-technical owner journey

1. **Choose a free, approved template.** Initially offer the existing adapted Atelier template; a gallery of arbitrary Astro themes is out of scope.
2. **Set up the site.** Name, logo/contact, language and RTL/LTR where the template supports that direction. Show a live preview and plain-language labels.
3. **Edit pages.** Home/About/Contact are Pages; a new Page can add and reorder a few supported blocks.
4. **Manage collections.** Add a collection by picking a familiar preset: Articles, Projects, Photos or People. See its items immediately and optionally create categories.
5. **Place a collection on a page.** Add a "Show collection" block and pick the collection plus a supported presentation (cards/list/gallery). The same collection can appear on several pages with different limits/filters.
6. **Preview, save draft, publish.** Keep a clear distinction between saved changes, a locally generated build and a confirmed remote deployment.

The owner should not see "schema", "Content Loader", "frontmatter", "Git" or "Astro" in everyday forms. Show creation forms for the chosen preset, not a generic field builder. A page designer based on ordered predefined blocks is enough: no freehand drag-and-drop or user-defined HTML/CSS for the first release.

## 3. Domain model and language

- **Page:** one named URL with ordered view blocks; e.g. Home, About, Contact or Articles.
- **CollectionDefinition:** a named repeatable content source with a fixed type preset, stable ID and slug; e.g. "Articles" (article), "Winter gallery" (photo) or "Artists" (person).
- **CollectionEntry:** one record with stable ID, collection ID, publication state and preset-specific fields (title/body/cover/date for article; image/alt/caption for photo; name/bio/portrait for person; title/description/media for project). Use a guided, short form per type.
- **Category:** belongs to **one collection**; stable ID/slug, display name, one level deep for v2 MVP. An entry may reference more than one category in the same collection. Do not duplicate media/files or model categories as physical folders.
- **PageBlock:** a presentation object such as rich text, image, or `collectionView`; it does not own or duplicate the collection's entries. A collection display references collection ID, optional category filter, view preset, sort, limit and optional paging.
- **Theme:** maps supported page blocks/view presets to actual Astro components. Unknown block types must fail clearly (not silently disappear).

**Collection is data; `collectionView` is a page component.** Article cards and photo grids can share structural UI components, but their entry forms and presentation details differ. A Page can exist with no Collection, and a Collection can exist before it is displayed.

### Small illustrative data shapes (not committed schema)

```json
{
  "site": { "language": "fa", "direction": "rtl", "themeId": "atelier" },
  "collections": [
    { "id": "articles", "name": "Articles", "type": "article",
      "categories": [{ "id": "it", "name": "IT", "slug": "it" }] }
  ],
  "entries": [
    { "id": "intro", "collectionId": "articles", "slug": "intro",
      "categoryIds": ["it"], "fields": { "title": "Introduction", "body": "..." } }
  ],
  "pages": [
    { "slug": "articles", "blocks": [
      { "type": "collectionView", "collectionId": "articles",
        "view": "cards", "categoryId": null, "pageSize": 12 }
    ] }
  ]
}
```

This is an **illustration**, not an API or persistence contract. Before implementation define schema version, strict validation, IDs, allowable block properties, URL collisions, publish flags and media constraints. Never let arbitrary rich text inject unsanitized HTML.

## 4. Recommended Astro implementation

Astro **Content Collections** and **Content Layer loaders** are useful but do not automatically provide Studio's dashboard or user-generated field schemas.

- Keep Studio's domain model independent of theme code and use a small preset registry for types and display views.
- Prefer **one file per large collection entry** when migration is justified: Astro's `glob()` loader reads JSON/Markdown files. For suitable smaller JSON arrays/definitions, `file()` can load named data with unique IDs.
- For a user-created, runtime-named collection, **do not generate a new TypeScript collection declaration on every edit**. A fixed Astro collection/loader for general entries plus collection metadata and app-side preset validation is one viable simple route. It trades some Astro per-collection static typing for runtime flexibility.
- Use `getCollection()` / `getEntry()` in Astro build-time code, then theme-aware blocks and `getStaticPaths()` for static routes. Keep the existing static hosting model. Do not add SSR merely to display public lists.
- Implement **two separate paginations**:
  1. Dashboard/API: backend reads/searches only the requested items (page/cursor, category, sort), instead of returning every entry in one JSON response. A per-entry store or index may be needed; slicing an already-loaded huge browser payload is not enough.
  2. Public site: `getStaticPaths({ paginate })` produces list/category pages such as `/articles/`, `/articles/2/`; detail routes are optional per preset. For Home, show the latest few items without pagination.
- Build-time pagination controls visitor downloads, **not** total build cost. 100,000 records/pages require separate profiling for build time, disk and asset size; don't promise this scale without evidence.
- One paginated collection-view block per Page in the initial version avoids URL collision and multiple independent pager complexity. Others use a fixed display limit.
- Whole-site RTL/LTR: map validated setting to `<html lang="..." dir="...">`, prefer CSS logical properties, and test nav order, icons, alignment and mixed-language content on every approved theme. Direction does not translate text.

Astro references:
- https://docs.astro.build/en/guides/content-collections/
- https://docs.astro.build/en/reference/content-loader-reference/
- https://docs.astro.build/en/reference/routing-reference/

## 5. Incremental migration and release safety

1. Complete the current desktop non-technical usability issue #5. Do not replace the working dashboard based on assumptions alone.
2. Prototype the page/collection UX with one theme and a small set of preset fields/blocks. Validate it with a real novice using desktop and, once supported, a real mobile device.
3. Define a **Content v2** migration with backup first and a backward-compatibility/rollback story. Preserve v1 page and project IDs, slugs, order, published flags, categories, WebP URLs and alt text. Add migration tests and a restore round-trip; do not silently discard unsupported blocks.
4. Replace v1 single-file storage incrementally only as needed; add backend list paging/search. Avoid introducing a remote database or SaaS backend for the local MVP.
5. Integrate an approved template view/preset adapter, then static public list and category pagination. Test duplicate/reserved URL handling, empty collections and unsupported views.
6. Add a minimal safe rich-text editor (bold, links, lists, images) with portable structured output and accessible touch controls. Preserve media/source quality and backups.
7. Validate RTL/LTR and template switching with real snapshots, build checks and content-survival tests. Production publish requires explicit owner confirmation and verification.

**Current implementation remains authoritative until each slice lands with code, tests and revised `CONTRACTS.md`.**

## 6. Product exclusions for the first redesign

No arbitrary schema builder, arbitrary third-party template import, nested categories, visual freeform layout editor, custom user HTML/CSS, online shared CMS, multi-user workflow, or assumption that a prepared Android APK can run a full Astro build.
