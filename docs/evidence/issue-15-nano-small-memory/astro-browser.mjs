import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { chromium } from '../../experiments/browser-astro-build/node_modules/playwright/index.mjs';

const root = resolve('.tmp/issue-15-nano-small-memory');
const inputs = resolve('.tmp/issue-15-nano');
const source = resolve(inputs, 'userland-run-nano-b3fd06a');
const ramMB = Number(process.env.PROBE_RAM_MIB || 1800);
const mode = process.env.PROBE_MODE || 'cli';
const disableTrap = process.env.PROBE_DISABLE_TRAP === '1';
const report = { kind: 'Desktop Chromium; not Android', ramMiB: ramMB, mode, disableTrap,
  startedAt: new Date().toISOString(), requests: [], console: [], pageErrors: [] };
const assets = new Map(['nano.min.wasm', 'node-full', 'fixture.tar.gz'].map(name => ['/' + name, resolve(name === 'fixture.tar.gz' ? root : inputs, name)]));
const server = http.createServer(async (req, res) => {
  try {
    const path = req.url === '/' ? null : assets.get(req.url) || resolve(source, '.' + req.url);
    if (path && !path.startsWith(source + sep) && ![...assets.values()].includes(path)) {
      res.writeHead(404).end(); return;
    }
    const body = path ? await readFile(path) : '<!doctype html><title>NanoVM Astro fixture</title>';
    res.writeHead(200, { 'Content-Type': !path ? 'text/html' : path.endsWith('.mjs') ? 'text/javascript' : 'application/octet-stream',
      'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' });
    res.end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(4176, '127.0.0.1', resolve));
let browser;
let page;
try {
  browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  page = await context.newPage();
  page.on('request', request => report.requests.push(request.url()));
  page.on('console', message => report.console.push({ type: message.type(), text: message.text().slice(0, 4000) }));
  page.on('pageerror', error => report.pageErrors.push(error.message));
  await page.goto('http://127.0.0.1:4176/');
  await page.evaluate(async () => {
    window.NanoVM = (await import('/runners/riscv/host/nanovm.mjs')).NanoVM;
    for (const [key, path] of [['wasm', '/nano.min.wasm'], ['nodeImage', '/node-full'], ['fixture', '/fixture.tar.gz']]) {
      window[key] = new Uint8Array(await (await fetch(path)).arrayBuffer());
    }
  });
  await context.setOffline(true);
  report.offlineBeforeVmCreation = true;
  await page.evaluate(({ ramMB, mode, disableTrap }) => {
    window.result = { status: 'running', phase: 'vm', logs: [] };
    (async () => {
      const result = window.result;
      try {
        const start = performance.now();
        const nodeUrl = URL.createObjectURL(new Blob([window.nodeImage]));
        let vm;
        try { vm = await window.NanoVM.create({ wasm: window.wasm, ramMB, nodeUrl }); }
        finally { URL.revokeObjectURL(nodeUrl); }
        result.bootMs = Math.round(performance.now() - start);
        window.vm = vm;
        result.phase = 'mount';
        const mountStart = performance.now();
        await vm.loadTarGz(window.fixture);
        result.mountMs = Math.round(performance.now() - mountStart);
        result.phase = 'astro';
        const cli = "process.env.CI='1';process.env.ASTRO_TELEMETRY_DISABLED='1';process.chdir('/fixture');process.argv=['node','/fixture/node_modules/astro/bin/astro.mjs','build'];await import('/fixture/node_modules/astro/bin/astro.mjs');";
        const api = "process.env.CI='1';process.env.ASTRO_TELEMETRY_DISABLED='1';process.chdir('/fixture');const {build}=await import('/fixture/node_modules/astro/dist/index.js');await build({root:'/fixture'});console.log('NANO_ASTRO_BUILD_RESOLVED');";
        const diagnostic = `process.chdir('/fixture');
console.log('ROLLDOWN_WASI_PATH',import.meta.resolve('/fixture/node_modules/@rolldown/binding-wasm32-wasi/rolldown-binding.wasi.cjs'));
try{await import('/fixture/node_modules/@rolldown/binding-wasm32-wasi/rolldown-binding.wasi.cjs');console.log('BINDING_IMPORTED');}catch(e){console.log('BINDING_ERROR',e.stack);process.exitCode=1;}`;
        const buildStart = performance.now();
        result.execution = await vm.node(...(disableTrap ? ['--disable-wasm-trap-handler'] : []), '--input-type=module', '-e', mode === 'cli' ? cli : mode === 'diagnostic' ? diagnostic : api,
          { maxSteps: 20000000000, onStdout: text => result.logs.push(text) });
        result.buildMs = Math.round(performance.now() - buildStart);
        result.phase = 'verify';
        result.html = {};
        for (const file of ['index.html', 'about/index.html']) result.html[file] = vm.readFileString('/fixture/dist/' + file);
        result.badge = vm.readFileString('/fixture/dist/badge.svg');
        result.outputFiles = [];
        function list(path) {
          for (const entry of vm.listDir(path) || []) {
            if (entry.type === 'dir') list(path + '/' + entry.name);
            else result.outputFiles.push(path + '/' + entry.name);
          }
        }
        list('/fixture/dist');
        result.passed = result.execution.exitCode === 0 &&
          Object.values(result.html).every(html => typeof html === 'string' && html.includes('BROWSER-PROJECT-01')) &&
          typeof result.badge === 'string' && result.badge.includes('<svg');
        result.status = result.passed ? 'passed' : 'failed';
      } catch (error) { result.status = 'failed'; result.error = String(error.stack || error); }
    })();
  }, { ramMB, mode, disableTrap });
  await page.waitForFunction(() => window.result.status !== 'running', null, { timeout: 180000 });
  report.result = await page.evaluate(() => window.result);
  report.userAgent = await page.evaluate(() => navigator.userAgent);
} catch (error) {
  report.driverError = String(error);
  if (page) report.partialResult = await page.evaluate(() => window.result).catch(() => null);
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(resolve(root, `astro-${mode}${disableTrap ? '-no-trap' : ''}-report.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ result: report.result, partialResult: report.partialResult, driverError: report.driverError, pageErrors: report.pageErrors }));
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
if (!report.result?.passed) process.exitCode = 1;
