# M2 publishing validation

**Date:** 2026-10-25 (Asia/Tehran)
**Environment:** Real Cloudflare account through the Studio UI in the in-app browser. No account identifiers or credentials recorded.

- The user authorized a disposable preview project: `studio-qa-1025-a7c9`.
- Initial project creation failed because Wrangler delegated new Pages projects to Workers in the Codex environment. After adding Pages `--force`, a real UI retry created the Pages project and selected it. The saved project remained selected after the API restart and panel reload.
- UI fixes verified: the Publish view now shows its own breadcrumb and heading; busy progress remains visible to assistive technology.
- A real preview upload initially exceeded the 60-second runner timeout. Wrangler could exit with code 0 after termination, so Studio reported a misleading missing-metadata error. The runner now uses a bounded 10-minute deploy timeout and rejects timed-out results before metadata verification.
- Focused publishing tests: `node --import tsx --test tests/publishing.test.ts` — 21 passed, 0 failed. Independent focused batch, deduplication, retry, abort, and readiness checks passed.
- Real Cloudflare upload completed for 259 assets across 75 bounded batches. Wrangler returned deployment metadata, and Cloudflare's deployment listing matched the selected QA project, preview branch, and deployment ID.
- Studio now polls the verified deployment URL for up to 60 seconds and retries only transient network/HTTP failures. It retains the verified deployment URL but labels readiness as unconfirmed if the public host remains unreachable.
- A second UI retry used the previously checkpointed assets; it returned the same deployment URL without resending the asset batches: [preview deployment](https://87beb9aa.studio-qa-1025-a7c9.pages.dev/). Studio showed the URL as clickable and readiness as unconfirmed.
- At the time of the agent-side check, the exact preview host resolved but this environment could not connect: IPv4 TCP/443 timed out and IPv6 was unreachable. The owner subsequently confirmed on 2026-10-26 (Asia/Tehran) that the connectivity issue was resolved and the preview was published successfully. The agent did not independently reload the public page after that confirmation.
