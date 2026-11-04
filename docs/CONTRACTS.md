# Content and theme contracts

The implementation in `packages/contracts/src/index.ts` is the source of truth. Planning docs do not make a feature implemented.

## Content v1

- Root document: `version: 1`, site identity/contact fields, and entries in the single `content/content.json` file (up to 500 entries under the current schema).
- Entries: UUID, unique slug, `page` or `project`, title, summary, optional categories/tags/date, published state, and ordered components.
- Components: plain text (`body`) or image gallery. Text components may also include an optional validated `richText` document; gallery and inline images reference managed `/media/<id>.webp` files and carry alt text.
- Zod validates API reads and writes. Duplicate IDs/slugs, invalid/reserved slugs, unsupported media paths, and oversized fields are rejected.
- The additive v1 rich-text document is versioned structured data, not HTML. It allows paragraph and H2–H4 blocks, left/center/right alignment, bold/italic, small/large text, and managed inline images with alt text. `body` remains the plain-text projection for compatibility; Astro renders only fixed tags from the validated nodes. The dashboard and site derive a 150 Unicode-codepoint excerpt from text components, falling back to the stored legacy `summary` when the body has no text.
- Older Studio builds do not preserve unknown `richText` fields: their Zod parse strips the additive field and a subsequent save or restore can discard rich formatting and inline references. Keep a backup before opening rich-text content in an older build.

## Theme and publishing

- Theme metadata declares supported content component types and color tokens. It does not yet support a runtime theme registry or dashboard theme selection.
- The `PublisherInterface` local build contract retains the last good `apps/site/dist` on failed builds. **Separately**, `apps/api/src/publishing.ts` implements Cloudflare Pages Direct Upload for the current desktop workflow; the local publisher alone does not deploy. QA preview validation is documented in [M2_VALIDATION](M2_VALIDATION.md).

Schema changes require validation tests and a migration plan before breaking existing content files.

## Local setup and recovery

- First launch can keep the bundled sample or initialize a blank site with a name and empty contact details. Initializing a blank site requires downloading a pre-change backup first; the API creates that backup before replacing content.
- A backup is a versioned JSON file containing validated content, referenced WebP files, and available JPEG/PNG originals. Restore validates the full bundle and checksums before replacing content; media is added without overwriting conflicting files.
- Uploaded source images are stored under ignored local `content/media-originals/`; generated WebP files alone are served to the public Astro site.
- Backups and source images stay local and are not included in the static site output. Users should keep downloaded backups outside the device as an independent recovery copy.

### Content V2 migration rollback

Before V1→V2 migration, the API writes a standard V1 recovery bundle under `content/backups/`; it includes the validated V1 content, referenced WebP files, and available originals. To return the active files to V1, stop Studio, preserve the current V2 files separately, then restore `content` from the bundle's `backup.content` and restore its bundled media files to the matching media directories. Reopen only with a V1-compatible build. The V2 dashboard's Restore control is not a rollback-to-V1 path: restoring a V1 bundle there migrates it back to V2. Keep an independent downloaded copy before any customer-data migration. This file-level rollback procedure is documented from the bundle format but has not been exercised as a browser workflow; customer-data readiness remains unverified.

## Content v2 runtime

`packages/contracts/src/content-v2.ts` is the local target Content V2 schema. V1 is the last committed format and remains readable for existing files and backups. In the current uncommitted workspace, the dashboard gate migrates V1 to V2 after writing a complete pre-migration backup under ignored `content/backups/`. If a valid `studio-draft-v1` exists, the gate first asks the read-only preview route for its V2 mapping and stores/read-back validates `studio-draft-v2`; only then does migration write a paired standard V1 backup for the draft and its referenced media. The original V1 draft remains untouched. A missing draft asset or unavailable browser storage blocks migration. The migration in `packages/contracts/src/content-migration.ts` is deterministic, and the API atomically replaces the active content file only after the saved-content backup, optional draft backup, and full V2 validation succeed. Issue #19 remains open until the migration and acceptance evidence are complete.

- Root data separates `pages`, generic `collections`, and their `items`. IDs are UUIDs; page and collection list paths plus collection item detail paths must be unique. Root paths cannot use `admin`, `api` or `media`; collection item slugs are scoped below their route prefix.
- Collection definitions have a stable ID, name, list slug, detail `routeBase`, `kind` (`gallery` or `content`), `listLayout`, `loading`, `pageSize`, and field definitions. New fields are additive and default older V2 data to `content`, `grid`, `show-more`, and 12 items per page. The existing `project` preset remains content and keeps `/projects/` plus `/portfolio/<slug>/` routes.
- Content items require a Title; gallery items may omit a display Title but always retain an internal slug. A published gallery item must contain an image. Optional fields are represented by Text (plain or rich), Category/tag, Gallery, and Link. Gallery items use one image; content items may have a cover and an attached gallery. Field IDs are unique within each Collection because item values are scoped by collection. Item values are keyed by field ID and checked against its definition. Category IDs are scoped by Category field; collection views name that field when filtering. Unknown field IDs and category IDs fail validation.
- V2 pages carry a Description and ordered `richText`, `gallery`, standalone `image`, or `collectionView` blocks. The `view` field on older `collectionView` blocks remains accepted for compatibility; canonical collection list pages render from collection-level layout/loading settings. A rich-text document is structured nodes only: text and processed-media images inside paragraphs/headings, plus ordered gallery blocks for lossless legacy conversion. It supports bold/italic marks, small/normal/large sizes and logical `start`/`center`/`end` alignment, not arbitrary HTML. Inline image placement is optional and supports inline, text-wrapping start/end, and block start/center/end; absence preserves the earlier rendering. V2 media alt text may be empty for decorative images. Standalone image blocks support optional logical alignment and size. In RTL, toolbar “right” maps to `start`; in LTR, it maps to `end`.
- An automatic Description has `source: "auto"` and no stored `value`; the Collection explicitly identifies its excerpt source Text field. The build strips image nodes, collapses whitespace and truncates at 1,000 Unicode code points, preferring a nearby word boundary where available. A custom override has `source: "manual"` and an explicit `value`. Existing v1 summaries map to manual values. A detail page should not show an automatic excerpt again immediately before its source body.
- Link fields allow site-root-relative paths and `http`, `https`, `mailto`, or `tel` URLs; protocol-relative and active-content schemes such as `javascript:` are rejected.
- Project preset route compatibility is `/projects/` for the list and `/portfolio/<slug>/` for item details. It preconfigures separate Category fields for categories and tags, Gallery, rich Text details, and plain Text release date. V1 pages keep their IDs, slugs and published flags; projects keep their item IDs, slugs, published state, order, media references, alt text and interleaved text/gallery order. Existing summaries remain manual. Cover Image points to the first existing gallery image; no file is copied.

The runtime enforces document IDs, collection references, path collisions, field value types, category membership, media paths and supported rich-text nodes. Focused tests cover migration fidelity, unknown versions, and V1/V2 backup restoration.

**V2 is the owner-selected target contract in the local working tree, not yet the committed or released contract.** The committed V1-only application rejects a V2 content file because its schema requires `version: 1` and `entries`; use the matching V2-capable local code for V2 data. V1 backup restore is supported by the current V2 migration path; restoring a V1 backup through the V2 dashboard migrates it to V2 after creating another recovery backup. Unknown versions and malformed V2 values are rejected. Keep the migration backup available for recovery. Do not mix a V2 content file with an older V1-only application build.
