# Build feasibility: pending owner decision

2026-10-29. Draft for issues #15/#14/#16; none is complete or closed.

## Proposed decision

Keep the desktop Node runner as the supported product build path. Keep Android
WebContainer and compiler experiments isolated. Explicitly defer Android/iOS
product support and cold offline phone builds until those requirements have
passing device evidence. This is a proposed scope decision, not an implemented
change or a claim that the Phase 1 acceptance criteria are satisfied.

Owner approval: **pending**. Retaining all phone/offline requirements instead
means continuing feasibility investigation before dependent product changes.

## Evidence and alternatives (#15)

Desktop Node has the [recorded baseline](DESKTOP_BUILD_BASELINE.md), existing
backup/recovery and the QA publisher. It remains the reference path.

The WebContainer experiment used SDK 1.6.4, Node 22.22.3 and Astro 7.4.4.
[Actual-template evidence](ISSUE_8_STUDIO_TEMPLATE.md) covers 24 routes,
239 media files, ZIP download and an observed System UI ANR. Its Node version
is below Astro's package engine field; however, inspection of the installed
Astro 7.4.4 CLI shows an explicit WebContainer floor of 22.22.0, which that
experiment meets. The version difference alone is not an established CLI blocker.
The dependency manifests
include experimental Rolldown/WASI alignment and do not match production.
[Offline evidence](ISSUE_8_OFFLINE.md) demonstrates warm execution but records a
cold runtime timeout. Compilation happened in Chrome; the host served static
inputs and controlled the browser. This is not full Studio product integration.
The [NanoVM prerequisite probe](ISSUE_15_NANOVM.md) subsequently verified desktop
Node execution and fresh VM creation after disconnecting browser networking.
JavaScript execution failed at 512 MiB guest RAM and passed at 1,024/1,800 MiB
in the host harness. This is not an Astro or mobile benchmark; #15 remains
partially investigated. The [actual Astro CLI attempt](ISSUE_15_NANOVM_ASTRO.md)
subsequently failed at Rolldown's WASM memory allocation without generated HTML;
dependency compatibility and cold PWA launch remain open.

The existing browser compiler subset pins compiler 2.13.1, Astro 5.18.2 and
esbuild-wasm 0.25.12. It compiles a bounded single page, without Astro CLI/Vite,
native image processing, imported components or full route generation. Its
approximately 5 MiB compiler and 12 MiB esbuild WASM assets are uncompressed
payload sizes, not measured working memory. The older precompiled renderer
experiment can render content offline, but compiles its template on the host.
Neither meets full local Astro source-build acceptance.

WASI support alone is not evidence of a complete browser Node runtime. Node's
[WASI documentation](https://nodejs.org/api/wasi.html) describes a Node module
for WASI applications; it does not establish that Node/Astro can boot in a PWA.
No additional runtime is adopted or marked tested here.

## Source availability and hosting constraints

The public [webcontainer-core repository](https://github.com/stackblitz/webcontainer-core)
is the runtime's issue hub, not source for rebuilding its Node engine. Do not
equate SDK availability with a self-maintainable open-source runtime.
The provider states that commercial production API use needs a license while
prototypes are exempt; self-hosting is an enterprise offering. See
[Commercial Usage](https://webcontainers.io/enterprise), checked 2026-10-29.
No license purchase, provider contact or commercial adoption is authorized here.

The [header guide](https://webcontainers.io/guides/configuring-headers) requires
cross-origin isolation (COOP/COEP and SharedArrayBuffer). The
[browser configuration guide](https://webcontainers.io/guides/browser-config)
also documents third-party storage/service-worker dependencies. Our harness
loads external runtime and package assets during initialization. Caching Studio's
own shell does not establish external runtime offline availability.

## iOS investigation (#14)

The provider's [mobile support documentation](https://developer.stackblitz.com/platform/webcontainers/browser-support)
describes beta iOS/iPadOS support from Safari 16.4 and warns about mobile memory
limits. This is vendor documentation, not Studio device evidence. No iOS device
was exercised here. Worker/WASM execution, export/file access, lifecycle,
repeated-build memory and offline behavior all remain unverified; #14 stays open.
Android x86 emulator results cannot settle ARM-phone or iOS compatibility.

## Preservation, security and rollback

The proposed decision retains Content v1, sample IDs/URLs/media, the loopback API,
backups and existing temporary-directory build/publish protections. It adds no
remote build service or customer-content migration. Experimental source execution
must use trusted fixtures without publishing credentials. Do not embed publishing
secrets in a browser runtime. Removing the isolated experiments would leave the
existing desktop build path intact; no production rollback is required because
no new engine has been integrated.

## Conditions for later steps

Record the owner's decision under #16 before architecture integration. Do not
close #8/#14/#15 on this research note. #18 still needs a concrete approved schema
and tested migration before changing Content v1; #5 still requires a real
non-technical owner session. These gates cannot be replaced with simulated tests.
