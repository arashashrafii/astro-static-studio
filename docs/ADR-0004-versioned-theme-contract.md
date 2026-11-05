# ADR-0004: Versioned Studio theme contract

**Status:** Accepted — owner approval received on 2026-11-05.
**Owner-approved boundaries:** In issue #22, the owner approved stable theme-neutral
placement IDs, versioned theme settings separate from Content V2, and a versioned backup
envelope that preserves v1 restore. The owner approved the concrete #30 contract shape
below on 2026-11-05.
**Evidence:** Issues #13, #17, #10 and #22; implementation and tests are prepared in
the issue #30 branch.

## Context

Atelier currently owns the Astro routes, layouts, styles and rendering directly. The
existing `ThemeInterface` is metadata only. A future selector must not make content
theme-specific, claim support based on manifest assertions alone, or let unsupported
themes silently fall back to Atelier. The verified build evidence covers only Node
24.13.0, Astro 7.4.2, static output, and the bundled Atelier source. RTL rendering and
the internal theme license remain unverified.

## Decision

1. Use a strict, versioned manifest, a versioned theme settings document, and a
   theme-owned adapter API. Keep manifest shape, adapter API, theme release, content,
   and settings versions distinct.
2. Use a fixed capability registry. Missing required capabilities, unsupported content
   versions, runtime incompatibility, or unknown schema versions block theme use with
   actionable diagnostics. Missing optional capabilities produce warnings; callers
   pass the effective capability set to settings validation and adapters so unsupported
   optional features are omitted from generated view models.
3. Declare exact tested runtime ranges until broader versions have passing evidence.
   Atelier currently claims only the verified Node/Astro patch versions, static routes,
   and LTR. Locale text is passed through; no translation or RTL claim is made.
4. Keep theme settings separate from Content V2. Map placements and optional fields by
   stable IDs, never display labels or block positions.
5. Add a generic `placementId` to page blocks. A deterministic UUIDv8, versioned migration
   assigns IDs from page identity and canonical block content, preserves assigned IDs,
   and runs before mappings are accepted. Existing IDs, slugs, routes, items and media
   references remain unchanged.
6. Carry theme settings in a future versioned backup envelope beside the current site
   backup. Continue to restore existing backup format v1 with default settings; validate
   settings references before replacement. This ADR does not change the current backup
   implementation.
7. Keep Atelier as the only bundled theme in the initial contract. Themes remain
   trusted executable build inputs; arbitrary imports, user schemas, markup, CSS,
   Android support, RTL, and multi-theme compatibility require separate evidence and
   decisions.

## Consequences

- `packages/theme/src/contract.ts` defines strict schemas, adapter interfaces, and
  compatibility/settings diagnostics. `packages/theme/src/atelier-manifest.ts` records
  current evidence and marks the internal license unknown instead of inferring rights.
- `ensureV2PlacementIdsV1()` provides deterministic backfill and the V1-to-V2 migration
  now assigns placement IDs to generated blocks. Existing V2 payloads remain readable;
  they must be migrated and saved before settings can refer to their placements.
- Issues #31 and #32 own Atelier adapter integration, persistence, settings UI, and
  versioned backup wiring. No theme selection UI is added by this decision.
- A failed validation blocks the proposed theme operation; a future switch/build
  implementation must keep the last valid settings and successful output available.

## Alternatives considered

- Put layout and theme preferences in Collection records: rejected because it mixes
  canonical content with presentation and makes switching themes alter customer data.
- Match fields by label or list index: rejected because labels can change and block
  order can change; stable IDs are required.
- Accept arbitrary Astro folders and discover support by trying a build: rejected for
  the first release because it exposes an unbounded compatibility and trust surface.
- Claim RTL or wider Node/Astro ranges from a single successful build: rejected because
  the available audit does not establish those capabilities.

## Verification

See [Studio theme contract v1](THEME_CONTRACT_V1.md) and
`tests/theme-contract.test.ts` for executable details and focused cases.
