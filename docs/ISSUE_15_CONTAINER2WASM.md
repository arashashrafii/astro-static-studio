# Issue #15: container2wasm desktop feasibility spike

**Status: Partially Verified; unresolved for full Astro output and Android.** The x86_64 QEMU/Wasm runner cold-started from browser storage while Chrome was offline and loaded the real Astro CLI. A two-page `astro build` did not finish within 900 seconds, so no successful HTML generation or runtime adoption is established.

## Verified evidence (desktop Chrome only)

- Built the task-local container2wasm v0.8.4/QEMU Wasm runtime. Its generated runtime files totaled **485,138,679 bytes** before the browser harness: `qemu-system-x86_64.data` 443,611,231 bytes (SHA-256 `00308fa3b054fee2a875f8928a3578fcb0a29746952405734ed0b2174fa4ad91`), `.wasm` 41,241,461 bytes (SHA-256 `fefc4cbaca56df229f3afd650cd5594817eff94268c576191e0a282f74046712`), plus JS.
- Set guest RAM to **512 MiB** using `--build-arg VM_MEMORY_SIZE_MB=512`; the prior default was 128 MiB. The already-built QEMU compile layer was reused from the task-local BuildKit cache.
- Chrome Headless 156.0.8078.73 on Linux x86_64 cached 10 required files. Chrome was fully stopped and restarted; the static server was stopped. CDP set network offline before navigation. The service worker controlled the page, `crossOriginIsolated` was true, and the guest reached Node.js **v22.23.4**. A control fetch failed with `net::ERR_INTERNET_DISCONNECTED` while the 10 cached files and HTML remained available.
- Wrote `GUEST_EDITED_MARKER_512` to the Astro fixture from the offline guest. `astro --version` had previously returned `astro v7.4.4` offline in the same task-local image.
- The latest actual offline command, `./node_modules/.bin/astro build`, ran for **900 seconds** and returned `ETIMEDOUT`. Its last progress output was Vite dependency optimization. A guest-side check found neither `dist/index.html` nor `dist/about/index.html`; the edited marker was therefore not verified in generated HTML.
- During 2-second host sampling, Chrome's largest single process peaked at **3.49 GiB RSS**, summed Chrome RSS peaked at **4.33 GiB**, and host available memory bottomed at **6.28 GiB**. These are desktop process/host measurements, not Android measurements; RSS sums can double-count shared pages. Browser CacheStorage reported about **915 MB** after caching the runtime.

## Limitations and next gate

- This is a desktop Chrome runtime experiment, not Android emulator or physical-phone evidence. No AVD was run.
- The c2w source build omitted QEMU's internal FP conformance-test subdirectory after an unavailable upstream TestFloat fetch. It did not modify the QEMU runtime target, but the tool's internal test suite was not verified.
- A real Astro CLI build did not complete, so ten repeated builds and repeated-build memory/stability are not justified. The large runtime, high Chrome RSS, and 15-minute timeout make this a negative performance signal for mobile; they do not prove that no further optimization could work.
- No product code, dependencies, or architecture were changed. Do not adopt this candidate or close #15 as solved. #16 owner architecture approval and #9 PWA work remain gated on a viable full-build result.

## Reproduction artifacts

Full logs and task-local sources are under `.tmp/issue-15-container2wasm/`: `RESULT.md`, `build/c2w-astro-rootfs-512.log`, `build/astro-cold-offline-evidence-512.log`, `build/astro-build-512-offline.log`, `build/astro-dist-check-512.log`, and `build/astro-build-512-memory*.csv`. These are local spike artifacts and are not committed. No commit or PR link exists for this experiment.
