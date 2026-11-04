# Browser Astro source-build feasibility spike

Status: **limited desktop and Android-emulator proof; real-phone acceptance pending**. See
the [emulator evidence](../../docs/ISSUE_8_EMULATOR_VALIDATION.md). This is a separate
experiment for roadmap issue #8, not the Studio editor or its supported build runner.
It does not modify customer content. No PWA or production deployment is included.

## Objective and acceptance

Compile changed `.astro` source and render a new downloadable static `index.html`
on Chrome Android, with no Termux, Node process on the phone, or remote build.
Success requires evidence from a real phone. Desktop viewport simulation is not
Android verification. Full `astro build` compatibility is a separate, unproven goal.

## Run

Node is used **only to prepare and serve the experimental tool on a development
computer**, not to compile the sample Astro page. From this directory:

```sh
npm ci
npm run build
npm test
npm run serve
```

Open http://127.0.0.1:4174. Test automation uses `/usr/bin/google-chrome` and
Playwright. There is no lint/typecheck configuration for this isolated JavaScript
experiment; browser integration tests exercise the actual WASM path.

`prepare.mjs` copies the compiler and esbuild WASM and bundles Astro's runtime.
It does **not** compile the sample `.astro` source. All source compilation,
TypeScript lowering and HTML rendering happen in a browser Worker after pressing
Build. The server only returns named static files; it has no build endpoint.
`dist/` is disposable and ignored. All dependencies are pinned in the lockfile.

For a phone, serve `dist/` from a static HTTPS origin, or use a development USB
port-forward (`adb reverse tcp:4174 tcp:4174`) then open the same localhost URL in
Chrome on the phone. The latter serves assets from the computer but performs the
build in the phone browser. No publication has been performed for this spike.
A static asset host is required for initial loading; fully offline installation
and service-worker caching are **not implemented**.

## Scope and compatibility findings

- Uses open-source Go/WASM `@astrojs/compiler` 2.13.1, Astro runtime 5.18.2,
  and esbuild-wasm 0.25.12. This deliberately pins Astro 5, rather than asserting
  compatibility with the existing experiment's Astro 7/native Rust compiler.
- One page, plain markup, expressions and TypeScript frontmatter. No project
  importer, filesystem, npm install, component imports, styles, scripts, islands,
  dynamic routes, integrations, `astro:assets`, native image processing or CLI.
- Import resolution permits only the bundled Astro runtime. This is a small
  source-to-static-HTML pipeline, **not the complete Astro/Vite build pipeline**.
- Compiler output requests a `createMetadata` export absent from this runtime.
  The preparation bundle supplies only that inert metadata helper. Rendering uses
  Astro's runtime, with a minimal render context; head/maybe-head instructions are
  ignored. This is an internal, unsupported compatibility seam, not a stable API.
- Source is limited to 64 KiB. Every build starts a fresh Worker and terminates it
  after success, error, or 60 seconds. This limits retained instances; it is not a
  hard memory quota and does not guarantee protection against browser OOM kills.
- WASM payloads are about 5 MiB (compiler) and 12 MiB (esbuild), before compression.
  Download size is not working-memory usage. Heap metrics shown by the page are
  optional and exclude some worker/WASM/process memory. No Android memory ceiling
  or safe project size is established.
- Only trusted developer-written sample source is supported: frontmatter executes
  JavaScript in the Worker. A Worker is not a security boundary for hostile code.
  Preview has an empty iframe sandbox; messages use textContent. Do not use this
  experiment to open third-party projects or sensitive data. Exported HTML is not
  sanitized for use outside the sandbox.

## Verification and phone protocol

For the current Issue #8 handoff and evidence checklist, see
[ISSUE_8_ANDROID_TEST](../../docs/ISSUE_8_ANDROID_TEST.md).

Automated Chrome checks cover desktop (1280×800) and narrow (390×844) layouts,
keyboard Build activation, compilation, changed title, escaped HTML, downloadable
Blob bytes, rejected style blocks, hidden stale download after failure, and no
requests to external origins. This proves a limited browser build, not Android.

On a real phone record model, Android/Chrome versions, RAM, available memory and
whether battery saver is on. Then:

1. Load the static tool; record asset transfer size and cold build time.
2. Change the title to a unique marker, build, download `index.html`, open it from
   Downloads and confirm the marker. Repeat with Persian text and `<>&` characters.
3. Repeat ten builds and record durations, browser/task memory when measurable,
   errors, tab reloads and thermal slowdowns. Page heap numbers alone are not peak
   memory evidence; use remote DevTools/device process observations when available.
4. Try malformed source, a style block, an import, and >64 KiB source. Confirm a
   clear failure, no old download, and recovery by restoring valid sample source.
5. Capture a network trace: requests must be static tool/WASM files only, with no
   build API or remote compilation. Disconnect the serving host after assets have
   loaded if testing cached operation; failure to reload assets is not remote build.
6. Save output HTML, report JSON, network trace, errors and memory observations.

Decision gate: only after this passes on a real phone decide whether to extend
routing/components and investigate PWA caching. If it fails, retain the evidence
and resolve the specific compiler/runtime/memory blocker before editor work.

## Primary references

- https://github.com/withastro/compiler — WASM transform and runtime requirements.
- https://github.com/withastro/compiler-rs — native Rust/NAPI compiler distinction.
- https://astro.build/blog/astro-repl/ — prior browser compilation, not CLI parity.
- https://webcontainers.io/guides/browser-support — Node-like alternative with
  cross-origin isolation requirements; not used by this open-source pipeline.

License: original code in this directory is MIT (see LICENSE). Third-party
packages retain their own licenses; retain their notices when distributing assets.

## Recorded result — 2026-10-27

`npm run build`, `npm test`, JavaScript syntax checks for engine/worker/UI/server,
and `git diff --check` succeeded on Linux, Chrome 155. The browser integration
case passed at both viewport sizes, including import and size rejection. Updated
page builds took approximately 1.2–2.1 seconds across local runs (not a phone
benchmark). Desktop and narrow screenshots were inspected. `adb devices` listed
no attached device. Android build/download, peak memory, repeated-build stability
and fully offline use remain unverified. Existing unrelated dashboard edits were
left untouched. No commit or deployment was made.

## Phone test deployment — 2026-10-28 (Asia/Tehran)

Private static test URL: https://astro-phone-build-lab.arash-ashrafi.chatgpt.site

Published with the Sites skill. Sign in with the owner's ChatGPT account if
prompted. Sites confirmed deployment succeeded; a real Android test is still
pending. Only the tool's static files are hosted. Editing, Astro compilation,
TypeScript lowering, rendering and the HTML download happen in the browser.
Initial tool loading needs Internet; this deployment does not add offline caching.
The browser integration test was rerun successfully at both viewport sizes.

Site identity: `appgprj_6ae116aff2848191bff9a63d88356b5e`.
Hosted source commit: `f9703c25f69ed69f7ed83240d9b3dc7c5048b59d`.
Hosting checkout: `.tmp/browser-astro-source/` (ignored, separate Sites repository).
Its manifest selects `dist/`; its preparation also copies license notices and
static security headers. The Studio repository was not committed or deployed.
Reuse this Site identity for updates rather than creating another Site.
