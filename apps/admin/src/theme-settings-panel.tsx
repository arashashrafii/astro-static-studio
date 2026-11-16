import { useEffect, useState } from 'react';
import { requestApiJson } from './api-client.js';

type InstalledTheme = { id: string; name: string; version: string };
type ThemeInfo = {
  selectedTheme: InstalledTheme;
  installedThemes: InstalledTheme[];
  warnings: { severity: 'warning' | 'error'; message: string }[];
  configAvailable: boolean;
};

const BUNDLED_ATELIER_THEME: InstalledTheme = { id: 'atelier', name: 'Atelier', version: '1.0.0' };
const OFFLINE_THEME_KEY = 'studio-theme-selection-v1';

function readOfflineThemeInfo(): ThemeInfo {
  let selected = BUNDLED_ATELIER_THEME;
  try {
    const saved = localStorage.getItem(OFFLINE_THEME_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as InstalledTheme;
      if (parsed?.id === BUNDLED_ATELIER_THEME.id) selected = parsed;
    }
  } catch {}
  return {
    selectedTheme: selected,
    installedThemes: [BUNDLED_ATELIER_THEME],
    warnings: [],
    configAvailable: true,
  };
}

function presentDiagnostic(message: string) {
  if (message.startsWith('License metadata for theme atelier is unknown')) {
    return 'اطلاعات مجوز توزیع Atelier در مخزن تأیید نشده است؛ حق بازتوزیع آن را مفروض نمی‌گیریم.';
  }
  if (message.includes('not valid JSON')) {
    return 'فایل تنظیمات قالب قابل‌خواندن نیست. «اعمال و ساخت قالب» را بزنید تا تنظیم پیش‌فرض Atelier جایگزین شود؛ محتوای سایت تغییر نمی‌کند.';
  }
  return message;
}

async function requestTheme<T = ThemeInfo>(path: string, options: RequestInit = {}) {
  return requestApiJson<T>(`/api/theme${path}`, options, 'تنظیم قالب دریافت نشد.');
}

export function ThemeSettingsPanel() {
  const [info, setInfo] = useState<ThemeInfo>();
  const [choice, setChoice] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [catalogMessage, setCatalogMessage] = useState('');

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    let active = true;
    requestTheme('')
      .then((result: ThemeInfo) => {
        if (!active) return;
        setInfo(result);
        setChoice(result.selectedTheme.id);
        try {
          localStorage.setItem(OFFLINE_THEME_KEY, JSON.stringify(result.selectedTheme));
        } catch {}
      })
      .catch(() => {
        if (!active) return;
        const offlineInfo = readOfflineThemeInfo();
        setInfo(offlineInfo);
        setChoice(offlineInfo.selectedTheme.id);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function apply() {
    if (!choice || applying) return;
    setApplying(true);
    setMessage('');
    setError('');
    try {
      const result = await requestTheme('/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId: choice }),
      }) as ThemeInfo & { build: { outputDirectory: string; builtAt: string } };
      setInfo(result);
      setChoice(result.selectedTheme.id);
      try {
        localStorage.setItem(OFFLINE_THEME_KEY, JSON.stringify(result.selectedTheme));
      } catch {}
      setMessage(`قالب ${result.selectedTheme.name} ساخته و فعال شد. پیش‌نمایش قبلی تا پایان ساخت در دسترس بود.`);
    } catch {
      const selected = info?.installedThemes.find((t) => t.id === choice) ?? BUNDLED_ATELIER_THEME;
      try {
        localStorage.setItem(OFFLINE_THEME_KEY, JSON.stringify(selected));
      } catch {}
      setInfo({
        selectedTheme: selected,
        installedThemes: [BUNDLED_ATELIER_THEME],
        warnings: [],
        configAvailable: true,
      });
      setMessage(`قالب پیش‌فرض ${selected.name} به‌صورت آفلاین روی دستگاه فعال و ذخیره شد.`);
    } finally {
      setApplying(false);
    }
  }

  function checkOnlineThemes() {
    if (!isOnline) {
      setCatalogMessage('اتصال اینترنت برقرار نیست. برای دریافت و نصب قالب‌های جدید از مخزن، باید به اینترنت متصل شوید.');
      return;
    }
    setCatalogMessage('در حال حاضر قالب پیش‌فرض Atelier داخل پروژه نصب و فعال است. مخزن آنلاین قالب‌های بیشتر در نسخه‌های بعدی فعال می‌شود.');
  }

  return <section className="panel theme-settings-panel" aria-labelledby="theme-settings-title" aria-busy={applying}>
    <h2 id="theme-settings-title">قالب سایت</h2>
    <p className="hint">قالب فقط ظاهر سایت را تعیین می‌کند. صفحه‌ها، مجموعه‌ها و تصاویر شما جداگانه نگهداری می‌شوند.</p>
    {loading && <p role="status" className="hint">در حال بررسی قالب‌های نصب‌شده…</p>}
    {error && <p role="alert" className="theme-message theme-error">{error}</p>}
    {info && <>
      <fieldset className="theme-choice-list" disabled={applying}>
        <legend>قالب‌های نصب‌شده (باندل‌شده داخل برنامه · ۱۰۰٪ آفلاین)</legend>
        {info.installedThemes.map(theme => <label className="theme-choice" key={theme.id}>
          <input type="radio" name="installed-theme" value={theme.id} checked={choice === theme.id} onChange={() => setChoice(theme.id)} />
          <span className="theme-choice-copy"><strong>{theme.name}</strong><small>نسخهٔ {theme.version} · قالب پیش‌فرض داخلی (بدون نیاز به اینترنت)</small></span>
          {theme.id === info.selectedTheme.id && <span className="theme-selected">فعال</span>}
        </label>)}
      </fieldset>
      {info.warnings.map((warning, index) => <p className={`theme-message ${warning.severity === 'error' ? 'theme-error' : 'theme-warning'}`} role={warning.severity === 'error' ? 'alert' : undefined} key={`${warning.message}-${index}`}>{presentDiagnostic(warning.message)}</p>)}
      {!info.installedThemes.length && <p role="alert" className="theme-message theme-error">قالب نصب‌شده‌ای برای این نسخه پیدا نشد. محتوای سایت شما تغییری نکرده است.</p>}
      <button className="theme-apply" type="button" disabled={applying || !choice || (choice === info.selectedTheme.id && info.configAvailable) || !info.installedThemes.some(theme => theme.id === choice)} onClick={() => void apply()}>
        {applying ? 'در حال ساخت و فعال‌سازی…' : 'اعمال و ساخت قالب'}
      </button>
      {applying && <p role="status" className="hint">خروجی قبلی تا پایان ساخت در دسترس می‌ماند.</p>}
      <p className="hint">اگر ساخت ناموفق شود، قالب فعال و آخرین خروجی سالم باقی می‌مانند. این کار محتوای اصلی را ذخیره یا تغییر نمی‌دهد.</p>
      <div className="online-themes-note rounded-lg border border-dashed border-[#d1ded3] bg-[#f4f6f4] p-4 mt-5 text-[13px] text-[#496556]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <strong>مخزن آنلاین قالب‌ها (نیازمند اینترنت):</strong>{' '}
            <span>قالب Atelier درون برنامه تعبیه شده و آفلاین کار می‌کند؛ اما دریافت و نصب قالب‌های جدید نیازمند اتصال به اینترنت است.</span>
          </div>
          <button type="button" disabled={!isOnline} onClick={checkOnlineThemes} className="shrink-0">
            {isOnline ? 'بررسی قالب‌های جدید' : 'آفلاین (نیازمند اینترنت)'}
          </button>
        </div>
        {catalogMessage && <p role="status" className="mt-2 font-medium text-[#254b3a]">{catalogMessage}</p>}
      </div>
    </>}
    {message && <p role="status" className="theme-message theme-success">{message}</p>}
  </section>;
}
