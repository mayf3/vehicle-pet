/**
 * PetSceneRenderer: the single generic renderer for every Pack (CTR-PET-007).
 * It renders the declarative plan within the mechanical DOM budget and maps
 * every whitelisted presentation preset to engine-owned visual semantics.
 */

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { RenderNode } from '../engine'
import { usePetEngine } from './PetEngineProvider'
import { AssetFallback } from './AssetFallback'

const NODE_BASE_WIDTH_PERCENT: Record<string, number> = {
  background: 100,
  subject: 60,
  decoration: 46,
  overlay: 100,
  'terminal-overlay': 100,
  'population-representative': 14,
}

/** One root plus at most 63 descendants, including the subject's asset. */
const RENDERER_DESCENDANT_BUDGET = 63

export interface PetSceneRendererProps {
  /** Prototype-only fault injection: asset ids forced to render their fallback. */
  simulateFailAssetIds?: readonly string[]
  'aria-label'?: string
}

export function PetSceneRenderer(props: PetSceneRendererProps) {
  const { snapshot, copy } = usePetEngine()
  const [clickCount, setClickCount] = useState(0)

  if (!snapshot.initialized) return <div className="vp-scene" aria-busy="true" />
  if (snapshot.plan === null) {
    return (
      <div className="vp-scene" role="img" aria-label={copy.waitingProgress}>
        <div className="vp-waiting">{copy.waitingProgress}</div>
      </div>
    )
  }

  const plan = snapshot.plan
  const reduced = snapshot.reducedMotion
  const level = snapshot.activePack?.manifest.levels.find((candidate) => candidate.levelId === plan.levelId)
  const scene = snapshot.activePack?.manifest.scenes.find((candidate) => candidate.sceneId === plan.sceneId)
  const sceneTransition = scene?.transition ?? 'instant'
  const upgradeTransition = level?.upgrade?.transition ?? 'instant'
  const upgradeReveal = level?.upgrade?.reveal ?? 'subject-swap'
  const celebration = level?.upgrade?.celebration ?? 'ambient-highlight'
  const visibleNodes = fitNodesToDomBudget(plan.nodes)

  return (
    <div
      className={`vp-scene vp-scene-transition-${sceneTransition} vp-upgrade-transition-${upgradeTransition} vp-upgrade-reveal-${upgradeReveal} vp-celebration-${celebration}`}
      role="group"
      aria-label={props['aria-label'] ?? 'Pet scene'}
      data-reduced-motion={reduced ? 'true' : 'false'}
      data-scene-transition={sceneTransition}
      data-upgrade-transition={upgradeTransition}
      data-upgrade-reveal={upgradeReveal}
      data-celebration={celebration}
      data-camera-zoom-permille={plan.cameraZoomPermille}
      data-subject-scale-permille={plan.subjectScalePermille}
    >
      {visibleNodes.map((node, index) => (
        <PlanNodeView
          key={node.nodeId}
          node={node}
          nodeIndex={index}
          cameraZoomPermille={plan.cameraZoomPermille}
          subjectScalePermille={plan.subjectScalePermille}
          reducedMotion={reduced}
          upgradeReveal={upgradeReveal}
          clickCount={node.kind === 'subject' ? clickCount : 0}
          onClickSubject={() => setClickCount((n) => n + 1)}
          simulateFailAssetIds={props.simulateFailAssetIds}
        />
      ))}
    </div>
  )
}

function fitNodesToDomBudget(nodes: readonly RenderNode[]): RenderNode[] {
  const selected: RenderNode[] = []
  const populationCounts = new Map<string, number>()
  let descendants = 0
  for (const node of nodes) {
    if (node.kind === 'population-representative') {
      const populationKey = node.nodeId.replace(/:\d+$/, '')
      const count = populationCounts.get(populationKey) ?? 0
      if (count >= 32) continue
      populationCounts.set(populationKey, count + 1)
    }
    const cost = node.kind === 'subject' ? 2 : 1
    if (descendants + cost > RENDERER_DESCENDANT_BUDGET) continue
    selected.push(node)
    descendants += cost
  }
  return selected
}

interface PlanNodeViewProps {
  node: RenderNode
  nodeIndex: number
  cameraZoomPermille: number
  subjectScalePermille: number
  reducedMotion: boolean
  upgradeReveal: 'subject-swap' | 'scene-expand' | 'milestone-card' | 'collection-add'
  clickCount: number
  onClickSubject: () => void
  simulateFailAssetIds?: readonly string[]
}

function PlanNodeView(props: PlanNodeViewProps) {
  const { node, nodeIndex, cameraZoomPermille, subjectScalePermille, reducedMotion } = props
  const camera = cameraZoomPermille / 1000
  const x = 50 + (node.placement.x / 100 - 50) * camera
  const y = 50 + (node.placement.y / 100 - 50) * camera
  const baseWidth = NODE_BASE_WIDTH_PERCENT[node.kind] ?? 30
  const subjectScale = node.kind === 'subject' ? subjectScalePermille / 1000 : 1
  const widthPercent = (baseWidth * node.placement.scalePermille * camera * subjectScale) / 1000
  const placementStyle: CSSProperties = {
    left: `${x}%`,
    top: `${y}%`,
    zIndex: node.zOrder,
    '--vp-node-index': nodeIndex,
    ...(reducedMotion ? {} : { transform: 'translate(-50%, -50%)' }),
  } as CSSProperties

  if (node.kind === 'aggregate-label' || node.kind === 'milestone') {
    return (
      <span
        className={`vp-node vp-kind-${node.kind} ${node.kind === 'aggregate-label' ? 'vp-aggregate' : 'vp-milestone-text'}`}
        style={placementStyle}
        data-placement-x={node.placement.x}
        data-placement-y={node.placement.y}
      >
        {node.text}
      </span>
    )
  }

  const sizedStyle = { ...placementStyle, width: `${widthPercent}%`, aspectRatio: '1 / 1' }
  if (node.kind === 'subject') {
    return (
      <SubjectButton
        node={node}
        style={sizedStyle}
        reducedMotion={reducedMotion}
        upgradeReveal={props.upgradeReveal}
        clickCount={props.clickCount}
        onClick={props.onClickSubject}
        simulateFailAssetIds={props.simulateFailAssetIds}
      />
    )
  }

  return (
    <SceneAsset
      node={node}
      className={`vp-node vp-node-img vp-kind-${node.kind}`}
      style={sizedStyle}
      simulateFailAssetIds={props.simulateFailAssetIds}
    />
  )
}

function SubjectButton(props: {
  node: RenderNode
  style: CSSProperties
  reducedMotion: boolean
  upgradeReveal: 'subject-swap' | 'scene-expand' | 'milestone-card' | 'collection-add'
  clickCount: number
  onClick: () => void
  simulateFailAssetIds?: readonly string[]
}) {
  const { node, reducedMotion, upgradeReveal, clickCount, onClick } = props
  const { snapshot, copy } = usePetEngine()
  const [showFeedback, setShowFeedback] = useState(false)
  const prevClickCount = useRef(0)

  useEffect(() => {
    if (clickCount > prevClickCount.current) {
      prevClickCount.current = clickCount
      setShowFeedback(true)
      const timer = window.setTimeout(() => setShowFeedback(false), 700)
      return () => window.clearTimeout(timer)
    }
    prevClickCount.current = clickCount
  }, [clickCount])

  const subjectMotion = clickCount > 0
    ? 'vp-click-pop 480ms ease-out'
    : 'vp-idle-float 3.6s ease-in-out infinite'
  const animation = reducedMotion
    ? 'none'
    : upgradeReveal === 'subject-swap'
      ? `vp-subject-swap 300ms ease-out both, ${subjectMotion}`
      : subjectMotion

  return (
    <button
      type="button"
      className="vp-node vp-subject-btn vp-kind-subject"
      style={{ ...props.style, animation }}
      aria-label={node.altText || snapshot.viewModel?.derivedLevelId || 'Pet'}
      onClick={onClick}
      data-pet-subject="true"
      data-feedback-visible={showFeedback ? 'true' : 'false'}
      data-feedback={reducedMotion ? copy.clickFeedback : '✦'}
    >
      <SceneAsset node={node} className="vp-node-img" simulateFailAssetIds={props.simulateFailAssetIds} />
    </button>
  )
}

/** Asset node with the webp → png → text degradation chain (CTR-PET-017). */
function SceneAsset({ node, simulateFailAssetIds, className, style }: {
  node: RenderNode
  simulateFailAssetIds?: readonly string[]
  className?: string
  style?: CSSProperties
}) {
  const { snapshot, assetUrl, resolveText } = usePetEngine()
  const pack = snapshot.activePack
  const [stage, setStage] = useState<'primary' | 'png' | 'text'>('primary')
  const populationKey = node.kind === 'population-representative' ? node.nodeId.replace(/:\d+$/, '') : undefined

  useEffect(() => setStage('primary'), [node.assetId])

  if (pack === null || node.assetId === null) {
    return <AssetFallback text={node.altText ?? ''} className={className} style={style} ariaHidden={node.ariaHidden} nodeId={node.nodeId} nodeKind={node.kind} populationKey={populationKey} />
  }

  const asset = pack.manifest.assets.find((candidate) => candidate.assetId === node.assetId)
  if (asset === undefined) return <AssetFallback text={node.altText ?? ''} className={className} style={style} ariaHidden={node.ariaHidden} nodeId={node.nodeId} nodeKind={node.kind} populationKey={populationKey} />

  const forcedFail = simulateFailAssetIds?.includes(asset.assetId) === true
  const primaryUrl = assetUrl(asset.assetId)
  const pngTwin = pack.manifest.assets.find(
    (candidate) => candidate.path === asset.path.replace(/\.webp$/, '.png') && candidate.format === 'png',
  )
  const pngUrl = pngTwin !== undefined ? assetUrl(pngTwin.assetId) : undefined
  const objectFit = node.kind === 'background' || node.kind === 'overlay' || node.kind === 'terminal-overlay' ? 'cover' : 'contain'

  if (!forcedFail && stage === 'primary' && primaryUrl !== undefined) {
    return <img className={className} style={{ ...style, objectFit }} src={primaryUrl} alt="" aria-hidden={node.ariaHidden || undefined} data-node-id={node.nodeId} data-node-kind={node.kind} data-population-key={populationKey} onError={() => setStage('png')} draggable={false} />
  }
  if (!forcedFail && stage !== 'text' && pngUrl !== undefined) {
    return <img className={className} style={{ ...style, objectFit }} src={pngUrl} alt="" aria-hidden={node.ariaHidden || undefined} data-node-id={node.nodeId} data-node-kind={node.kind} data-population-key={populationKey} onError={() => setStage('text')} draggable={false} />
  }
  return <AssetFallback text={node.altText ?? resolveText(asset.altText)} className={className} style={style} ariaHidden={node.ariaHidden} nodeId={node.nodeId} nodeKind={node.kind} populationKey={populationKey} />
}
