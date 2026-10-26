# Content and theme contracts

The implementation in `packages/contracts/src/index.ts` is the source of truth. Planning docs do not make a feature implemented.

## Content v1

- Root document: `version: 1`, site identity/contact fields, and entries in the single `content/content.json` file (up to 500 entries under the current schema).
- Entries: UUID, unique slug, `page` or `project`, title, summary, optional categories/tags/date, published state, and ordered components.
- Components: plain text (`body`) or image gallery. Images reference `/media/<id>.webp` and carry alt text.
- Zod validates API reads and writes. Duplicate IDs/slugs, invalid/reserved slugs, unsupported media paths, and oversized fields are rejected.

## Theme and publishing

- Theme metadata declares supported content component types and color tokens. It does not yet support a runtime theme registry or dashboard theme selection.
- The `PublisherInterface` local build contract retains the last good `apps/site/dist` on failed builds. **Separately**, `apps/api/src/publishing.ts` implements Cloudflare Pages Direct Upload for the current desktop workflow; the local publisher alone does not deploy. QA preview validation is documented in [M2_VALIDATION](M2_VALIDATION.md).

Schema changes require validation tests and a migration plan before breaking existing content files.

## Local setup and recovery

- First launch can keep the bundled sample or initialize a blank site with a name and empty contact details. Initializing a blank site requires downloading a pre-change backup first; the API creates that backup before replacing content.
- A backup is a versioned JSON file containing validated content, referenced WebP files, and available JPEG/PNG originals. Restore validates the full bundle and checksums before replacing content; media is added without overwriting conflicting files.
- Uploaded source images are stored under ignored local `content/media-originals/`; generated WebP files alone are served to the public Astro site.
- Backups and source images stay local and are not included in the static site output. Users should keep downloaded backups outside the device as an independent recovery copy.

## Proposed v2 direction — not the current runtime contract

The [CONTENT_MODEL](CONTENT_MODEL.md) document proposes separately managed **Pages**, **Collection definitions**, **Collection entries** and **per-collection categories**. Page blocks would include `richText`, `image` and `collectionView`; the latter references a collection and display preset, not embedded duplicated entries. A collection type preset defines the allowed fields for articles, projects, photos or people. Themes map those supported block types to Astro renderers.

**No v2 contract is deployed yet.** Do not silently change the `version: 1` schema, existing `page/project` kind values or `text/gallery` components in production code. First design and test a versioned, reversible/backed-up migration that preserves IDs, slugs, published flags, categories, gallery order and media links. Reject unsupported versions and unknown block types with actionable errors. Keep safe backup and restore coverage before changing storage.

Current V1 is the compatibility reference until a tested migration is implemented.
