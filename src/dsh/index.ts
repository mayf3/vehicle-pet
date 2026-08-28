/**
 * Host entry (`main`/root export): the thinnest possible DSH bundle Host
 * lifecycle. Loading this entry makes the package's declared browser half
 * discoverable to the Harness client-module registry; the Host half itself is
 * intentionally inert (CTR-OVERLAY-001 — external bundle plugin, no Core
 * patch, no Host business logic).
 */

import type { Context } from '@deepseek-ai/cordis'

/** Stable Cordis plugin name matching the `cordis.patch.yml` row id. */
export const name = 'vehicle-pet'

export function apply(_ctx: Context): void {
  // Inert by design: all overlay behavior lives in the browser half.
}
