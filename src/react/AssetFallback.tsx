/**
 * AssetFallback: the degraded visual used when a Pack asset fails to load.
 * The fallback keeps the accessible copy visible so level, milestone, keepsake,
 * and aggregate information never disappears (CTR-PET-017).
 */

export interface AssetFallbackProps {
  text: string
  testId?: string
}

export function AssetFallback({ text, testId }: AssetFallbackProps) {
  return (
    <div className="vp-asset-fallback" data-pet-asset-fallback="true" data-testid={testId}>
      {text}
    </div>
  )
}
