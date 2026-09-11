import { useState, type ReactElement } from 'react'
import { PetSceneRenderer } from '../../react'
import { ExpressionLayer } from './ExpressionLayer'
import { companionAssets, poseAlphaBounds } from './character-assets.generated'
import { petDisplayName, petGrade } from './pets/bundled'
import type { PetPresentation } from './pets/types'
import type { VehiclePetExpressionVariant } from './expressions'

// The pose canvas is 320×540, contained in the square resident canvas.
function poseHitStyle(alphaBounds: readonly [number, number, number, number], surfaceSize: number) {
  const [x0, y0, x1, y1] = alphaBounds
  const ratio = 320 / 540
  // Two pre-transform pixels cover the subtle idle motion and alpha edge.
  const pad = 2 / surfaceSize * 100
  return {
    left: `${(1-ratio)/2*100+x0/540*100-pad}%`,
    top: `${y0/540*100-pad}%`,
    width: `${(x1-x0)/540*100+pad*2}%`,
    height: `${(y1-y0)/540*100+pad*2}%`,
  }
}

interface Props {
  pet: PetPresentation
  variant: VehiclePetExpressionVariant
  levelId: string | undefined
  locale: string | undefined
  interactionCount: number
}

function EngineScene(props: Props): ReactElement {
  const anchors = props.pet.engineScene?.expressionAnchors ?? {}
  return <PetSceneRenderer subjectInteractive={false} interactionCount={props.interactionCount}
    presentationMode="compact-overlay"
    subjectOverlay={<ExpressionLayer variant={props.variant} derivedLevelId={props.levelId} anchors={anchors} />} />
}

function PoseSprite(props: Props): ReactElement | null {
  const poseIndex = props.pet.poseSprite?.variantPose[props.variant]
  if (poseIndex === undefined) return null
  return <PoseImage pet={props.pet} pose={poseIndex} levelId={props.levelId} locale={props.locale} />
}

function PoseImage({ pet, pose, levelId, locale }: { pet: PetPresentation; pose: number; levelId: string | undefined; locale: string | undefined }): ReactElement | null {
  const [failure, setFailure] = useState(0)
  const recipe = pet.poseSprite
  const asset = companionAssets[pose]
  const insignia = recipe?.insignia
  const level = petGrade(pet.id, levelId, 'en')
  const insigniaAsset = pet.gradePolicy.insigniaMode === 'wearable' && insignia !== undefined && level !== null
    ? insignia.assets[level.index]
    : undefined
  const insigniaAnchor = insigniaAsset !== undefined ? insignia?.anchors[pose] : undefined
  if (asset === undefined) return null
  if (failure > 1) {
    return <span className="vpo-assetFallback">{petDisplayName(pet.id, locale)}</span>
  }
  return <span className="vpo-pose" data-companion-pose={pose}>
    <img src={failure === 0 ? asset.webp : asset.png} alt="" draggable={false}
      onError={() => setFailure(value => value + 1)} />
    {insigniaAsset !== undefined && insigniaAnchor !== undefined
      ? <img className="vpo-insignia" src={insigniaAsset}
        data-companion-insignia={level?.grade} alt="" draggable={false}
        style={{ left: `${insigniaAnchor[0]}%`, top: `${insigniaAnchor[1]}%`, transform: `translate(-50%,-50%) rotate(${insigniaAnchor[2]}deg)` }} />
      : null}
  </span>
}

const recipes = { 'engine-scene': EngineScene, 'pose-sprite': PoseSprite } as const
export function CharacterVisual(props: Props): ReactElement {
  const Recipe = recipes[props.pet.recipe]
  return <Recipe {...props} />
}

/** Hit-style helper resolved from a pet's own recipe data (generic). */
export function petHitStyle(pet: PetPresentation, variant: VehiclePetExpressionVariant, surfaceSize: number) {
  const poseIndex = pet.poseSprite?.variantPose[variant]
  if (pet.recipe === 'pose-sprite' && poseIndex !== undefined) {
    const bounds = poseAlphaBounds[poseIndex]
    if (bounds !== undefined) return poseHitStyle(bounds, surfaceSize)
  }
  return undefined
}
