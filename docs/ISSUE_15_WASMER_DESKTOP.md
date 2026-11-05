# Issue #15 — Wasmer browser runtime desktop probe

2026-11-06. **Partially verified; no supported Android build claim.** This is an isolated feasibility experiment, not a product runtime selection or architecture approval.

## Test setup

- Host: Ubuntu 24.04.5 LTS, x86_64, Node.js 24.13.0.
- Browser: Google Chrome 157.0.8103.38, a fresh temporary browser profile per tested package.
- Harness: Vite 8.3.6 and `@wasmer/sdk` 0.19.1. The PWA shell used COOP `same-origin` and COEP `require-corp`; `crossOriginIsolated` was true.
- The browser executed Wasmer packages locally in WebAssembly. The first run resolved packages through `registry.wasmer.io` and downloaded `.webc` artifacts from `cdn.wasmer.io`; no remote build endpoint was invoked. Wasmer's current SDK documentation describes this local execution and browser storage cache, while requiring cross-origin isolation and noting that the first run downloads packages ([SDK docs](https://docs.wasmer.io/runtime/js/)).
- No Android emulator executable or attached device was available (`adb devices -l` returned no devices). No Android SDK package or license was accepted/installed in this probe.

## Results

### `wasmer/edgejs@=0.2.4`

The first online install completed its package downloads. CDN `Content-Length` values for the three requested WebC artifacts total **91,972,197 bytes** (about 87.7 MiB), excluding GraphQL and protocol overhead. The local PWA shell's production assets total **5,187,509 bytes**. After package setup, Chrome reported **98,310,750 bytes** of browser storage usage; this includes the local app shell and browser-profile data, so it is not an exact network-transfer measurement.

The runtime package became available, but `node --version` exited with code 1, empty stdout and empty stderr after **122,156 ms**. A new Chrome process using the same profile and a dead local proxy could reopen the cached shell; a fresh `https://example.com` probe failed, no Wasmer registry/CDN request occurred during this run, and `node --version` again exited 1 in **8,227 ms**. This proves cached package data was available to the new desktop browser process, but the runtime command did not pass. The browser still reported `navigator.onLine=true`: the proxy test is a browser egress block, not an OS-level network disconnect or Android offline test.

### `wasmer/edgejs-quickjs@=0.2.5`

The official package page identifies this as Edge.js with an embedded QuickJS N-API provider ([package page](https://wasmer.io/wasmer/edgejs-quickjs)). Its WebC artifact has a reported CDN `Content-Length` of **85,471,775 bytes**. The sandbox creation did not reach a ready or failed state within the 240-second browser wait; no Node command or Astro CLI run was observed. The temporary Chrome profile occupied about 101 MB at timeout, including browser profile files.

### Earlier `wasmer/edgejs@0.2.0`

The first command attempt also exited 1 without generated output after **165,543 ms**. Its report is part of the existing #15 history; the current SDK documentation's sample still references this package version.

## Compatibility, resources, and licensing

- The browser bundle built successfully. Its SDK WASM is 4,828,230 bytes before gzip; the built PWA shell assets total 5,187,509 bytes. This measures the harness, not an installed Astro runtime.
- The Wasmer package command was the first runtime gate. Since `node --version` did not pass for 0.2.4 and sandbox creation timed out for 0.2.5, an Astro CLI install/build was not attempted. No Astro HTML output was generated.
- Runtime command durations and browser-storage use were captured, but peak memory/RSS was not measured. Android storage, memory, repeat builds, and cold PWA relaunch remain unverified.
- The Edge.js source repository identifies its source as MIT. The Wasmer JavaScript SDK source carries a Modified MIT license with an attribution condition for commercial products exceeding its stated MAU/revenue thresholds ([SDK license](https://github.com/wasmerio/wasmer-sdk/blob/main/js/LICENSE)). The exact license notices for all packaged WebC runtime dependencies were not audited, so artifact redistribution terms remain unverified.
- `docs/evidence/issue-15-wasmer-desktop/` contains sanitized browser reports and package-size measurements. Reproduction source is in [the isolated POC](../experiments/issue-15/wasmer-browser-poc/); it is not a product dependency.

To reproduce, run `npm ci` and `npm run build` in that POC directory, start `npm run serve` in one terminal, then run `npm run probe` in another. Set `CHROME_PATH` if Chrome is elsewhere and `WASMER_PACKAGE` to test another pinned registry package. Use the same `PROFILE_DIR` for an online run and a later run with `BROWSER_OFFLINE=1`; the latter blocks browser external traffic through an unreachable local proxy while allowing the loopback PWA shell. The generated report records requests, failures, timing and browser-storage estimates. This proxy exercise is not equivalent to turning off Android device networking.

## Recommendation and remaining work

Do not integrate the tested Wasmer runtime packages or claim a full local Astro build. The precise desktop blocker is that the pinned `node --version` command did not succeed, and the QuickJS package did not finish sandbox creation within four minutes. The required Android evidence also cannot be collected in the current environment. Keep Android build support unresolved until a candidate passes a full Astro CLI output check on a documented Android device/emulator, including an actual cold offline relaunch and resource measurements. The architecture decision remains in #16; this report does not select a runtime.

No product source, dependencies, runner or build settings were changed by this probe.
