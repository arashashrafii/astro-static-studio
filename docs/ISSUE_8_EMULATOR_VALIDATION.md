# Issue #8 — Android emulator execution evidence

Date: 2026-10-28 (Asia/Tehran). Result: **Partially Verified**.
The limited browser-source compiler ran successfully in actual Android Chrome
inside an emulator. This is not a physical-phone or full Astro build verification.

## Environment and method

- Android Emulator 37.2.12 (build 16428233), KVM, SwiftShader, two CPU cores.
- AVD `studio-issue8-api34`, Pixel 5 profile, Google Play Android 14/API 34
  x86_64 image revision 14. Emulator increased requested 2048 MiB RAM to 2560 MiB.
- Chrome **113.0.5672.136**, V8 11.3; no Android user-agent/viewport simulation
  in desktop Chrome. Android fingerprint and timestamps are in the JSON evidence.
- Official image size 1,510,752,654 bytes; SHA-1
  `01d32617fd1937e540faf8731d70cf50e35af854` matched Google's manifest.
  Direct SDK downloads failed; Google's redirector delivered verified archives.
- Original nine tool assets matched the deployed-source checkout byte for byte.
  Source reference: separate Sites commit `f9703c25f69ed69f7ed83240d9b3dc7c5048b59d`.
  The private hosted URL itself was not tested in this new emulator profile.
- Static assets were served over `adb reverse tcp:4174 tcp:4174`, at
  `http://127.0.0.1:4174/`. The host only read static files. Compilation and rendering
  executed in Chrome's Android Worker. Automation connected to Android Chrome's
  debugging socket using ADB and CDP; Node did not compile the page.

Setup differences matter: initial Chrome launches died when the Google Play
services provider died (`DEPENDENCY DIED` in Android exit history). Google Play
services were disabled in this isolated AVD, first-run bypass flags were used,
and Chrome then stabilized. This is a configured emulator result, not evidence
for an unchanged stock phone. No desktop Chrome or product setting was changed.
The temporary AVD debug flags and disabled Google Play services state were restored
after testing, and the owned emulator was stopped to release resources.

## Observed results

Ten consecutive changed-source builds with unique markers, Persian text and
literal `<>&` passed. Each generated 229 UTF-8 bytes of HTML and escaped the
markup characters correctly. Reported Worker durations, in milliseconds:

`2741, 2551, 2337, 2364, 2501, 2624, 2678, 2655, 2744, 2470`

Median: 2587.5 ms; range: 2337–2744 ms. These are Worker-reported durations,
not complete page load/download times or controlled cold-cache benchmarks.
The script observed no page JavaScript errors during this sequence.

An unsupported style block failed with the expected message and hid the old
download link. Restoring valid source successfully recovered the build.

The first automated download gestures encountered Chrome's native notification
prompt and did not save files. This was not counted as successful download.
After dismissing that prompt and restoring default native download handling,
an additional changed-source build produced **227 bytes**, saved by Chrome to
`/sdcard/Download/index.html`. ADB pulled the saved file: it matched the browser's
generated Blob byte for byte and contained `EMULATOR-DOWNLOAD — فایل گوشی`.
Saved-file SHA-256:
`ae06ef9b6bf8809021dc3a0e3e1230d8db4f4ad57bd40d7443ff1d6aa2156578`.
A direct Chrome `file://` opening intent was not supported; native opening from
Downloads remains unverified. Saved bytes and preview rendering are verified.

Server logs contained only GETs for the static page/modules/WASM (and a favicon
404), with no source upload/build API. Captured page requests had no external
origin. This is a page/server trace, not a packet capture of all Android traffic.
An initial run failed because its temporary static server had exited; restarting
the static server in the test process fixed that transport failure without any
change to the engine.

`dumpsys meminfo` for the Chrome main process after the sequence reported PSS
90,370 KiB and RSS 234,708 KiB. This is a single main-process snapshot; it excludes
other browser processes and is not peak Worker/WASM/whole-browser memory.

## Artifacts and reproduction

- [Compact evidence JSON](evidence/issue-8-emulator.json)
- [Actual Android screenshot](evidence/issue-8-emulator-android.png)
- [Page including generated output](evidence/issue-8-emulator-page.png)
- [HTML pulled from Android Downloads](evidence/issue-8-downloaded-index.html)

Raw AVD log, download checksums/manifests, CDP test driver, all ten results,
screenshots, main-process memory dump and static request log are retained in
`.tmp/issue-8-emulator/` (ignored, local, not durable GitHub attachments).
The documentation/artifacts above are currently uncommitted. GitHub's Issue
comment preserves the principal observations and hashes.

To repeat after starting the configured AVD and Chrome: reverse port 4174, forward
9223 to `localabstract:chrome_devtools_remote`, then run the retained
`test-browser.mjs` and `download-check.mjs` in that evidence directory. The latter
restores native download behavior; dismiss any native prompts before counting a
download. The test drivers start/stop their own static-only server.
No product code or publishing deployment changed, so the desktop suite was not
rerun for this device-only validation.

## Still unverified

Physical phone, ARM64, peak/whole-browser memory, offline/PWA caching, current
Chrome releases, native local-file opening and full Astro CLI/Vite portfolio
builds remain unverified. This subset uses Astro runtime 5.18.2/compiler 2.13.1/
esbuild-wasm 0.25.12; the desktop baseline uses Astro 7.4.2 and has a larger scope.
Issue #8 stays open. No **Verified Solution** or architecture approval is implied.

Follow-up: a [full-project CLI diagnostic](ISSUE_8_FULL_BUILD_PROBE.md) booted a
browser Node runtime, but dependency installation timed out in two bounded trials.
Neither trial reached `astro build`; this does not establish full-build success
or general impossibility.
