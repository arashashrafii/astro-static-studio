# Issue #15 — exact cold offline bootstrap blocker

2026-10-31. **Diagnostic completed; required cold offline startup remains unmet.**
No architecture approval, runtime adoption or product change.

## Proven result

The external WebContainer bootstrap document is unavailable after restarting
Chrome offline in the same persistent Android profile:

- Online `https://stackblitz.com/headless` returned HTTP 200, with
  `Cache-Control: max-age=0, private, must-revalidate`. CDP reported neither disk
  cache nor service-worker response. Its iframe navigated successfully.
- Cold offline the same document request failed with
  `net::ERR_INTERNET_DISCONNECTED`, confirmed independently by Playwright
  `requestfailed` and CDP `Network.loadingFailed` (type `Document`). Request:
  09:06:58.581 UTC; failures: 09:06:58.658/697 UTC. Query values are redacted.
- That frame navigated to `chrome-error://chromewebdata/` at 09:07:08.537 UTC.
  Runtime boot timed out after 90,048 ms. The bootstrap document failure occurs
  before a usable runtime; it is a specific observed blocker, not a complete
  inventory of all remaining offline dependencies.
- Offline controls failed fresh `cache: no-store` timestamped registry fetches,
  reported `navigator.onLine=false`, and an empty route table. The host loopback
  shell remained available through ADB reverse. This is not a full offline PWA test.

[Online report](evidence/issue-15-cold-bootstrap/online-report.json) and
[cold report](evidence/issue-15-cold-bootstrap/cold-report.json) retain the events.
Page-target CDP may omit worker-target network activity; missing events do not
prove no activity. Safe cache headers only were retained, URLs have query values
redacted, and no cookies, authorization headers or HAR were collected.

## Execution and limitations

The owned persistent `studio-issue8-api34` Android emulator used Chrome
156.0.8078.47, port 5556, KVM, two cores, 2,560 MiB RAM and headless mode without
wiping data. Reused SDK 1.6.4 SHA-256:
`b150edafd8970f61a23eaeab937b0831c0dc0b86ae46e2c58304f32917446076`.

One actual online runtime boot passed in 18,790 ms; mount passed in 54 ms, but
initial filesystem read timed out after 15,037 ms. This is not a passing online
Node/filesystem smoke test. Its successful bootstrap response and boot are useful
baseline observations for the document-navigation diagnosis. One actual cold
runtime boot was attempted. No Astro installation or build was performed.

Setup initially failed before runtime execution because the Chrome debugging
endpoint was unavailable. The known `am set-debug-app --persistent` sequence,
exact existing Chrome flags, force-stop/relaunch and socket forwarding fixed that
prerequisite. A separate attempted disconnect was correctly rejected because the
first control fetch still returned HTTP 200 after a two-second radio transition.
The final driver waits for a bounded verified disconnect before restarting Chrome.
Those reports are preserved as [setup](evidence/issue-15-cold-bootstrap/setup-report.json)
and [transition](evidence/issue-15-cold-bootstrap/disconnect-transition-report.json)
evidence. They are not additional cold runtime attempts.

System UI/launcher ANRs occurred during emulator startup and another System UI
modal appeared during the cold trial. Actual screenshots were inspected before
using their visible Close app actions. ANR logs are retained separately; these
failures do not explain away the explicit offline document network failure.
Original radio settings, Chrome command-line file and global debugging settings
were restored; owned server/forwarding/emulator resources were stopped.

## Smallest supported next prerequisite

Establish whether the provider supports a licensed, durable offline bootstrap
for this external document and its dependency closure. No such mechanism was
verified here. A Studio-origin service worker cannot be assumed to intercept this
third-party iframe. Do not copy/self-host the proprietary runtime or bypass its
licensing as a cache fix. If supported offline bootstrap is unavailable, a runtime
with locally persistable bootstrap inputs and a passing actual Astro build is
required before product integration. NanoVM has not passed that build prerequisite.

## Reproduction and validation

Copy preserved [driver](evidence/issue-15-cold-bootstrap/run.mjs),
[cold-only continuation](evidence/issue-15-cold-bootstrap/cold-run.mjs) and
[probe](evidence/issue-15-cold-bootstrap/app.mjs) to ignored
`.tmp/issue-15-cold-bootstrap/`. Reuse `index.html` and SDK from
`.tmp/issue-8-runtime-offline/`. Drivers resolve the existing Playwright installation
from that working location; do not run them directly from the evidence directory.
The cold-only continuation reads `online-preserved.json` from the working folder.

JavaScript syntax, evidence assertions and whitespace checks passed. No product
checks ran because product code was unchanged. Mandatory cold startup remains
unimplemented; #15 investigation and #16 architecture decision remain open.

## Provider-supported remedy review (2026-10-31)

**No publicly documented, immediately usable standalone cold-offline bootstrap
mechanism was found.** This is a documentation/support finding, not proof of
technical impossibility. No further browser trial was run because no supported
local runtime bundle or caching procedure was available to test.

The current official [API reference](https://webcontainers.io/api) documents only
`coep`, `workdirName` and `forwardPreviewErrors` for `BootOptions`; no offline,
bootstrap URL or runtime-asset persistence option is listed. `mount` snapshots and
`export` operate on the container filesystem, not the engine bootstrap. The
[API support policy](https://webcontainers.io/guides/api-support) distinguishes the
npm client from the separately hosted StackBlitz runtime; installing or bundling
the npm SDK therefore does not supply the engine.

There is an endpoint configuration nuance: the official API documents
`auth.init({ editorOrigin, clientId, scope })`, describing `editorOrigin` as the
StackBlitz origin. Inspection of the exact tested SDK 1.6.4 shows that this sets
the origin used for `/headless`. Its internal iframe URL helper also reads
`globalThis.WEBCONTAINER_API_IFRAME_URL`. No public guide found documents that
internal override as a supported offline solution. Neither option supplies the
runtime or grants redistribution rights. No fake OAuth client, endpoint override,
proxy or copied proprietary runtime was tried.

The [WebContainer commercial page](https://webcontainers.io/enterprise) explicitly
offers enterprise self-hosted/on-premises/VPC installations and requires licensing
for commercial production (prototypes/POCs are exempt). It does not publish a
standalone browser runtime bundle or promise phone/PWA cold startup. Separately,
[StackBlitz air-gap instructions](https://developer.stackblitz.com/enterprise/installation/air-gapped-installs)
require an enterprise license with air-gapping enabled, a licensed release bundle,
container registry and Kubernetes installation. This is an internal server
installation, not evidence of a self-contained phone PWA. The
[existing-cluster quickstart](https://developer.stackblitz.com/enterprise/installation/quickstart-existing-cluster)
lists 16 vCPUs, 32 GB memory and 200 GB storage as minimum cluster requirements.
Moreover, the currently served [general FAQ](https://developer.stackblitz.com/guides/user-guide/general-faqs)
still says WebContainers in Enterprise Server are not currently available. That
conflicts with the WebContainer enterprise offering's broader wording; availability
and applicability require provider confirmation rather than assuming the air-gap
bundle contains this API engine.

The [introduction](https://webcontainers.io/guides/introduction) advertises offline
operation generally, while the [StackBlitz overview](https://developer.stackblitz.com/guides/user-guide/what-is-stackblitz)
describes continuing after losing connectivity mid-session. Neither supplies a
cold browser-restart recipe. The [browser configuration guide](https://webcontainers.io/guides/browser-config)
discusses cross-domain service workers/storage permissions, not durable offline
bootstrap installation.

Next concrete WebContainer prerequisite: obtain provider confirmation and an
appropriately licensed supported package/procedure covering **API-engine bootstrap
without Internet, Chrome restart in the same PWA profile, local persistence of the
complete dependency closure, device-local versus LAN hosting, and license/update
checks offline**. No vendor contact, purchase, credential access, installation or
architecture selection was performed. Without such an artifact there is no
supported WebContainer PoC to implement from the reviewed public material; proceed
with independently verifiable alternative-runtime prerequisites instead.
