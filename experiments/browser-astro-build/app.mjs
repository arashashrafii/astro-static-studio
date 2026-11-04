const button = document.querySelector('#build');
const status = document.querySelector('#status');
const link = document.querySelector('#download');
let downloadURL;
button.onclick = () => {
  button.disabled = true;
  link.hidden = true;
  document.querySelector('iframe').srcdoc = '';
  if (downloadURL) URL.revokeObjectURL(downloadURL);
  status.textContent = 'Compiling Astro source locally…';
  // A fresh worker bounds per-build retained compiler/module memory.
  const worker = new Worker('./worker.mjs', { type: 'module' });
  const finish = () => { clearTimeout(timeout); worker.terminate(); button.disabled = false; };
  const timeout = setTimeout(() => { finish(); status.textContent = 'Failed: exceeded 60 seconds. Worker stopped.'; }, 60000);
  worker.onerror = event => { finish(); status.textContent = `Failed: ${event.message}`; };
  worker.onmessage = ({ data }) => {
    finish();
    if (data.error) { status.textContent = `Failed: ${data.error}`; return; }
    document.querySelector('iframe').srcdoc = data.html;
    downloadURL = URL.createObjectURL(new Blob([data.html], { type: 'text/html' }));
    link.href = downloadURL;
    link.hidden = false;
    status.textContent = 'Success: HTML compiled and rendered on this device.';
    document.querySelector('#report').textContent = JSON.stringify({ userAgent: navigator.userAgent, durationMs: Math.round(data.ms), outputBytes: data.bytes, deviceMemoryGiB: navigator.deviceMemory ?? null, browserHeap: performance.memory ? { used: performance.memory.usedJSHeapSize, limit: performance.memory.jsHeapSizeLimit } : null, note: 'Heap values exclude some worker/WASM memory; they are not peak process memory.' }, null, 2);
  };
  worker.postMessage(document.querySelector('#source').value);
};
