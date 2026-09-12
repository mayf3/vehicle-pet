import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Creator-facing failure surface for the pet preview route (CTR-OVERLAY-038
 * local preview): a broken pet pack, presentation, or asset must never
 * collapse the page into a silent blank screen. The boundary keeps the error
 * visible and names the two creator-owned recovery paths — pet:validate for
 * data errors and the Creator Kit docs for the preview contract.
 */
export class PreviewErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[petPreview] render failure:', error, info.componentStack)
  }

  override render(): ReactNode {
    const { error } = this.state
    if (error === null) return this.props.children
    return (
      <div role="alert" style={{ fontFamily: 'sans-serif', color: '#5a2a2a', padding: 24, maxWidth: 900 }}>
        <h2 style={{ marginTop: 0 }}>Pet preview failed to render</h2>
        <p>
          The preview crashed while rendering this pet&apos;s data or assets. Fix the reported
          problem and reload — the preview stays on the real resident renderer, so what fails here
          would fail on the resident surface too.
        </p>
        <pre style={{ background: '#fdf2f2', border: '1px solid #e5b8b8', borderRadius: 6, padding: 12, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {error.message}
        </pre>
        <p>
          Run <code>pnpm pet:validate examples/&lt;your-pet&gt;</code> — validation failures name the
          exact file and field. See <code>docs/creator/GETTING_STARTED.md</code> for the preview
          contract and <code>docs/creator/PET_DEFINITION_REFERENCE.md</code> for field constraints.
        </p>
      </div>
    )
  }
}
