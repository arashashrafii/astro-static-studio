# Issue #5 usability review

Date: 2026-10-27

## Scope and evidence

The requested in-app browser could not be opened from this subagent: `cua.createBrowserTab` returned “IAB visibility is not supported in a subagent thread.” No desktop/tablet/mobile rendering, runtime preview/build behavior, or keyboard sequence was therefore observed. Findings below come from source inspection and are hypotheses to validate, not observed novice failures. No content was edited and no publishing action was taken.

The MVP explicitly requires a real non-technical tester (MVP acceptance criterion 10); this simulated source review cannot close that gate.

## Prioritized findings

1. **High — mobile navigation may overwhelm the editing task.** The app places Overview, site information, publishing, then every individual page and project in the sidebar (`apps/admin/src/main.tsx:35`). Below 700px the sidebar becomes a full-width block and the page/project sections become two inline columns (`apps/admin/src/style.css:1`). Confirm whether the content list pushes the task below the fold or becomes hard to scan on a real small screen; consider a compact section switcher/list view if confirmed.
2. **High — build and preview use technical, disconnected concepts.** The always-visible header groups “save changes,” “build site,” and a link to a separate local preview server (`apps/admin/src/main.tsx:36`). Build success exposes an output directory path, while preview becomes unavailable if that second server is down. A novice may not know which action shows their edits. Validate a task framed as “check how my site looks” and simplify toward one clear preview action with actionable status.
3. **Medium — draft and saved states are easy to miss.** Draft state is communicated in a general `role="status"` region above the page content (`apps/admin/src/main.tsx:37`); save is disabled when clean, and individual entries show only a published/draft dot in navigation (`main.tsx:35`). Test whether people can tell if changes are saved and which entry is unsaved, including with keyboard and screen reader.
4. **Medium — publishing choices put preview and production side by side.** The publish panel has adjacent preview and production actions, followed by explanatory text that production updates the public site; the production action asks a browser confirmation (`apps/admin/src/main.tsx:41`). Test comprehension of the distinction and ensure the QA action is the obvious safe default.

## Required follow-up

Run the issue #5 task-based session with a real non-technical owner on desktop. Record task completion, hesitation/errors, and exact viewport/device. Then repeat relevant checks at tablet/mobile widths and keyboard-only, including preview/build status and publishing choice. Recheck these hypotheses after any layout changes. This review alone does not establish usability or close issue #5.

## Source review after the dashboard changes

The developer's current diff collapses Pages and Projects into native `<details>` groups with counts and visible add labels; native summaries support keyboard activation. It also moves slug/category/tag/date fields into a “more details” disclosure and adds explicit saved/unsaved state with a local-device explanation. These changes address the source-level hierarchy and save-state concerns above. I could not retest the UI after the change: binding to the existing IAB tab failed with `transport closed before response` in this subagent. The root agent is checking the live view. No non-technical owner test has been conducted, so #5 remains open.

## Limited live check (root-provided)

The root agent inspected the existing IAB tab without modifying content. It showed the collapsed navigation groups and explicit saved status. On the existing “Stranger” project, the title, summary and published control were visible while secondary fields were collapsed. Pressing Enter on “جزئیات بیشتر” revealed the slug field, confirming that disclosure can be opened by keyboard. At viewport widths 390, 768 and 1440 CSS pixels, measured viewport/client/scroll widths were respectively 390/375/375, 768/753/753 and 1440/1425/1425; no document-level horizontal overflow appeared in that project view. The viewport was reset afterward.

This is a narrow check of one project view, one disclosure keyboard action and document width at three sizes. It does not verify the full editing/preview/build/publish workflow, all keyboard controls, every screen, or usability with a novice. Issue #5 still requires its real non-technical owner session.
