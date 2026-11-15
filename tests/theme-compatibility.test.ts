import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ContentV2Schema } from '../packages/contracts/src/content-v2.js';
import { createAtelierDefaultSettings, createThemeAdapter } from '../packages/theme/src/studio/adapter.js';
import { ThemeManifestV1Schema, type ThemeCapability, type ThemeRouteModel, type StudioThemeAdapter } from '../packages/theme/src/contract.js';
import { atelierManifest } from '../packages/theme/src/atelier-manifest.js';
import { mapStructuralFixture, type FixtureRoute } from '../experiments/theme-contract-fixture/src/lib/routes.js';

const repo = resolve(fileURLToPath(new URL('..', import.meta.url)));
const fixturePath = resolve(repo, 'tests/fixtures/theme-compatibility-v2.json');
const capabilities: ThemeCapability[] = [
  'content.v2', 'routes.static', 'route.home', 'route.page', 'route.collectionList',
  'route.collectionItem', 'field.text', 'field.richText', 'field.category', 'field.gallery', 'field.link',
  'media.webp', 'direction.ltr', 'direction.rtl',
];

function build(command: string, args: string[], env: NodeJS.ProcessEnv) {
  const result = spawnSync(command, args, { cwd: repo, env, encoding: 'utf8', timeout: 120_000 });
  assert.equal(result.status, 0, command + ' ' + args.join(' ') + ' failed:\n' + result.stdout + '\n' + result.stderr);
}

function outputFile(dir: string, route: string) {
  return resolve(dir, route === '/' ? 'index.html' : route.replace(/^\/+|\/+$/g, '') + '/index.html');
}

function assertAccessibleStaticPage(html: string, title: string, description: string) {
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<html[^>]+lang="en"[^>]+dir="ltr"/i);
  assert.ok(html.includes('<title>' + title + ' | Contract Fixture</title>') || html.includes('<title>' + title + ' — Contract Fixture</title>'));
  assert.ok(html.includes('content="' + description + '"'), 'meta description is present');
  assert.match(html, /<h1\b/i, 'one primary heading is present');
  for (const imageTag of html.match(/<img\b[^>]*>/gi) ?? []) assert.match(imageTag, /\balt="[^"]*"/i, 'each image has an alt attribute');
}

test('one immutable V2 fixture builds through Atelier and a structurally independent Astro theme', async () => {
  const source = await readFile(fixturePath, 'utf8');
  const content = ContentV2Schema.parse(JSON.parse(source));
  const rawContent = JSON.parse(source);
  const atelierSettings = createAtelierDefaultSettings(rawContent);
  const atelierRoutes = createThemeAdapter().map({ content, settings: atelierSettings, manifest: atelierManifest, availableCapabilities: capabilities });

  const structuralManifest = ThemeManifestV1Schema.parse({
    manifestVersion: 1,
    contractVersion: 1,
    id: 'structural-fixture',
    name: 'Structural fixture (test only)',
    version: '1.0.0',
    adapter: { entryPoint: './src/lib/routes.ts', exportName: 'mapStructuralFixture' },
    compatibility: {
      contentVersions: [2],
      astro: { range: { minInclusive: '7.4.2', maxExclusive: '7.4.3' }, testedVersion: '7.4.2' },
      node: { range: { minInclusive: '24.13.0', maxExclusive: '24.13.1' }, testedVersion: '24.13.0' },
    },
    templates: [
      { id: 'gallery-home', role: 'home' },
      { id: 'editorial-page', role: 'page' },
      { id: 'catalog-index', role: 'collectionList' },
      { id: 'object-detail', role: 'collectionItem' },
    ],
    sections: [],
    capabilities: { required: ['content.v2', 'routes.static', 'route.home', 'route.page', 'route.collectionList', 'route.collectionItem', 'field.text', 'field.richText', 'media.webp'], optional: [] },
    localization: { contentLocalePolicy: 'any-bcp47-pass-through', directions: ['ltr'] },
    designTokens: { background: { type: 'color', default: '#e9f0f2' }, foreground: { type: 'color', default: '#18333d' } },
    license: { status: 'unknown', reason: 'Internal test fixture; no separate distribution license is granted.' },
    dependencies: {
      lockfile: 'package-lock.json',
      packages: [
        { name: 'astro', declaredRange: '7.4.2', resolvedVersion: '7.4.2' },
        { name: '@astro-static-studio/contracts', declaredRange: '*', resolvedVersion: '0.1.0' },
        { name: '@astro-static-studio/theme', declaredRange: '*', resolvedVersion: '0.1.0' },
      ],
    },
  });
  const structuralSettings = createAtelierDefaultSettings(rawContent, structuralManifest);
  const structuralAdapter: StudioThemeAdapter = { contractVersion: 1, map: mapStructuralFixture };
  const structuralRoutes: FixtureRoute[] = structuralAdapter.map({ content, settings: structuralSettings, manifest: structuralManifest, availableCapabilities: capabilities }) as FixtureRoute[];
  assert.throws(() => structuralAdapter.map({ content, settings: structuralSettings, manifest: structuralManifest, availableCapabilities: capabilities.filter(capability => capability !== 'media.webp') }), /requires capabilities:.*media.webp/);
  assert.equal(await readFile(fixturePath, 'utf8'), source, 'both adapters leave the canonical fixture byte-for-byte unchanged');

  const roleCounts = (routes: ThemeRouteModel[]) => routes.reduce<Record<string, number>>((counts, route) => ({ ...counts, [route.role]: (counts[route.role] ?? 0) + 1 }), {});
  assert.deepEqual(roleCounts(structuralRoutes), roleCounts(atelierRoutes));
  assert.notDeepEqual(structuralRoutes.map(route => route.path).sort(), atelierRoutes.map(route => route.path).sort(), 'the fixture uses a different route convention');
  const atelierItem = atelierRoutes.find(route => route.role === 'collectionItem');
  const structuralItem = structuralRoutes.find(route => route.role === 'collectionItem');
  assert.ok(atelierItem && structuralItem);
  assert.ok(JSON.stringify(atelierItem.data).includes('First work'));
  assert.ok(JSON.stringify(structuralItem.data).includes('First work'));

  const temp = await mkdtemp(resolve(tmpdir(), 'studio-theme-compat-'));
  const atelierOutput = resolve(temp, 'atelier');
  const structuralOutput = resolve(temp, 'structural');
  const routeDataPath = resolve(temp, 'structural-routes.json');
  try {
    await writeFile(routeDataPath, JSON.stringify(structuralRoutes));
    build('npm', ['run', 'build', '-w', 'apps/site', '--', '--outDir', atelierOutput], {
      ...process.env,
      STUDIO_THEME_COMPATIBILITY_CONTENT_PATH: fixturePath,
    });
    build(resolve(repo, 'node_modules/.bin/astro'), ['build', '--root', resolve(repo, 'experiments/theme-contract-fixture'), '--outDir', structuralOutput], {
      ...process.env,
      STUDIO_FIXTURE_ROUTES: routeDataPath,
    });

    const atelierPaths = ['/', '/about/', '/projects/', '/portfolio/first-work/'];
    const structuralPaths = ['/', '/content/about/', '/collections/projects/', '/items/first-work/'];
    for (const path of atelierPaths) assert.ok(atelierRoutes.some(route => route.path === path), 'Atelier adapter maps ' + path);
    for (const path of structuralPaths) assert.ok(structuralRoutes.some(route => route.path === path), 'fixture adapter maps ' + path);
    const atelierAbout = await readFile(outputFile(atelierOutput, '/about/'), 'utf8');
    const structuralAbout = await readFile(outputFile(structuralOutput, '/content/about/'), 'utf8');
    assertAccessibleStaticPage(atelierAbout, 'About this fixture', 'About page metadata description.');
    assertAccessibleStaticPage(structuralAbout, 'About this fixture', 'About page metadata description.');
    assert.ok(atelierAbout.includes('Shared canonical page copy.'));
    assert.ok(structuralAbout.includes('Shared canonical page copy.'));

    const atelierItemHtml = await readFile(outputFile(atelierOutput, '/portfolio/first-work/'), 'utf8');
    const structuralItemHtml = await readFile(outputFile(structuralOutput, '/items/first-work/'), 'utf8');
    assertAccessibleStaticPage(atelierItemHtml, 'First work', 'First work details.');
    assertAccessibleStaticPage(structuralItemHtml, 'First work', 'First work details.');
    assert.ok(atelierItemHtml.includes('A blue sculpture'));
    assert.ok(structuralItemHtml.includes('A blue sculpture'));
    assert.ok(atelierItemHtml.includes('/media/4e656f50d995505d2d20190718a51034.webp'));
    assert.ok(structuralItemHtml.includes('/media/4e656f50d995505d2d20190718a51034.webp'));
    await readFile(resolve(atelierOutput, 'media/4e656f50d995505d2d20190718a51034.webp'));
    const atelierSecondCollectionPage = await readFile(outputFile(atelierOutput, '/projects/page/2/'), 'utf8');
    const structuralSecondCollectionPage = await readFile(outputFile(structuralOutput, '/collections/projects/page/2/'), 'utf8');
    assert.ok(atelierSecondCollectionPage.includes('Fifth work'));
    assert.ok(structuralSecondCollectionPage.includes('Fifth work'));
    assert.ok(!atelierSecondCollectionPage.includes('Unpublished work'));
    assert.ok(!structuralSecondCollectionPage.includes('Unpublished work'));
    await readFile(resolve(structuralOutput, 'media/4e656f50d995505d2d20190718a51034.webp'));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
