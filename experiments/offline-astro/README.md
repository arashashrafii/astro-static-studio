# Offline Astro rendering experiment

This experiment checks whether one prepared Astro template can render edited structured content in a browser without contacting a remote service. The editor can change the JSON, preview the home page, choose a local JPEG, PNG, or WebP, and download one ZIP archive containing the generated HTML, CSS, and image files. A local export command writes the same files to disk.

## Prepare and run

Use Node.js 22.12 or newer. From this directory, install the pinned packages once:

```sh
npm ci
```

After installation, the preparation, rendering, export, tests, and demo use local files only:

```sh
npm run prepare:renderer
npm test
npm run export
npm run demo
```

Open [http://127.0.0.1:4173/](http://127.0.0.1:4173/) while the demo server is running. The page and its ESM bundle load from loopback. It makes no request to an external host. Edit the JSON or select a local photo, then choose **Generate static files** and download `offline-site.zip`.

The disk export is written to `dist/offline-site/` and contains:

- `index.html`
- `projects/paper-study/index.html`
- `styles.css`
- `images/paper-study.svg`

## Android wrapper experiment

The `android/` project wraps the same prepared editor in a native WebView. It pins Gradle 9.3.1, Android Gradle Plugin 9.1.1, AndroidX WebKit 1.18.0, and Android SDK Platform 36. Build it with JDK 17 or newer, Node.js 22.12 or newer, and Android SDK Build Tools 36.0.0:

```sh
npm ci
cd android
./gradlew assembleDebug
```

If Google Maven is unreachable, retry with the opt-in official Google Maven redirector fallback: `./gradlew -DofflineAstro.useGoogleMavenRedirector=true assembleDebug`. The usual `google()` repository remains first.

The Gradle build runs `npm run prepare:android` before packaging. The prepared editor and renderer are copied into ignored app assets and loaded from `https://appassets.androidplatform.net`; the app has no Internet permission and no local web server. The WebView allows only that origin, disables file/content access and mixed content, and blocks other navigation and subresource requests. AndroidX WebKit 1.18.0 provides the origin-scoped, main-frame-checked message listener used for ZIP export. Android's document picker writes the archive only to the destination the user chooses. The native boundary accepts one ZIP message, checks base64 bounds and the ZIP local-header signature, and caps raw archives at 20 MiB. The native image picker supplies the existing JPEG/PNG/WebP file field without requesting broad media access.

The debug APK is `app/build/outputs/apk/debug/app-debug.apk`; install it on a connected device with `adb install -r app/build/outputs/apk/debug/app-debug.apk`, or copy it to a phone and open it from Files. The APK was built and verified on 2026-10-24, but has not been installed or exercised on an Android device or emulator. For a phone installation and airplane-mode check, see [`docs/ANDROID_POC.md`](../../docs/ANDROID_POC.md). The wrapper uses the prepared fixed Astro renderer and does not run `astro build` on the phone. The Android web asset copy and APK outputs are generated and ignored.

The sample content and image are in `content/`. The automated check replaces `fetch` with a function that always fails and verifies rendering still succeeds without calling it. It also checks the archive with `unzip` and Python's standard `zipfile` reader, including nested paths, UTF-8 names, and extracted bytes (that test is skipped if either reader is unavailable). The container does not allow creating a network namespace (`unshare -n` is unavailable), so the check does not claim OS-level network isolation. The output bundle has no external module imports.

## What is being rendered

The preparation command compiles [`src/SitePage.astro`](src/SitePage.astro) with the pinned Astro compiler, then bundles Astro's compiler runtime for browser ESM. The browser calls that prepared component with the edited content; Astro renders and escapes the HTML values. CSS and image bytes are copied into separate static files with relative links that work from both routes.

This is a precompiled component renderer, not `astro build` running on a phone. Full Astro static generation normally builds routes and supplies Astro's complete render context, integrations, styles, scripts, image processing, and deployment output. This experiment does not run those systems.

Astro's current internal compiler and runtime are not documented as a supported browser renderer. The bounded shim supplies the compiler's inert `createMetadata` value, and the output writer ignores only Astro's `head` and `maybe-head` instructions. The template has an explicit local stylesheet link and no Astro style/script blocks, islands, imported components, slots, or head-propagating content. Preparation fails if the compiled template adds imports, style blocks, or scripts. This should not be generalized to arbitrary Astro templates.

The editor supports a single local image selection for the first project. The ZIP writer stores entries without compression and uses UTF-8 paths; it does not create ZIP64 archives. The editor does not resize or convert photos or provide a user-facing directory picker. The Node export command is useful for checking the generated static files independently of the editor page.

## Device limits

The demo has only been checked on the available Linux environment. No Android or iOS device/emulator is attached here, so the experiment makes no Android or iOS compatibility claim. A device check should install the prepared demo assets first, turn off external connectivity while keeping the local app available, edit a title, select a photo, generate the files, then open both exported routes and verify that the CSS and image load. Check the browser's network panel for any request whose destination is outside the device.
