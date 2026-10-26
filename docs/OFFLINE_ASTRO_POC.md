# Offline Astro renderer POC verification

**Result: partially verified on desktop; Android and iOS acceptance remains open.** Checked 2026-10-24.

The experiment compiles the fixed `src/SitePage.astro` at developer time with Astro 7.4.2 and compiler-rs 0.5.2, then bundles a browser ESM renderer. Editing JSON and regenerating HTML happens in the browser; the demo server serves local files and does not render routes. A narrow shim supplies Astro's inert `createMetadata` value. This is not `astro build` running on a phone or a general Astro runtime.

Checks passed:

- Implementer reports `npm ci --offline --no-audit --no-fund`, `npm run prepare:renderer`, and `npm run export` passed. `npm test` passed 4/4 during this verification. The export contains `index.html`, `projects/paper-study/index.html`, `styles.css`, and `images/paper-study.svg`.
- In Chrome, changing the project title and selecting **Generate static files** updated the preview and showed one archive link for the four generated files.
- Both exported HTML routes rendered through a localhost static file server. Each includes full page text, relative navigation, local CSS, and the local SVG with alt text. The HTML has no executable scripts. The image loaded successfully.
- A renderer check passed with `fetch`, `XMLHttpRequest`, `WebSocket`, and `EventSource` unavailable. A separate scratch-copy check confirmed Astro `<style>` and `<script>` blocks are rejected during preparation.
- The editor collapsed to one column at a simulated 390 × 844 viewport without horizontal overflow.
- The browser editor now exposes one `offline-site.zip` download link. I independently generated the same ZIP, checked it with `unzip -t` and Python `zipfile`, and confirmed the edited project title, both route paths, CSS path, and SVG bytes survived extraction. The CUA browser cannot save Blob downloads, so I verified the link and archive generation separately rather than claiming a browser download completed.

This does not prove airplane-mode operation of the editor in a browser: the demo page and its modules are served from localhost, the browser automation has no network-offline switch, and the environment does not permit an isolated network namespace. Chrome's automated URL policy also blocks `file://`; static routes were inspected over localhost. These are limits of the test setup, not evidence that static HTML needs a server.

The implementation is deliberately limited to this prepared template. Astro style/script blocks and additional compiled imports are rejected; the renderer does not provide arbitrary integrations, islands, slots, Astro's image pipeline, or a full Astro build. The ZIP path issue is resolved in the current implementation, but device-side download and extraction remain unverified.

The host is Ubuntu x86_64 with no connected Android device or Android emulator, and no iOS device or simulator toolchain. The viewport check is desktop simulation only. **Next issue:** verify archive download/extraction, editing, and both exported routes on real Android and iOS devices with external connectivity disabled.
