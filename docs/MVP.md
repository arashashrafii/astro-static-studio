# MVP Scope

**Version status:** The committed baseline is V1. The current uncommitted workspace includes a V2 migration, dashboard and renderer; its local content is V2. V2 focused tests pass, while browser migration/CRUD acceptance remains open under issue #19. Later V1-only descriptions are historical baseline or acceptance context, not a complete description of the workspace.

## Goal
Prove that a non-technical owner can manage a simple portfolio with **one Astro template** and a local React/TypeScript dashboard. Studio runs on the owner's device without a Studio-operated server or database. Sara Rahanjam is the sample output; do not build a universal site builder yet.

## Target owner capabilities (features below are not all implemented)
- See a simple dashboard with Projects, Articles, Pages, Media, and Publish.
- Add, edit, reorder, and remove portfolio projects.
- Edit project title, description, category, and gallery images.
- Manage articles and their pictures as Content V2 collection items (the active dashboard supports V1 backups and V2 Pages/Collections).
- Edit content in predefined Home, About, and Contact sections. Contact may use email/phone links; no server-side form is required for this example.
- Upload JPEG or PNG photos from a phone or desktop, inspect image quality, convert suitable output to WebP, and use meaningful alt text. Preserve source files or an export path when needed for artwork fidelity.
- Save drafts and preview before publication.
- Publish with one simple action, then see an accurate result or retry instructions.

## Site setup and publishing
- Select supported page/layout presets and configure site title and contact links.
- Build and preview the site locally.
- Choose one supported publishing destination and authorize it; credentials must not enter browser bundles.
- The local single-owner workflow does not require account sign-in or Admin/Editor roles.

## First-release limits
- **One site installation, one sample theme, one publishing path** in the proof of concept.
- No drag-and-drop designer, arbitrary custom HTML editor, or automatic theme import.
- Android is the first packaged target; iOS is deferred until Android is validated.
- Full local Astro builds on Android are a feasibility gate; the existing renderer experiment does not prove this capability.
- Desktop run uses Node.js/npm and does not require a separate installer.
- Keep the current local-only Node API; do not introduce a hosted backend or database without a demonstrated need.
- Avoid a broad plugin ecosystem, e-commerce, or complex user-management screens.

## Acceptance criteria
1. Responsive CMS works with basic keyboard accessibility and touch controls on Android and desktop browsers.
2. Editor can add one project with three images, preview, and publish it without Git or terminal knowledge.
3. JPEG and PNG conversion includes a visible before/after file-size and quality check. Images display correctly with appropriate alt text.
4. Editor can update About and Contact without changing source code.
5. The single owner can create a simple page using a supported layout preset; there is no separate Admin role in the local MVP.
6. Build produces static output; navigation, project URLs, responsive images, and galleries work after deployment.
7. CMS shows an actionable failure message when the build or deploy fails, and prior published content is not silently lost.
8. No publish credentials or long-lived tokens appear in browser bundles or Git history.
9. The local single-owner workflow has no role boundary; if remote multi-user access is added later, permissions must be enforced at the write boundary.
10. Use at least one real non-technical tester before calling the MVP usable.

## Platform note
Desktop setup requires Node.js/npm. Android is the first native package target. iOS is a later phase. Do not claim full mobile Astro builds until verified on a real Android device.

## Excluded from MVP
Multiple publisher adapters; curated Astro theme gallery; visual page builder; iOS before Android proof; collaborative editing.

## Prototype order
Local content/preview and a Cloudflare QA preview publish are implemented; the remaining immediate gate is task-based testing with a non-technical desktop owner. Android full-build feasibility and packaging come later. The proposed collection/block redesign follows an incremental, backed-up content migration, not a one-shot replacement.

References: [MDN PWA installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

## Current implementation versus proposed follow-up

**Implemented in this repository (desktop local workflow):** React/TypeScript PWA shell, loopback Node API, Astro sample renderer, `content/content.json` validated with Zod v1, page/project editing with text and gallery components, image conversion, local backup/restore, temporary-directory static build and Cloudflare Pages QA preview publishing. Cloudflare production publishing, real non-technical acceptance testing, Android product workflow, free-template picker, RTL/LTR site setting, article/artist/photo collection types, rich-text editor and static pagination are **not verified as implemented**.

**Proposed follow-up, outside the existing v1 acceptance baseline:** a guided template-first setup, editable Pages and typed Collections with one-level categories, simple collection-view page blocks, plain rich text, theme-supported direction setting and two independent paging concerns (CMS data retrieval and generated static URLs). No arbitrary schema builder or drag-and-drop editor. See [CONTENT_MODEL.md](CONTENT_MODEL.md).

Treat these as **future acceptance criteria**, not proof that the features work:
- Owner creates an Articles collection from a preset and adds an entry without technical terms.
- Owner creates a Photos collection, assigns Winter/Summer categories, and adds a gallery view to a page.
- Owner can put the same collection on Home (limited items) and Articles (paginated list) without duplicating records.
- RTL and LTR pass real layout tests on each supported theme; changing direction does not translate content.
- A backup/restore round-trip and content migration preserve all existing v1 projects/pages, published flags, slugs, media and galleries.
- A dashboard listing fetches only one page of entries from its local API; static site pagination produces separate HTML pages.

Do not increase MVP scope before desktop usability issue #5 is reviewed.
