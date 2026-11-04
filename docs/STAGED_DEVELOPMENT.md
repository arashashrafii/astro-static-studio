# Staged development issue map

Date: 2026-10-28 (Asia/Tehran)

Canonical tracking issue: https://github.com/arashashrafii/astro-static-studio/issues/28

Progress update: #13 is verified and closed. See [DESKTOP_BUILD_BASELINE](DESKTOP_BUILD_BASELINE.md)
and its [Verified Solution](https://github.com/arashashrafii/astro-static-studio/issues/13#issuecomment-6463842587).
The phase tables below are the original planning snapshot. Current owner decisions (2026-11-04):
#5 is closed; #15 is the next technical issue and begins with cold offline WebContainer
diagnosis; #14 is deferred until Android results; #16 follows #15 with Android as the priority;
#17 remains gated by #16, and #10 by #17; #18 is closed with current Collection scope settled;
#19 targets Content V2 in the local uncommitted workspace, with V1 retained as migration and
recovery input; #11 and #12 remain optional/deferred. See the matching GitHub issue comments.
Earlier Android emulator and runtime evidence remains in the linked issue reports; it is not
physical-device acceptance.

## Status
Build feasibility is **Partially Verified**; the final build architecture is **Unresolved**. This map is a work queue, not architecture approval.

## Problem
Development must reuse the implemented desktop editor, contracts, backups and QA publisher, while resolving phone-build feasibility before expanding the content model or editor. Existing closed issues must not be recreated or treated as proof of every new requirement.

## Options
1. Rewrite the product across all phases now.
2. Reuse the working baseline and execute focused evidence-first issues in dependency order.
3. Retain only the desktop product and defer the proposed expansion.

## Recommended Approach
Use option 2 as the planning approach. Work on only one main issue at a time. First reproduce desktop evidence (#13), then collect real Android evidence in existing #8. Use bounded alternative-runtime and iOS investigations before proposing #16. Wait for explicit owner approval at #16, #18, #22/#24 when product scope changes, and #25 before corresponding architecture implementation. A small PoC passing does not prove full Astro compatibility.

### Existing work retained
- #2 site setup, #3 page/project editing and #4 backup/recovery are closed and implemented in the desktop baseline. Do not recreate them.
- #6 provider decision and #7 Cloudflare QA publication are closed. docs/M2_VALIDATION.md records the owner's later confirmation of preview access. Production publication is not verified or authorized by this map.
- #5 was closed by the owner on 2026-11-04 after accepting the desktop and responsive mobile-web workflow.
- Existing fixed-renderer APK experiment is not a full Android Astro build.
- Existing browser-source PoC: https://astro-phone-build-lab.arash-ashrafi.chatgpt.site . Desktop checks passed; real Android, peak memory, full build and offline/PWA behavior remain unverified. Evidence is recorded in #8.
- #10 portable contracts, #11 a second approved template and #12 another publisher already exist; retain them. #11 and #12 are optional follow-ups, not reasons to duplicate earlier work.

### Phase 1 — Build Feasibility
1. #13 — reproduce and record the existing desktop build baseline.
2. #8 — real Android test; first the published source-compilation subset, then separately the supported full-build feasibility. Do not relax its original full/offline criteria.
3. #15 — WebContainers/other local-runtime comparison, using #13 and initial #8 results. A full-runtime follow-up under #8 may then use #15; this is not a circular prerequisite for the initial phone test.
4. #14 — iOS limitations and bounded device evidence, reusing #13/#8.
5. #16 — evidence-based build architecture proposal and explicit owner decision.
Research may identify blockers; absence of a device is never a passed criterion. The decision must explicitly defer or resolve unsupported targets.

### Phase 2 — Template Compatibility
6. #17 — audit the bundled template and produce one small compatible example, after #16.
7. #10 — verify/enforce portable content/media/theme/build/publish contracts from #16/#17.
Optional later: #11 — a second owner-approved template after #10; the bundled example already covers the first sample.

### Phase 3 — Generic Collections
8. #18 — isolated schema PoC: Cover Image, Title, Description; reconcile with the older preset-only proposal and obtain approval.
9. #19 — approved migration/storage slice with backups, compatibility and rollback.
10. #20 — optional Category, Gallery, Text and Link field types.
11. #21 — accessible schema-generated entry forms.
The current v1 page/project schema stays authoritative until an approved, tested migration lands. Schema-generated forms do not automatically authorize an arbitrary schema designer.

### Phase 4 — Visual Editor
12. #22 — approved template field binding and data/presentation separation; preset controls first.
13. #23 — the same Gallery data rendered as List, Grid and Masonry.
No general drag-and-drop editor or arbitrary template importer is implied.

### Phase 5 — Setup Wizard & Dashboard
14. Complete the existing #5 real-owner desktop usability gate before the new setup workflow.
15. #24 — extend the safe setup from closed #2 into the approved wizard.
16. #25 — explicitly decide single-owner modes versus real roles/authorization.
17. #27 — implement only the approved #25 decision.
18. #9 — package/test the approved Android workflow, after build evidence, #16, #21 and #27. PWA/native selection follows the decision; do not assume the old APK settles it.

### Phase 6 — End-to-End Validation
19. #26 — site creation → Collection → content → preview → local build → authorized QA publication, including device evidence and recovery.
Reuse #7's existing Cloudflare path. Production publication needs separate explicit authorization.

## Acceptance Criteria
- [x] Inspect current code/docs, all existing issue bodies, open-state search and relevant discussion history before creating issues.
- [x] Reuse existing issues and record completed work, uncommitted PoCs and remaining evidence separately.
- [x] Create focused missing issues with Problem, Options, Recommended Approach, Acceptance Criteria and Dependencies.
- [x] Publish an ordered map and identify approval gates without changing product architecture.
- [ ] Owner reviews the proposed order/architecture decision gates before later product changes.
- [ ] Each executed issue gets a short result, chosen method, evidence and next issue.
- [ ] Only after all issue criteria are proven, post **Verified Solution** including method, test artifacts, limitations and commit/PR link. Otherwise use **Partially Verified** or **Unresolved** and keep the issue open.

## Dependencies
This is the index for #5, #8–#27; dependencies are listed above and in each issue. Closed #2–#4 and #6–#7 are reused baseline work. The index itself is not a new implementation milestone.

## Current next issue
#15: perform the bounded cold offline WebContainer diagnosis specified in the issue. Then use
the measured result to prepare #16, prioritizing Android. Do not treat emulator builds as
physical-phone acceptance or PWA readiness.

## Scope and evidence limits
Repository HEAD at the original map snapshot: 8754bb9; implementation baseline fdb3701. The current working tree contains V2 implementation/evidence and Spec Kit installation work; those local changes remain separate from the committed V1 baseline until reviewed and pushed. No issue closure or Verified Solution claim should be inferred from code presence alone.
