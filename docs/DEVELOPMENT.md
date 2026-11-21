# Development guide

Use Git and Node.js 22 or later with npm. Follow the [README quick start](../README.md#run-from-source) to install dependencies and start the desktop Studio. Use `npm install`, which is also what the GitHub CI workflow runs.

## Local development

`npm run dev` first builds the React dashboard, then starts Express on port 3000. Open [localhost:3000](http://localhost:3000). The server delivers the dashboard, the `/api` endpoints, local media under `/media`, and the generated preview under `/preview`. Restart the command after code changes to rebuild the dashboard and reload the server. If port 3000 is busy, run `PORT=3001 npm run dev` in a POSIX shell or `$env:PORT = '3001'; npm run dev` in PowerShell.

Installation runs `scripts/link-workspaces.mjs` to make the internal contracts and theme packages available. After editing those packages, run `node scripts/link-workspaces.mjs` before rebuilding or testing so the installed workspace copies reflect your changes.

Use a disposable project or sample content when testing edit, restore, and publishing flows. The default local workflow needs no environment overrides. See [`.env.example`](../.env.example) for available local overrides and the [publishing guide](PUBLISHING.md) for deployment setup.

## Where to make changes

| Area | Location |
| --- | --- |
| React dashboard, editor, and browser-side offline behavior | [`apps/admin`](../apps/admin) |
| Express API, storage, preview, builds, and publishing | [`apps/api`](../apps/api) |
| Astro routes and static rendering | [`apps/site`](../apps/site) |
| Content schemas and migrations | [`packages/contracts`](../packages/contracts) |
| Theme manifest, contract, and Atelier adapter | [`packages/theme`](../packages/theme) |
| Native Capacitor projects | [`android`](../android) and [`ios`](../ios) |
| Cross-platform CLI and tests | [`bin`](../bin) and [`tests`](../tests) |

## Verification

Run a focused test first when changing behavior, for example `node --import tsx --test tests/theme-contract.test.ts` for the theme contract. For a code pull request, run `npm run check` and `npm test`. Report any failure with the test name and whether it also occurs on `main`. For documentation-only changes, check links and verify any commands you added or changed.

| Command | What it does |
| --- | --- |
| `npm run check` | Runs the root TypeScript check |
| `npm run lint` | Runs strict TypeScript checks across the workspaces |
| `npm test` | Runs the Node test suites under `tests/` |
| `npm run build` | Builds the generated Astro site and the dashboard |
| `npm run cap:sync` | Rebuilds the dashboard and syncs both native projects |

The [CI workflow](../.github/workflows/ci.yml) runs installation, type checking, the build, Capacitor sync, selected Node tests, and an npm package dry run.

## Native apps

Install the JavaScript dependencies from the repository root first. Sync can update generated files in the native projects. Review the diff before committing.

**Android.** Use JDK 21 and Android SDK Platform 36. From the repository root, run:

```sh
npm run mobile:android
cd android
./gradlew assembleDebug
```

On Windows, run `.\gradlew.bat assembleDebug` from the `android` directory. Look for the debug APK under `android/app/build/outputs/apk/debug/`.

**iOS.** On macOS with Xcode installed, run `npm run mobile:ios` and then `npx cap open ios` from the repository root. Choose a simulator in Xcode for local testing. See the [release guide](RELEASE_AND_DISTRIBUTION.md) for signing and distribution.
