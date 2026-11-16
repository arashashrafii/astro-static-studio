# Architecture

**Status: Content V2 is active across the workspace alongside cross-platform Node/npm CLI, 100% offline Capacitor Android (`astro-static-studio.apk`) and iOS packaging, and automated GitHub Releases.** The local editor, file-backed API, Astro renderer with bundled `Atelier v1.0.0` theme, client/server WebP conversion, safe local build path, and Cloudflare Pages Direct Upload adapter are implemented. Production publishing and physical-device acceptance testing remain subject to owner verification.

## Boundaries
1. **CMS UI:** A responsive React + TypeScript/Vite dashboard and PWA shell for one local owner. No Admin/Editor role split is currently implemented.
2. **Content & media:** Zod-validated V1 and V2 use `content/content.json` and WebP media plus retained source images. V2 is the owner-selected target in the local working tree; V1 is the last committed format and remains the migration/backup input until V2 is reviewed, accepted and committed. Per-entry JSON/Markdown is a proposal, not existing storage.
3. **Theme renderer:** Astro components/layouts render the records to HTML, CSS, and optional JavaScript at build time.
4. **Build/publish runner:** Node.js on the owner's device builds content + theme into static assets. A provider adapter may upload them after the owner authorizes a destination.
5. **Static host:** Serves the published assets. It is not responsible for CMS writes or build execution.

Data flow:
**Editor -> CMS forms -> validation + secure write -> content version -> build runner -> Astro static output -> publishing adapter -> static host**

## Installation model
- **Desktop CLI (Windows, macOS, Linux):** Distributed as a standard Node.js/npm package (`npx astro-static-studio` / `astro-studio`). Runs locally on the owner's device with zero central Studio backend.
- **Mobile standalone apps (Android & iOS):** Packaged via Capacitor (`android/` and `ios/`) so editing, WebP conversion (`IndexedDB`), bundled default theme (`Atelier v1.0.0`), and preview work 100% offline. Internet is only required for remote hosting deployment or downloading future online themes.

## Technical baseline
- Public site: **Astro** with pre-rendered routes and components.
- CMS: **React + TypeScript + Vite**, with Service Worker auto-update (`apps/admin`).
- Content: **Content V2** (`content/content.json`) separating pages, collection definitions, and items, with V1 migration/backup compatibility retained.
- Images: select JPEG/PNG on mobile or desktop, process to WebP (Sharp on Node API; browser Canvas + `IndexedDB` when offline on mobile), preserve originals and alt text.
- Publishing: local Astro build plus a Cloudflare Pages Direct Upload adapter (`apps/api/src/publishing.ts`), and automated multi-platform artifact releases via `.github/workflows/release.yml`.
- First provider: owner-approved Cloudflare Pages Direct Upload via Wrangler. QA preview upload was verified against deployment metadata and owner-confirmed accessible; production deployment remains subject to explicit confirmation. See [PUBLISHING](PUBLISHING.md) and [M2_VALIDATION](M2_VALIDATION.md).
- Theme contract: `ThemeContractV1` and bundled `Atelier v1.0.0` (`packages/theme`), supporting LTR and RTL site configuration (`<html lang dir>`).
- Local development & CLI runtime: unified Express server on `PORT=3000` (`http://localhost:3000`) serving the built admin UI (`apps/admin/dist`), `/media`, `/preview`, and `/api`.

## Security and reliability
- **Never place repository write tokens or hosting secrets in dashboard JavaScript.** Use a secure local authorization flow or a narrowly scoped broker only if the target provider requires it.
- The MVP is single-user/local. If remote multi-user access is introduced later, authorization must be enforced at the trusted write boundary.
- Validate file type, size, names and content inputs; escape rendered content and avoid arbitrary HTML injection.
- Keep draft versions, publish status, and rollback paths. Do not claim publication until deployment reports success.
- Handle concurrent edits, upload failures, and build failures explicitly.
- Media storage inside a Git repository is acceptable for a small prototype; monitor growth and move large media to a suitable store if needed.

## Mobile & Offline Design Requirements
One responsive interface across desktop, **Android** (`astro-static-studio.apk`), and **iOS** (Capacitor app using `iosScheme: "capacitor"`). Android PWA install buttons/prompts are intentionally excluded because Android is distributed directly as a native APK. All core editing, media WebP conversion (`IndexedDB`), bundled `Atelier v1.0.0` theme rendering, and local preview run **100% offline**; network connectivity is only required when publishing to a remote static host or downloading future online templates.

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

## Collection + page system

See [CONTENT_MODEL.md](CONTENT_MODEL.md) for the UX flow, storage contracts, data/renderer separation, category rules, paginated routes and incremental migration.

- Keep **Collection definitions** (e.g. Images or Content), **items**, **tags**, **Pages** and **Page blocks** as distinct domain concepts. Each collection has one canonical list layout plus detail routes; a `collectionView` block can link to its items without its own layout controls.
- Use the two owner-approved collection kinds, Image gallery and Content, with their fixed forms and small set of list layouts. Do not expose raw Zod schemas or arbitrary Astro components in the dashboard.
- Store content independently of theme; a supported theme maps block/view types to its own Astro components.
- If/when per-entry file storage is introduced, prefer Astro Content Layer's `glob()`/`file()` loaders and `getCollection()` at **build time**. The current renderer imports the single JSON file directly; do not claim the Content Layer is already used.
- Use `getStaticPaths()` and `paginate()` to generate category/index/detail routes where appropriate. This is **distinct** from efficient dashboard API paging. Statically generated pagination does not remove the cost of processing all entries at build time.
- Site `language` and `direction` should map to `<html lang dir>` and CSS logical properties after theme validation; the current renderer hardcodes `lang="en" dir="ltr"`.

Official Astro references: [Content Collections](https://docs.astro.build/en/guides/content-collections/), [Content Loaders](https://docs.astro.build/en/reference/content-loader-reference/), and [Routing/Pagination](https://docs.astro.build/en/reference/routing-reference/).
