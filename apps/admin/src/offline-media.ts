const DB_NAME = 'studio-offline-media-v1';
const STORE_NAME = 'media';

export interface OfflineMediaRecord {
  src: string;
  dataUrl: string;
  size: number;
  createdAt: number;
  pendingSync: boolean;
}

const memorySrcCache = new Map<string, string>();
const listeners = new Set<() => void>();
let hydrated = false;

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeOfflineMedia(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'src' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open media DB'));
  });
}

async function readAllRecords(): Promise<OfflineMediaRecord[]> {
  try {
    const db = await openMediaDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as OfflineMediaRecord[]) ?? []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function putRecord(record: OfflineMediaRecord): Promise<void> {
  const db = await openMediaDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function hydrateOfflineMediaMap(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  const records = await readAllRecords();
  for (const record of records) {
    memorySrcCache.set(record.src, record.dataUrl);
  }
  if (records.length > 0) notify();
}

export function resolveMediaSrc(src: string): string {
  return memorySrcCache.get(src) ?? src;
}

export async function getOfflineMediaStats(): Promise<{ count: number; totalBytes: number }> {
  const records = await readAllRecords();
  return {
    count: records.length,
    totalBytes: records.reduce((sum, item) => sum + (item.size || 0), 0),
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(blob);
  });
}

export async function convertImageToWebpBlob(file: File): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('فقط تصویرهای JPEG و PNG پذیرفته می‌شوند.');
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('خواندن تصویر انجام نشد.'));
      el.src = url;
    });
    const maxDim = 2000;
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;
    if (!width || !height) throw new Error('ابعاد تصویر قابل خواندن نیست.');
    if (width > maxDim || height > maxDim) {
      const ratio = Math.min(maxDim / width, maxDim / height);
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('خطا در پردازش تصویر آفلاین');
    ctx.drawImage(img, 0, 0, width, height);
    const webpBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.82),
    );
    if (webpBlob) return webpBlob;
    // Fallback to PNG blob if WebP encoder is unavailable in older WebView
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('تبدیل تصویر انجام نشد.'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function saveOfflineMedia(file: File): Promise<{ src: string; webpSize: number }> {
  const webpBlob = await convertImageToWebpBlob(file);
  const dataUrl = await blobToDataUrl(webpBlob);
  const id = crypto.randomUUID();
  const src = `/media/${id}.webp`;
  const record: OfflineMediaRecord = {
    src,
    dataUrl,
    size: webpBlob.size,
    createdAt: Date.now(),
    pendingSync: true,
  };
  memorySrcCache.set(src, dataUrl);
  try {
    await putRecord(record);
  } catch {
    // Even if IndexedDB fails (e.g. private browsing), in-memory cache still renders during session
  }
  notify();
  return { src, webpSize: webpBlob.size };
}

export async function exportOfflineMediaMap(): Promise<Record<string, string>> {
  const records = await readAllRecords();
  const map: Record<string, string> = {};
  for (const record of records) map[record.src] = record.dataUrl;
  for (const [src, dataUrl] of memorySrcCache.entries()) {
    if (!map[src]) map[src] = dataUrl;
  }
  return map;
}

export async function importOfflineMediaMap(map: Record<string, string> | undefined): Promise<void> {
  if (!map || typeof map !== 'object') return;
  for (const [src, dataUrl] of Object.entries(map)) {
    if (typeof src === 'string' && typeof dataUrl === 'string' && /^\/media\/[a-f0-9-]+\.webp$/.test(src)) {
      memorySrcCache.set(src, dataUrl);
      try {
        await putRecord({
          src,
          dataUrl,
          size: Math.round(dataUrl.length * 0.75),
          createdAt: Date.now(),
          pendingSync: true,
        });
      } catch {}
    }
  }
  notify();
}
