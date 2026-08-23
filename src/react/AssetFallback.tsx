/**
 * AssetFallback: the degraded visual used when a Pack asset fails to load.
 * The fallback keeps the accessible copy visible so level, milestone, keepsake,
 * and aggregate information never disappears (CTR-PET-017).
 */

import type { CSSProperties } from 'react'

export interface AssetFallbackProps {
  text: string
  testId?: string
  className?: string
  style?: CSSProperties
  ariaHidden?: boolean
  nodeId?: string
  nodeKind?: string
  populationKey?: string
}

export function AssetFallback({ text, testId, className, style, ariaHidden, nodeId, nodeKind, populationKey }: AssetFallbackProps) {
  return (
    <div className={['vp-asset-fallback', className].filter(Boolean).join(' ')} style={style} aria-hidden={ariaHidden || undefined} data-node-id={nodeId} data-node-kind={nodeKind} data-population-key={populationKey} data-pet-asset-fallback="true" data-testid={testId}>
      {text}
    </div>
  )
}
