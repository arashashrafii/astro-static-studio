# MVP Scope

## Goal
Prove that a non-technical artist can manage and publish a simple portfolio with **one Astro template** and a **mobile-first React/TypeScript PWA**. Begin with Sara Rahanjam's site as a reference; do not build a universal site builder yet.

## Content Editor features
- See a simple dashboard with Projects, Articles, Pages, Media, and Publish.
- Add, edit, reorder, and remove portfolio projects.
- Edit project title, description, category, and gallery images.
- Add and edit simple articles and their pictures.
- Edit content in predefined Home, About, and Contact sections. Contact may use email/phone links; no server-side form is required for this example.
- Upload JPEG or PNG photos from a phone or desktop, inspect image quality, convert suitable output to WebP, and use meaningful alt text. Preserve source files or an export path when needed for artwork fidelity.
- Save drafts and preview before publication.
- Publish with one simple action, then see an accurate result or retry instructions.

## Admin features
- Select from approved page types/layout presets; create a simple page by filling its predefined fields.
- Configure site title, navigation, contact links, and selected supported template.
- Set up a supported publishing destination and editor permissions.
- Manage technical settings in a separate advanced area.

## First-release limits
- **One site installation, one sample theme, one publishing path** in the proof of concept.
- No drag-and-drop designer, arbitrary custom HTML editor, or automatic theme import.
- No separate native app binaries.
- No guaranteed offline editing or publish-without-internet.
- Do not introduce a database or backend until a real requirement justifies one.
- Avoid a broad plugin ecosystem, e-commerce, or complex user-management screens.

## Acceptance criteria
1. Responsive CMS works with basic keyboard accessibility and touch controls on Android, iPhone, and Windows browsers.
2. Editor can add one project with three images, preview, and publish it without Git or terminal knowledge.
3. JPEG and PNG conversion includes a visible before/after file-size and quality check. Images display correctly with appropriate alt text.
4. Editor can update About and Contact without changing source code.
5. Admin can create a simple page using a supported layout preset.
6. Build produces static output; navigation, project URLs, responsive images, and galleries work after deployment.
7. CMS shows an actionable failure message when the build or deploy fails, and prior published content is not silently lost.
8. No publish credentials or long-lived tokens appear in browser bundles or Git history.
9. Editor cannot change restricted Admin settings through either UI or backend actions.
10. Use at least one real non-technical tester before calling the MVP usable.

## Cross-platform note
A PWA is a website, not three native builds. Home-screen installation is browser-dependent. On iOS, users typically use the browser's Share / Add to Home Screen action; on Windows, Chromium-based browsers can install web apps. Test actual browser combinations.

## Excluded from MVP
Cloudflare/ArvanCloud publisher adapters beyond the initial target; curated Astro theme gallery; visual page builder; native packages using Capacitor or Tauri; collaborative editing.

## Prototype order
First local content/preview, then secure publishing, then test the complete mobile editing flow.

References: [MDN PWA installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).
