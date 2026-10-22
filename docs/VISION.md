# Product Vision

## Mission
Make static websites easy to manage for people who are not developers. An artist, photographer, writer, or small-business owner should be able to update a personal website from a phone, without using Astro, Git, a terminal, or a hosting dashboard.

## Product definition
Astro Static Studio is a **simple content-management and publishing tool**, not a replacement for Astro and not a new general-purpose website framework. Astro generates the public static website. This product manages structured content and sends approved changes through a build-and-publish process.

The first real example is **sararahanjam.com**. It is a reference portfolio, not the product itself.

## Main audiences
- **Content Editor (non-technical):** Manages articles, project descriptions, photos, galleries, and contact details. Cannot accidentally change the layout or hosting configuration.
- **Admin (technical):** Sets up a site, chooses an approved theme/layout, manages access and publishing settings, and can create pages using predefined page types.

For now, each customer has a separate installation and content repository. A central multi-tenant SaaS platform is not a requirement.

## Core user journey
1. Open the CMS on a smartphone or computer.
2. Sign in securely.
3. Select Projects, Articles, Pages, or Contact.
4. Edit plain-language forms and upload photos, including from a phone.
5. Review a preview, save a draft, and select Publish.
6. The system validates the content, builds static HTML, and publishes it. The editor sees success or a useful error, not build logs.

## Platform experience
**Mobile-first, cross-platform PWA** is the product direction. The same responsive dashboard should work in modern browsers on Android, iOS, and Windows; supported browsers also allow users to add it to a home screen or install it. Installation details and feature support differ by browser and OS. Android, iOS, and Windows native apps are **not** required for the first release.

Mobile design rules: touch-friendly controls, short forms, clear labels, minimal navigation, image upload from the photo library or camera, progress indicators, and recoverable editing. Test on real small screens, not only desktop simulation.

## Product principles
1. Simple by default; technical settings stay in Admin.
2. Separate content from presentation, so data remains portable.
3. Start with one working Astro template and allow more *adapted* templates later.
4. Public site output is static HTML/CSS and optional client-side JavaScript.
5. Publishing should be a one-click user action, not a manual Git task.
6. Avoid unnecessary subscriptions, servers, and custom frameworks.

## Not in the first release
Visual drag-and-drop design editor, arbitrary third-party template imports, native Android/iOS/Windows packages, multi-tenant hosting platform, complex workflows, real-time multi-user collaboration, e-commerce, and guaranteed offline editing.

## Success signals
A non-technical tester can update a gallery from a smartphone, edit Contact, preview, and publish without developer help. A second tester can complete the same core tasks on Windows. Content survives a theme change in a controlled test. Publishing reports success or failure accurately.

## Open questions (validate during prototype)
Exact authentication provider, draft storage, supported image limits/quality, first deployment target, and how preview and rollback will work. Do not treat these as settled choices.
