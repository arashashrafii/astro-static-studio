import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const profile = resolve(process.env.PROFILE_DIR ?? '.tmp/wasmer-browser-profile');
const reportPath = resolve(process.env.REPORT_PATH ?? '.tmp/wasmer-browser-report.json');
const port = Number(process.env.PORT ?? 4178);
const packageName = process.env.WASMER_PACKAGE ?? 'wasmer/edgejs-quickjs@=0.2.5';
const chromePath = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const offlineProxy = process.env.BROWSER_OFFLINE === '1';
await mkdir(profile, { recursive: true });

const args = ['--no-sandbox', '--disable-dev-shm-usage'];
if (offlineProxy) args.push('--proxy-server=http://127.0.0.1:1', '--proxy-bypass-list=localhost;127.0.0.1');
const context = await chromium.launchPersistentContext(profile, {
  executablePath: chromePath,
  headless: true,
  args,
});
const page = context.pages()[0] ?? await context.newPage();
const report = {
  packageName,
  browserOfflineProxy: offlineProxy,
  requests: [],
  failures: [],
  consoleErrors: [],
  startedAt: new Date().toISOString(),
};
page.on('request', request => report.requests.push(request.url()));
page.on('requestfailed', request => report.failures.push({ url: request.url(), error: request.failure()?.errorText }));
page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
page.on('pageerror', error => report.consoleErrors.push(error.message));

try {
  const startedAt = Date.now();
  await page.goto(`http://127.0.0.1:${port}/?package=${encodeURIComponent(packageName)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  await page.evaluate(async () => Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) => setTimeout(() => reject(new Error('service worker ready timed out')), 15_000)),
  ]));
  report.shellMs = Date.now() - startedAt;
  report.crossOriginIsolated = await page.evaluate(() => crossOriginIsolated);
  if (offlineProxy) {
    report.externalProbe = await page.evaluate(async () => {
      try {
        const response = await fetch('https://example.com', { cache: 'no-store' });
        return { ok: response.ok, status: response.status };
      } catch (error) {
        return { error: String(error) };
      }
    });
  }
  await page.locator('#run').click();
  await page.waitForFunction(() => {
    const state = document.querySelector('#state')?.textContent ?? '';
    return state.includes('passed') || state.includes('failed');
  }, null, { timeout: 240_000 });
  report.elapsedMs = Date.now() - startedAt;
  report.state = await page.locator('#state').textContent();
  report.result = await page.locator('#result').textContent();
  report.storage = await page.evaluate(async () => ({
    ...(await navigator.storage.estimate()),
    serviceWorkerRegistrations: (await navigator.serviceWorker.getRegistrations()).length,
  }));
} catch (error) {
  report.error = error instanceof Error ? error.message : String(error);
  report.state = await page.locator('#state').textContent().catch(() => '');
  report.result = await page.locator('#result').textContent().catch(() => '');
} finally {
  report.endedAt = new Date().toISOString();
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  await context.close();
}
