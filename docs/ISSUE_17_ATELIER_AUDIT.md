# Issue #17 — Atelier audit against the verified desktop build

**Status: Partially verified.** Atelier builds as static output on the verified desktop Node/Astro path. A build using `HEAD`'s V1 content generated 24 pages; a synthetic, committed V1 fixture generated four representative routes. A separate run with this worktree's uncommitted V2 content generated 25 pages; that result is explicitly local and is not evidence that V2 data changes are part of the committed V1 baseline or a release. This audit does not establish Android, cold-offline browser, or arbitrary Astro-template support.

## Reproduction

- Repository revision inspected: `25171b6880c0c6919a74e4e1685b9e0279463b82`.
- Runtime: Node `v24.13.0`, npm `11.16.0`.
- Astro: `7.4.2` (`apps/site/package.json` range `^7.4.2`; lockfile exact version). Astro declares Node `>=22.23.4`; the tested runtime satisfies that range.
- Astro compiler: `@astrojs/compiler-rs` / `@astrojs/compiler-binding` `0.5.2`, MIT. The binding package publishes optional platform binaries, including Android arm64 and WASI variants; their presence is not evidence that the complete Astro CLI runs on Android.
- Theme package: `@astro-static-studio/theme` `0.1.0`; contracts package: `@astro-static-studio/contracts` `0.1.0`.
- Build command: `npm run build -w apps/site -- --outDir /tmp/astro-static-studio-issue17-dist`.
- Result: passed; static output, 25 generated pages, about 35 MiB. The production output directory was not used.

## Theme inventory

- Astro config sets `output: 'static'`; no Astro integrations or adapters are configured.
- Routes are source-owned: `/` and `/projects/` are fixed pages; `[...slug].astro` generates published pages, Collection lists, and item details. For the current V2 sample this produced Home, About, Contact, Projects, and 21 published `/portfolio/<slug>/` details.
- `Layout.astro` owns the site shell, global CSS, navigation, footer, title/description and `lang`/`dir` attributes. The current responsive CSS uses breakpoints at 650–700px. It contains both older physical left/right rules and newer logical alignment rules; setting `dir` alone does not establish complete RTL layout support.
- Astro components cover V1 text/gallery entries and V2 rich text, image, gallery, Collection listing/view and item details. The site reads `content/content.json` directly and validates V1 or V2 with the shared Zod schemas; it does not use Astro Content Collections or Content Layer loaders.
- CSS is embedded in the shared layout. The project list and Collection listing use small browser scripts. No Astro `client:*` islands, CSS framework, Sass, image integration, server adapter, or external runtime service is configured.
- Media is referenced from `/media/...` and copied from `apps/site/public/media`; the fixture build resolved all checked image references. Images are rendered directly; Astro image optimization is not configured.
- The package `@astro-static-studio/theme` currently exports only `id`, `name`, `version`, supported V1 component names, and three color tokens. It is not yet an executable renderer registry or adapter contract. Page roles, route construction, nav labels and presentation are hard-coded in `apps/site`.

## Minimal compatibility fixture

The sanitized V1 fixture is stored at `docs/fixtures/atelier-v1-minimal.json`. It has an About page and one text-only project, so it carries no customer artwork or media. An isolated tree used the fixture as its root `content/content.json`; site/package sources were copied or linked from the worktree, and the user's working content file was not edited.

Build command:

```sh
fixture_root=$(mktemp -d /tmp/astro-static-studio-atelier.XXXXXX)
mkdir -p "$fixture_root/apps" "$fixture_root/packages" "$fixture_root/content"
cp -a apps/site "$fixture_root/apps/site"
ln -s "$PWD/packages/contracts" "$fixture_root/packages/contracts"
ln -s "$PWD/packages/theme" "$fixture_root/packages/theme"
ln -s "$PWD/node_modules" "$fixture_root/node_modules"
ln -s "$PWD/node_modules" "$fixture_root/apps/site/node_modules"
cp docs/fixtures/atelier-v1-minimal.json "$fixture_root/content/content.json"
./node_modules/.bin/astro build --root "$fixture_root/apps/site" --outDir "$fixture_root/dist"
```

Result: passed; generated `/`, `/about/`, `/projects/`, and `/portfolio/sample-work/` (four static pages). It is a V1 compatibility example and does not introduce a new schema or migration.

### Existing content route checks

- Building `git show HEAD:content/content.json` in an isolated tree passed and generated 24 pages, including `/projects/`, `/about/`, `/contact/`, and the existing `/portfolio/<slug>/` routes.
- Building the uncommitted local V2 content generated 25 pages, including Home, About, Contact, Projects and 21 published item routes. This characterization is not a released V2 claim.
- All runs wrote output to isolated `/tmp` directories. The local content file was not edited.

## Supported boundary and actionable limits

The verified example supports this repository's bundled Atelier source, the existing validated V1/V2 content shapes, static routes and local desktop Astro CLI build. It does not support arbitrary template import, arbitrary Astro project structure, SSR/server endpoints, Astro integrations/adapters not present in the config, or a user-authored theme schema. An unsupported template should be rejected by a future explicit theme manifest/adapter validator before selection/build; current code has no such detector yet, so it must not be described as an implemented behavior.

For this product, keep the initial supported boundary to one bundled, reviewed Atelier template, static Astro output, and Studio's validated content contracts. Do not expose arbitrary template import, user-authored Astro/HTML/CSS, or a general theme schema. These limits match the repository's existing product instructions; they are not a new restriction requiring separate approval. The current product has no theme import UI, so unsupported third-party themes cannot be selected through Settings. Manual source-level additions are outside the supported workflow and may currently surface Astro's raw build error rather than a Studio-specific message. #30 must add manifest/compatibility checks that explain unknown, incompatible, or unsupported theme requirements before selection/build.

The config itself establishes the actionable current boundary for build mode (`output: 'static'`), and the content validators reject unsupported content versions/shapes before rendering. No preflight check for integrations, server-only code, or arbitrary external theme structure exists yet; those cases are not supported and are not guaranteed to receive a user-friendly diagnostic today.

The current source uses a mixture of logical and physical CSS direction rules. RTL/LTR requires a dedicated visual and keyboard audit in the theme implementation; the presence of `dir` attributes is insufficient. Android and cold-offline constraints are tracked separately in #8/#15/#16 and were not tested here.

No source or content file was changed during the audit. Route output was generated from the original input content; IDs, slugs and `/media/...` references were left untouched. The V1 baseline build preserves the observed `/projects/`, `/portfolio/<slug>/`, `/about/` and `/contact/` routes.

## UI/UX source review (not browser-verified)

An independent UI/UX review identified these items for the Atelier default-theme implementation and its browser acceptance; none is reported as a verified rendered-browser defect:

- Collection filter and pagination controls have small padding on narrow screens; check touch target size.
- Category filters are keyboard buttons, but active state is represented by a CSS class only; provide an accessible selected/pressed state and check focus visibility.
- Direction support needs visual validation: some styles use physical left/right, gallery navigation arrows are fixed, and interface labels mix English and Persian.
- Small muted text uses `#777` on the light background; verify contrast and adjust if needed.
- Listing images are cropped with `object-fit: cover`; confirm that this presentation suits the portfolio artwork.

These checks belong in #31/#32 responsive, accessibility and RTL/LTR verification. This source review did not run a browser accessibility audit or visual QA.

## License and unresolved items

Astro and its compiler packages declare MIT. The internal theme/contracts packages have no `license` metadata, and this worktree contains no repository-level `LICENSE` file. This audit cannot infer redistribution rights or authorship terms for Atelier source or sample artwork. Record/confirm the project's intended licensing and required attribution before distributing the theme as a selectable installable package.

The adapter/registry boundary, manifest validation and unsupported-feature diagnostics belong to #30 and are not present yet. This report does not make or approve that architecture decision. The theme issues can continue on the desktop baseline while those decisions are handled in their planned dependency order.
