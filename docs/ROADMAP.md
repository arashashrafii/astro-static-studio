# Implementation Roadmap

**Status:** Planning. No application code is verified in this repository.

## Goal
Deliver a simple, mobile-first CMS for Astro websites. Customers can edit projects, text and pictures, then publish a static site without using Git or a terminal.

## Important starting point
The user previously developed a local prototype for **sararahanjam.com**. As of the initial planning review, its GitHub repository contains no files. **Do not start coding again until the local work has been reviewed.** The product repository, `astro-static-studio`, holds the reusable CMS plan; the Sara Rahanjam repository is a first test site.

## Milestone 0 — Audit and recover existing work (FIRST)
- Identify the current local project and Git remote; do not assume the work was lost.
- Make a safe backup; verify no tokens, passwords, customer personal data, or `.env` files will be committed.
- Push existing code to the correct private repository or provide it for inspection. No force push or destructive reset.
- Inspect actual files, dependencies, existing Astro site, PWA dashboard, image pipeline, and unfinished features.
- Run the documented install, lint, typecheck, tests and local builds **where possible**. Record results or missing prerequisites.
- Compare current code with VISION, MVP and ARCHITECTURE; document what is reusable and what is missing.
- Produce a brief inventory and **one recommended next issue**. No speculative rewrite.

**Done when:** The actual code has been reviewed, its local run steps are known, and we can name one safe improvement.

## Milestone 1 — Local vertical slice
- Reuse the current code where possible.
- With one Astro theme, render one project page and gallery from versioned content.
- Build a **mobile-first React/TypeScript PWA** form to edit one project (title, description, images).
- Import JPEG/PNG, preview and convert appropriately to WebP with size/quality checks.
- Preview the static output locally before publishing.

**Done when:** A tester can edit a project with three pictures and view correct generated static pages locally.

## Milestone 2 — Secure one-click publish
- Pick one publishing destination for the first test; GitHub-based Actions is a candidate, not an irreversible requirement.
- Choose and document a safe identity and write mechanism. Do not ship long-lived GitHub/hosting secrets in the browser.
- Save validated content, trigger a trusted Astro build, deploy static files, and show success/failure.
- Support useful error messages and recovery from failed publishes.

**Done when:** A tester can publish the project without touching GitHub; verified published pages update without leaking credentials.

## Milestone 3 — Usability, quality and roles
- Test real Android, iOS and Windows browsers; check PWA install behavior only where supported.
- Cover editing Home/About/Contact, content validation, image accessibility, and safe failure handling.
- Keep Admin and Editor capabilities separate and enforce permission checks in any trusted service, not just the UI.
- Add focused automated tests and an independent review for each feature.

**Done when:** At least one non-technical tester can update and publish a site from a phone without technical help.

## Milestone 4 — Extensibility (later)
- Define/validate portable content, component, theme and publishing contracts.
- Adapt a second approved Astro template; **do not claim arbitrary templates work automatically**.
- Explore another static host (Cloudflare Pages, S3-compatible storage, etc.) through a tested publishing adapter.
- Consider a curated template gallery, offline workflows, and native packages only after the core journey succeeds.

## Agent-first delivery process
1. **Plan or Research (only when needed):** Confirm the requirement and check available tools before reinventing one. Clearly separate verified facts from proposals.
2. **Developer:** Implement one small GitHub issue using Clean Code, KISS, pragmatic SOLID, tests and documented setup.
3. **Independent Reviewer:** Check acceptance criteria, defects, data safety, test evidence and mobile UX. Return precise fixes if needed.
4. **Owner:** Approves material product decisions and production releases; does not need to approve every internal code detail.

This is a **workflow of roles**, not a requirement for three paid or constantly running AI agents.

## GitHub issue quality bar
Every implementation issue states: objective, current code/links, scope and exclusions, acceptance criteria, tests/checks, security risks, dependencies and a clear definition of done. Make small, reviewable changes; report actual results, never invented completion.

## Next task
See the GitHub issue **Audit existing local Sara Rahanjam implementation**. Audit first; then decide what to build next based on actual code.
