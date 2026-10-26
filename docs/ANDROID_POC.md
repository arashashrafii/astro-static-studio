# Android offline editor POC

The experimental wrapper is in `experiments/offline-astro/android/`. It packages the prepared editor and fixed Astro renderer into an APK, loads those local assets through AndroidX `WebViewAssetLoader`, and generates static files in the browser. It does not run `astro build` on the phone.

## Build

Use JDK 17 or newer, Node.js 22.12 or newer, Android SDK Platform 36, and Build Tools 36.0.0. From `experiments/offline-astro/android/`, run:

```sh
./gradlew assembleDebug
```

If Google Maven is unreachable from the build environment, retry with the opt-in official Google Maven redirector:

```sh
./gradlew -DofflineAstro.useGoogleMavenRedirector=true assembleDebug
```

The normal `google()` repository remains first. The opt-in setting adds Google's `https://redirector.gvt1.com/edgedl/android/maven2/` repository as a fallback. The Gradle build runs `npm run prepare:android` before packaging. The editor and renderer assets and APK outputs are generated and ignored.

## Verified APK

The debug APK was built on 2026-10-24 at `experiments/offline-astro/android/app/build/outputs/apk/debug/app-debug.apk`.

- Reproducible build command with the documented fallback: `./gradlew -DofflineAstro.useGoogleMavenRedirector=true assembleDebug` — passed (34 actionable tasks, 1 executed, 33 up-to-date).
- SHA-256: `a98f3f82b035d5142f6a9dc923053f63b8b6f15c5e96d3744d2ef7d4839d9c9a`
- Package: `org.astross.offlineastro`, version `0.1.0` (version code 1)
- Minimum Android API: 24; target API: 36
- `apksigner verify --verbose --print-certs`: passed; APK uses a standard Android debug certificate.
- `aapt dump permissions`: no permissions declared, including no `INTERNET` or broad storage/media permission.
- The APK contains the editor page, archive writer, compiled Astro component, generated renderer, and stylesheet module. All six packaged editor/renderer files matched their build inputs byte for byte.
- The APK-packaged renderer and ZIP writer ran with edited content and an image byte array. The resulting archive contained the edited home and project routes, stylesheet, and image with the expected bytes.

The WebView permits only the app-assets HTTPS origin, blocks other navigation and subresource requests, disables file/content access and mixed content, and uses an origin-scoped, main-frame-checked WebMessage listener. ZIP export uses Android's document picker; the native bridge accepts one pending archive, checks its base64 encoding and ZIP signature, and caps it at 20 MiB. Image selection uses Android's document picker and accepts JPEG, PNG, or WebP. No Android device or emulator was attached, so installation, the system pickers, the native bridge round-trip, and airplane-mode behavior have not been tested on a phone.

## Phone check

1. Copy `app-debug.apk` to an Android phone, open it from Files, allow that source to install apps if Android asks, and install **Offline Astro Editor**.
2. Turn on Airplane mode and make sure Wi-Fi is also off. Open the app; the editor should load without a connection.
3. Change the project title, choose a JPEG/PNG/WebP photo, and tap **Generate static files**. Save `offline-site.zip` to Downloads with the system picker and confirm the status reports success.
4. Open the saved ZIP with an archive app and check for `index.html`, `projects/<project-slug>/index.html`, `styles.css`, and the selected image. Open the extracted HTML on the phone or another offline computer; confirm text, style, and image appear.
5. Turn Airplane mode off after the check.

Android's guidance recommends `WebViewAssetLoader` for APK-local files instead of `file://` access, and warns that JavaScript bridges should receive trusted content and validate message origins. The Storage Access Framework lets a user choose files and save destinations without broad storage permissions. See [loading in-app WebView content](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content), [WebView file inclusion risks](https://developer.android.com/privacy-and-security/risks/webview-unsafe-file-inclusion), [WebView native bridge risks](https://developer.android.com/privacy-and-security/risks/insecure-webview-native-bridges), and [the Storage Access Framework](https://developer.android.com/training/data-storage/shared/documents-files).

This remains an experimental wrapper for one prepared template. It does not run Astro's full build pipeline on Android. The earlier offline prototype's iOS status is unchanged; no iOS implementation or compatibility claim has been verified.
