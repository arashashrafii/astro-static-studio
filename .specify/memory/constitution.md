<!--
Sync Impact Report
Version: 1.0.0 → 1.1.0
Modified: III. Portable Content and Safe Recovery; IV. Trusted Publishing and Secure Inputs;
V. Evidence and Quality Gates; product constraints; development workflow; governance.
Added sections: none. Removed sections: none.
Follow-up: reconcile conflicting V1/V2 status descriptions in the relevant future issue.
Remove this report before committing the constitution.
-->
# Astro Static Studio Constitution

## Core Principles

### I. Owner-Friendly, Local-First Product

The product MUST help a non-technical owner edit, preview, recover and publish a static site
without daily exposure to code, Git, credentials or hosting internals. Each customer has a
separate local installation. The current desktop workflow is the baseline; Android and iOS
capabilities MUST NOT be claimed until verified. UI changes MUST support responsive layouts,
labeled controls, keyboard access, meaningful status and touch-friendly interaction.

### II. Simple, Focused Changes

Each issue MUST have a clear objective and acceptance criteria. Changes MUST use the smallest
coherent solution, follow existing boundaries and avoid speculative abstractions or unrelated
refactoring. One approved template and one supported publishing path remain the initial focus;
SaaS, arbitrary templates and freeform page design require explicit approval.

### III. Portable Content and Safe Recovery

Content MUST remain separate from presentation and be validated at storage and API boundaries.
Changes to schemas or templates MUST preserve supported content, identifiers, routes and media,
or provide a versioned, tested migration and recovery path. Backups and restore MUST be
validated before replacing content. Breaking changes and rollback procedures MUST be documented.
Existing code and tests determine implemented contracts; proposals do not establish behavior.
Before changing a contract, inspect the active implementation, existing backups and migration
tests; preserve supported V1 recovery and any approved V2 data. Reject unknown versions and
malformed inputs without partial writes. Treat site export and editable backup as distinct outputs.

### IV. Trusted Publishing and Secure Inputs

Public output MUST work on static-only hosting. Builds and publishing MUST run in a trusted
process; credentials MUST NOT enter browser bundles or Git history. Inputs and uploaded files
MUST be validated, errors reported clearly, and image quality and useful alt text preserved.
Publishing MUST report verified outcomes and retain recovery paths. Production publication and
destructive changes require owner approval. If multi-user access is introduced, authorization
MUST be enforced at the trusted write boundary.
Failed builds MUST retain the last successful local output. A QA preview is not production
acceptance, and successful upload alone does not prove public reachability.

### V. Evidence and Quality Gates

Each implementation MUST include relevant business-logic and regression tests, including user
errors and failure paths where applicable. Run relevant typecheck, lint, tests and build; report
any unavailable or failed checks. UI changes MUST be checked at mobile and desktop sizes and
for keyboard usability. Security-sensitive changes MUST receive a focused security review.
Claims of usability, mobile support or production deployment MUST be backed by actual evidence.
Record the tested version, environment, method, results and limitations. Experiments, emulators,
automated checks and agent walkthroughs MUST NOT be reported as real-device or non-technical
owner acceptance. Mark incomplete evidence as partial or unresolved, and close an issue only
when its applicable acceptance criteria are met or the owner explicitly changes its scope.

## Product and Architecture Constraints

Maintain separable CMS UI, content and media contracts, Astro renderer, build runner and publisher
adapter. Use the existing local Node API and file-backed content unless an approved change
justifies a different design. The local MVP is single-owner; role enforcement applies if a remote
multi-user boundary is added. Existing content and backups require particular care during schema
migration. RTL and LTR support MUST be verified in each approved theme, not assumed from a
single direction attribute.
Material changes to build architecture, template compatibility, content-model scope or access
roles MUST follow the applicable owner decision gate. Record offline startup, local build,
preview and publication as separate capabilities; do not describe a remote or limited compiler
as a full local Astro build. No alternative provider or runtime is approved by an experiment.

## Development Workflow and Review

Read AGENTS.md and the required product documents before proposing coding changes. Inspect the
worktree and relevant code before edits, preserve unrelated work, and define one focused issue.
Use targeted tests first, address related failures, review the diff, and run broader checks when
risk or project rules justify them. Update documentation when behavior, configuration, contracts
or recovery workflows change. Do not create branches, commits or push changes without the
necessary authorization. Provide a concise handoff with results, checks, decisions and blockers.
Use the relevant GitHub issue and its acceptance criteria as the working scope; check linked
dependencies and current decisions before implementation. Reuse completed work and existing
issues. Record evidence and limitations against the issue when authorized; do not treat an issue
description or historical roadmap as proof that a feature is implemented or approved.

## Governance

This constitution summarizes project principles alongside AGENTS.md and the referenced product
documents. Explicit owner instructions and applicable higher-priority rules take precedence;
resolve conflicts rather than silently treating proposals as implemented facts. Plans and reviews
MUST check applicable principles and document justified exceptions. Amendments MUST describe the
change and its impact, update this document and be reviewed by the project owner. Increment the
major version for incompatible principle changes, minor for added or materially expanded guidance,
and patch for non-semantic clarifications. The adoption date records creation of this initial
constitution; the last-amended date records the latest change.

**Version**: 1.1.0 | **Ratified**: 2026-11-04 | **Last Amended**: 2026-11-04
