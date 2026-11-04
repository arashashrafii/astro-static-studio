# بررسی مستقل معماری — ۲۰۲۶-۱۱-۰۱

وضعیت: **پیشنهاد برای تصمیم #16؛ تصویب یا پیاده‌سازی نشده است.**

## تصمیم پیشنهادی

برای MVP اندروید، یک PWA با ذخیرهٔ محلی پیش‌نویس‌ها و یک مسیر آنلاین **GitHub Actions → Astro واقعی → Cloudflare Pages Direct Upload** انتخاب شود. یک رابط کوچک و محدود در حساب Cloudflare خود مشتری، ورود و عملیات GitHub را انجام دهد. سایت عمومی همچنان کاملاً استاتیک است. محیط Node/WASM داخل گوشی جزو مسیر اصلی محصول نباشد. مسیر Node دسکتاپ فعلی حفظ شود.

این پیشنهاد ساده‌ترین مسیرِ قابل اتکا با توجه به پیاده‌سازی فعلی است، نه کمترین تعداد سرویس روی کاغذ. هنوز موفقیت اتصال امن، نصب مستقل PWA یا اجرای Actions در این پروژه اثبات نشده است.

**تغییرهای لازم در وعدهٔ محصول:** پذیرش بیلد و پیش‌نمایش دقیق آنلاین؛ حذف الزام بیلد کامل Astro در گوشی و cold build آفلاین از MVP؛ پذیرش یک سرویس کوچک متعلق به مشتری و حساب GitHub/Cloudflare. راه‌اندازی اولیه توسط فرد فنی انجام شود؛ استفادهٔ روزمره فقط فرم، ذخیره، پیش‌نمایش و انتشار باشد. اگر این تغییرها پذیرفته نشوند، این پیشنهاد نیاز اصلی قبلی را برآورده نمی‌کند و بیلد کامل آفلاین اندروید همچنان حل‌نشده است.

## چه چیزی واقعاً بررسی شد؟

- HEAD محلی و شاخهٔ remote `main`: `8754bb9e9b5162796a93cc634113ce9c5ec0d0bd`. remote فقط main داشت؛ جست‌وجوی PR نتیجه نداشت. تاریخچهٔ پنج کامیت آخر و کامیت پیاده‌سازی [fdb3701](https://github.com/arashashrafii/astro-static-studio/commit/fdb3701c904cd8111063946e8e4a713d912357f3) از اتصال GitHub بررسی شد. این ادعا شامل تمام تاریخچهٔ مخزن نیست.
- گفت‌وگوی **Review Astro Static Studio**، شناسهٔ `01a16cc7-1c62-7dd0-b07a-3da2642f87e2`: چهار نوبت اخیر، شامل تأیید push همان کامیت، دریافت مستندات 8754bb9 و تغییرات کامیت‌نشدهٔ فرم‌ها خوانده شد.
- گفت‌وگوی **ساخت MVP محلی sararahanjam.com**، شناسهٔ `01a162fa-5028-7621-86c4-d439333a8668`: چهار نوبت آخر، شامل گزارش push نسخهٔ اولیه در مخزن جداگانه خوانده شد؛ این push مستقل با GitHub آن مخزن راستی‌آزمایی نشد.
- چهار نوبت آخر گفت‌وگوی **امکان‌سنجی بیلد Astro در اندروید** و مأموریت این بررسی خوانده شد. تمام گفتگوهای قبلی خوانده نشده‌اند.
- AGENTS، VISION، MVP، ARCHITECTURE، CONTRACTS، CONTENT_MODEL، فایل‌های اصلی قرارداد، API، build runner، publisher، backup، renderer و PWA config بررسی شدند. وضعیت جاری #8/#9/#14/#15/#16 و یادداشت‌های آزمایش محلی بررسی شد. [تعویق iOS](https://github.com/arashashrafii/astro-static-studio/issues/14#issuecomment-6555332190) تأیید شد؛ این تعویق نتیجهٔ تست iOS نیست.

### موجود و قابل استفاده

React/Vite editor، API محدود به loopback، Content v1 معتبرشده با Zod، صفحه/پروژه با text/gallery، تبدیل JPEG/PNG با Sharp، حفظ originals، backup/restore با checksum، Astro renderer و build staging که خروجی سالم قبلی را در شکست نگه می‌دارد. QA preview در Cloudflare در گزارش M2 ثبت و دسترسی آن توسط مالک تأیید شده؛ production تأیید نشده است.

PWA shell و manifest به معنی محصول مستقل گوشی نیست: ذخیره و تبدیل تصویر و انتشار فعلاً به Node API روی `127.0.0.1:4322` وابسته‌اند؛ cache فعلی فایل‌های رابط، جای پایگاه دادهٔ آفلاین را نمی‌گیرد. دادهٔ فعلی یک JSON با سقف ۵۰۰ entry است؛ فقط page/project و text/gallery دارد. Articles، News، Photo Galleries مستقل، collectionView، انتخاب قالب، rich text، RTL/LTR صحیح و pagination هنوز قابلیت تأییدشدهٔ محصول نیستند.

تغییرهای قبلی admin، ROADMAP، scripts، experiments و evidence کامیت نشده‌اند؛ حفظ شدند. گزارش تاریخی #13 شامل ۴۰ تست و typecheck/build موفق است؛ در این بررسی مجدداً اجرا نشد و نصب تمیز dependency را هم اثبات نمی‌کند.

## شواهد بیلد روی گوشی

- **WebContainer:** طبق ISSUE_8_STUDIO_TEMPLATE و ISSUE_8_OFFLINE، قالب واقعی با ۲۴ route و ۲۳۹ رسانه در شبیه‌ساز Android ساخته و ZIP آن دانلود شد؛ ده warm build آفلاین بعد از آماده‌سازی آنلاین موفق بود، حدود ۶۹ تا ۱۰۳ ثانیه. نمونه‌برداری Chrome PSS حدود ۱۴۶۴ MiB بود؛ حداقل RAM گوشی واقعی نیست. timeout تخلیهٔ خروجی و یک ANR قبلی همچنان محدودیت‌اند. Node 22.22.3 با engine اعلام‌شدهٔ Astro 7.4.4 یعنی >=22.23.4 هم‌خوان نیست؛ این اختلاف علت اثبات‌شدهٔ cold boot نیست.
- cold restart آفلاین به درخواست خارجی `https://stackblitz.com/headless` با `ERR_INTERNET_DISCONNECTED` برخورد کرد؛ timeout نودثانیه‌ای پیامد است. بستهٔ عمومی و پشتیبانی‌شده برای bootstrap مستقل آفلاین پیدا نشده؛ ناممکن‌بودن همهٔ راه‌ها ثابت نشده است. SDK معادل سورس موتور نیست. [شرایط رسمی](https://webcontainers.io/enterprise) برای استفادهٔ تجاری تولیدی مجوز می‌خواهد؛ self-hosting سازمانی اثبات runtime مستقل تلفن نیست. [پشتیبانی مرورگر](https://webcontainers.io/guides/browser-support) و isolation/headerها نیز باید رعایت شوند.
- **NanoVM:** Node 25.4.0 پس از preload در دسکتاپ JS اجرا کرد، نه پس از cold restart مرورگر. Astro ابتدا در allocation و سپس WASM SIMD شکست خورد؛ HTML نداشت. تلاش scalar نیز جایگزین سازگار اثبات نکرد. AGPL/commercial موتور و مجوز guestها باید جدا بررسی شوند؛ ادغام برای MVP توصیه نمی‌شود.
- **container2wasm:** cold launch آفلاین در Chrome دسکتاپ به Node/Astro رسید؛ runtime تقریباً ۴۸۵ MB، CacheStorage تقریباً ۹۱۵ MB، peak جمع RSS حدود ۴٫۳۳ GiB بود که احتمال شمارش تکراری shared pages دارد. بیلد دو صفحه پس از ۹۰۰ ثانیه timeout شد، بدون HTML. این داده Android نیست.

نتیجه: ادامهٔ این مسیر یعنی نگهداری runtime، بسته‌های WASI/native، cache، حافظه، lifecycle و مجوزها؛ صرفاً افزودن service worker نیست. مصرف باتری و پایداری گوشی ARM اندازه‌گیری نشده‌اند. #8 بسته‌شدن تحقیق با نتیجهٔ جزئی/منفی است؛ #15/#16 هنوز بازند.

## سه گردش کار

### A — پیشنهاد: ویرایش محلی، بیلد آنلاین

۱. نصب اولیه با اینترنت: shell، schema و نسخهٔ قالب قابل پشتیبانی دریافت می‌شوند. IndexedDB برای محتوا و blobهای رسانه کافی است؛ OPFS فقط اگر اندازه‌گیری نیاز نشان داد. Node، node_modules و VM روی گوشی دانلود نمی‌شوند.

۲. هر ذخیره ابتدا تراکنش محلی دارد. بستن Chrome و بازکردن آفلاین باید ویرایش‌ها، تصاویر و وضعیت «هنوز همگام نشده» را بازیابی کند. خروجی آخر می‌تواند cache شود، ولی باید «نسخهٔ قبلی» نمایش داده شود؛ پیش‌نمایش تغییرات جدید نیست. برای MVP پیش‌نمایش دقیق تازه، آنلاین است؛ renderer موازی برای پیش‌نمایش آفلاین نسازیم.

۳. با درخواست کاربر، snapshot معتبر شامل content/media به یک commit اتمیک در مخزن خصوصی مشتری تبدیل شود. پیش‌نویس محلی تا تأیید ذخیرهٔ remote باقی بماند. هر snapshot دارای base SHA و شناسهٔ درخواست باشد؛ اختلاف نسخه خطای قابل بازیابی بدهد، overwrite پنهان نشود. ثبت content/media در یک tree انجام شود تا بیلد نیمه‌کاره نبیند.

۴. Actions روی commit مشخص، Node سازگار و lockfile ثابت را با `npm ci` اجرا کند؛ schema، media و مسیرها را دوباره اعتبارسنجی کند؛ Astro کامل روی runner اجرا شود. اینترنت گوشی برای ارسال داده/پیگیری لازم است؛ اینترنت runner برای checkout/dependency لازم است مگر cache کامل موجود باشد. cold build یعنی runner/cache تازه؛ warm build یعنی cache dependency، نه تضمین incremental Astro. زمان صف و زمان بیلد از هم گزارش شوند.

۵. خروجی معتبر ابتدا QA preview شود؛ نسخهٔ محتوا، commit، workflow run، checksum خروجی و deployment ID به هم متصل باشند. بسته‌شدن PWA پس از قبول درخواست، job را متوقف نکند؛ پس از بازگشت نتیجه از سرور خوانده شود. timeout گوشی به معنی شکست قطعی یا موفقیت انتشار نیست. retry نباید commit یا deploy تکراری بسازد.

۶. انتشار واقعی فقط اقدام جداگانهٔ مالک باشد. artifact بررسی‌شده دوباره به production ارسال شود؛ job قدیمی نباید نسخهٔ جدید را بازنویسی کند. خروجی قبل از upload بررسی شود. production فعلی در شکست سالم بماند. [Cloudflare rollback](https://developers.cloudflare.com/pages/configuration/rollbacks/) به deployment موفق production است؛ preview هدف rollback production نیست. rollback سایت و بازگردانی محتوای editor دو عمل جدا هستند.

### ورود امن و مالکیت حساب‌ها

پیشنهاد: Worker کوچک هم‌مبدأ با PWA، متعلق به همان مشتری. GitHub App فقط روی مخزن آن مشتری نصب شود. ورود مالک با web OAuth، state و PKCE؛ client secret/private key فقط در Worker. بررسی شناسهٔ ثابت مالک و repo در هر عملیات، cookie امن HttpOnly/SameSite، کنترل Origin/CSRF، محدودیت نرخ/حجم و allowlist مسیرهای محتوا ضروری‌اند. نصب App به‌تنهایی هویت فرد درخواست‌کننده را ثابت نمی‌کند.

[مستندات فعلی GitHub](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app) PKCE را پشتیبانی می‌کند اما تبادل web token همچنان client_secret می‌خواهد. [OAuth App device flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps) secret نمی‌خواهد، ولی این به‌تنهایی CORS و مناسب‌بودن PWA را ثابت نمی‌کند. پشتیبانی [CORS در REST](https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests) را نباید به endpoint ورود تعمیم داد. بنابراین «PWA کاملاً استاتیک + PKCE = ورود بدون واسطه» مبنای تصمیم نیست. هیچ token بلندمدت یا PAT از کاربر در مرورگر نخواهیم خواست.

Worker پس از احراز مالک، token نصب کوتاه‌عمر و محدود به repo می‌گیرد؛ [انقضای رسمی یک ساعت است](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app). مجوزها: Contents write برای snapshot؛ Actions read برای نتیجه/artifact و write فقط اگر dispatch انتشار انتخاب شود. ویرایش workflow/template/package از API محتوا ممنوع؛ مجوز App خود GitHub در حد مسیر فایل محدود نیست، پس کد واسط مرز امنیتی واقعی است. workflow فقط کد قالب مورداعتماد را اجرا کند، نه کد ارسال‌شده توسط فرم.

Cloudflare token با کمترین مجوز ممکن Pages در secret محیط workflow متعلق به مشتری باشد، نه PWA، backup یا source. مسیر دسکتاپ Wrangler موجود می‌ماند، ولی login تعاملی دسکتاپ بدون تغییر برای CI قابل استفاده نیست. پیاده‌سازی CI باید اعتبار محیطی و همان کنترل مقصد/نتیجهٔ publisher را داشته باشد. broker فقط status/download برای run متعلق به همان سایت ارائه دهد؛ [artifact خصوصی](https://docs.github.com/en/rest/actions/artifacts) نیاز به مجوز دارد و URL موقت دانلود انقضا دارد، بنابراین لینک ذخیره‌شده را دائمی فرض نکنیم. polling هنگام بازبودن برنامه کافی است؛ webhook و queue جدا برای MVP لازم نیست.

راه‌اندازی یک‌باره توسط فرد فنی: حساب‌های GitHub/Cloudflare مالک، repo خصوصی با سورس قالب و lockfile، GitHub App و callback و نصب محدود، Worker و secrets، workflow ثابت و پروژهٔ QA. این هزینهٔ واقعی است و هنوز wizard خودکار ندارد. یک مشتری نباید به حساب شخصی توسعه‌دهنده وابسته بماند. فعلاً چندکاربری و نقش‌ها لازم نیست؛ #25 همچنان درگاه تصمیم جداست.

### چرا build خود هاست را انتخاب نکردیم؟

[Cloudflare Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/) با push، build/preview/status فراهم می‌کند و برای نصب کاملاً تازه ممکن است ساده‌تر باشد: یک workflow و secret آپلود کمتر. ورود PWA، commit امن، نگهداری draft و recovery همچنان لازم‌اند؛ این گزینه آن مسائل را حذف نمی‌کند. همچنین [پروژهٔ Direct Upload فعلی قابل تبدیل به Git integration نیست](https://developers.cloudflare.com/pages/get-started/direct-upload/) و پروژهٔ جدید می‌خواهد. برای حفظ مسیر موجود و کنترل artifact، Actions + Direct Upload توصیه می‌شود؛ دو موتور آنلاین هم‌زمان نسازیم. در نصب تازه، اگر PoC نشان داد host-native با همان preview/restore نیازها واقعاً کم‌هزینه‌تر است، جایگزینی در #16 مطرح شود، نه افزودن provider دوم.

### B — بیلد کامل داخل Android PWA

یک‌بار اینترنت برای دریافت runtime، سورس قالب، dependency closure و رسانه؛ سپس باید همهٔ آن‌ها روی storage ماندگار باشند. cold application start، cold runtime start، cold build و warm build چهار پذیرش جدا هستند. تازه‌کردن runtime یا قالب ممکن است دانلود دوباره بخواهد. preview دقیق از خروجی محلی ممکن می‌شود فقط پس از بیلد موفق؛ upload همچنان اینترنت و احراز امن می‌خواهد. تغییر تب، خاموش‌شدن صفحه و توقف Android می‌تواند build/upload را قطع کند؛ background execution تضمین محصول نیست.

مزیت: حفظ استقلال و امکان بیلد آفلاین در صورت اثبات. عیب امروز: runtime مناسب و کاملِ cold-offline تأییدشده نداریم؛ dependency/native compatibility و بودجهٔ حافظه/زمان با کار اصلی CMS رقابت می‌کنند. این گزینه برای MVP فعلی رد می‌شود، نه به‌عنوان حکم ناممکن‌بودن فنی.

### C — قالب ازپیش‌کامپایل‌شده

قالب در سیستم توسعه/CI به bundle مرورگری تبدیل شود؛ گوشی فقط داده را به HTML/ZIP تبدیل کند. می‌تواند سبک‌تر و آفلاین باشد، اما **اجرای `astro build` روی source در گوشی نیست**. آزمایش قدیمی این روش فقط subset محدود بدون importهای آزاد، style/script بلوک Astro و وابستگی‌های عمومی را پشتیبانی می‌کند. برای هر integration/asset pipeline باید سازگاری بسازیم و با Astro مقایسه کنیم. این عملاً renderer محدود دیگری می‌سازد؛ با نیاز امروز به سادگی نگهداری، آن را مسیر اصلی توصیه نمی‌کنم. فقط اگر استقلال آفلاین از اجرای واقعی Astro مهم‌تر شود، با نام و پذیرش صریحِ محصول متفاوت بررسی شود.

## ذخیره، خروجی و هزینه

local draft منبع تغییرات همگام‌نشده است؛ repo منبع نسخه‌های پذیرفته‌شده و قابل build؛ deployment ID منبع وضعیت منتشرشده. وضعیت‌ها «محلی ذخیره شد / آنلاین ثبت شد / در حال ساخت / آمادهٔ پیش‌نمایش / منتشر شد» جدا باشند. مخزن خصوصی برای پیش‌نویس‌ها مناسب‌تر است؛ URL preview را بدون حفاظت، خصوصی فرض نکنیم. PoC از fixture غیرحساس استفاده کند.

export بازیابی باید شامل content، WebP، originals، نسخهٔ schema/template، source قالب و lockfile یا snapshot دقیق سورس باشد؛ HTML تنها backup قابل ویرایش نیست. node_modules را backup نکنیم. سورس کامل release باید قابل دریافت/نگهداری خارج از سرویس باشد؛ برای cold offline editor لازم نیست کل سورس روی گوشی نگهداری شود. originals فعلاً در Git نادیده گرفته می‌شوند؛ تا وقتی در export مستقل تأیید نشده‌اند «backup آنلاین کامل» ادعا نکنیم. برای سایت کوچک، فایل‌های بهینه در Git کافی است؛ رشد تاریخچهٔ تصاویر با حذف فایل برنمی‌گردد. سقف رسانه/حجم مشخص و تست شود؛ object store یا LFS را پیشاپیش اضافه نکنیم.

[storage مرورگر](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) پیش‌فرض best-effort است. `persist()` درخواست شود و نتیجه نمایش داده شود؛ نصب PWA جای backup مستقل نیست. quota، حذف دادهٔ مرورگر و خرابی import باید بدون نابودکردن نسخهٔ سالم مدیریت شوند. cache runtime/interface از content جدا باشد؛ update برنامه اول سازگاری schema و recovery را بررسی کند.

نسخهٔ Node/Astro/ابزارها و Actions به نسخه/SHA ثابت بسته شود؛ تغییر dependency فقط در release کنترل‌شده و پس از smoke/restore/RTL-LTR. scope قالب: یکی از قالب‌های تأییدشده، صفحه‌های فرم‌دار و presetها؛ Articles/News/Projects/Photo Galleries و collectionView طبق مهاجرت مستقل #18/#19. در هر صفحه ابتدا حداکثر یک collectionView صفحه‌بندی‌شده؛ static pagination با paging داشبورد یکی نیست. مهاجرت v1 با حفظ ID/URL/media و rollback جدا از انتخاب runner است.

«بیلد رایگان نامحدود» وعده ندهیم. [صفحهٔ جاری هزینهٔ Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions) برای public standard runner رایگان است، اما private allowance و artifact/cache محدود دارد و هزینه به مالک repo می‌رسد. در تاریخ بررسی GitHub Free: allowance محاسباتی ماهانه ۱۲ دلار، artifact برابر ۵۰۰ MB و cache برابر ۱۰ GB/repo؛ مستندات جاری allowance را مبلغ بیان می‌کنند، نه تضمین تعداد ثابت دقیقه. زمان واقعی job، صف، نرخ runner و retention باید در PoC ثبت شود؛ نرخ و plan حساب پیش از نصب دوباره بررسی شود. retention کوتاه artifact، build فقط با درخواست و budget محدود مناسب‌اند.

[Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits/) برای Git build رایگان ۵۰۰ build/month، یک build هم‌زمان و timeout بیست دقیقه دارد؛ این سهمیه را با Actions یکی نگیریم. asset تا ۲۵ MiB و سایت Free تا ۲۰هزار فایل محدود است. [Worker](https://developers.cloudflare.com/workers/platform/pricing/) سهمیه و هزینهٔ جدا دارد. برای هیچ‌یک هزینهٔ واقعی این مشتری اندازه‌گیری نشده است. در A مصرف گوشی عمدتاً ویرایش، تصویر و انتقال است؛ در B compilation و حافظه هم اضافه می‌شود؛ صرفه‌جویی باتری عددی اندازه‌گیری نشده است.

## PoC کوچک، به ترتیب وابستگی

۱. **#16 — تصمیم روی همین تغییر وعده‌ها.** فقط قبول/رد مسیر پیشنهادی و اجازهٔ PoC محدود ثبت شود؛ هنوز معیارهای قدیمی #9 یا وضعیت issueها تغییر نکند. #15 شواهد منفی را حفظ کند؛ تکرار VMهای سنگین لازم نیست. #14 تعویق دارد.

۲. **#16 — اتصال و build آنلاین با Content v1 در fixture جدا.** ابتدا login امن و رد کاربر/repo غیرمجاز و CSRF؛ سپس snapshot شامل یک متن و یک تصویر، commit اتمیک، `npm ci` تمیز روی Node pinشده، build واقعی و ZIP/manifest. قبولی: marker و hash رسانه در HTML/خروجی، نتیجه مرتبط با SHA دقیق، هیچ secret در bundle/log/export، conflict و double retry بدون overwrite. فقط با اجازهٔ اجرای PoC از حساب‌ها استفاده شود؛ این review هیچ حساب/secret جدیدی تنظیم نکرده است.

۳. **#9 — cold-offline editor با همان v1.** shell مستقل HTTPS و persistence محلی، یک عکس و متن؛ بستن کامل Chrome، قطع شبکه، بازکردن PWA، ویرایش/ذخیره، export/restore و quota error. قبولی: داده سالم، وضعیت آفلاین صادقانه، هیچ درخواست runtime خارجی برای بازکردن editor؛ build جدید در این قرارداد آنلاین است. ابتدا آزمون مرورگر/شبیه‌ساز؛ پذیرش گوشی واقعی طبق خواستهٔ مالک پس از آماده‌شدن PWA انجام شود. Sharp دسکتاپ مرورگری نیست؛ مسیر تصویر گوشی باید جدا با کنترل کیفیت/حد ابعاد و فشار حافظه اثبات شود، از rewrite API فعلی پرهیز شود.

۴. **#7/#9 — وصل‌کردن snapshot به QA و بازیابی.** فقط مقصد QA مجاز: قطع شبکه وسط upload، توقف PWA، شکست build و job قدیمی، retry، بازخوانی status و دریافت artifact خصوصی. قبولی: آخرین سایت سالم می‌ماند، پیام موفقیت فقط پس از تأیید provider، خروجی/commit قابل تطبیق و content بدون افت. بودجهٔ زمانی پیشنهادی برای fixture موجود: کل مسیر تا QA زیر پنج دقیقه در سه اجرای معمول، همراه با گزارش صف/انتقال/بیلد؛ این هدف آزمایش است، تضمین سرویس نیست. شکست بودجه یعنی اصلاح یا بازبینی، نه حذف اندازه‌گیری. production و rollback واقعی نیاز به اجازهٔ جدا دارند.

پس از اثبات مسیر: #5 تست کاربر غیرتکنیکی؛ #17/#10 قرارداد قالب؛ #18/#19 مهاجرت کوچک Pages/Collections با backup؛ سپس فرم‌ها و #26 پذیرش یکپارچه. این وابستگی به معنی اجرای همهٔ مراحل در همین chat نیست.

## تحویل بررسی

- RESULT: بررسی و پیشنهاد تصمیم کامل؛ معماری محصول هنوز تصویب نشده است.
- CHANGES: فقط این گزارش و نمای خلاصهٔ خارج از repo؛ هیچ کد/داده/issue تغییر نکرد.
- TESTS: بررسی read-only کد، تاریخچه، اسناد و منابع رسمی؛ هیچ test/build/emulator/VM/deploy تازه اجرا نشد.
- DECISIONS: پیشنهاد A با واسط محدود هر مشتری؛ شواهد B برای MVP کافی نیست؛ C محصول محدود متفاوت است.
- UNRESOLVED: پذیرش سه تغییر وعدهٔ بالا؛ سپس امکان‌سنجی امنِ end-to-end، بودجهٔ واقعی و پذیرش نهایی گوشی. پیاده‌سازی پیش از تصمیم مالک مجاز نیست.
- GIT: HEAD برابر 8754bb9؛ تغییرهای قبلی حفظ شدند؛ commit/push انجام نشد.
- NEXT ISSUE: #16؛ بررسی/ثبت تصمیم و در صورت تأیید، PoC محدود با v1؛ بدون مهاجرت schema یا نشر production.
