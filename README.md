# Astro Static Studio

Astro Static Studio is an offline-first CMS for editing content, managing media, and generating static Astro sites. It includes a Persian RTL dashboard, the bundled Atelier theme, and a native Android app. The desktop dashboard runs in a browser with a local Node.js server. Publishing the generated site to Cloudflare Pages requires network access.

## Try the Studio

- **Desktop** (Windows, macOS, or Linux with Node.js 22 or later). Download the `.tgz` from [GitHub Releases](https://github.com/arashashrafii/astro-static-studio/releases), install it with `npm install -g ./astro-static-studio-1.0.0.tgz` (use the downloaded filename), run `astro-studio`, and open [localhost:3000](http://localhost:3000).
- **Android.** Download the APK from [GitHub Releases](https://github.com/arashashrafii/astro-static-studio/releases).
- **iOS.** The repository includes an Xcode project. See the [development guide](docs/DEVELOPMENT.md#native-apps) for setup and the [release guide](docs/RELEASE_AND_DISTRIBUTION.md) for signing and packaging.

## Run from source

Install Git and Node.js 22 or later with npm. If you plan to contribute, [fork the repository](https://github.com/arashashrafii/astro-static-studio/fork) and use your fork's clone URL.

```sh
git clone https://github.com/arashashrafii/astro-static-studio.git
cd astro-static-studio
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000). Local editing and preview require no account or publishing credentials. See the [development guide](docs/DEVELOPMENT.md) for build commands, test selection, and native setup.

## Project documentation

- [Contributing](CONTRIBUTING.md) explains the fork, review, and merge workflow.
- [Architecture](docs/ARCHITECTURE.md) describes how the dashboard, server, and site builder fit together.
- [Content contracts](docs/CONTRACTS.md) and the [theme contract](docs/THEME_CONTRACT_V1.md) cover content and theme changes.
- [Publishing](docs/PUBLISHING.md) covers deployment of the generated site.
- [Release and distribution (Persian)](docs/RELEASE_AND_DISTRIBUTION.md) covers GitHub Actions, release artifacts, and native signing.
- [Roadmap](docs/ROADMAP.md) records project plans. Use [GitHub Issues](https://github.com/arashashrafii/astro-static-studio/issues) to discuss current work.

## License

Astro Static Studio and the bundled Atelier theme are available under the [MIT License](LICENSE). Third-party components retain their own licenses.
