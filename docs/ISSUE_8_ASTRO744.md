# Issue #8 — latest Astro 7.4.4 diagnostic

**Update:** later Rolldown dependency alignment and the programmatic build path
passed ten repetitions. See [follow-up evidence](ISSUE_8_ROLLDOWN_FIX.md).
The failures below remain historical evidence, not the latest outcome.

2026-10-29. Overall **Partially Verified; latest-version build blocked**.

npm's latest stable Astro was checked live: 7.4.4. Latest WebContainer API is
1.6.4, exposing Node22.22.3. Astro7.4.4 and telemetry3.4.2 require Node>=22.23.4;
this environment is below that requirement. Main Studio dependencies unchanged.
The fixture is the small two-page sample upgraded to7.4.4, not the full Studio theme.

## Installation

Pinned lockfile prepared on host with package-lock-only/ignore-scripts; no host
Astro compilation. Browser `npm ci` with lifecycle scripts enabled timed out at
180002ms. Subsequent browser installation with `--ignore-scripts
--fetch-timeout=30000 --fetch-retries=0 --loglevel=http --no-audit --no-fund
--progress=false` succeeded twice (16054ms and11477ms;186 packages). This is a
working diagnostic workaround; changed flags/cache state do not isolate a single
causal install failure. Disabled lifecycle scripts may matter for other packages.

## Build result

First actual `npm run build` (43190ms) automatically downloaded
@rolldown/binding-wasm32-wasi1.2.15, reported WASI/peer warnings, and exited0
without dist/index.html. A separate fresh trial bootstrapped that binding again
(34693ms), then retried build in the same runtime (20342ms). Again exit0 with no
HTML. The output-based assertion correctly failed. **Zero verified builds with
7.4.4; ten consecutive builds were not achieved.** No success is inferred from
exit0. This is not proof that latest Astro browser builds are impossible.
Node requirement and the Rolldown/WASI boundary need resolution before retrying.

## System memory

ADB shell cannot read Chrome smaps_rollup (Permission denied). The old zero
readings are invalid. New sampler enumerates all Chrome-named processes,
including isolated sandbox and privileged processes, then reads each PID's
`dumpsys meminfo` PSS/swapPSS. Failures are explicit and excluded, never zero.
It sums sequential per-process snapshots: sampled aggregate, not atomic true peak.
Shared pages are apportioned using PSS. Sampling target2s; actual durations vary.

Final attempt:51 valid samples/1error, up to8processes; maximum sampled aggregate
PSS **1072253KiB (1047.12MiB)**, snapshot duration up to2.564s. Previous successful
installation/failed-build attempt:64valid/4errors, max1075335KiB, duration up to7.435s.
These windows include setup/install/build/teardown and may include idle time;
they are not ten-build peak measurements. PSS includes Chrome overhead and is
not an Android/ARM physical-phone memory requirement. Short peaks and processes
created between enumeration/sampling may be missed. Raw samples retained.

## Evidence and scope

See evidence/issue-8-astro744 for raw reports, logs, lockfile fixture, sampler,
source and memory summaries. The host served static files and controlled CDP;
Node/npm/build ran inside Android14 x86_64 Chrome156.0.8078.47 WebContainer.
Network required for package/runtime assets. Physical phone tests deferred until
PWA acceptance, per owner instruction. No product edits, commit, push or deployment.
Issue8 remains open; no Verified Solution. Next focused work: isolate latest
Astro's no-output behavior at the Rolldown/WASI import boundary and obtain a
browser runtime meeting Astro's Node requirement before full repetition claims.

## Follow-up: isolated import diagnostic

Latest-version fixture installed again in9769ms. A Node process with an explicit
keepalive imported `rolldown` before Astro or compiler-rs. It failed with exit1:
`Cannot find native binding`, after downloading the WASI binding and reporting
peer-version warnings. The compiler-rs import was not reached. This localizes a
failure to Rolldown's binding initialization independently of Astro CLI, but does
not establish whether its root cause is optional-package installation, WASI,
peer-version mismatch, or the unsupported Node version. See import-diagnostic.json.

WebContainer's official API-support documentation distinguishes its client SDK
from the runtime implementation hosted by StackBlitz. Its public webcontainer-core
repository describes itself as an issues/bug-report hub, not engine source.
Rebuilding that public repository cannot supply a custom Node runtime. A new
browser Node-compatible runtime would be separate architecture work requiring
owner review, not an Issue8 patch.
