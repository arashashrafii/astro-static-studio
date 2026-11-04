# Issue #8 — warm builds and cold offline startup

2026-10-29 experiment; closure updated 2026-10-31. **Investigation concluded;
Issue #8 closed by explicit owner request with a partial/negative feasibility
result. Product offline acceptance remains unmet.**

Closure record: [GitHub #8 closure comment](https://github.com/arashashrafii/astro-static-studio/issues/8#issuecomment-6541252709).
Warm offline builds passed after online initialization; cold offline runtime
startup failed twice. Closure does not claim a Verified Solution, supported
runtime, stable phone operation or architecture approval. Original evidence and
criteria are preserved below.

## Acceptance criteria

An offline owner must be able to reopen Studio and build saved content without
network access. Repeated builds in an already running online-initialized session
are a separate, weaker check. Neither result establishes physical-phone support.

## Existing evidence recovered from local experiments

The Android emulator reports in [evidence/issue-8-offline](evidence/issue-8-offline/)
were inspected and preserved, rather than rerunning ten expensive builds.
These are historical execution results, not new tests run while writing this note.
Environment and fixture limitations remain those in
[ISSUE_8_STUDIO_TEMPLATE](ISSUE_8_STUDIO_TEMPLATE.md).

- Network control: a registry fetch succeeded before disconnect and failed after
  Wi-Fi and mobile data were disabled. The reported default route was empty.
- Ten warm offline actual-template builds passed after one online build. Each
  build changed a marker and checked all 24 generated routes. Reported build
  durations range from 68,520 to 103,328 ms. Final media, CSS and JavaScript checks
  passed. This used the import/keepalive experimental runner; 11 output-drain
  timeouts remain, so success does not prove clean stream closure.
- A smaller runtime probe could read/write its virtual filesystem and start a
  new Node process after disconnect. Both version checks returned v22.22.3.
- After Chrome was stopped and restarted offline, runtime boot timed out after
  90,001 ms. The host still served the harness over ADB reverse; this isolates
  runtime startup from availability of the Studio application shell.
- The harness origin had no registered service worker. Reloading after stopping
  the host server failed. This harness is not an installable offline PWA.
- ANR event logs did not gain entries during the successful warm-build experiment.
  Earlier System UI/Android service ANRs remained in those logs. This does not
  explain or resolve the earlier instability.

## Reproduction and interpretation

Preserved drivers require the prepared fixtures, Android emulator, Playwright,
ADB forwarding and loopback static server used in the original experiment.
They are diagnostic sources, not a standalone product test package.
The raw reports preserve failed requests, stage timings and verification markers.

Warm offline execution is demonstrated for this fixture and environment.
Cold offline startup is not demonstrated and failed the bounded runtime probe.
Do not infer that caching the Studio shell will cache or make the external
WebContainer runtime boot offline. No remote build fallback is authorized.

## Fresh runtime recheck

A fresh execution on 2026-10-29, 18:40–18:42 UTC reproduced the runtime result:
online control succeeded, offline network control failed, warm offline filesystem
and Node execution passed, and cold runtime boot timed out after 90,003 ms.
Reload without the harness server again failed. No driver error was recorded.
The recheck driver restored the emulator's original Wi-Fi/mobile-data settings.
The raw `recheck-report.json` and driver sources are preserved beside the earlier
reports. JSON/evidence assertions, JavaScript syntax checks and `git diff --check`
passed. No product typecheck/build/full suite was run for this documentation and
diagnostic-only change; this probe is not an Astro build repetition.

## Remaining gate

At the experiment's conclusion these gaps kept #8 open. On 2026-10-31 the owner
explicitly authorized closing the investigation without claiming product
acceptance. Cold offline startup, supported Node runtime, physical-phone
acceptance (deferred until PWA readiness), repeatable stability and product runner
integration remain unresolved. The tested configuration is a no-go for a
self-contained cold-start/offline PWA engine. Existing #15 remains open for
runtime comparison, followed by #16 for the owner's architecture decision;
neither is evidence that these gaps are resolved. No next-issue implementation,
Content v1 or production publishing change is authorized by these experiments.
