import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { server } from './serve.mjs';
test('browser compiles changed Astro source and exports matching HTML at desktop and phone sizes', async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
  try {
    for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      const requests = [];
      page.on('request', request => requests.push(request.url()));
      await page.goto(origin);
      await page.locator('#build').focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.querySelector('#build').disabled);
      assert.match(await page.locator('#status').innerText(), /^Success/, await page.locator('#status').innerText());
      const source = await page.locator('#source').inputValue();
      await page.locator('#source').fill(source.replace('Built on this device', 'Updated <phone> & title'));
      await page.locator('#build').click();
      await page.waitForFunction(() => !document.querySelector('#build').disabled);
      assert.match(await page.locator('#status').innerText(), /^Success/, await page.locator('#status').innerText());
      const html = await page.locator('#download').evaluate(async link => (await fetch(link.href)).text());
      assert.match(html, /Updated &lt;phone&gt; &amp; title/);
      assert.match(html, /^<!doctype html>/);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.screenshot({ path: `/tmp/browser-astro-${viewport.width}.png`, fullPage: true });
      for (const invalid of ['<style>h1{color:red}</style><h1>No</h1>', '---\nimport Other from \"./other.astro\";\n---\n<Other />', 'x'.repeat(65537)]) {
      await page.locator('#source').fill(invalid);
      await page.locator('#build').click();
      await page.waitForFunction(() => !document.querySelector('#build').disabled);
      assert.match(await page.locator('#status').innerText(), /^Failed:/);
      assert.equal(await page.locator('#download').isVisible(), false);
      }
      assert.equal(requests.every(url => url.startsWith(origin) || url.startsWith('blob:')), true);
      console.log(JSON.stringify({ viewport, report: await page.locator('#report').innerText() }));
      await page.close();
    }
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
