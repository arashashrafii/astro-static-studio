# MVP Scope

**Version status:** Content V2 is active across the workspace (pages, typed collections, rich text, WebP media, RTL/LTR settings, and V1 migration/backup compatibility). Cross-platform Node CLI (`Windows/macOS/Linux`) plus standalone 100% offline Capacitor Android (`astro-static-studio.apk`) and iOS packaging are implemented and built via GitHub Actions. Real-device APK/iOS acceptance and Cloudflare production publishing remain subject to owner verification.

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
- **One site installation, one bundled default theme (`Atelier v1.0.0`), one remote host adapter (`Cloudflare Pages`)** in the current release.
- No drag-and-drop designer, arbitrary custom HTML editor, or automatic unverified third-party theme import.
- Android is distributed as a standalone offline APK (`astro-static-studio.apk`) with all PWA install prompts removed; iOS is packaged as a standalone offline Capacitor app (`ios/`).
- All editing, WebP image processing, bundled default theme, and local preview run 100% offline; internet is only needed for publishing or downloading future online themes.
- Desktop installation runs cross-platform via Node.js/npm (`npx astro-static-studio` / `astro-studio`).
- Keep the local Express API (`PORT=3000`); do not introduce a hosted Studio backend or database.
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
Desktop CLI runs via Node.js 22+ / npm on Windows, macOS, and Linux. Android (`astro-static-studio.apk`) and iOS (`astro-static-studio*.ipa` / `.xcarchive.zip`) are packaged with Capacitor and synced automatically via `.github/workflows/release.yml`. Do not claim full on-device Astro CLI builds inside mobile WebViews; mobile uses offline local editing, `IndexedDB` WebP storage, and built-in offline HTML preview, while full static Astro CLI builds and Cloudflare deployment run in Node/CI.

## Excluded from MVP
Multiple publisher adapters; unverified third-party theme marketplace; visual drag-and-drop page builder; collaborative multi-user role management.

## Prototype order
Local content/preview and a Cloudflare QA preview publish are implemented; the remaining immediate gate is task-based testing with a non-technical desktop owner. Android full-build feasibility and packaging come later. The proposed collection/block redesign follows an incremental, backed-up content migration, not a one-shot replacement.

References: [MDN PWA installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

## Current implementation versus proposed follow-up

**Implemented in this workspace:** React/TypeScript Content V2 dashboard (`apps/admin`), unified Express server on port `3000` (`apps/api`), Astro static renderer with bundled `Atelier v1.0.0` theme (`apps/site` & `packages/theme`), V1→V2 migration and backup/restore, Sharp & client-side Canvas WebP conversion, local offline preview, cross-platform Node CLI (`npx astro-static-studio`), native Capacitor Android (`astro-static-studio.apk`) & iOS (`ios/`) projects without Android PWA install banners, and automated GitHub Releases (`.github/workflows/release.yml`). Cloudflare production publishing, physical Android/iOS device acceptance, and downloading future online themes remain to be verified/implemented.

**Proposed follow-up, outside the existing v1 acceptance baseline:** a guided template-first setup, editable Pages and typed Collections with one-level categories, simple collection-view page blocks, plain rich text, theme-supported direction setting and two independent paging concerns (CMS data retrieval and generated static URLs). No arbitrary schema builder or drag-and-drop editor. See [CONTENT_MODEL.md](CONTENT_MODEL.md).

Treat these as **future acceptance criteria**, not proof that the features work:
- Owner creates an Articles collection from a preset and adds an entry without technical terms.
- Owner creates a Photos collection, assigns Winter/Summer categories, and adds a gallery view to a page.
- Owner can put the same collection on Home (limited items) and Articles (paginated list) without duplicating records.
- RTL and LTR pass real layout tests on each supported theme; changing direction does not translate content.
- A backup/restore round-trip and content migration preserve all existing v1 projects/pages, published flags, slugs, media and galleries.
- A dashboard listing fetches only one page of entries from its local API; static site pagination produces separate HTML pages.

Do not increase MVP scope before desktop usability issue #5 is reviewed.
