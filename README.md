# Astro Static Studio

A local-first content studio for managing an Astro static website. The application and sample site run from this repository; Sara Rahanjam is the included reference content/theme instance, not a separate product repository.

**Content-version status:** The committed baseline uses V1. The current uncommitted workspace includes a V2 schema, migration, dashboard and renderer, and the local content file is V2. Focused automated tests pass; browser migration/CRUD acceptance remains open under issue #19. Older V1 descriptions below describe the committed baseline, not all current workspace changes. See [Content contracts](docs/CONTRACTS.md).

## Run locally

Requirements: Node.js 22+ and npm.

```sh
npm install
npm run dev
```

Open the dashboard at `http://127.0.0.1:5173`. The Astro preview runs at `http://127.0.0.1:4321`; a loopback-only local API at `127.0.0.1:4322` saves validated content and media, and runs the static build. Keep the development processes running while editing/building.

```sh
npm run check
npm test
npm run build
```

The current usable slice is a local single-site editor with projects/pages, text and galleries, draft recovery, WebP media conversion, Astro static output, and a PWA dashboard shell. Site builds go to a temporary directory first; a failed build leaves the previous successful output intact. Cloudflare Pages Direct Upload and a preview deployment flow are implemented and were exercised with a QA project; the owner confirmed the preview became accessible. Production publishing has not been verified. Template selection, a general collection manager, RTL/LTR theme switching, iOS support, and full on-device Android Astro builds are not implemented. The Android APK in `experiments/offline-astro` is an earlier technical experiment, not the Studio app.

## Structure

- `apps/admin`: Persian RTL React dashboard/PWA.
- `apps/api`: local-only content, media and build API.
- `apps/site`: Astro static renderer and Sara sample site.
- `content`: sample site content.
- `packages/contracts`: validated content/theme/publisher contracts.
- `packages/theme`: initial Atelier theme metadata.

See [Vision](docs/VISION.md), [MVP](docs/MVP.md), [Architecture](docs/ARCHITECTURE.md), [Content and page model (proposed)](docs/CONTENT_MODEL.md), [Current contracts](docs/CONTRACTS.md), [Publishing decision](docs/PUBLISHING.md), and [Roadmap](docs/ROADMAP.md).

## Product direction (proposal, not shipped)

Keep the non-technical owner journey simple: choose an **approved free template**, configure site identity and language/direction, edit **Pages** and **Collections**, preview, and publish. A page can contain simple predefined blocks, including a collection display (cards, list, or gallery). Collection entries and categories are managed separately from the page on which they appear.

This is a **future content-model/UI proposal**, not a description of the current v1 schema. Today the implementation has only `page`/`project` entries and `text`/`gallery` blocks loaded from one JSON file; see [CONTENT_MODEL](docs/CONTENT_MODEL.md) for migration boundaries and sequencing.
