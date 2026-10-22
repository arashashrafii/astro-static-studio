# Architecture Proposal

**Status: design proposal, not an implemented system.**

## Boundaries
1. **CMS UI:** A mobile-first React + TypeScript PWA. Editors use guided forms; Admin sees advanced settings.
2. **Content & media:** Portable validated JSON/Markdown records and optimized media, stored separately from theme markup.
3. **Theme renderer:** Astro components/layouts render the records to HTML, CSS, and optional JavaScript at build time.
4. **Build/publish runner:** A trusted build environment turns content + theme into static assets and deploys them.
5. **Static host:** Serves the published assets. It is not responsible for CMS writes or build execution.

Data flow:
**Editor -> CMS forms -> validation + secure write -> content version -> build runner -> Astro static output -> publishing adapter -> static host**

## Installation model
Start with a separate installation/repository for each customer. Avoid a central multi-tenant platform. Admin configures the chosen host; the Editor never sees deployment credentials.

## Technical baseline
- Public site: **Astro** with pre-rendered routes and components.
- CMS: **React + TypeScript** as a responsive **PWA**, likely with Vite (to confirm when implementation starts).
- Content: versioned JSON/Markdown and media files. Schema validation is mandatory.
- Images: select JPEG/PNG on mobile/desktop, process to WebP before committing where supported, choose quality/dimensions, preserve clarity and alt text. Build-time resizing remains available for theme-specific image sizes.
- Publishing: start with a Git-based workflow and a trusted runner (for example GitHub Actions). Later introduce hosting adapters only after testing a concrete host's capability.
- Theme contract: content schema remains stable and each theme maps supported page and block types to its own components.
- Local development: CMS and Astro preview can run on localhost; production PWA installation and secure authentication need appropriate HTTPS hosting.

## Security and reliability
- **Never place repository write tokens or hosting secrets in the browser.** Use an appropriate OAuth/GitHub App flow and a minimal trusted service when secure token exchange or write operations require one.
- Server-side authorization must check Admin versus Editor, regardless of hidden UI controls.
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
