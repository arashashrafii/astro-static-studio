# Issue #8 — full-project Astro CLI attempt in Android Chrome

Date: 2026-10-28 (Asia/Tehran). **Full build: Unresolved.**
The existing limited compiler result remains Partially Verified separately.
This experiment does not establish that full browser builds are impossible.

## Question and fixture

Can the actual `astro build` command build a small project inside Chrome in the
existing Android emulator, rather than merely render a preselected component?
The planned success case is two CLI builds with a changed JSON marker, both
HTML routes updated, CSS/JS/image assets present, and a downloadable output ZIP.

The trusted fixture pins Astro 5.18.2 and contains Home/About pages, shared
layout and Card component imports, imported JSON, global CSS, a page script
and a public SVG. It does not require native image resizing or integrations.
It is deliberately smaller than the Astro 7.4.2 desktop portfolio from #13.

## Diagnostic method, not a product architecture decision

Use `@webcontainer/api` 1.6.4 as an isolated diagnostic runtime, following its
official boot/filesystem/process API. Serve the test harness as static files at
`http://127.0.0.1:4175/` through ADB reverse, with COOP `same-origin` and COEP
`require-corp`. Mount source files into the browser runtime; run `node --version`,
`npm install`, then (only on installation success) `npm run build`.

The host bundled only the public API wrapper and prepared the fixture/lockfile.
It did not run Astro or compile the project. A local offline npm metadata step
produced the second attempt's lockfile; that is dependency resolution, not a
host-side site build. Runtime/dependency asset loading needs network access.

This is not adoption of WebContainers or completion of #15's broader comparison.
The API wrapper's MIT license and public issue-tracker repository do not prove
the whole runtime is open source. Open-source suitability, licensing, supported
features and a product build architecture remain separate, unapproved questions.

## Environment and actual observations

Same Android 14/API34 x86_64 AVD, Emulator 37.2.12, KVM, SwiftShader, 2560 MiB
guest RAM and two cores. Chrome 113.0.5672.136. As in the earlier emulator test,
Google Play services were disabled and first-run/debug flags used in the isolated
AVD. This is not a physical phone or current-Chrome compatibility result.

Chrome reported secure context and `crossOriginIsolated: true`;
`SharedArrayBuffer` existed. A separate read-only browser check found
`typeof SharedWorker === 'undefined'`.

First trial, no lockfile mounted:

- Runtime boot passed in 10,322 ms.
- `node --version` passed in 6,846 ms, reporting **v22.22.3**, exit code 0.
- `npm install --no-audit --no-fund` exceeded the harness's 240,000 ms deadline
  (observed 241,117 ms). No successful installation result was reported.
- `astro build` was never invoked; no `dist` or output ZIP was produced.

Second trial, lockfile mounted and progress suppressed:

- Runtime boot passed in 6,102 ms.
- `node --version` passed in 4,290 ms, again reporting v22.22.3/exit 0.
- `npm install --no-audit --no-fund --progress=false` exceeded its shorter
  120,000 ms deadline (observed 120,004 ms). It emitted a tsconfck deprecation
  warning, but no successful install exit.
- Again, no Astro CLI invocation or generated site output.

Both trials reported: `Could not establish a connection to shared worker. It's
either not supported or failed too many times. Refreshing this page might help.`
The absent API and message are evidence, **not a proven causal diagnosis** of
the install timeout. The first trace also contained an aborted staticblitz
resource; teardown can abort requests, so this is not proof of a registry outage.
The second captured page trace had no failed requests; it does not cover every
internal runtime/package-manager request.

An initial CDP navigation attempt aborted before the trial and was corrected by
using an existing Chrome target. First-trial screenshot capture timed out after
the recorded npm timeout; second-trial screenshot succeeded. These automation
errors are distinct from build failures. Main product code was not changed.

## Evidence and reproduction limits

- [Compact two-trial record](evidence/issue-8-full-build-probe.json)
- [Second-trial screenshot](evidence/issue-8-full-build-probe.png)
- Raw source fixture, API lockfile, project lockfile, preparation script, static
  server/CDP driver and complete reports: `.tmp/issue-8-full-build/` (ignored/local).
- Second mounted fixture JSON SHA-256:
  `e6f07565e29d4e3a12450f19840f23337bba3fa4db1832392da191abed69165f`.

In the retained probe directory, `node run.mjs` starts its static-only server and
drives the Android Chrome debugging endpoint at localhost:9223. It expects ADB
reverse port4175 and the existing prepared WebContainer wrapper/fixture files.
The saved fixture includes the lockfile for the second trial. The original
preparation script predates that manual lockfile addition: rerunning it recreates
the first un-locked fixture unless the saved project lockfile is reinserted.
These are experimental local drivers, not a supported packaged build engine.
Reports and documentation are uncommitted; GitHub's #8 comment preserves the
key results. No new commit, deployment or product architecture change was made.

## Conclusion and smallest next step

The browser runtime can boot and report a working Node command in this emulator.
The tested setup has **not** demonstrated a complete Astro project build: both
attempts stopped at dependency installation. No native-addon failure was reached
or diagnosed in these runs. Timeouts are harness limits, not a proof of impossibility.

The next focused investigation within #8 is dependency delivery/runtime support
(including a current Chrome test if available) before retrying this same small
fixture. Do not replace Astro with another custom renderer and call that full CLI
parity. Physical phone, ARM, offline/PWA, peak memory and the full supported
Astro 7 portfolio remain unverified. Issue #8 stays open, without Verified Solution.

Primary references:
- [WebContainers quickstart](https://webcontainers.io/guides/quickstart)
- [Required headers](https://webcontainers.io/guides/configuring-headers)
- [Troubleshooting: lockfiles, shared resources and native addons](https://webcontainers.io/guides/troubleshooting)
- [Public repository describes itself as an issue tracker](https://github.com/stackblitz/webcontainer-core)
