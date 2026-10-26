# Architecture Proposal

**Status: working desktop baseline, proposed future content model.** The local editor, file-backed API, Astro renderer, image conversion, safe local build path and first Cloudflare Pages Direct Upload adapter exist. A QA preview was uploaded and owner-confirmed accessible (see M2_VALIDATION). Production publishing, template selection, generic collections and phone-native full Astro builds remain open.

## Boundaries
1. **CMS UI:** A responsive React + TypeScript/Vite dashboard and PWA shell for one local owner. No Admin/Editor role split is currently implemented.
2. **Content & media:** Currently Zod-validated `content/content.json` (v1) and WebP media plus retained source images. Per-entry JSON/Markdown is a proposal, not existing storage.
3. **Theme renderer:** Astro components/layouts render the records to HTML, CSS, and optional JavaScript at build time.
4. **Build/publish runner:** Node.js on the owner's device builds content + theme into static assets. A provider adapter may upload them after the owner authorizes a destination.
5. **Static host:** Serves the published assets. It is not responsible for CMS writes or build execution.

Data flow:
**Editor -> CMS forms -> validation + secure write -> content version -> build runner -> Astro static output -> publishing adapter -> static host**

## Installation model
Start with a separate local installation/repository for each customer. Avoid a central multi-tenant platform and a Studio-hosted backend. The local owner authorizes publishing; credentials must stay out of browser code.

## Technical baseline
- Public site: **Astro** with pre-rendered routes and components.
- CMS: **React + TypeScript + Vite**, with a responsive PWA dashboard shell in `apps/admin`.
- Content: current `ContentSchema` v1 is a single JSON document, with `page`/`project` entries and `text`/`gallery` components. Zod validation happens at the local API boundary; no Astro Content Layer loader is wired in yet.
- Images: select JPEG/PNG on mobile/desktop, process to WebP before committing where supported, choose quality/dimensions, preserve clarity and alt text. Build-time resizing remains available for theme-specific image sizes.
- Publishing: local Astro build plus a Cloudflare Pages Direct Upload adapter. The trusted local Node process manages credentials and upload; GitHub Actions or a hosted runner is not required.
- First provider: owner-approved Cloudflare Pages Direct Upload via Wrangler. QA preview upload was verified against deployment metadata and owner-confirmed accessible; production deployment was not verified. See [PUBLISHING](PUBLISHING.md) and [M2_VALIDATION](M2_VALIDATION.md). Direct Upload projects cannot later switch to Git integration.
- Theme contract: content schema remains stable and each theme maps supported page and block types to its own components.
- Local development: dashboard `127.0.0.1:5173`, Astro preview `127.0.0.1:4321`, Node API `127.0.0.1:4322`. The local single-user workflow has no hosted authentication. Installability and mobile packaging are separate platform checks.

## Security and reliability
- **Never place repository write tokens or hosting secrets in dashboard JavaScript.** Use a secure local authorization flow or a narrowly scoped broker only if the target provider requires it.
- The MVP is single-user/local. If remote multi-user access is introduced later, authorization must be enforced at the trusted write boundary.
- Validate file type, size, names and content inputs; escape rendered content and avoid arbitrary HTML injection.
- Keep draft versions, publish status, and rollback paths. Do not claim publication until deployment reports success.
- Handle concurrent edits, upload failures, and build failures explicitly.
- Media storage inside a Git repository is acceptable for a small prototype; monitor growth and move large media to a suitable store if needed.

## PWA design requirements
One intended interface for desktop and future **Android**, with iOS deferred; only the desktop workflow has been implemented and exercised. Prefer touch-friendly controls and quick photo uploads, with readable forms and responsive galleries. Provide browser-specific installation guidance when useful. Avoid reliance on unsupported background sync or offline publishing features. Offline editing is a future option, not an MVP promise.

## Site rendering
Public pages must work on simple static file hosting without server-side rendering. An email link or external contact link is fine; a true server-submitted form would need a separate service. Keep useful existing routes if migration benefits from them.

## Key architectural decisions to validate
- Safe v1-to-v2 migration and per-entry store with atomic writes/backups
- CMS-side paginated queries and later build-time large-content performance
- Allowed block/preset registry and unsupported theme component behavior
- RTL/LTR quality for each approved template; language does not imply automatic translation
- Content validation/sanitized rich-text representation, image fidelity and backup strategy
- Android full-build feasibility; production Cloudflare publishing and rollback verification

## Risks
iOS and Android installation behavior differs; mobile image processing can be memory-heavy; Git repositories can become too large for media; third-party Astro themes may not support this content schema. Test before making platform guarantees.

References:
- [Astro documentation](https://docs.astro.build/)
- [MDN: PWA installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)

## Proposed collection + page system (not implemented)

See [CONTENT_MODEL.md](CONTENT_MODEL.md) for the UX flow, storage contracts, data/renderer separation, category rules, paginated routes and incremental migration.

- Keep **Collection definitions** (e.g. Articles/Photos/Artists), **entries**, **categories**, **Pages** and **Page blocks** as distinct domain concepts. A collection is not a visual component; a `collectionView` block renders its items on a page.
- Use a small fixed set of content type presets and display presets. Do not expose raw Zod schemas or arbitrary Astro components in the dashboard.
- Store content independently of theme; a supported theme maps block/view types to its own Astro components.
- If/when per-entry file storage is introduced, prefer Astro Content Layer's `glob()`/`file()` loaders and `getCollection()` at **build time**. The current renderer imports the single JSON file directly; do not claim the Content Layer is already used.
- Use `getStaticPaths()` and `paginate()` to generate category/index/detail routes where appropriate. This is **distinct** from efficient dashboard API paging. Statically generated pagination does not remove the cost of processing all entries at build time.
- Site `language` and `direction` should map to `<html lang dir>` and CSS logical properties after theme validation; the current renderer hardcodes `lang="en" dir="ltr"`.

Official Astro references: [Content Collections](https://docs.astro.build/en/guides/content-collections/), [Content Loaders](https://docs.astro.build/en/reference/content-loader-reference/), and [Routing/Pagination](https://docs.astro.build/en/reference/routing-reference/).
