# Issue #15 — actual tiny Astro build in NanoVM

2026-10-29. **Partially Verified; both build attempts failed.** No architecture adoption,
product change, Android claim or issue closure.

## Objective and inputs

Run the existing two-page Astro fixture inside NanoVM and verify generated Home,
About and badge files. Exit code zero alone is insufficient. Preserve the product
runner, Content v1 and existing uncommitted work.

This uses the exact NanoVM v0.3.0 source/WASM/Node image from the
[prerequisite probe](ISSUE_15_NANOVM.md), with 1,800 MiB guest RAM, desktop headless
Chromium 156 and guest Node v25.4.0. It does not use Android or a physical phone.

The source files reuse #8's two-page fixture: shared layout, imported component,
JSON data, CSS, a button script and public SVG. Package preparation uses #8's
Astro 7.4.4 lockfile, Rolldown/WASI 1.2.15 and the existing emnapi 2.0.0-beta.2
alignment. The compiler's WASM package 0.5.2 is added explicitly without saving
manifest changes. This is the earlier experimental dependency combination, not
the production dependency tree or a new supported Astro configuration.

Host commands only install packages and archive files; they do not compile Astro.
Lifecycle scripts and optional native packages are omitted. The archive contains
9,334 regular files plus directories/symlinks and is 17,967,333 bytes compressed. The preserved lockfile matches the
prior fixture lockfile byte-for-byte. Full archive hash, package versions, fixture
source hashes, inputs, driver and raw reports are in
[evidence/issue-15-nano-astro](evidence/issue-15-nano-astro/).

## Execution and default result

The browser loads modules, WASM, Node and the fixture archive from a loopback
static server. Context networking is disabled before constructing the VM and
mounting the archive. The guest sets CI/telemetry settings, changes to `/fixture`
and invokes Astro's actual CLI through its shipped entry point. No host or remote
build endpoint is involved.

Default CLI trial: VM initialization 1,781 ms, archive mount 565 ms, CLI run
48,653 ms. Exit code 1; no generated Home, About or badge files. Rolldown reports
`Cannot find native binding`, with a nested `WebAssembly.Memory(): could not
allocate memory` cause. No browser page error was captured.

## Isolated memory diagnosis

A fresh VM runs direct memory constructors and explicitly imports the installed
Rolldown WASM entry. This proves that entry exists; the failure is not resolved
by repeatedly installing optional packages.

Without additional flags, even a one-page WASM allocation with a two-page maximum
fails, for both shared and unshared memory. All five tested configurations fail.
The explicit binding import points to its `WebAssembly.Memory` constructor.

Node's documented
[`--disable-wasm-trap-handler`](https://nodejs.org/api/cli.html#--disable-wasm-trap-handler)
avoids the large virtual-memory reservation used by optimized bounds checks.
With that flag, the small constructors and compiler-sized 4,000-page initial
memory succeed. The Rolldown-sized 16,384-page initial allocation (1 GiB) and the
explicit binding import still fail. The pinned loader sets maximum 65,536 pages
and shared memory. No loader or engine source was patched.

The diagnostic creates several memories in one guest; its large-allocation
failure alone does not prove the same result in a fresh CLI process. The default
CLI trial and this diagnostic are distinct experiments. NanoVM's pinned mmap
implementation checks anonymous mappings against guest RAM; this is consistent
with address-space pressure, but no guest syscall trace or exact allocation
accounting was collected. Do not report a proven minimum memory requirement.

A fresh CLI retry with `--disable-wasm-trap-handler` also failed at the same
allocation: initialization 1,751 ms, mount 569 ms, run 63,483 ms, exit code 1.
It generated no HTML or public output files. The two CLI trials and two isolated
diagnostics all retained the original package/runtime sources. The flag resolves
small-allocation behavior but does not make this fixture build successfully.

## Reproduction

First prepare the pinned runtime as described in the prerequisite report. Copy
the preserved probe scripts to `.tmp/issue-15-nano/`, and the three preserved
input files (`fixture-source.json`, `package.json`, `package-lock.json`) into its
`astro-inputs/` directory. The preparer requires a new `astro/` folder path and
will fail rather than overwrite an existing fixture.

```sh
python3 .tmp/issue-15-nano/prepare-astro.py
node .tmp/issue-15-nano/astro-browser.mjs
PROBE_MODE=diagnostic node .tmp/issue-15-nano/astro-browser.mjs
PROBE_MODE=diagnostic PROBE_DISABLE_TRAP=1 node .tmp/issue-15-nano/astro-browser.mjs
PROBE_DISABLE_TRAP=1 node .tmp/issue-15-nano/astro-browser.mjs
```

The driver uses the previously installed Playwright and Chrome, bounded 180-second
guest execution, loopback port 4176 and no credentials. It records output and
missing files as failures, then closes its browser and server. Reports are
diagnostic evidence, not a passing full-build result.

## Scope and remaining checks

No generated HTML was verified in either CLI trial. Full Astro compatibility,
dependency installation inside the guest, repeated-build memory, Android
stability, and cold PWA restart remain unverified. These results do not justify
integrating NanoVM into Studio or relaxing offline/phone requirements.
Keep #15/#8 open and the #16 decision pending.

Validation: two actual CLI attempts and two allocation diagnostics ran. Assertions
confirmed expected failures, missing output, installed binding resolution and
loopback/Blob-only requests. JavaScript/Python syntax and diff whitespace checks
passed. No product typecheck/full tests/build were run: product code is unchanged.
Continue #15's runtime comparison from this blocker rather than treating Node
execution alone as Astro compatibility or starting Android acceptance testing.
