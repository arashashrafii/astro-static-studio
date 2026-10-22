# Astro Static Studio

A simple content-management and publishing tool for Astro-based static websites.

**Status:** Planning. This repository contains product and architecture documents, not a finished application.

## Vision

Help non-technical people update personal websites, artist portfolios, and small project galleries without learning Astro, Git, or deployment.

The customer edits content and selects **Publish**. The system builds static pages and publishes them to the chosen static host.

## Roles

- **Content Editor:** Add and edit text, projects, articles, images, galleries, and page content within approved layouts.
- **Admin:** Configure website settings, select supported layouts/themes, configure publishing, and manage access.

The first release does **not** include a drag-and-drop visual page builder.

## Proposed stack

- **Astro:** Generate public static HTML, CSS, and optional JavaScript.
- **React + TypeScript PWA:** Simple content management dashboard.
- **JSON/Markdown and image files:** Portable content storage; independent of theme.
- **WebP image processing:** Optimize images before publishing, with quality checks.
- **Publisher adapter:** Build and deploy through a supported workflow (first target: GitHub, other static hosts later).

Static hosting is only for the public site; editing, credentials, and builds happen elsewhere.

## Project documents

- [Product vision](docs/VISION.md)
- [MVP scope](docs/MVP.md)
- [Architecture and design decisions](docs/ARCHITECTURE.md)
- [Content and theme contracts](docs/CONTRACTS.md)
- [Roadmap](docs/ROADMAP.md)
- [Instructions for coding agents](AGENTS.md)

## Example site

[sararahanjam.com](https://sararahanjam.com) is the reference portfolio and first migration test, **not** the full product. The tool should support separate installations per customer.

## Key principles

1. Keep the editor simple for non-technical users.
2. Separate content, themes, CMS, builds, and hosting.
3. Start with one example site and one theme.
4. Keep public output static; avoid unnecessary services.
5. Make all advanced options optional and admin-only.
6. Do not assume any external Astro theme works without adaptation.

> No implementation is approved by these planning documents. Confirm the MVP decisions before coding.
