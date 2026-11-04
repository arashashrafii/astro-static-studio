# Issue #15 — NanoVM prerequisite execution test

2026-10-29. **Partially Verified.** This is the first bounded alternative-runtime
test, not an architecture selection or completion of issue #15.

## Objective and acceptance

Before installing Astro, verify that the same pinned NanoVM/Node image can print
its version, execute a JavaScript output marker, and write/read a file with browser
network access disabled. Check output, not just the upstream runner's exit code.
Do not modify product code, Content v1, customer content or publishing credentials.

## Exact inputs

- NanoVM v0.3.0, commit `b3fd06ac608b1adb0024f26ca108bae970c6bbaa`.
- Released `nano.min.wasm`: 2,458,248 bytes.
- Repository's RISC-V Node image: 90,059,416 bytes; executing it reports v25.4.0.
- Input hashes, raw reports and probe sources:
  [evidence/issue-15-nano](evidence/issue-15-nano/).
- Host Linux x86_64, Node v24.13.0; desktop headless Chromium 156.
  No Android or iOS execution was performed in this slice.

The Node image matched the Git LFS SHA-256
`c1ea44df1775f02cf6956e1493728b7523acbdfdf1ce37294fcc9d01a09a7155`.
An initial sequential download timed out after 240 seconds. Validated byte-range
downloads assembled the complete hash-matching file in 143.569 seconds. This is
host network retrieval, not a mobile download-speed measurement. Source/WASM
retrieval and browser module sizes are additional to the Node image size.

## Actual results

The unmodified upstream CLI harness ran its bundled hello ELF successfully.
At 512 MiB configured guest RAM, `node --version` returned v25.4.0, but JavaScript
evaluation emitted `Fatal process out of memory: SegmentedTable::InitializeTable`
without the requested output marker. The runner returned zero despite the fatal
error. The probe marks that check failed and retains stderr. This is evidence
against trusting exit status alone.

At 1,024 MiB and 1,800 MiB, both host version and JavaScript-marker checks passed.
The upstream shell tests also use a 1,800 MiB guest setting; the first retry follows
that existing configuration rather than patching the engine. These are tested
settings, not a measured minimum or proof of mobile suitability.

In desktop Chromium, all modules, WASM and Node bytes were loaded from a local
static server. Playwright then disabled context networking **before creating a
new NanoVM**. The node image was supplied through a local Blob URL, using the
documented `nodeUrl` option. At 1,800 MiB:

- VM initialization: 1,803 ms.
- `node --version`: 250 ms, v25.4.0, exit zero.
- JavaScript write/read: 7,196 ms, expected `NANO-OFFLINE-OK` marker and exit zero.
- No captured page errors; requests were loopback static files and a local Blob.

This isolates fresh **VM** startup after loading the assets. It does not establish
an offline browser restart, installed PWA persistence, or Android OS airplane-mode
behavior. No remote compiler endpoint was used; no Astro compilation was attempted.
The initial browser harness had an HTTP error-handler defect; it was corrected
before these successful runs. No runtime behavior was patched or log output hidden.

A second browser run at 1,024 MiB also passed: initialization 1,167 ms, version
242 ms, and offline file write/read 7,031 ms. These are separate configurations,
not a repeated stability sample at one setting.

Host child maximum RSS is recorded separately for each RAM setting in the raw
reports. It includes the host Node/WASM harness and is not guest heap usage,
browser peak memory, or an Android memory requirement. Browser peak memory was
not measured. One run per configuration does not establish repeatable stability.

## Source and license findings

The pinned source includes the engine, host wrapper and harness. Its
[license document](https://github.com/userland-run/nano/blob/b3fd06ac608b1adb0024f26ca108bae970c6bbaa/LICENSE.md)
offers AGPL-3.0 or commercial terms; its NOTICE separately identifies guest Node's
license. This records upstream terms, not approval to integrate or redistribute.
The SDK's separate license does not replace the engine's license.
See the [pinned build documentation](https://github.com/userland-run/nano/blob/b3fd06ac608b1adb0024f26ca108bae970c6bbaa/docs/build.md)
and upstream `test/run_tests.sh` for the test settings.

The browser harness serves COOP `same-origin` and COEP `require-corp` headers
because this engine imports shared WASM memory. All bootstrap inputs must already
be available locally for offline creation; durable PWA caching is not implemented.
The RISC-V guest architecture also means existing desktop native addon binaries
cannot be assumed usable. Astro's actual dependency closure remains untested.

## Reproduce and next slice

Use `.tmp/issue-15-nano/` as the disposable working folder. Retrieve the source
archive at the exact commit and extract it as `userland-run-nano-b3fd06a`; download
the v0.3.0 release `nano.min.wasm`. Verify their hashes against `inputs.json`.
Copy the preserved Python/JavaScript probe sources into that folder, then run:

```sh
python3 .tmp/issue-15-nano/download-node.py
PROBE_RAM_MIB=1024 python3 .tmp/issue-15-nano/smoke.py
PROBE_RAM_MIB=1800 node .tmp/issue-15-nano/browser-smoke.mjs
```

The browser driver requires the existing browser experiment's installed Playwright
and `/usr/bin/google-chrome`. It serves static files on loopback port 4176, closes
its own browser/server, and never starts the Studio API. The source archive is
upstream executable code; no customer project or credentials are loaded.

Follow-up: the [tiny Astro build attempt](ISSUE_15_NANOVM_ASTRO.md) mounted the
fixture and dependencies, then failed at Rolldown's WASM memory allocation in the
default CLI trial. No generated HTML was verified. Package installation inside
the guest, native/WASM addon compatibility, Astro output,
repeated-build memory, Android stability and cold PWA launch remain unverified.
Keep #15/#8 open and the #16 architecture decision pending.

Validation: raw JSON, expected success/failure markers and loopback-only request
assertions passed; Python/JavaScript syntax and diff whitespace checks passed.
Product typecheck, build and full tests were not run for this isolated probe.
