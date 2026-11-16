# راهنمای انتشار، نصب کراس‌پلتفرم (Node/npm) و خروجی موبایل (Android APK و iOS)

این راهنما نحوهٔ توزیع پروژه در سه مسیر **موبایل (اندروید و iOS)**، **دسکتاپ (ویندوز، مکینتاش، لینوکس از طریق npm)** و **انتشار خودکار در GitHub Releases** را توضیح می‌دهد.

---

## ۱. انتشار و نصب روی ویندوز، مکینتاش و لینوکس از طریق Node / npm

بله، دقیقاً همان‌طور که حدس زدید، برای این‌که برنامه با یک دستور روی **Windows، macOS و Linux** نصب و اجرا شود، پروژه به‌عنوان یک **پکیج استاندارد npm** (در رجیستری `npmjs.com` — همان مخزن کتابخانه‌های Node.js) تنظیم شده است:

- فیلد `"private": true` از `package.json` ریشه حذف شده است.
- دستور اجرایی کراس‌پلتفرم در `"bin"` تعریف شده است: `astro-studio` و `astro-static-studio` که مستقیماً با Node و `tsx` بالا می‌آیند (بدون وابستگی به اسکریپت‌های لینوکسی یا `npm.cmd`).
- اسکریپت `scripts/link-workspaces.mjs` به‌صورت `postinstall` پکیج‌های داخلی (`contracts` و `theme`) را روی هر سه سیستم‌عامل آماده می‌کند.
- پکیج‌های Capacitor موبایل در `devDependencies` قرار گرفته‌اند تا کاربران دسکتاپ هنگام نصب از `npm` حجم اضافی موبایل را دانلود نکنند.

### مراحل انتشار پکیج روی npm (فقط یک‌بار برای هر نسخه):
1. در سایت [npmjs.com](https://www.npmjs.com/) یک حساب کاربری بسازید و لاگین کنید:
   ```bash
   npm login
   ```
2. پیش‌نمایش فایل‌هایی که داخل بسته قرار می‌گیرند:
   ```bash
   npm pack --dry-run
   ```
3. انتشار نسخه روی npm:
   ```bash
   npm publish --access public
   ```
   *(یا توکن `NPM_TOKEN` را در بخش Secrets مخزن گیت‌هاب قرار دهید تا GitHub Actions پس از هر تگ انتشار، آن را به‌صورت خودکار در npm منتشر کند.)*

### نحوهٔ نصب و اجرا توسط کاربران روی Windows / macOS / Linux:
پس از انتشار در npm، روی هر سیستم‌عاملی که Node.js (نسخهٔ ۲۲ به بالا) نصب باشد، با یکی از دو دستور زیر برنامه اجرا می‌شود:
```bash
# اجرا بدون نصب دائمی:
npx astro-static-studio

# یا نصب سراسری روی سیستم:
npm install -g astro-static-studio
astro-studio
```

---

## ۲. خروجی خودکار Android (`astro-static-studio.apk`) و iOS (`.ipa` / `.xcarchive.zip`) در GitHub Releases

فایل `.github/workflows/release.yml` طوری تنظیم شده است که پس از اجرای کامل `npm run build` و تست‌های تأییدشده:

1. **روی لینوکس (`ubuntu-latest`)**: پکیج کامل npm (`astro-static-studio-<version>.tgz`) و فایل نصبی مستقل و ۱۰۰٪ آفلاین اندروید با نام پروژه (**`astro-static-studio.apk`**) را با JDK 21، Android SDK (`platforms;android-36`) و Capacitor می‌سازد.
2. **روی مکینتاش (`macos-latest`)**: پروژهٔ iOS را با Xcode و Capacitor (`iosScheme: "capacitor"`) کامپایل و آرشیو کرده و خروجی‌های **`astro-static-studio*.ipa`** و **`astro-static-studio.xcarchive.zip`** را تولید می‌کند.
3. **در GitHub Releases**: همهٔ فایل‌ها به همراه `SHA256SUMS.txt` در صفحهٔ **Releases** مخزن گیت‌هاب شما برای دانلود قرار می‌گیرند.

### پیش‌نیاز و نحوهٔ ساخت یک Release جدید:
ابتدا مطمئن شوید در تنظیمات مخزن گیت‌هاب خود مسیر زیر فعال است:
`Settings → Actions → General → Workflow permissions → Read and write permissions`

**روش اول (توصیه‌شده — تگ نسخه):**
```bash
git tag v1.0.0
git push origin v1.0.0
```
**روش دوم (اجرای دستی از داخل گیت‌هاب):**
در مخزن گیت‌هاب خود وارد تب **Actions** شوید، روی **Build & Release (Android APK, iOS IPA, npm Package)** کلیک کنید و دکمهٔ **Run workflow** را بزنید.

**روش سوم (خودکار با هر Push روی `main` یا `master`):**
با هر بار Push روی شاخهٔ اصلی، ورک‌فلو به‌طور خودکار اجرا می‌شود و ریلیز متناظر با نسخهٔ داخل `package.json` را می‌سازد/به‌روزرسانی می‌کند.

### کارکرد ۱۰۰٪ آفلاین روی اندروید و iOS:
- تمام دکمه‌ها و راهنماهای نصب PWA روی اندروید حذف شده‌اند و نسخهٔ اندروید به‌صورت APK مستقل ارائه می‌شود.
- قالب پیش‌فرض (`Atelier v1.0.0`)، داده‌های اولیه، تبدیل تصاویر به WebP (در IndexedDB) و پیش‌نمایش محلی به‌صورت کامل داخل برنامه قرار دارند و هیچ نیازی به اینترنت ندارند.
- اتصال به اینترنت در آینده فقط برای **دریافت قالب‌های جدید از مخزن قالب‌ها** و **انتشار نهایی سایت روی هاست** لازم خواهد بود.

### ساخت و نصب محلی APK روی شبیه‌ساز اندروید (Local Emulator):
در سیستم لوکال (دارای Node.js 22+، JDK 21 و Android SDK / Android Studio):
```bash
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/astro-static-studio-debug.apk
```

### نکات امضای نهایی (Signing) برای انتشار عمومی موبایل:
- **اندروید**: بدون تنظیم هیچ کلید مخفی، فایل `astro-static-studio.apk` (Debug APK) قابل نصب روی گوشی و شبیه‌ساز به‌طور خودکار ساخته می‌شود. برای امضای نهایی انتشار گوگل‌پلی کافی است این ۴ Secret را در تنظیمات مخزن گیت‌هاب اضافه کنید:
  `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`
- **iOS**: به‌طور پیش‌فرض آرشیو Xcode (`astro-static-studio.xcarchive.zip`) و `.ipa` بدون نیاز به حساب پولی Apple Developer ساخته می‌شود تا روی Xcode / ابزارهای Sideloading قابل استفاده باشد. برای امضای خودکار با گواهی Apple Developer می‌توان از Secretهای `IOS_CERTIFICATE_BASE64`, `IOS_CERTIFICATE_PASSWORD`, `IOS_PROVISION_PROFILE_BASE64`, `IOS_EXPORT_OPTIONS_PLIST_BASE64` استفاده کرد.
