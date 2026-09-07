/**
 * ExpressionLayer: the static per-state expression overlay rendered inside
 * the subject box (DSH_PET_OVERLAY_ADAPTER_V2 CTR-OVERLAY-014). The layer is
 * aria-hidden, non-interactive, and positioned by the per-level face anchor
 * table; reduced motion never hides it (CTR-OVERLAY-015 static carrier).
 */

import { type ReactElement } from 'react'
import {
  expressionAnchor,
  expressionAsset,
  expressionStateFromSession,
} from './expressions'
import type { VehiclePetSessionView } from './types'

export interface ExpressionLayerProps {
  readonly sessionView: VehiclePetSessionView
  readonly derivedLevelId: string | undefined
}

export function ExpressionLayer(props: ExpressionLayerProps): ReactElement | null {
  const state = expressionStateFromSession(props.sessionView)
  const anchor = expressionAnchor(props.derivedLevelId)
  const asset = expressionAsset(state)
  if (anchor === null || asset === null) return null
  const [left, top, size] = anchor
  return (
    <picture
      className="vpo-expr"
      data-vehicle-pet-expression={state}
      data-expr-state={state}
      aria-hidden="true"
      style={{ left: `${left}%`, top: `${top}%`, width: `${size}%`, height: `${size}%` }}
    >
      <source type="image/webp" srcSet={asset.webp} />
      <img className="vpo-exprImg" src={asset.png} alt="" draggable={false} />
    </picture>
  )
}
