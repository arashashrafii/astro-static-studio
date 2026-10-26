# Astro Static Studio

A local-first content studio for managing an Astro static website. The application and sample site run from this repository; Sara Rahanjam is the included reference content/theme instance, not a separate product repository.

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

The current usable slice is a local single-site editor with projects/pages, text and galleries, draft recovery, WebP media conversion, Astro static output, and a PWA dashboard shell. Site builds go to a temporary directory first; a failed build leaves the previous successful output intact. Cloud publishing, theme selection, iOS and on-device Android Astro builds are not implemented. The Android APK in `experiments/offline-astro` is an earlier technical experiment, not the Studio app.

## Structure

- `apps/admin`: Persian RTL React dashboard/PWA.
- `apps/api`: local-only content, media and build API.
- `apps/site`: Astro static renderer and Sara sample site.
- `content`: sample site content.
- `packages/contracts`: validated content/theme/publisher contracts.
- `packages/theme`: initial Atelier theme metadata.

See [Vision](docs/VISION.md), [MVP](docs/MVP.md), [Architecture](docs/ARCHITECTURE.md), [Publishing decision](docs/PUBLISHING.md), and [Roadmap](docs/ROADMAP.md).
