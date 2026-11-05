# Studio theme contract v1

## Scope

The contract is a reviewed boundary for one bundled static Astro theme. It does not
make arbitrary Astro projects installable, add theme selection UI, or claim Android or
multi-theme support. Issue #31 implements the Atelier adapter and connects its route
models to the existing static Astro pages.

Executable schemas and diagnostics are in `packages/theme/src/contract.ts`. The
representative manifest is `packages/theme/src/atelier-manifest.ts`.

## Versioned files and APIs

The contract keeps these versions distinct:

- `manifestVersion` versions the manifest document shape.
- `contractVersion` identifies the Studio adapter API.
- `version` identifies the theme release.
- `contentVersions` lists canonical content versions the theme accepts.
- `settingsVersion` versions the separate theme settings document.

Unknown manifest or settings versions fail with an actionable version diagnostic.
An adapter must implement `StudioThemeAdapter` with the same `contractVersion` as
the manifest. Theme packages declare a package-relative adapter entry point and
exported factory name. The Atelier entry point is
`packages/theme/src/studio/adapter.ts`; its route models feed the current static Astro
page templates. Persistent settings and a selectable theme registry remain in #32.

`ThemeManifestV1` declares stable route-template roles, section IDs with allowed block
types and route roles, required and optional capabilities, design-token types/defaults, localization/direction claims,
runtime ranges, exact tested versions, dependency resolution metadata, and license
status. Capability IDs come from the fixed registry in `ThemeCapabilitySchema`.
Unknown capability IDs and malformed metadata are rejected.

`ThemeSettingsV1` is separate from Content V2. It stores the selected theme/version,
template IDs by route role, finite token values, and section mappings keyed by stable
`placementId`. Each section declares which page block types it can render; incompatible
section/block mappings are rejected. Collection mappings refer to the canonical
Collection ID and optional field IDs; records are never copied. Tokens are finite
six-digit colors, not arbitrary CSS.

## Compatibility and diagnostics

Runtime ranges use inclusive minimum and exclusive maximum numeric versions. The
Atelier manifest only declares the exact evidence collected by #13 and #17:

- Astro `7.4.2`, within `>=7.4.2 <7.4.3`.
- Node `24.13.0`, within `>=24.13.0 <24.13.1`.
- Static routes and LTR/RTL direction, verified in #31 on the desktop renderer and a
  390px mobile viewport. Content locale is passed through; this does not
  claim that all theme labels are translated.
- The theme/package license is `unknown`, because neither a repository-level license
  nor internal package license metadata was present in the audited source.

The ranges are intentionally narrow; compiling with another version requires new
evidence before widening them. A license status of `unknown` is valid metadata and is
not permission to redistribute the theme or sample artwork.

`validateThemeManifest()` returns errors for unknown format/API versions, unsupported
content/runtime versions, and unavailable required capabilities. It returns warnings
for unavailable optional capabilities and unknown license metadata. The caller passes
the effective capability set to settings validation and the adapter, which omits
unsupported optional fields from generated view models. Unknown license metadata does
not establish redistribution rights. Required capability failure blocks theme use.
Unknown or incompatible themes must never silently fall back to Atelier.

`validateThemeSettings()` checks theme/version identity, template and section IDs,
section/block compatibility, token values, placement IDs, Collection references, and
optional field IDs against the effective capability set. Atelier accepts any valid
BCP 47 language tag as pass-through text; this does not translate fixed interface
labels. Direction validation accepts LTR and RTL; Atelier layouts use direction-aware
navigation, logical alignment, and gallery arrows. Missing placement IDs report that
the versioned migration is required.

## Stable placement IDs and migration

Each Content V2 page block may carry a theme-neutral UUID `placementId`. It identifies
the generic page placement, not a theme section. `ensureV2PlacementIdsV1()` performs
the versioned compatibility migration:

- Existing IDs are preserved.
- Missing IDs are generated as deterministic UUIDv8 values from the page ID and a
  canonical content fingerprint. Identical duplicate blocks receive separate IDs by
  occurrence order. Inserting or reordering different blocks does not change their IDs.
- Duplicate IDs fail Content V2 validation.
- The V1-to-V2 content migration assigns these IDs to generated page blocks.

For already stored V2 content, call and persist the migration before accepting theme
settings. Settings validation rejects blocks without IDs. Once assigned and saved,
block reordering preserves IDs. The migration is additive; it does not change page IDs,
slugs, routes, item IDs, or media references. It does not alter the current V1 backup
format.

Theme settings will be included beside the existing site backup in a later versioned
backup envelope. That envelope must continue to accept existing backup format v1,
validate all mapping references before replacing content, and restore defaults when
older backups have no theme settings. This issue defines that constraint; production
backup wiring remains in #32.

## Atelier manifest notes

The checked-in manifest records the current `apps/site` dependency declarations and
resolved versions from `package-lock.json`. It points to the checked-in
`./studio/adapter.ts` Atelier adapter. It declares the
current route roles (`home`, `page`, `collectionList`, and `collectionItem`) and the finite color tokens
already present in the theme metadata. Optional collection/field capabilities are
declared separately from required V1/V2 content and required LTR/RTL directions.

The adapter and manifest are not an import sandbox. Theme source and dependencies are
executable build inputs and remain reviewed trusted code. Astro integrations, SSR,
remote runtime services, arbitrary schemas, markup, CSS, or package scripts are outside
this contract.
