/**
 * ExpressionLayer: the static per-variant expression overlay rendered inside
 * the subject box (DSH_PET_OVERLAY_ADAPTER_V3 CTR-OVERLAY-014). The layer is
 * aria-hidden, non-interactive, and positioned by the per-level face anchor
 * table; reduced motion never hides it (CTR-OVERLAY-015 static carrier).
 */

import { type ReactElement } from 'react'
import {
  expressionAnchor,
  expressionAsset,
  type VehiclePetExpressionVariant,
} from './expressions'

export interface ExpressionLayerProps {
  readonly variant: VehiclePetExpressionVariant
  readonly derivedLevelId: string | undefined
  /** The presenting pet's own per-level face anchor table (V8 CTR-038). */
  readonly anchors: Readonly<Record<string, readonly [number, number, number]>>
}

export function ExpressionLayer(props: ExpressionLayerProps): ReactElement | null {
  const anchor = expressionAnchor(props.anchors, props.derivedLevelId)
  const asset = expressionAsset(props.variant)
  if (anchor === null || asset === null) return null
  const [left, top, size] = anchor
  return (
    <picture
      className="vpo-expr"
      data-vehicle-pet-expression={props.variant}
      data-expr-state={props.variant}
      aria-hidden="true"
      style={{ left: `${left}%`, top: `${top}%`, width: `${size}%`, height: `${size}%` }}
    >
      <source type="image/webp" srcSet={asset.webp} />
      <img className="vpo-exprImg" src={asset.png} alt="" draggable={false} />
    </picture>
  )
}
