# Issue #19 — isolated migration and browser checks

Date: 2026-11-04 (Asia/Tehran). Result: **Partially verified**; issue #19 remains open.

## Earlier isolated browser evidence

The current uncommitted workspace was copied to `/tmp/astro-issue19-check` at repository HEAD
`8754bb9`. It used `tests/fixtures/content-v1.json` and generated media matching fixture IDs.
The local API and dashboard ran on loopback ports 4322 and 5173. Original project content and
media were not used or modified. Environment: Linux x86_64, Node 24.13.0, Chrome
156.0.8078.73. These checks apply to the working-tree code, not committed HEAD, and are not
owner acceptance.

- **Migration:** V1 fixture showed the migration gate. Upgrade made the copied content V2,
  preserved page/project IDs and slugs, and created a V1 backup including referenced WebP.
- **Page and collection CRUD:** created/saved a page; created/saved a content collection and
  item; edited the item title, saved, reloaded and verified persistence.
- **V1 draft migration:** an unsaved V1 title change was detected and shown in the V2 dashboard;
  saved V2 retained the original title. Separate V1 backups preserved saved and draft versions
  with fixture media.
- **Page deletion:** deleted the fixture page, saved, reloaded and verified zero pages.
- **V1 restore:** restored the generated V1 backup through the V2 dashboard; original page and
  project IDs returned, then the V2 dashboard migrated the restored file again and created a
  recovery backup. This is a restore round trip, not rollback to a V1-compatible runtime.
- **Static output:** created a visible content item with generated PNG cover, image title and
  rich-text description. Local site build contained title, description, WebP reference and file
  on the project detail route. Fixture alt text was empty.
- **Deletion:** deleted the disposable item, saved, reloaded and verified it absent. At 390×844
  desktop emulation, created and deleted an empty collection and verified persistence. This did
  not test a collection with items or linked page views.
- **Keyboard:** partial. At 390×844, Tab focused mobile menu, Enter opened it, and Tab moved
  from collection name to generated slug. Full keyboard-only CRUD/focus order and a physical
  touch-device session were not tested.
- **Invalid API inputs:** unknown content version and payload over 5 MiB each returned HTTP 400;
  isolated content file hash did not change.
- **Earlier checks:** `npm run check`, `npm test` (73 tests), `npm run build`, and isolated V1
  `npm run test:smoke` passed. Smoke used the V1 `entries` shape, so it is not a V2 CRUD smoke
  test. Vite reported a missing Tailwind configuration warning. No lint script is defined.

## Rollback guidance

The V2 dashboard Restore control migrates a restored V1 bundle back to V2; it is not a route to
resume with a V1-compatible build. The recovery bundle contains V1 `content` plus referenced
media. To return files to V1, stop Studio, preserve V2 files separately, restore the bundle's
`content` and media files at their original paths, then use a V1-compatible build. This
file-level procedure is documented in [CONTRACTS](CONTRACTS.md#content-v2-migration-rollback),
but has not been exercised as a browser workflow.

## Final automated checks — 2026-11-04

Against the current uncommitted checkout at HEAD `8754bb9`:

- `npm run check` — passed.
- `npm test` — passed, 73 tests, 0 failures.
- `npm run build` — passed (Astro static site and Vite admin PWA); Vite printed
  `Missing Tailwind CSS configuration file.`
- `npm run test:smoke` — attempted but failed before checks because API was not listening on
  `127.0.0.1:4322` (`ECONNREFUSED`). It mutates checkout content and media, so was not restarted
  against this user-data checkout. Earlier isolated V1 smoke run above is the only passing smoke
  evidence from this work.
- No lint script is defined.

## Isolated follow-up attempt — 2026-11-04

Prepared `/tmp/astro-issue19-followup` from the local implementation with only
`tests/fixtures/content-v1.json` installed as content. The API bound to `127.0.0.1:4322`; Vite
selected `127.0.0.1:5174` because 5173 was occupied. The isolated API/admin processes were
stopped and the temporary copy removed after the container ran out of free space.

- **Keyboard-only CRUD and focus order: passed in the isolated browser for the exercised flow.**
  After freeing space, opened the isolated dashboard at `127.0.0.1:5174` (the active 5173 tab
  remained untouched). Tab+Enter migrated the fixture, opened page/collection forms, edited and
  saved a page title, created a collection and item, and reached Save through keyboard focus.
  The item rich-text editor initially trapped Tab by inserting indentation. A focused fix was
  added in `apps/admin/src/rich-text-editor.tsx`; afterward Tab advanced from the editor to the
  next Date field, and page-editor Tab traversal advanced from the editor through Add block
  controls to Save. Full keyboard acceptance beyond this fixture and flow is not claimed.
- **Collection deletion with dependents and a linked page view: passed in the isolated browser.**
  Created `Keyboard Collection` with one published item, added a `collectionView` to
  `Keyboard Acceptance Page` targeting that collection, saved, then used the collection's
  delete action. The confirmation explicitly said the collection and one item would be deleted.
  After confirming, the app returned to the linked page editor with that view removed; saved and
  reloaded. Dashboard then showed one collection and one remaining item (the fixture project),
  and re-opening the test page showed no collection-view block.
- **Initial browser attempt:** before freeing disk space, Chrome could not open a new tab because
  its profile reported no space. That attempt was not counted as evidence; the isolated run above
  succeeded after cleanup.
- **Physical device:** unavailable. Only desktop browser emulation evidence above exists.
- **Focused migration/restore tests:** after removing the oversized temporary copy, reran
  `node --import tsx --test tests/content-migration.test.ts tests/backup.test.ts` in the active
  checkout; all 20 passed. Coverage includes missing draft media and unknown stored versions
  without changing saved content, plus invalid backup versions, truncated WebP, checksum
  mismatch, collisions, and rollback of newly added media. After the editor fix, `npm run check`
  and `npm run build -w apps/admin` also passed; Vite printed the existing missing Tailwind
  configuration warning.
- **Smoke:** not run in the follow-up. It expects API/admin on 4322/5173, while the active 5173
  tab could have addressed the live checkout.

## Bounded final keyboard pass — 2026-11-04

Used a fresh V1 fixture copy at `127.0.0.1:5174`; the active checkout and its `127.0.0.1:5173`
tab were left untouched. All form and action navigation below used Tab/Shift+Tab, Enter, Space,
and typed keys. JavaScript confirmation dialogs were accepted through the browser dialog control;
the destructive action itself was reached and invoked by keyboard.

- **Page:** created a page, edited its title, reached Save by Tab, saved, then reached Delete page
  by Tab, confirmed, and reloaded. The test page was absent; the fixture About page remained.
- **Collection:** created a collection, edited its name, reached Save by keyboard, then reached
  Delete collection by Tab and confirmed the dialog. After reload only the fixture Projects
  collection remained. The final collection deletion in this pass had zero items.
- **Item:** created an item, edited its title, reached Save by Tab, saved, then reached Delete
  item by Tab and confirmed. After reload, the test item was absent and the fixture project
  remained.
- **Focus:** page title/slug, collection name/slug/options, item title/publish/date, rich-text
  toolbar/editor, Save and Delete controls were reachable in the exercised forms. The rich-text
  Tab fix was verified: forward Tab left the editor for the next field. Deletion confirmations
  are native JavaScript dialogs and were accepted with the browser dialog controller.
- **Mobile viewport:** earlier isolated emulation at 390×844 is recorded above. This final pass
  stayed at the browser's default viewport because the connected browser control does not expose
  a viewport override. No physical device was available; physical-device testing is not listed
  in issue #19's acceptance criteria.
- **V2 smoke:** not run. The existing `tests/smoke.mjs` is V1-only (`entries`) and hard-codes
  `localhost:5173` for media fetches. Running it here could send requests to the active checkout;
  no smoke infrastructure was changed. The earlier isolated V1 smoke evidence remains above.

No physical touch device was available. Smoke was not run in the follow-up. No production
publication or customer-content migration occurred.

## Remaining acceptance and disposition

Issue #19 remains **Partially Verified** pending a reviewable commit or PR. The bounded keyboard
CRUD flows and dependent collection deletion are now evidenced; keyboard traversal beyond these
flows remains untested. No production publication or customer-content migration occurred.
Content V2 is the owner-selected target; V1 remains legacy input and recovery format. Changes
are uncommitted and unpushed as directed, so do not claim Verified Solution or close the issue.
