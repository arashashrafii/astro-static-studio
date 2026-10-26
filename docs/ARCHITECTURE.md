# Architecture Proposal

**Status: partial implementation.** The local editor, file-backed API, Astro renderer, image conversion and local build path now exist here, adapted from the Sara reference project. A first Cloudflare Pages adapter is implemented; real-account preview validation, theme selection and phone-native Astro builds remain open.

## Boundaries
1. **CMS UI:** A mobile-first React + TypeScript PWA. Editors use guided forms; Admin sees advanced settings.
2. **Content & media:** Portable validated JSON/Markdown records and optimized media, stored separately from theme markup.
3. **Theme renderer:** Astro components/layouts render the records to HTML, CSS, and optional JavaScript at build time.
4. **Build/publish runner:** Node.js on the owner's device builds content + theme into static assets. A provider adapter may upload them after the owner authorizes a destination.
5. **Static host:** Serves the published assets. It is not responsible for CMS writes or build execution.

Data flow:
**Editor -> CMS forms -> validation + secure write -> content version -> build runner -> Astro static output -> publishing adapter -> static host**

## Installation model
Start with a separate local installation/repository for each customer. Avoid a central multi-tenant platform and a Studio-hosted backend. The local owner authorizes publishing; credentials must stay out of browser code.

## Technical baseline
- Public site: **Astro** with pre-rendered routes and components.
- CMS: **React + TypeScript** as a responsive **PWA**, likely with Vite (to confirm when implementation starts).
- Content: versioned JSON/Markdown and media files. Schema validation is mandatory.
- Images: select JPEG/PNG on mobile/desktop, process to WebP before committing where supported, choose quality/dimensions, preserve clarity and alt text. Build-time resizing remains available for theme-specific image sizes.
- Publishing: first build locally and verify static output. Add one tested provider adapter after local output works; do not make GitHub Actions or a hosted runner a product dependency.
- First provider: owner-approved Cloudflare Pages Direct Upload via Wrangler. See [PUBLISHING](PUBLISHING.md). Real-account preview validation is still pending; Direct Upload projects cannot later switch to Git integration.
- Theme contract: content schema remains stable and each theme maps supported page and block types to its own components.
- Local development: CMS and Astro preview can run on localhost; production PWA installation and secure authentication need appropriate HTTPS hosting.

## Security and reliability
- **Never place repository write tokens or hosting secrets in dashboard JavaScript.** Use a secure local authorization flow or a narrowly scoped broker only if the target provider requires it.
- The MVP is single-user/local. If remote multi-user access is introduced later, authorization must be enforced at the trusted write boundary.
- Validate file type, size, names and content inputs; escape rendered content and avoid arbitrary HTML injection.
- Keep draft versions, publish status, and rollback paths. Do not claim publication until deployment reports success.
- Handle concurrent edits, upload failures, and build failures explicitly.
- Media storage inside a Git repository is acceptable for a small prototype; monitor growth and move large media to a suitable store if needed.

## PWA design requirements
One interface for **Android, iOS and Windows**. Prefer touch-friendly controls and quick photo uploads, with readable forms and responsive galleries. Provide browser-specific installation guidance when useful. Avoid reliance on unsupported background sync or offline publishing features. Offline editing is a future option, not an MVP promise.

## Site rendering
Public pages must work on simple static file hosting without server-side rendering. An email link or external contact link is fine; a true server-submitted form would need a separate service. Keep useful existing routes if migration benefits from them.

## Key architectural decisions to validate
- Draft/write API and user authentication
- Publication workflow and first hosting target
- Content folder structure and schema versioning
- Image quality/backup strategy
- Theme adapter interface and unsupported block behavior
- Safe rollback and preview URLs

## Risks
iOS and Android installation behavior differs; mobile image processing can be memory-heavy; Git repositories can become too large for media; third-party Astro themes may not support this content schema. Test before making platform guarantees.

References:
- [Astro documentation](https://docs.astro.build/)
- [MDN: PWA installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
