# MVP Scope

## Goal
Prove that a non-technical owner can manage a simple portfolio with **one Astro template** and a local React/TypeScript dashboard. Studio runs on the owner's device without a Studio-operated server or database. Sara Rahanjam is the sample output; do not build a universal site builder yet.

## Content Editor features
- See a simple dashboard with Projects, Articles, Pages, Media, and Publish.
- Add, edit, reorder, and remove portfolio projects.
- Edit project title, description, category, and gallery images.
- Add and edit simple articles and their pictures.
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
- Do not introduce a database or backend until a real requirement justifies one.
- Avoid a broad plugin ecosystem, e-commerce, or complex user-management screens.

## Acceptance criteria
1. Responsive CMS works with basic keyboard accessibility and touch controls on Android and desktop browsers.
2. Editor can add one project with three images, preview, and publish it without Git or terminal knowledge.
3. JPEG and PNG conversion includes a visible before/after file-size and quality check. Images display correctly with appropriate alt text.
4. Editor can update About and Contact without changing source code.
5. Admin can create a simple page using a supported layout preset.
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
First local content/preview, then secure publishing, then test the complete mobile editing flow.

References: [MDN PWA installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).
