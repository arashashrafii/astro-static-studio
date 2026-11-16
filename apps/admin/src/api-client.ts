export function isBundledMobileRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (cap?.isNativePlatform?.() && window.location.hostname === 'localhost' && !window.location.port) {
    return true;
  }
  return window.location.protocol === 'capacitor:' || window.location.protocol === 'file:';
}

export async function requestApiJson<T = Record<string, unknown>>(
  url: string,
  options: RequestInit = {},
  fallbackError = 'خطای ارتباط',
): Promise<T> {
  if (isBundledMobileRuntime()) {
    throw new Error('حالت آفلاین اپلیکیشن موبایل فعال است.');
  }

  const response = await fetch(url, options);
  const text = await response.text();
  let parsed: unknown = null;
  let isJson = false;

  if (text.trim()) {
    try {
      parsed = JSON.parse(text);
      isJson = true;
    } catch {
      isJson = false;
    }
  } else {
    const contentType = response.headers.get('content-type') ?? '';
    isJson = contentType.includes('application/json');
    parsed = {};
  }

  if (!response.ok) {
    const message =
      isJson && parsed && typeof parsed === 'object' && 'error' in parsed && typeof (parsed as { error?: unknown }).error === 'string'
        ? (parsed as { error: string }).error
        : fallbackError;
    throw new Error(message);
  }

  if (!isJson || parsed === null || typeof parsed !== 'object') {
    throw new Error('پاسخ معتبر JSON از سرور دریافت نشد.');
  }

  return parsed as T;
}

export async function requestApiBlob(url: string, options: RequestInit = {}, expectedMimePrefix = 'application/json'): Promise<Blob> {
  if (isBundledMobileRuntime()) {
    throw new Error('حالت آفلاین اپلیکیشن موبایل فعال است.');
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error('server');
  }
  const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
  if (expectedMimePrefix && !contentType.includes(expectedMimePrefix)) {
    throw new Error('server');
  }
  return response.blob();
}
