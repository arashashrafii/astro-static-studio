import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectPlatform } from '../apps/admin/src/pwa-install.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

test('detectPlatform identifies Android and iOS user agents accurately', () => {
  assert.deepEqual(
    detectPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36'),
    { isAndroid: true, isIOS: false },
  );
  assert.deepEqual(
    detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'),
    { isAndroid: false, isIOS: true },
  );
  assert.deepEqual(
    detectPlatform('Mozilla/5.0 (X11; Linux x86_64) Chrome/126.0.0.0 Safari/537.36'),
    { isAndroid: false, isIOS: false },
  );
});

test('PWA icon assets exist and index.html includes required mobile and iOS meta tags', async () => {
  for (const file of ['icon-192.png', 'icon-512.png', 'pwa-maskable-512x512.png', 'apple-touch-icon.png', 'icon.svg']) {
    const info = await stat(resolve(root, 'apps/admin/public', file));
    assert.ok(info.isFile() && info.size > 0, `${file} must exist and be non-empty`);
  }

  const html = await readFile(resolve(root, 'apps/admin/index.html'), 'utf8');
  assert.match(html, /name="mobile-web-app-capable"\s+content="yes"/);
  assert.match(html, /name="apple-mobile-web-app-capable"\s+content="yes"/);
  assert.match(html, /name="theme-color"\s+content="#263c32"/);
  assert.match(html, /rel="apple-touch-icon"\s+href="\/apple-touch-icon\.png"/);
  assert.match(html, /rel="icon"\s+type="image\/svg\+xml"\s+href="\/icon\.svg"/);
  assert.match(html, /rel="preload"\s+as="image"\s+href="\/icon\.svg"/);
  assert.match(html, /class="app-splash"/);
});

test('VitePWA configuration keeps maskable and any icon purposes separate and compliant', async () => {
  const viteConfig = await readFile(resolve(root, 'apps/admin/vite.config.ts'), 'utf8');
  assert.ok(!viteConfig.includes("purpose: 'any maskable'"), 'do not mix any and maskable on one unpadded icon');
  assert.ok(viteConfig.includes("purpose: 'maskable'"));
  assert.ok(viteConfig.includes("id: '/'"));
  assert.ok(viteConfig.includes("scope: '/'"));
  assert.ok(viteConfig.includes("display: 'standalone'"));
  assert.ok(viteConfig.includes("background_color: '#263c32'"));
  assert.ok(viteConfig.includes("theme_color: '#263c32'"));
  assert.ok(viteConfig.includes('prefer_related_applications: false'));
  assert.ok(viteConfig.includes("display_override: ['standalone', 'minimal-ui']"));
});

test('Android install prompts are removed and native Capacitor Android + iOS + GitHub Release packaging exist', async () => {
  const html = await readFile(resolve(root, 'apps/admin/index.html'), 'utf8');
  const viteConfig = await readFile(resolve(root, 'apps/admin/vite.config.ts'), 'utf8');
  const pwaInstall = await readFile(resolve(root, 'apps/admin/src/pwa-install.tsx'), 'utf8');

  assert.equal(html.includes('نصب روی اندروید'), false);
  assert.equal(viteConfig.includes('روی اندروید'), false);
  assert.equal(pwaInstall.includes('PWAInstallButton'), false);
  assert.equal(pwaInstall.includes('PWAInstallPanel'), false);

  const capConfig = JSON.parse(await readFile(resolve(root, 'capacitor.config.json'), 'utf8')) as {
    webDir: string;
    server?: { iosScheme?: string; androidScheme?: string };
    plugins?: { SplashScreen?: { backgroundColor?: string } };
  };
  assert.equal(capConfig.webDir, 'apps/admin/dist');
  assert.equal(capConfig.server?.iosScheme, 'capacitor');
  assert.equal(capConfig.server?.androidScheme, 'https');
  assert.equal(capConfig.plugins?.SplashScreen?.backgroundColor, '#263c32');

  const androidManifest = await stat(resolve(root, 'android/app/src/main/AndroidManifest.xml'));
  const iosPlist = await stat(resolve(root, 'ios/App/App/Info.plist'));
  assert.ok(androidManifest.isFile() && iosPlist.isFile());

  const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8')) as {
    private?: boolean;
    bin?: Record<string, string>;
    os?: string[];
  };
  assert.notEqual(pkg.private, true);
  assert.ok(pkg.bin?.['astro-studio']);
  assert.ok(pkg.os?.includes('win32') && pkg.os?.includes('darwin') && pkg.os?.includes('linux'));

  const releaseWorkflow = await readFile(resolve(root, '.github/workflows/release.yml'), 'utf8');
  assert.match(releaseWorkflow, /build-android-apk/);
  assert.match(releaseWorkflow, /build-ios-app/);
  assert.match(releaseWorkflow, /build-npm-package/);
  assert.match(releaseWorkflow, /npm run build/);
  assert.match(releaseWorkflow, /sdkmanager/);
  assert.match(releaseWorkflow, /-resolvePackageDependencies/);
  assert.match(releaseWorkflow, /softprops\/action-gh-release/);
});

