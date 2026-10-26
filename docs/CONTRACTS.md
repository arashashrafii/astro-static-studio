# Content and theme contracts

The implementation in `packages/contracts/src/index.ts` is the source of truth. Planning docs do not make a feature implemented.

## Content v1

- Root document: `version: 1`, site identity/contact fields, and entries.
- Entries: UUID, unique slug, `page` or `project`, title, summary, optional categories/tags/date, published state, and ordered components.
- Components: plain text (`body`) or image gallery. Images reference `/media/<id>.webp` and carry alt text.
- Zod validates API reads and writes. Duplicate IDs/slugs, invalid/reserved slugs, unsupported media paths, and oversized fields are rejected.

## Theme and publishing

- Theme metadata declares supported content component types and color tokens. It does not yet support a runtime theme registry or dashboard theme selection.
- Publisher metadata exposes a `publish()` contract. The local publisher builds into a temporary directory and replaces `apps/site/dist` only after a successful build; it does not deploy to GitHub, Cloudflare, or another host.

Schema changes require validation tests and a migration plan before breaking existing content files.

## Local setup and recovery

- First launch can keep the bundled sample or initialize a blank site with a name and empty contact details. Initializing a blank site requires downloading a pre-change backup first; the API creates that backup before replacing content.
- A backup is a versioned JSON file containing validated content, referenced WebP files, and available JPEG/PNG originals. Restore validates the full bundle and checksums before replacing content; media is added without overwriting conflicting files.
- Uploaded source images are stored under ignored local `content/media-originals/`; generated WebP files alone are served to the public Astro site.
- Backups and source images stay local and are not included in the static site output. Users should keep downloaded backups outside the device as an independent recovery copy.
