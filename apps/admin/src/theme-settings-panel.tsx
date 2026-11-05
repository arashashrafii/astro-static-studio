import { useEffect, useState } from 'react';

type InstalledTheme = { id: string; name: string; version: string };
type ThemeInfo = {
  selectedTheme: InstalledTheme;
  installedThemes: InstalledTheme[];
  warnings: { severity: 'warning' | 'error'; message: string }[];
  configAvailable: boolean;
};

function presentDiagnostic(message: string) {
  if (message.startsWith('License metadata for theme atelier is unknown')) {
    return 'اطلاعات مجوز توزیع Atelier در مخزن تأیید نشده است؛ حق بازتوزیع آن را مفروض نمی‌گیریم.';
  }
  if (message.includes('not valid JSON')) {
    return 'فایل تنظیمات قالب قابل‌خواندن نیست. «اعمال و ساخت قالب» را بزنید تا تنظیم پیش‌فرض Atelier جایگزین شود؛ محتوای سایت تغییر نمی‌کند.';
  }
  return message;
}

async function requestTheme(path: string, options: RequestInit = {}) {
  const response = await fetch(`/api/theme${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? 'تنظیم قالب دریافت نشد.');
  return body;
}

export function ThemeSettingsPanel() {
  const [info, setInfo] = useState<ThemeInfo>();
  const [choice, setChoice] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    requestTheme('')
      .then((result: ThemeInfo) => {
        if (!active) return;
        setInfo(result);
        setChoice(result.selectedTheme.id);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'تنظیم قالب دریافت نشد.');
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
      setMessage(`قالب ${result.selectedTheme.name} ساخته و فعال شد. پیش‌نمایش قبلی تا پایان ساخت در دسترس بود.`);
    } catch (reason) {
      setError(`${reason instanceof Error ? reason.message : 'ساخت قالب انجام نشد.'} قالب فعال و خروجی قبلی حفظ شدند؛ می‌توانید دوباره تلاش کنید.`);
    } finally {
      setApplying(false);
    }
  }

  return <section className="panel theme-settings-panel" aria-labelledby="theme-settings-title" aria-busy={applying}>
    <h2 id="theme-settings-title">قالب سایت</h2>
    <p className="hint">قالب فقط ظاهر سایت را تعیین می‌کند. صفحه‌ها، مجموعه‌ها و تصاویر شما جداگانه نگهداری می‌شوند.</p>
    {loading && <p role="status" className="hint">در حال بررسی قالب‌های نصب‌شده…</p>}
    {error && <p role="alert" className="theme-message theme-error">{error}</p>}
    {info && <>
      <fieldset className="theme-choice-list" disabled={applying}>
        <legend>قالب‌های نصب‌شده و بررسی‌شده</legend>
        {info.installedThemes.map(theme => <label className="theme-choice" key={theme.id}>
          <input type="radio" name="installed-theme" value={theme.id} checked={choice === theme.id} onChange={() => setChoice(theme.id)} />
          <span className="theme-choice-copy"><strong>{theme.name}</strong><small>نسخهٔ {theme.version} · قالب پیش‌فرض</small></span>
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
    </>}
    {message && <p role="status" className="theme-message theme-success">{message}</p>}
  </section>;
}
