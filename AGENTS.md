# Instructions for AI Coding Agents

This file applies to all coding work in **Astro Static Studio**. Read [VISION](docs/VISION.md), [MVP](docs/MVP.md), [ARCHITECTURE](docs/ARCHITECTURE.md), [CONTRACTS](docs/CONTRACTS.md), and [CONTENT_MODEL](docs/CONTENT_MODEL.md) before proposing changes. This repository contains an implemented desktop local editor, Astro renderer, and Cloudflare QA preview publishing path; proposed future features remain proposals unless verified in code and tests.

## Mission and boundaries
Build a **small, mobile-first, user-friendly CMS for Astro static sites**. The sample portfolio `sararahanjam.com` is a reference, not the whole product. A non-technical Content Editor should update content and publish without seeing code, Git, or build settings.

Prioritize a separate installation per customer, portable content, a predefined theme, and an easy editor. Do **not** build a SaaS platform, drag-and-drop page designer, native apps, or support for arbitrary Astro templates in MVP unless explicitly requested.

## Engineering principles
- **KISS and YAGNI:** Prefer the simplest solution that satisfies a tested requirement. Do not add features, services, microservices, or abstractions for hypothetical future needs.
- **Clean Code:** Meaningful names, small cohesive functions, clear module boundaries, readable error messages, and minimal duplication.
- **SOLID pragmatically:** Use single responsibility and dependency inversion where they remove real coupling; do not create interfaces or layers solely to demonstrate a pattern.
- **DRY carefully:** Share stable logic, but avoid complicated generalization of two unrelated features.
- **Typed, validated boundaries:** Prefer TypeScript strict mode, schema validation for external and stored data, and explicit failure handling. Never trust data from forms, uploaded files, or third-party APIs.
- **Maintainability:** Document decisions that are not obvious. Avoid clever code, hidden global state, and fragile magic values.
- **Consistency:** Use the project's existing formatting, naming, package manager, and test tooling where established. Propose changes before introducing new major dependencies.

## Product and UX rules
- Responsive **PWA first**: Android and iOS browsers plus Windows desktop. Design for touch and small screens; test real-device workflows where possible.
- Content Editor: forms for projects, articles, galleries, text, photos, and predefined pages. No exposure to hosting configuration, tokens, or theme internals.
- Admin: controls site settings, access, predefined themes/layouts, and publishing configuration.
- Implement **authorization**, not just hidden UI: check permissions in the trusted action that performs a write.
- Support JPEG/PNG image input, safe processing toward WebP, quality checks and file-size limits. Preserve useful alt text and avoid unannounced image quality loss.
- Avoid building custom UI frameworks or a full visual page editor.
- Accessibility basics: labeled fields, keyboard interaction, adequate touch targets, meaningful status messages, sensible focus order and contrast.

## Architecture boundaries
- Keep **CMS UI**, **content/media schema**, **Astro renderer/theme**, **build runner**, and **publishing provider adapter** independent enough to change without rewriting everything.
- The published site must work on **static-only hosting**. Interactive client-side JavaScript is fine; do not assume server execution on the static host.
- Build and deploy from a trusted runner; **never embed repository write tokens, API secrets, or hosting credentials in client-side code or Git history**.
- Content stays separate from presentation. Template changes must not silently discard user content. Do not promise arbitrary template compatibility.
- Prefer one supported publisher and one Astro template in the first proof of concept.

## Testing and quality gates
Each implementation task should include:
1. A clear problem statement and **acceptance criteria** understandable to a non-technical tester.
2. Small changes that fit the current design, with tests for new business logic and regressions.
3. Validation of edge cases, user errors, upload failures, and build/deploy failures.
4. A relevant typecheck, lint, test and build run. Report which commands were run and their results; never say tests passed when they did not run.
5. Browser usability checks at mobile and desktop sizes for UI changes; verify keyboard accessibility for interactive controls.
6. Security review of any new data input, file upload, authentication or deployment path.
7. Documentation updates when behavior, schema, setup or constraints change.

## Source control rules
- Read the current repository state before editing. Do not overwrite the user's uncommitted work.
- Make narrow, reviewable changes. Avoid unrelated refactors, generated artifacts, or large dependency updates.
- Never commit .env files, credentials, access tokens, or personal user data.
- Document breaking changes and schema migrations; provide a rollback strategy for publishing changes.
- Ask before destructive operations, publication to production, or changes that impact customer content.
- Provide a concise summary of changed files, tests performed, limitations, and next recommended step.

## Agent workflow
1. Read product docs and repository state.
2. Pick **one small milestone** from [ROADMAP](docs/ROADMAP.md).
3. Explain scope and proposed approach before coding when architecture changes.
4. Implement the smallest vertical slice with tests.
5. Run relevant checks and show evidence.
6. Record decisions and update documentation.
7. Stop when acceptance criteria are met; do not expand scope without a user request.

## Definition of Done
A change is done only when the acceptance criteria are met, supported test/build checks succeed (or failures are clearly disclosed), mobile usability is considered, secrets are protected, and the documentation reflects the behavior. A simulated demo is not a deployed or verified production system.

## Communication
Use clear, short English (roughly B1–B2 readability). Separate verified facts, proposals, and open questions. Be precise and avoid repeating the user's instructions.

## Current v1 versus future content model

- **Current source of truth:** `packages/contracts/src/index.ts` defines Content v1: only page/project entries and text/gallery components in `content/content.json`. The existing site uses a direct JSON import, not Astro Content Collections.
- **Future proposal:** `docs/CONTENT_MODEL.md` specifies a template-first, Pages + typed Collections experience with per-collection categories and collection-view blocks. It is **not** an instruction to silently rewrite the schema or UI.
- Before implementing it, preserve the working loopback API, backups, Cloudflare publish protections, existing sample data, IDs, URLs and asset paths. Prepare a versioned, tested migration with rollback, and follow issue #5 usability evidence.
- Reuse Astro build-time Content Layer loaders and pagination only after confirming they serve the specific migration; never confuse static route pagination with local dashboard API paging.
- Default to one supported template and preset forms/blocks. RTL/LTR must be supported and tested by each approved theme; it is not achieved by a `dir` attribute alone.
