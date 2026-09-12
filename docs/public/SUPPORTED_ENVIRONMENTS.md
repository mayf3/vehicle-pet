# Supported Environments

Status: Public Preview documentation.

## DeepSeek Harness Web overlay plugin (the product surface)

| Component | Requirement |
|---|---|
| Host | the pinned Harness Web source checkout (below), run through its own `pnpm dsh` |
| Supported host route | `git clone https://github.com/mayf3/deepseek-harness` → `git checkout f77b5a2fcebc2d9138f6608a60636f2294868d42` → `pnpm install && pnpm build` |
| Pinned interop ref | `mayf3/deepseek-harness@f77b5a2fcebc2d9138f6608a60636f2294868d42` (Harness Web `0.1.0-rc.8`) |
| React | 18 (host-provided identity; the plugin never bundles React) |
| Install | from the host checkout: `pnpm dsh plugin --profile web add …` + `pnpm dsh web` (use a disposable `DSH_HOME` for previews) |

### Host version mismatch — symptom and fix

A globally installed `dsh` CLI (the npm `@deepseek-ai/dsh` binary, for
example `0.1.0-rc.6`) is **not a supported host**. The typical failure mode
is: `plugin add` reports success, then `dsh web` aborts with loader errors
such as `Cannot find the native Koffi module` or `Cannot find package
'@mayf3/vehicle-pet' imported from …/cordis-plugin-loader/...`. That means
the wrong binary is serving the profile — not a plugin defect. Fix: run all
host commands through the pinned source checkout as above (`pnpm dsh …`
from inside the `deepseek-harness` clone). Any future host upgrade requires
an explicit compatibility review of the pin.

Behavior notes: the resident overlay works in normal browsing pages, hides
during structured onboarding, coexists with a co-installed deepseek-pet
overlay in its default placement, and requires no dev server.

## Development

| Component | Requirement |
|---|---|
| Node.js | 22.19+ or 24+ (the pinned harness checkout declares the same range) |
| pnpm | per-repo `packageManager` pin: `10.28.1` here, `11.7.0` in the harness checkout |
| Chrome | current, for Playwright E2E (`pnpm test:e2e`, pinned-browser DSH e2e) |
| OS | macOS / Linux for the full suite; Windows untested |

## Explicitly not supported

- Other host binaries: a globally installed `dsh` CLI (npm `@deepseek-ai/dsh`)
  is unverified and unsupported — see the mismatch section above.
- Other hosts (browser extension, mobile, standalone app shell): the
  prototype shell (`pnpm dev`) is a development tool, not a product.
- Remote pack installation, marketplace, runtime untrusted code.
- Audio/TTS, Live2D or model-driven runtime animation, multi-pet
  simultaneous residents, telemetry.

## Performance sanity (preview baseline)

The served DSH client bundle inlines every pet/pack asset as data URLs
(tens of MB range by design — no network fetches at runtime after load).
Startup/mount, idle CPU, hidden-tab suppression, and write-loop absence are
covered by the deterministic suite and the release helper's disposable-E2E
check (`pnpm verify:release`); no performance platform is in preview scope.
