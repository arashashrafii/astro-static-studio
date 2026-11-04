# Implementation Roadmap

## Owner planning update — 2026-11-01

Use [the current Persian execution plan](PROJECT_PLAN_2026-11-01.fa.md) and its
linked [dashboard scenario](ISSUE_5_OWNER_TEST.fa.md) as the current sequence.
The tester agent reproduced and verified the backup fix: two valid downloads
(46.7 MB / 238 media, then 48.6 MB / 241 media) succeeded. The trial project,
three images, alt text, ordering, edits and local preview were verified. CUA's
documented filechooser API completed upload; native OS picker visibility was not
tested. Publish-control identification remains blocked while Cloudflare is
disconnected, and no connection or publication was attempted. The local services
are running for owner review. #8 is
closed research with partial/negative evidence, #15 is
still unresolved, #16 has no approved architecture, and #14 is deferred by owner.
The older six-phase notes below are historical planning context where they conflict
with the current plan or owner decisions; they do not authorize implementation.

## Staged-development planning update — 2026-10-28

The owner requested an evidence-first six-phase sequence. The ordered issue map is
in [STAGED_DEVELOPMENT](STAGED_DEVELOPMENT.md) and [tracking issue #28](https://github.com/arashashrafii/astro-static-studio/issues/28).
It reuses completed desktop work and existing open issues. The earlier milestone
sections below remain historical/product context, not authorization to skip the new gates.
Issue #13's desktop evidence is now verified; see [DESKTOP_BUILD_BASELINE](DESKTOP_BUILD_BASELINE.md).
The active feasibility issue is #8. Android emulator experiments built the actual
Studio template and exported verified static output; ten warm offline builds also
passed. Cold offline runtime startup failed a bounded probe, and physical-phone
acceptance and offline/PWA operation remain unverified. See
[ISSUE_8_STUDIO_TEMPLATE](ISSUE_8_STUDIO_TEMPLATE.md) and
[ISSUE_8_OFFLINE](ISSUE_8_OFFLINE.md). Build architecture
selection (#16), generic Collection schema (#18), and experience/permission separation
(#25) require explicit owner approval before their corresponding product changes.

**Status:** Desktop local editing/build, setup/recovery and Cloudflare QA preview publishing exist. Milestone 1 non-technical usability validation was accepted by the owner and issue #5 is closed. M2 preview publishing is complete with owner-confirmed reachability. Content V2 is the owner-selected target, with migration, dashboard and renderer work present in the uncommitted local workspace; issue #19 remains open for migration/restore and browser acceptance evidence. Native mobile builds remain later work.

## Goal
Deliver a simple, mobile-first CMS for Astro websites. Customers can edit projects, text and pictures, then publish a static site without using Git or a terminal.

## Current baseline
This repository now contains an adapted copy of the Sara editor, local API, contracts, Astro renderer, and Sara sample content/media. The original `sararahanjam.com` repository remains separate and unchanged. Sara is the first sample output; Astro Static Studio is the product.

## Milestone 0 — Establish the Studio product baseline (DONE)
- Run the dashboard, local API, sample Astro site, typecheck, tests and static builds from this repository.
- Fix integration failures, preserve the Sara site as sample output, and keep the last successful build when a later build fails.
- Reconcile product docs with the verified local-first architecture and real gaps.

**Done when:** A tester can start Studio here, edit sample content, generate static output, and inspect the dashboard and site. A failed build keeps the last successful site.

## Milestone 1 — [Complete the desktop dashboard](https://github.com/arashashrafii/astro-static-studio/milestone/3) (IN PROGRESS)
- Issues: [#2 site setup](https://github.com/arashashrafii/astro-static-studio/issues/2), [#3 page/project editing](https://github.com/arashashrafii/astro-static-studio/issues/3), [#4 backup/recovery](https://github.com/arashashrafii/astro-static-studio/issues/4), [#5 usability validation](https://github.com/arashashrafii/astro-static-studio/issues/5).
- [x] Let an owner start a new local site from the supported template instead of editing only the Sara sample; protect replacement with a backup.
- [x] Complete page/project editing controls and make preview and local output behavior clear.
- [x] Add validated local recovery for content and media; show image size/quality impact.
- [ ] Test the full workflow with a non-technical desktop user, including a failure/recovery case.
- Under #5: simplify the dashboard and publishing layout after project creation and preview publishing are validated; sole-account selection is handled in M2.

**Done when:** A non-technical owner can set up a site, edit its pages and projects, preview and build it, and recover from a failed build without touching code or losing prior output. The owner usability check is still required; automated checks alone do not close this milestone.

## Milestone 2 — [Add one remote publishing destination](https://github.com/arashashrafii/astro-static-studio/milestone/1) (DONE)
- Issues: [#6 choose provider](https://github.com/arashashrafii/astro-static-studio/issues/6), [#7 implement publishing](https://github.com/arashashrafii/astro-static-studio/issues/7).
- [x] Owner approved Cloudflare Pages Direct Upload in [PUBLISHING](PUBLISHING.md); it cannot be changed later to Git integration on the same project.
- [x] Confirm a Cloudflare test project/account is available for a preview deployment proof.
- [x] Keep the first implementation to one host; the M1 non-technical usability check remains open.
- [x] Authorize publishing without putting credentials in dashboard JavaScript; Wrangler is forced to use OS keyring storage.
- [x] Build locally, validate and deploy static files through the provider boundary, and show verified success or safe actionable failure.
- [x] Keep the Cloudflare upload adapter separate from local Astro build logic; Arvan S3 is deferred.
- [x] Complete a real preview deployment and manual dashboard flow with a test Cloudflare account. The owner confirmed the published preview is now accessible; the earlier agent-side network restriction is recorded in [M2 validation](M2_VALIDATION.md).

**Done when:** A tester can publish the project without touching GitHub; the owner confirmed the preview is accessible and credentials were not exposed.

## Milestone 3 — [Validate Android local use](https://github.com/arashashrafii/astro-static-studio/milestone/2) (later)
- Issues: [#8 test full local Astro build](https://github.com/arashashrafii/astro-static-studio/issues/8), [#9 package and verify Android workflow](https://github.com/arashashrafii/astro-static-studio/issues/9).
- Package the dashboard workflow for Android after desktop is stable.
- Test real-device file/media access and offline behavior.
- Confirm whether a full Astro build can run locally on Android; do not equate the fixed-renderer APK experiment with this requirement.

## Milestone 4 — [Extensibility](https://github.com/arashashrafii/astro-static-studio/milestone/4) (later)
- Issues: [#10 enforce portable contracts](https://github.com/arashashrafii/astro-static-studio/issues/10), [#11 second approved template](https://github.com/arashashrafii/astro-static-studio/issues/11), [#12 evaluate another publisher](https://github.com/arashashrafii/astro-static-studio/issues/12).
- Define/validate portable content, component, theme and publishing contracts.
- Adapt a second approved Astro template; **do not claim arbitrary templates work automatically**.
- Evaluate a **second** static host (for example, S3-compatible storage) through a tested publishing adapter; Cloudflare Pages is already the first provider.
- Consider a curated template gallery, offline workflows, and native packages only after the core journey succeeds.

## Proposed content/UX evolution — AFTER desktop usability validation

Design reference: [CONTENT_MODEL.md](CONTENT_MODEL.md). This older roadmap section records proposals; it does not override the owner-selected V2 target or establish issue completion. The committed baseline remains V1, local V2 work is uncommitted, and issue #19 remains open.

1. **Evidence first:** finish [#5](https://github.com/arashashrafii/astro-static-studio/issues/5) with a non-technical owner on the current desktop workflow. Preserve the working publish and backup behavior.
2. **Template-first setup:** keep the bundled approved template as the initial free choice; later test a second adapted free template before exposing selection. Add site language and whole-site RTL/LTR controls only when the chosen theme passes direction/accessibility tests.
3. **Unified content domain:** introduce named typed Collections (Articles, Projects, Photos, People) with preset guided forms, one-level categories, item-level pages when enabled, and shared data/validation without building a schema editor.
4. **Page composer:** allow a Page to contain ordered predefined text, image and collection-view blocks; collection views reference stored items and choose cards/list/gallery. Avoid freeform drag-and-drop.
5. **Storage + performance:** safely migrate Content v1 with backup and compatibility checks. Move toward per-entry storage as needed; implement server-side local API paging/filtering separately from static `paginate()` routes and measure real build performance.
6. **Rich text + usability:** provide a small safe editor for bold, links, lists and images; validate mobile ergonomics and safe rendering. Do not promise mobile full Astro builds until issue #8 is validated.

Implement small reviewable slices and update [CONTRACTS.md](CONTRACTS.md) only after code/tests support the new version; #10 is the contract enforcement checkpoint. New roadmap issues may be created later after scope and ownership are agreed.

## Agent-first delivery process
1. **Plan or Research (only when needed):** Confirm the requirement and check available tools before reinventing one. Clearly separate verified facts from proposals.
2. **Developer:** Implement one small GitHub issue using Clean Code, KISS, pragmatic SOLID, tests and documented setup.
3. **Independent Reviewer:** Check acceptance criteria, defects, data safety, test evidence and mobile UX. Return precise fixes if needed.
4. **Owner:** Approves material product decisions and production releases; does not need to approve every internal code detail.

This is a **workflow of roles**, not a requirement for three paid or constantly running AI agents.

## GitHub issue quality bar
Every implementation issue states: objective, current code/links, scope and exclusions, acceptance criteria, tests/checks, security risks, dependencies and a clear definition of done. Make small, reviewable changes; report actual results, never invented completion.

## Next task
Issue #5 was closed on 2026-11-04 by owner acceptance of the desktop and responsive mobile-web workflow. The selected next technical issue is #15: diagnose the cold offline WebContainer startup, then use its evidence for #16. Issue #14 is deferred until Android results; #17 and #10 remain gated by #16/#17. See the [staged issue map](STAGED_DEVELOPMENT.md) and tracking [issue #28](https://github.com/arashashrafii/astro-static-studio/issues/28). The Persian plan dated 2026-11-01 is a historical snapshot, not the current issue order.
