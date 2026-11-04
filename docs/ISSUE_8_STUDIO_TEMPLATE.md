# Issue #8 — Studio template, runner cleanup and Android ZIP download

2026-10-29. **Requested experiment completed; overall #8 Partially Verified.**

## Scope and exact inputs

The browser built a snapshot of the actual `apps/site/src`, Astro config,
`packages/theme`, `packages/contracts`, and `content/content.json`, including
24 published routes and all239 public media files (34316008bytes). No simplified
replacement theme or synthetic media. Input hashes and repository equality are
recorded in expected.json/assets.json. Actual source files match the repository;
experimental root/workspace dependency manifests and generated lockfile differ.
Astro pinned7.4.4 instead of site's ^7.4.2; the Rolldown WASI beta dependency
alignment from the previous experiment is retained. The Node requirement gap
remains (browser22.22.3 versus Astro>=22.23.4).

This validates the renderer/theme/contracts/content build in browser, not the
Node loopback CMS, media conversion pipeline, publisher staging/rollback or
Cloudflare deployment. No product/source data changes were made.

## Runner cleanup

A lightweight agent provided a small replacement command handler. It awaits
actual process exit, then gives output2s to drain. If it remains open, the reader
is left with WebContainer ownership; no abort/cancel is forced. Rejections remain
handled/logged and global errors remain observable. Pending readers can last
until runtime teardown; this is a bounded wait, not proof of upstream stream
closure. The final run had1drain wait and **zero captured console errors**.
The ten-build sample previously had10stream-close errors after forced aborts.
No log filtering was used to conceal errors.

## Actual browser builds

Same Android14/API34 x86_64 AVD,2560MiB guest RAM/two cores,
Chrome156.0.8078.47/WebContainer1.6.4. Host static files/CDP only; every Astro
build ran inside Chrome through `await build({root:'./apps/site'})` followed
by explicit process exit. Network used for runtime/dependency files.

First trial: install22012ms,media mount7237ms. Actual template built in110700ms
including command cleanup/route verification; all24routes contained original
site name. A second build after changing only snapshot site.name to
STUDIO-ANDROID-UPDATED passed all24route checks in59647ms. Both exit0.
The harness then incorrectly demanded external CSS/JS files; Astro had embedded
them. Report retained as attempt-1.json; this was an assertion error, not a
failed renderer build. One unrelated favicon404 was captured in that trial.

Correct the check to accept actual style/script content in HTML, serve an empty
favicon response, and rerun one updated build for export. Final trial:
install9891ms,media mount5841ms,build+24route validation92625ms. All media/CSS/JS
checks pass. This is3verified actual-template builds across two trials;
previous ten repetitions were on the separate two-page Astro7 fixture.

## Native ZIP download verification

Browser creates ZIP Blob and SHA256, then Chrome's normal download handling is
restored (`Browser.setDownloadBehavior: default`) and its download link clicked.
Chrome saved **/sdcard/Download/studio-issue8.zip**,34512512bytes. ADB pulled this
already-downloaded file, not a separately host-generated ZIP.
SHA256 matches the browser Blob:
`7061f6f8d444998a36b9eddaee033fbc919576f2b7a27e0ab96eb8976388078b`.
ZIP CRC/integrity passes;263entries=24HTML+239media. All24HTML files have the
updated marker; every one of239media files matches its input SHA256 byte-for-byte.
Paths were checked before extraction. No file conversion/host Astro build.
The ZIP remains locally at `.tmp/issue-8-studio/android-downloaded.zip`.

For an additional check, the downloaded ZIP's files were served unchanged by a
host static server to Android Chrome. Title=STUDIO-ANDROID-UPDATED; category
button filtered20cards to19, All restored20. This is a static preview, not an
Android-native ZIP extraction/open test. A Playwright screenshot attempt timed
out; separate ADB screenshots and a later successful interaction JSON are retained.

## Memory and stability

Final run's windowed system samples:65valid/1failed; max sampled aggregate
Chrome PSS **1498720KiB=1463.59MiB**, maximum successful snapshot duration2.230s.
Per-PID `dumpsys meminfo` includes main,zygote,privileged/isolated workers and
Chrome overhead; sequential samples can miss instantaneous peaks. This includes
install,media loading,build,ZIP creation/download and other tab overhead; it is
not compiler-only RAM or an ARM-phone requirement. Raw windowed samples retained.

**Android System UI displayed an ANR dialog after export**, despite the intact
native download and error-free captured browser console. Screenshot retained.
No causal attribution is established. The dialog was dismissed to run preview.
This means build/export feasibility passed but device-level stability has not.
Chrome also needed startup/CDP readiness retries before the experiment.

## Evidence, remaining work and status

[evidence/issue-8-studio-template](evidence/issue-8-studio-template/) contains
sources for the local driver, input/media hash manifests, both trial reports,
windowed memory samples, download verification summary, screenshots and preview
result. Prepared exact fixture/lock/SDK/ZIP remain in `.tmp/issue-8-studio`.
`node run.mjs` uses ADB reverse4175/CDP9223 and the prepared local files;
media URLs serve original public files read-only. No self-contained PWA yet.

Remaining #8 acceptance evidence: cold/offline build behavior, supported Node
runtime, repeatable device stability and product runner integration. Final phone
acceptance is deferred until PWA readiness per owner. WebContainer architecture
and open-source/licensing suitability remain undecided; no adoption is implied.
Do not close #8 or add Verified Solution while these required checks remain.
No commit/push/deployment. Existing admin edits preserved. Base HEAD
8754bb9e9b5162796a93cc634113ce9c5ec0d0bd. Harness syntax and diff whitespace checks
passed; unrelated full product suite was not rerun for this experiment.
