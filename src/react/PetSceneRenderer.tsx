/**
 * PetSceneRenderer: the single generic renderer for every Pack (CTR-PET-007).
 * Consumes the derived SceneRenderPlan only — there are no Pack-specific
 * branches here. Handles camera zoom, permille placement, idle motion, click
 * feedback, asset failure degradation, and reduced motion.
 */

import { useEffect, useRef, useState } from 'react'
import type { RenderNode } from '../engine'
import { usePetEngine } from './PetEngineProvider'
import { IconSpark } from './icons'
import { AssetFallback } from './AssetFallback'

const NODE_BASE_WIDTH_PERCENT: Record<string, number> = {
  background: 100,
  subject: 60,
  decoration: 46,
  overlay: 100,
  'terminal-overlay': 100,
  'population-representative': 14,
}

export interface PetSceneRendererProps {
  /** Prototype-only fault injection: asset ids forced to render their fallback. */
  simulateFailAssetIds?: readonly string[]
  'aria-label'?: string
}

export function PetSceneRenderer(props: PetSceneRendererProps) {
  const { snapshot, copy } = usePetEngine()
  const [clickCount, setClickCount] = useState(0)

  if (!snapshot.initialized) {
    return <div className="vp-scene" aria-busy="true" />
  }
  if (snapshot.plan === null) {
    return (
      <div className="vp-scene" role="img" aria-label={copy.waitingProgress}>
        <div className="vp-waiting">{copy.waitingProgress}</div>
      </div>
    )
  }

  const plan = snapshot.plan
  const zoom = plan.cameraZoomPermille / 1000
  const reduced = snapshot.reducedMotion

  return (
    <div className="vp-scene" role="group" aria-label={props['aria-label'] ?? 'Pet scene'}>
      <div
        className="vp-scene-inner"
        style={{ transform: `scale(${zoom.toFixed(3)})`, transformOrigin: 'center center' }}
      >
        {plan.nodes.map((node) => (
          <PlanNodeView
            key={node.nodeId}
            node={node}
            reducedMotion={reduced}
            clickCount={node.kind === 'subject' ? clickCount : 0}
            onClickSubject={() => setClickCount((n) => n + 1)}
            simulateFailAssetIds={props.simulateFailAssetIds}
          />
        ))}
      </div>
    </div>
  )
}

interface PlanNodeViewProps {
  node: RenderNode
  reducedMotion: boolean
  clickCount: number
  onClickSubject: () => void
  simulateFailAssetIds?: readonly string[]
}

function PlanNodeView({ node, reducedMotion, clickCount, onClickSubject, simulateFailAssetIds }: PlanNodeViewProps) {
  const left = `${node.placement.x / 100}%`
  const top = `${node.placement.y / 100}%`
  const baseWidth = NODE_BASE_WIDTH_PERCENT[node.kind] ?? 30
  const width = `${(baseWidth * node.placement.scalePermille) / 1000}%`
  const zIndex = String(node.zOrder)

  if (node.kind === 'aggregate-label') {
    return (
      <span className="vp-node vp-aggregate" style={{ left, top, transform: 'translate(-50%, -50%)', zIndex }} aria-hidden={false}>
        {node.text}
      </span>
    )
  }

  if (node.kind === 'milestone') {
    return (
      <span
        className="vp-node vp-milestone-text"
        style={{ left, top, transform: 'translate(-50%, -50%)', zIndex }}
      >
        {node.text}
      </span>
    )
  }

  if (node.kind === 'subject') {
    return (
      <SubjectButton
        node={node}
        left={left}
        top={top}
        width={width}
        zIndex={zIndex}
        reducedMotion={reducedMotion}
        clickCount={clickCount}
        onClick={onClickSubject}
        simulateFailAssetIds={simulateFailAssetIds}
      />
    )
  }

  return (
    <div className="vp-node" style={{ left, top, width, aspectRatio: '1 / 1', transform: 'translate(-50%, -50%)', zIndex }} aria-hidden={node.ariaHidden || undefined}>
      <SceneAsset node={node} simulateFailAssetIds={simulateFailAssetIds} />
    </div>
  )
}

function SubjectButton(props: {
  node: RenderNode
  left: string
  top: string
  width: string
  zIndex: string
  reducedMotion: boolean
  clickCount: number
  onClick: () => void
  simulateFailAssetIds?: readonly string[]
}) {
  const { node, left, top, width, zIndex, reducedMotion, clickCount, onClick } = props
  const { snapshot, copy } = usePetEngine()
  const [showSpark, setShowSpark] = useState(false)
  const prevClickCount = useRef(0)
  const altText = node.altText ?? ''

  useEffect(() => {
    if (clickCount > prevClickCount.current) {
      prevClickCount.current = clickCount
      setShowSpark(true)
      const timer = window.setTimeout(() => setShowSpark(false), 700)
      return () => window.clearTimeout(timer)
    }
    prevClickCount.current = clickCount
  }, [clickCount])

  const idle = !reducedMotion ? { animation: 'vp-idle-float 3.6s ease-in-out infinite' } : {}
  const pop = !reducedMotion && clickCount > 0 ? { animation: 'vp-click-pop 480ms ease-out' } : {}

  return (
    <button
      type="button"
      className="vp-subject-btn"
      style={{ left, top, width, aspectRatio: '1 / 1', zIndex, ...idle, ...pop }}
      aria-label={altText || snapshot.viewModel?.derivedLevelId || 'Pet'}
      onClick={onClick}
      data-pet-subject="true"
    >
      <SceneAsset node={node} simulateFailAssetIds={props.simulateFailAssetIds} />
      {showSpark ? (
        reducedMotion ? (
          <span style={{ position: 'absolute', left: '50%', top: '-24%', transform: 'translateX(-50%)', color: '#fde68a', fontSize: 12 }} aria-hidden="true">
            {copy.clickFeedback}
          </span>
        ) : (
          <span
            style={{ position: 'absolute', left: '50%', top: 0, color: '#fde68a', fontSize: 14, animation: 'vp-click-spark 680ms ease-out both' }}
            aria-hidden="true"
          >
            <IconSpark />
          </span>
        )
      ) : null}
    </button>
  )
}

/** Asset node with the webp → png → text degradation chain (CTR-PET-017). */
function SceneAsset({ node, simulateFailAssetIds }: { node: RenderNode; simulateFailAssetIds?: readonly string[] }) {
  const { snapshot, assetUrl, resolveText } = usePetEngine()
  const pack = snapshot.activePack
  const [stage, setStage] = useState<'primary' | 'png' | 'text'>('primary')

  useEffect(() => {
    setStage('primary')
  }, [node.assetId])

  if (pack === null || node.assetId === null) {
    return <AssetFallback text={node.altText ?? ''} />
  }

  const asset = pack.manifest.assets.find((a) => a.assetId === node.assetId)
  if (asset === undefined) {
    return <AssetFallback text={node.altText ?? ''} />
  }

  const forcedFail = simulateFailAssetIds !== undefined && simulateFailAssetIds.includes(asset.assetId)
  const primaryUrl = assetUrl(asset.assetId)
  const pngTwin = pack.manifest.assets.find(
    (a) => a.path === asset.path.replace(/\.webp$/, '.png') && a.format === 'png',
  )
  const pngUrl = pngTwin !== undefined ? assetUrl(pngTwin.assetId) : undefined

  if (!forcedFail && stage === 'primary' && primaryUrl !== undefined) {
    return (
      <img
        className="vp-node-img"
        src={primaryUrl}
        alt=""
        onError={() => setStage('png')}
        draggable={false}
        style={node.kind === 'background' || node.kind === 'overlay' || node.kind === 'terminal-overlay' ? { objectFit: 'cover' } : undefined}
      />
    )
  }
  if (!forcedFail && stage !== 'text' && pngUrl !== undefined) {
    return (
      <img
        className="vp-node-img"
        src={pngUrl}
        alt=""
        onError={() => setStage('text')}
        draggable={false}
        style={node.kind === 'background' || node.kind === 'overlay' || node.kind === 'terminal-overlay' ? { objectFit: 'cover' } : undefined}
      />
    )
  }
  return <AssetFallback text={node.altText ?? resolveText(asset.altText)} />
}
