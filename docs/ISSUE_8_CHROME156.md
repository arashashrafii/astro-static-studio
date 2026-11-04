# Issue #8 — Chrome update and two-page build

2026-10-29. **Emulator sample: passed. Overall Issue #8: Partially Verified; remains open.**

## Environment and update

Existing `studio-issue8-api34`, Android 14/API34 x86_64, Emulator 37.2.12,
KVM/SwiftShader, 2560 MiB guest RAM, two cores. Not a physical phone.
Google Play Store updated Chrome from 113.0.5672.136 to **156.0.8078.47**.
Play services were enabled. Updates initially returned DF-DFERH-01. After a
reboot and clearing only Play Store cache, Updates loaded without account login.
This sequence does not establish the cause of recovery. Only Chrome was selected
for update (about 134 MB). Download briefly stalled at 90%, then installed.
No credentials, APK mirrors, app-data reset or product changes were used.
Chrome used the existing debug/first-run flags for this isolated experiment.

## Ordered tests and results

1. Browser WebContainer API 1.6.4: Node v22.22.3; install `is-number@7.0.0`
   in 6862 ms; assert numeric/non-numeric behavior and exact version. All exit 0.
   Secure context, cross-origin isolation, SharedArrayBuffer and SharedWorker
   were available. One telemetry request was aborted; package assertions passed.
2. Only after that success, run the unchanged pinned Astro 5.18.2 fixture from
   the previous probe: two routes, shared layout/component, JSON, CSS, script,
   public SVG. First attempt: dependency install 59972 ms; actual `npm run build`
   commands 54890 and 43374 ms, both exit 0; changed markers passed. The harness
   then incorrectly required separate CSS/JS files and failed its asset check.
3. Preserve that report. Correct only the harness to record outputs before
   validation and accept the fixture's CSS/JS embedded in HTML. Repeat the same
   fixture: install 11185 ms (cache state differs); builds **49938 / 40486 ms**,
   exit 0. Both routes contain `BROWSER-PROJECT-02`, with the old marker absent.
   SVG and embedded CSS/JS checks pass. No captured console errors or failed
   requests in this full-project run.

These durations include process/output overhead; they are not pure compiler
benchmarks. Four actual Astro CLI builds succeeded across the two attempts.
This supports feasibility for this small fixture, not arbitrary Astro projects.
SharedWorker availability changed alongside Chrome; causality for the earlier
npm stall is not isolated.

## Output and reproducibility

[Evidence directory](evidence/issue-8-chrome156/) contains original reports,
fixture, harness source, screenshots, metadata and browser-generated ZIP.
ZIP entries: `index.html` (567 bytes), `about/index.html` (356), `badge.svg` (100).
Host-side ZIP integrity and both updated markers were checked after retrieving
an already-generated browser Blob through CDP. Native Android ZIP download was
not tested. ZIP SHA-256:
`03521a59124bdf5d6035307d6d9795a1c0e971e875a0f08f4bc841c7b08621a1`.

Local runnable directories are `.tmp/issue-8-tiny-package` and
`.tmp/issue-8-full-build-chrome156`; run `node run.mjs` in each in that order,
with ADB reverse 4175 and Chrome CDP forwarded to 9223. They reuse the prepared
WebContainer wrapper and repository Playwright dependency. Evidence source
copies use prefixes for identification and are not standalone packaged tools.
The host serves static harness files and controls CDP; it never runs Astro.
WebContainer runtime and npm assets load over the network. This is not offline
proof or a packet capture of every runtime request.

## Remaining acceptance criteria

Full supported Astro 7 desktop template, physical-phone full CLI build,
offline/cold-start behavior, ten repeated full builds, peak memory and native
ZIP save/open remain unverified. The earlier phone result is a separate limited
one-page compiler result. WebContainer engine licensing/open-source suitability
and final build architecture remain undecided. No Verified Solution comment or
issue closure is warranted. No commit, push, deployment or product-code edit.
Base HEAD: `8754bb9e9b5162796a93cc634113ce9c5ec0d0bd`.
