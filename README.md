# Astro Static Studio

An **offline-first static website CMS and Astro builder** powered by **Content V2**, a bundled default theme (**Atelier v1.0.0**), in-browser/server WebP image processing, and standalone mobile packaging. All content editing, media management, and local preview work **100% offline**—internet access is only required when downloading future online themes or publishing to remote hosting (such as Cloudflare Pages).

## Platforms & Installation

### 1. Desktop CLI via Node / npm (Windows, macOS, Linux)

Requires **Node.js 22+**.

```sh
# Run directly without global installation
npx astro-static-studio

# Or install globally
npm install -g astro-static-studio
astro-studio --port 3000
```

Running from source:

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. The unified Express server (`apps/api/src/server.ts`) serves the React dashboard (`apps/admin/dist`), local media (`/media`), local static preview (`/preview`), and local API (`/api`).

### 2. Android (`.apk`) — 100% Offline Standalone App

- Native Capacitor Android project located in `android/`, packaged with output name **`astro-static-studio.apk`**.
- All Android PWA install banners/buttons have been removed; Android is distributed directly as a standalone `.apk`.
- Runs completely offline inside the Capacitor WebView:
  - Bundled `Content V2` fallback & `Atelier v1.0.0` theme.
  - Edits persisted locally (`localStorage` + `IndexedDB`) with client-side Canvas WebP image conversion and local offline preview.

Build APK locally (requires JDK 21 & Android SDK):

```sh
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/astro-static-studio-debug.apk
```

### 3. iOS (`.ipa` / `.xcarchive.zip`) — 100% Offline Standalone App

- Native Capacitor iOS project located in `ios/` (using Swift Package Manager in `ios/App/CapApp-SPM` and `iosScheme: "capacitor"`).
- Operates 100% offline with bundled assets, local WebP conversion, and offline preview.

Sync iOS bundle locally (macOS + Xcode):

```sh
npm install
npm run build
npx cap sync ios
npx cap open ios
```

## Automated GitHub Releases

`.github/workflows/release.yml` automatically runs `npm run check`, `npm run build`, verification tests, and packages all release artifacts on:
- Pushing a version tag (`v*`, e.g. `git tag v1.0.0 && git push origin v1.0.0`)
- Pushing to `main` or `master`
- Manual trigger via **Actions → Build & Release (Android APK, iOS IPA, npm Package) → Run workflow**

Each release publishes:
- `astro-static-studio.apk` (Android offline APK)
- `astro-static-studio*.ipa` and `astro-static-studio.xcarchive.zip` (iOS app archive)
- `astro-static-studio-<version>.tgz` (cross-platform npm package)
- `SHA256SUMS.txt`

See [Release & Distribution Guide (FA)](docs/RELEASE_AND_DISTRIBUTION.md) for signing secrets and full step-by-step instructions.

## Development & Verification Scripts

```sh
npm run build        # Build static Astro site + offline admin bundle
npm run cap:sync     # Build admin bundle and sync android/ and ios/
npm run check        # Root TypeScript typecheck
npm run lint         # Strict TypeScript check across workspaces
npm test             # Run unit test suite
```

## Repository Structure

- `apps/admin`: Persian RTL React + Vite + Tailwind CSS dashboard (`Content V2` editor, client-side WebP conversion, offline preview, Service Worker auto-update).
- `apps/api`: Node/Express server (`PORT=3000`) providing local storage, Sharp WebP processing, static site build runner, backup/restore, and Cloudflare Pages publishing.
- `apps/site`: Astro static site renderer with bundled `Atelier v1.0.0` theme.
- `packages/contracts`: Zod schemas for `Content V2`, V1→V2 migration, and block/field validation.
- `packages/theme`: Theme contract V1, Atelier manifest, and adapter.
- `android/` & `ios/`: Native Capacitor mobile projects, icons, and splash assets (`scripts/generate-mobile-assets.mjs`).
- `bin/` & `scripts/`: Cross-platform Node CLI entrypoint (`astro-studio`), workspace linker (`link-workspaces.mjs`), and asset generators.
- `content/`: Local `content.json`, `theme-config.json`, and media originals.
- `.github/workflows/`: CI (`ci.yml`) and multi-platform GitHub Release (`release.yml`) workflows.

See [Release & Distribution (FA)](docs/RELEASE_AND_DISTRIBUTION.md), [Architecture](docs/ARCHITECTURE.md), [Current Contracts](docs/CONTRACTS.md), [Publishing](docs/PUBLISHING.md), [Roadmap](docs/ROADMAP.md), and [Staged Development](docs/STAGED_DEVELOPMENT.md).
