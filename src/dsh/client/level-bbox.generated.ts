/**
 * GENERATED FILE — do not edit. Run `pnpm assets:dsh-generate`.
 * Per-level visible sprite bounding box, measured from the subject sprite
 * PNG alpha channel (V3 CTR-OVERLAY-003 hitbox honesty). Percentages of
 * the square sprite canvas. A level missing from this map renders the
 * fallback full-canvas hitbox.
 */

export interface LevelVisibleBbox {
  readonly leftPct: number
  readonly topPct: number
  readonly widthPct: number
  readonly heightPct: number
}

export const levelVisibleBbox: Readonly<Record<string, LevelVisibleBbox>> = {
  "autonomous-fleet/l1": {"leftPct":6.46,"topPct":25.83,"widthPct":87.08,"heightPct":48.13},
  "autonomous-fleet/l2": {"leftPct":6.46,"topPct":20.63,"widthPct":87.08,"heightPct":58.75},
  "autonomous-fleet/l3": {"leftPct":6.46,"topPct":25.42,"widthPct":87.08,"heightPct":49.17},
  "autonomous-fleet/l4": {"leftPct":6.46,"topPct":18.75,"widthPct":87.08,"heightPct":62.5},
  "autonomous-fleet/l5": {"leftPct":6.46,"topPct":11.67,"widthPct":87.08,"heightPct":76.67},
  "autonomous-fleet/l6": {"leftPct":7.5,"topPct":6.67,"widthPct":78.96,"heightPct":87.92},
  "autonomous-fleet/l7": {"leftPct":7.71,"topPct":6.67,"widthPct":81.04,"heightPct":87.92},
  "autonomous-fleet/l8": {"leftPct":7.71,"topPct":6.67,"widthPct":78.13,"heightPct":87.92},
  "autonomous-fleet/l9": {"leftPct":7.71,"topPct":6.67,"widthPct":76.04,"heightPct":87.92},
  "autonomous-fleet/l10": {"leftPct":7.71,"topPct":6.67,"widthPct":77.08,"heightPct":87.92},
  "autonomous-fleet/l11": {"leftPct":7.71,"topPct":6.67,"widthPct":76.67,"heightPct":87.92},
  "autonomous-fleet/l12": {"leftPct":7.71,"topPct":6.67,"widthPct":77.5,"heightPct":87.92},
  "seedling-fixture/seed": {"leftPct":25,"topPct":29.06,"widthPct":50,"heightPct":51.88},
  "seedling-fixture/sprout": {"leftPct":23.75,"topPct":30.31,"widthPct":52.5,"heightPct":64.69},
  "seedling-fixture/tree": {"leftPct":22.5,"topPct":14.06,"widthPct":55,"heightPct":82.81},
}
