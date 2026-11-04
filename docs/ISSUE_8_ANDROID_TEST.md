# Issue #8 — Chrome Android test protocol

Date: 2026-10-28 (Asia/Tehran).
Status: **Awaiting real-device evidence**. Only the historical desktop subset is
Partially Verified, with a later [successful emulator subset run](ISSUE_8_EMULATOR_VALIDATION.md).
Full Astro build, physical-phone performance and offline operation are not verified.
The emulator result is separate from this physical-phone protocol.

## Scope

Use the existing private [browser-source PoC](https://astro-phone-build-lab.arash-ashrafi.chatgpt.site/).
Sign in with the owner's ChatGPT account if prompted. Initial page/tool loading
needs Internet (about 17 MiB of WASM before compression). Compilation, TypeScript
lowering and HTML rendering are implemented in a visiting-device Worker, with a
Blob download. There is no remote build endpoint in this implementation.

Hosted source: `f9703c25f69ed69f7ed83240d9b3dc7c5048b59d` in the separate Sites repository.
Tools: compiler 2.13.1, Astro runtime 5.18.2, esbuild-wasm 0.25.12.
This tests one Astro page, not the complete Astro CLI/Vite pipeline or the
Astro 7.4.2 desktop portfolio verified in #13. Do not compare their durations as
equivalent workloads or close #8 on this subset alone.

## Record the environment first

Record physical phone model, Android version, Chrome version (`chrome://version`),
RAM if known, battery-saver state and test time. Unknown RAM is acceptable as
unknown evidence; do not infer it from the browser's approximate deviceMemory.
If using Android on a laptop or an emulator, record that explicitly along with
Android distribution/system-image, architecture and allocated RAM where known.
Never label an emulator result as a real-phone test.

## Test steps

1. Open the URL in Chrome on the physical phone. Keep the tab in the foreground.
   If access, authentication or loading fails, report the exact error before
   changing the setup; this is not yet evidence of a compiler failure.
2. In the source box, replace only `Built on this device` inside the quoted
   title with `PHONE-01 — آزمایش گوشی`. Keep the surrounding quotes and code.
3. Tap **Build HTML on this device**. Record the success/error message. On success,
   copy the JSON report under the preview (especially userAgent, durationMs and
   outputBytes) and capture the changed preview. A 60-second timeout stops the Worker.
4. Tap **Download index.html**. Confirm the saved file exists in Downloads.
   Open it with an available HTML viewer/browser and check the unique marker.
   If Android has no suitable file handler, retain/send the HTML file and record
   the opening step as unverified rather than declaring compilation failed.
5. Repeat with `PHONE-02 — فارسی <>&` inside the title's quotes. The preview and
   saved HTML must show the characters as text; the HTML must escape markup
   characters. Each downloaded file must contain its own current marker.
6. Perform ten builds in total, using PHONE-01 through PHONE-10. Record each
   durationMs and whether there was a freeze, tab reload, error or noticeable heat.
   Save at least the first and last downloaded HTML and success reports. The
   first in-tab build is a first-run observation, not a controlled cold-cache benchmark.
7. Negative/recovery test: save the valid source text, append
   `<style>h1{color:red}</style>`, then Build. This unsupported feature must fail;
   the previous download link must disappear. Restore the saved valid source,
   change the marker and Build again; success and a new download must recover.
   Record the error message separately: the current UI retains old report JSON
   after a failure, so that old JSON is not evidence that the failed run passed.
8. Optional cached-offline test: after one successful online build, keep the tab
   open, enable airplane mode AND disable Wi-Fi, change the marker to PHONE-OFFLINE,
   then Build and download without reloading. Record exact results. A new Worker
   may need static modules/WASM again; failed cache loading does not establish that
   local compilation is impossible. Offline installation/reload and PWA caching
   have not been implemented or promised. Re-enable networking afterward.

## Evidence to return

- Device/OS/Chrome and physical-phone versus emulator/laptop classification.
- First and last success JSON, downloaded HTML, and a preview screenshot.
- Ten durations and any errors, tab reloads, heat or freezes.
- Unsupported-style error, hidden stale download and restored-source recovery.
- Offline attempt and exact connectivity state, if performed.

For deeper verification, collect a Chrome network trace/console and actual process
memory measurements using remote debugging. Ordinary screenshots and userAgent are
useful initial observations but do not independently prove network isolation or
peak memory. Page browserHeap excludes some Worker/WASM/process memory; outputBytes
is generated HTML size, not RAM. Unavailable measurements stay unverified.

## Android on a laptop

Android Emulator in Android Studio is suitable for preliminary Android-browser
compatibility and download tests. Use Device Manager to create a phone AVD with
a Google Play system image, open/update Chrome there and repeat the same steps.
No emulator installation or system reconfiguration is part of this issue step.
An existing Android installation on a laptop may also be tested if it has Chrome;
record the exact distribution and treat that as a separate device class.

Inference: emulator/laptop execution is useful evidence for that environment, but
does not establish physical-phone memory, ARM compatibility, lifecycle or thermal
behavior. Shrinking a desktop Chrome viewport is also not Android execution.
Real-phone evidence remains required by #8.

Primary references:
- [Android virtual devices](https://developer.android.com/studio/run/managing-avds)
- [Android Emulator](https://developer.android.com/studio/run/emulator)
- [Emulator hardware acceleration](https://developer.android.com/studio/run/emulator-acceleration)

## Completion rule

Record returned observations under #8 with their evidence source and limitations.
Even a successful physical-phone run verifies only this bounded browser subset.
Full supported build/offline criteria remain open until separately demonstrated
or a reviewed blocker/no-go is recorded. No Verified Solution or issue closure
is authorized by preparing these instructions.
