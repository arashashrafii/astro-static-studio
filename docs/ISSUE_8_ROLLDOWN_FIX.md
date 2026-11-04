# Issue #8 — Rolldown WASM initialization and ten Astro builds

2026-10-29. **Requested emulator experiment completed. Issue #8 remains Partially
Verified.** Earlier Astro7 no-output results are superseded for this experimental
configuration; stock CLI/runtime support is not established.

## Diagnosis and minimal experimental settings

A direct import of `@rolldown/binding-wasm32-wasi@1.2.15` revealed
`this.bridge.setLastError is not a function`. The stack mixed emnapi runtime2alpha
inside the binding with core1.11 at the root. Explicitly installing the binding
avoided Rolldown's automatic `/tmp` download path. Matching core/runtime to
2.0.0-alpha.5 changed the failure to `Cannot set properties of undefined (setting
'initWorker')` in @napi-rs/wasm-runtime. This confirms the alpha alignment alone
was insufficient, not a general WebContainer incompatibility.

The successful fixture uses:

- Astro7.4.4, Rolldown WASI binding1.2.15 as a direct dependency.
- Global experimental overrides for @emnapi/core and @emnapi/runtime to
  **2.0.0-beta.2**, accepted by wasm-runtime1.2.6's peer range. This overrides the
  binding's declared alpha dependencies and is not an upstream-approved fix.
- `NAPI_RS_FORCE_WASI=true` for spawned commands.
- Browser `npm ci --force --ignore-scripts --no-audit --no-fund
  --progress=false --loglevel=http --fetch-timeout=30000 --fetch-retries=0`.

Both direct binding and Rolldown imports passed. With the alignment, a CLI build
printed completion/routes, but the harness waited120s. The final trial changed
both process orchestration and output cleanup, so it does not independently
isolate the original CLI wait: each fresh Node process awaits `build({})` from
Astro's programmatic API, logs BUILD_API_RESOLVED, then explicitly exits0.
The harness awaits that exit and allows2s for stdout drainage before aborting
only its output reader. Ten output drainage timeouts and ten browser console
`Cannot close an errored readable stream` messages were captured. Stream cleanup
still needs hardening for a product runner; no clean-console claim is made.

## Verified outputs and timings

Same Android14/API34 x86_64 emulator,2560MiB guest RAM/two cores,
Chrome156.0.8078.47; WebContainer API1.6.4, Node22.22.3.
**Node is below Astro's declared >=22.23.4 requirement.** No version spoofing,
Node upgrade, or claim of officially supported compatibility.

One browser runtime/install, ten sequential independent Node build processes.
Before every build, src/data.json receives a unique LATEST-ASTRO-BUILD-N marker.
Each process exited0 after its build promise resolved; both HTML routes were
read and checked before proceeding to the next build. All ten passed.
Elapsed milliseconds (process startup, build, output cleanup and verification):
67579,43654,39814,39212,42945,39948,41096,43464,40978,40578.
Median41037ms; these are not compiler-only benchmarks. No concurrent builds.

Final outputs: index.html537B, about/index.html326B, badge.svg100B; embedded CSS
and JS checked. Browser creates output ZIP; host retrieves its Blob through CDP
and checks ZIP integrity and final markers in both pages. Native Android ZIP
save/open is not tested. ZIP SHA256:
`6118df860f5dc48dd6daca7519b6c94afa7265b698c64f3ff936ede6994f7a27`.

## Sampled system memory

Retained measurements are restricted to the trial's UTC time window
09:33:18.083–09:41:06.494 (13:03:18–13:11:06 Asia/Tehran).
ADB enumerates all Chrome-named PIDs including isolated sandboxes/zygote/utility,
then sequentially obtains per-PID `dumpsys meminfo` PSS and sums them. It includes
Chrome overhead and other open tabs, not just the build worker. No smaps access
or JavaScript heap estimate is used. Failed/incomplete samples are explicit.

231valid samples,3errors;7–8processes; sample-start median2.000s/max2.425s;
maximum successful snapshot duration2.424s. Maximum sampled aggregate PSS:
**1069189KiB =1044.13MiB**, at09:38:07.757 UTC (build run in progress),8PIDs.
The peak snapshot took0.955s. Maximum swapPSS during the window50473KiB, measured
separately, not necessarily simultaneous with PSS peak.
This is a reproducible sampled maximum, not an atomic instantaneous high-water
mark: short peaks, PID churn, and the3failed samples can hide larger usage.
Emulator x86 memory/thermal behavior does not establish an ARM phone RAM minimum.

## Evidence and boundaries

[evidence/issue-8-rolldown-fix](evidence/issue-8-rolldown-fix/) retains failed and
successful import reports, exact final fixture with lockfile, source, raw trial
report, windowed memory JSONL, sampler, summary and output ZIP. Local runnable
harness is `.tmp/issue-8-latest/run.mjs`, ADB reverse4175/CDP9223. It expects the
prepared WebContainer SDK bundle/create-zip helper and repository Playwright.
Fixture SHA256:
`9d9f3823f48e36c86ac78696fb7776c05fde945ba45723e721a11295a8015eb8`.
Host provided static files and CDP control only; every Astro build executed in
the browser runtime. Network required for dependencies/runtime assets.

This proves the small two-page Astro7.4.4 project with these experimental
settings; full Studio theme, supported Node runtime, cold/offline/PWA behavior,
native ZIP download and product-runner cleanup remain unverified. Physical phone
validation deferred until final PWA acceptance by owner. WebContainer is not
adopted as architecture. No product edits, commit, push or deployment.
Base HEAD8754bb9e9b5162796a93cc634113ce9c5ec0d0bd. `git diff --check` passed.
No Verified Solution comment or issue closure: broader #8 criteria remain open.
