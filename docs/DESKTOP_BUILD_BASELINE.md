# Issue #13 — desktop Astro build baseline

Result: **Verified for the Issue #13 desktop criteria only**.
Tested 2026-10-28, 01:11:32–01:12:08 Asia/Tehran (UTC timestamps are in the JSON report).

## Method and exact source

Reuse the existing Node runner, `apps/api/src/publisher.ts`, and
`buildAndPromote()` without changing their implementation. Export the committed
repository into a fresh ignored fixture, then reuse installed dependencies there.
All intentional content/source changes happen in that fixture. No server or
publishing provider is needed to run this desktop build check.

- Issue: https://github.com/arashashrafii/astro-static-studio/issues/13
- Tested source: [8754bb9e9b5162796a93cc634113ce9c5ec0d0bd](https://github.com/arashashrafii/astro-static-studio/commit/8754bb9e9b5162796a93cc634113ce9c5ec0d0bd)
- Environment: Linux x86_64, kernel 7.0.0-38-generic, Node 24.13.0, npm 11.16.0.
- Dependencies: Astro 7.4.2, compiler-rs 0.5.2, TypeScript 5.9.3, tsx 4.23.15,
  Vite 8.3.5. The existing installed tree was reused; this is not a fresh-install test.
- Fixture: committed supported portfolio, unchanged for the first build.
- Lockfile SHA-256: `b183ddc8a0fb56fa73d4bdd28ee66a3afb2ef1ef906b5877a3530732fe3b14df`.
- Initial content SHA-256: `69d8c5e39691e86281f876753dbed6d1c4079ccff52f25e59b45311abede42cc`.

The site's build runner, theme, content, contracts and lockfile matched HEAD in
the user's workspace. Existing uncommitted dashboard edits were excluded by the
committed-fixture export. This report therefore verifies the committed desktop
baseline, not those unrelated dashboard changes.

## Reproduce

From the repository root, with its dependencies already installed, run:

```sh
node scripts/verify-desktop-build.mjs
```

The harness requires the current Linux environment's `git`, `tar`, `cp` and npm.
It exports the current HEAD, hard-links installed dependency trees, prints the
evidence directory and retains logs, per-file manifests and output under
`.tmp/issue-13-*/`. It makes no commits, installations or deployment requests.
It is not a replacement build engine. A future run against another HEAD or
dependency tree is a new measurement, not a reproduction of identical inputs.

## Observed checks

- `npm run check`: passed (5.186 seconds).
- `npm exec -- node --import tsx --test tests/build-output.test.ts`:
  2 passed, 0 failed (1.373 seconds including command startup).
- `npm test`: 40 passed, 0 failed, 0 skipped (6.009 seconds).
- `npm run build`: passed, both Astro site and Vite/PWA dashboard
  (10.711 seconds). This includes command startup and both builds.
- Static site output: 263 files, including 24 HTML files; 34,469,860 bytes
  (about 32.87 MiB). Dashboard output is not included in that byte count.
- Marker build via `npm run build:site`: passed (3.607 seconds). The fixture's
  site name became `Issue 13 desktop build — به‌روز <check> & verified`.
  `index.html` contained the new Persian/English text with `<check>` and `&`
  escaped. Output differed from the baseline as expected.
- Injected real Astro failure via `npm run build:site`: expected exit 1
  (3.513 seconds). The fixture page imported a deliberately missing component.
  The full manifest of every path, size and SHA-256 was identical before/after
  failure; no staging or backup directories remained.
- Restored-source build via `npm run build:site`: passed (3.965 seconds),
  retaining the updated marker in the generated HTML.

The focused tests cover staging/promotion behavior; the missing-component trial
additionally exercises the real npm → Astro → publisher error path.

Updated-output manifest SHA-256, identical after the failed build:
`d16423f1bf770768bd95792039367478b134c9dab029d10cba04629c8c532b7a`.
Updated `index.html` SHA-256:
`d95025ee4886afe79304f1b29964a1c0f9ad012736917659f8a3587927917d75`.

## Evidence and limitations

The compact machine-readable record is [evidence/issue-13-desktop.json](evidence/issue-13-desktop.json).
Raw logs, both complete per-file manifests, the full report and generated HTML
are retained locally at `.tmp/issue-13-BUk8Or/`; that directory is ignored and is
not a durable GitHub attachment. The Issue comment repeats the key evidence.
The script and this report are new, uncommitted verification artifacts; the
commit link above identifies the tested product source, not a commit containing
these new artifacts.

No production code, original content or public deployment was changed. Hashes
of the original content, publisher, promotion helper and home page were checked
after the trials. UI/browser usability was not tested; no UI changed for #13.
The live-API smoke suite was not run because this issue directly exercises the
build runner without starting the three development servers. There is no lint
script in this repository. Script syntax and diff whitespace checks passed.

These are single-run wall-clock observations with existing dependencies, not
peak-memory measurements, cold-cache benchmarks, Android/iOS evidence, offline
browser evidence or a publication test. They must not be compared directly to
the much smaller one-page browser PoC as equivalent build workloads.

Next queued issue is #8. It has not been started as part of this verification.
