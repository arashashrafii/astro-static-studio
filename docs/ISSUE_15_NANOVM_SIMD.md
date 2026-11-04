# Issue #15 — bounded NanoVM memory follow-up

2026-10-31. **Failed prerequisite; no full Astro output.** This isolated test
continues the [two failed Astro attempts](ISSUE_15_NANOVM_ASTRO.md). It does not
adopt an engine, change the product, or weaken cold offline PWA requirements.

## New hypothesis

The installed Rolldown 1.2.15 CJS loader requests 16,384 initial memory pages
(1 GiB). Parsing the unchanged WASM binary's memory import shows a smaller
minimum: 1,001 pages, maximum 65,536, shared. A loader-only trial can therefore
request 1,024 pages (64 MiB), above the binary's declared minimum, without
changing the module, maximum, shared flag or engine. This is an experimental
package patch, not a supported Rolldown configuration.

The trial archive derives from the preserved original archive and changes only
`@rolldown/binding-wasm32-wasi/rolldown-binding.wasi.cjs`, replacing
`initial: 16384` with `initial: 1024`. Original NanoVM files remain untouched.
The pinned NanoVM v0.3.0, Node v25.4.0, Astro 7.4.4 and existing experimental
dependency alignment remain unchanged. Installed Astro's engine field is
`>=22.23.4`, which this guest Node meets. No installation or new engine-version
warning was produced; guest Node emitted its experimental WASI warning.

## Result

One direct binding-import test ran in desktop headless Chromium 156 with
1,800 MiB guest RAM and `--disable-wasm-trap-handler`. Networking was disabled
before fresh VM creation, after loading local assets, as in the previous probe.
VM creation took 1,896 ms, mount 603 ms, and guest execution 21,292 ms.

The memory-constructor failure was passed, revealing the next failure:

```text
CompileError: WebAssembly.Module(): Compiling function #117 failed: Wasm SIMD unsupported @+58193
```

The explicit installed Rolldown binding import exited 1. No HTML, badge or other
output files existed. No page errors were captured. All observed requests were
loopback assets or a local Blob. A full Astro CLI retry was not run because the
binding prerequisite now demonstrably fails. This result does not prove the
smaller initial allocation would support a successful complete build.

## Evidence and reproduction

Preserved [driver, preparer, inputs and raw report](evidence/issue-15-nano-small-memory/).
The report retains the complete error and experimental WASI warning. Inputs
record original/trial archive hashes and unchanged runtime hashes. Working
files are isolated under ignored `.tmp/issue-15-nano-small-memory/`.

With the previous probe's pinned source/runtime and original fixture available,
copy the preserved scripts into a new `.tmp/issue-15-nano-small-memory/` folder.
The preparer refuses to overwrite an existing trial archive:

```sh
python3 .tmp/issue-15-nano-small-memory/prepare.py
PROBE_MODE=diagnostic PROBE_DISABLE_TRAP=1 node .tmp/issue-15-nano-small-memory/astro-browser.mjs
```

The diagnostic driver's generic full-output check remains false by design;
assess the retained explicit import error rather than treating exit status as
an Astro build result. JavaScript/Python syntax checks and assertions for the
expected SIMD error, missing output, offline-before-VM ordering, loopback/Blob
requests and absent page errors passed. Product tests/typecheck/build were not
run because no product code changed.

## Constraint for the next candidate

This pinned guest/runtime cannot compile the required unchanged Rolldown WASM
module. Further RAM-only retries do not address that error. A subsequent
candidate needs demonstrated SIMD support for this actual module (or a separately
justified compatible dependency/runtime build), followed by full Astro static
output verification. Rebuilding Node or the emulator is outside this bounded
trial. No such replacement was tested here.

Cold browser/PWA restart persistence, Android/iOS execution and full Astro output
remain unverified. A passing runtime boot or subset compiler cannot close #15;
the next candidate must preserve its runtime and complete dependency closure
across browser restart without network, then generate and verify the full static
output. Keep #15/#8 open and #16 architecture adoption pending.

## Read-only native binding follow-up

On 2026-10-31, direct npm registry requests for pinned
`@rolldown/binding-linux-riscv64-{gnu,musl}@1.2.15` both returned HTTP 404
(`version not found`). The GNU package has only the placeholder `0.0.0` release.
Both `@astrojs/compiler-binding-linux-riscv64-{gnu,musl}@0.5.2` requests returned
404 (`Not Found`). The current primary registry manifests for Rolldown 1.2.15
and compiler-binding 0.5.2 list neither target nor optional dependency for
RISC-V. Their generated JavaScript loaders contain RISC-V branches; those
branches do **not** establish published artifacts. The selected registry fields
and responses are preserved in
[evidence/issue-15-nano-small-memory/native-metadata.json](evidence/issue-15-nano-small-memory/native-metadata.json).

The pinned NanoVM build recipes compile Node against musl with `--fully-static`,
`LDFLAGS=-static`, and `-march=rv64gc -mabi=lp64d`. `file` confirms the actual
image is statically linked; its strings include `Dynamic loading not supported`.
Thus executable ELF loading is not evidence of usable dynamic `.node` addons;
this existing image does not supply a demonstrated native-addon route, and a
GNU/glibc package would not match its musl build. No native import test was run
because no pinned RISC-V artifact exists.

The recipes explicitly describe RISC-V **without RVV**. Their Highway EMU128
patch addresses V8's JSON stringifier, not WASM SIMD support. No documented
WASM-SIMD-enabling guest flag or compatible prebuilt replacement was found in
the pinned NanoVM docs/build recipes. Forcing unsupported CPU features was not
attempted. Changing Node/emulator or producing compatible native bindings would
require a separately scoped build proposal; neither is a small package-install
fix. No toolchain, package, custom engine or additional VM trial was installed
or run for this read-only follow-up.

## 2026-10-31 — isolated scalar-flag retry

An offline retry used a fresh Cargo target directory and the cached threaded
emnapi archive. The exact build command (from the Rolldown checkout) was:

```sh
RUST_HOME="$PWD/../rustup" CARGO_HOME="$PWD/../cargo" \
PATH="$PWD/../rustup/toolchains/1.99.0-x86_64-unknown-linux-gnu/bin:$PATH" \
CARGO_TARGET_DIR="$PWD/../target-scalar-retry" \
EMNAPI_LINK_DIR="$PWD/../tools/node_modules/emnapi/lib/wasm32-wasip1-threads" \
RUSTFLAGS='-C target-feature=-simd128,-relaxed-simd --cfg tokio_unstable' \
cargo build --offline --locked --manifest-path crates/rolldown_binding/Cargo.toml \
  --target wasm32-wasip1-threads --profile release-wasi -j 2
```

Cargo exited 0; the captured `rustc` invocation included the scalar target
flags. Artifact `target-scalar-retry/wasm32-wasip1-threads/release-wasi/rolldown_binding.wasm`
is 233,928,440 bytes, SHA-256
`41b07adcd34cd21000ebf787d4c29778b074c97a63a1e5353d7d4986f90ee925`.
WABT with threads enabled still found 11 SIMD instruction types and no
relaxed-SIMD instructions. Its SIMD-disabled parse failed at offset `09d837a`
with `expected valid local type`; thus this artifact is not verified scalar.
No NanoVM guest import or full Astro build was run. The SIMD prerequisite and
Issue #15 remain unresolved; this experiment does not adopt an architecture.
