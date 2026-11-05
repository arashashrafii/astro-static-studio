import { Wasmer } from '@wasmer/sdk/browser';

const state = document.querySelector('#state');
const result = document.querySelector('#result');
const button = document.querySelector('#run');
const packageName = new URLSearchParams(location.search).get('package') ?? 'wasmer/edgejs-quickjs@=0.2.5';

state.textContent = `Shell ready. crossOriginIsolated=${crossOriginIsolated}; package=${packageName}`;
navigator.serviceWorker?.register('/sw.js').catch(error => {
  state.textContent += `; service worker failed: ${error.message}`;
});

button.addEventListener('click', async () => {
  button.disabled = true;
  const startedAt = performance.now();
  let wasmer;
  let sandbox;

  try {
    state.textContent = `Resolving local runtime package ${packageName}…`;
    wasmer = new Wasmer();
    sandbox = await wasmer.sandboxes.create({ packages: [packageName] });
    state.textContent = `Runtime package ready in ${Math.round(performance.now() - startedAt)} ms.`;

    const output = await sandbox.command('node', ['--version']).run({
      check: false,
      timeoutMs: 200_000,
      outputBytes: 100_000,
    });
    result.textContent = JSON.stringify({
      exitCode: output.exitCode,
      reason: output.reason,
      stdout: output.stdout.text(),
      stderr: output.stderr.text(),
    }, null, 2);
    state.textContent = `Node version command ${output.exitCode === 0 ? 'passed' : 'failed'} in ${Math.round(performance.now() - startedAt)} ms; online=${navigator.onLine}.`;
  } catch (error) {
    result.textContent = error instanceof Error ? error.stack ?? error.message : String(error);
    state.textContent = `Local runtime probe failed in ${Math.round(performance.now() - startedAt)} ms; online=${navigator.onLine}.`;
  } finally {
    await sandbox?.close().catch(() => {});
    await wasmer?.close().catch(() => {});
    button.disabled = false;
    window.dispatchEvent(new CustomEvent('wasmer-probe-finished'));
  }
});
