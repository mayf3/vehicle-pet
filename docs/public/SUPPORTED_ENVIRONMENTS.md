# Supported Environments

Status: Public Preview documentation.

## DeepSeek Harness Web overlay plugin (the product surface)

| Component | Requirement |
|---|---|
| Host | DeepSeek Harness Web `0.1.0-rc.8` |
| Pinned interop ref | `mayf3/deepseek-harness@f77b5a2fcebc2d9138f6608a60636f2294868d42` |
| React | 18 (host-provided identity; the plugin never bundles React) |
| Install | `dsh plugin --profile web add …` + profile restart |

Behavior notes: the resident overlay works in normal browsing pages, hides
during structured onboarding, coexists with a co-installed deepseek-pet
overlay in its default placement, and requires no dev server.

## Development

| Component | Requirement |
|---|---|
| Node.js | 22+ |
| pnpm | 10.28.1 (`packageManager`-pinned) |
| Chrome | current, for Playwright E2E (`pnpm test:e2e`, pinned-browser DSH e2e) |
| OS | macOS / Linux for the full suite; Windows untested |

## Explicitly not supported

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
