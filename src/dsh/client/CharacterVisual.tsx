import { useState, type ReactElement } from 'react'
import { PetSceneRenderer } from '../../react'
import { ExpressionLayer } from './ExpressionLayer'
import { COMPANION_POSES, characterLevel, type CharacterDefinition } from './characters'
import { companionAssets, insigniaAssets, poseAnchors, poseAlphaBounds } from './character-assets.generated'
import type { VehiclePetExpressionVariant } from './expressions'

// The pose canvas is 320×540, contained in the square resident canvas.
export function companionHitStyle(variant: VehiclePetExpressionVariant, surfaceSize: number) {
  const [x0,y0,x1,y1] = poseAlphaBounds[COMPANION_POSES[variant]]!
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
  character: CharacterDefinition
  variant: VehiclePetExpressionVariant
  levelId: string | undefined
  interactionCount: number
}
function EngineScene(props: Props): ReactElement {
  return <PetSceneRenderer subjectInteractive={false} interactionCount={props.interactionCount}
    presentationMode="compact-overlay"
    subjectOverlay={<ExpressionLayer variant={props.variant} derivedLevelId={props.levelId} />} />
}
function PoseSprite(props: Props): ReactElement | null {
  const pose = COMPANION_POSES[props.variant]
  return <PoseImage key={pose} pose={pose} levelId={props.levelId} />
}
function PoseImage({ pose, levelId }: { pose: number; levelId: string | undefined }): ReactElement | null {
  const [failure, setFailure] = useState(0)
  const asset = companionAssets[pose]
  const anchor = poseAnchors[pose]
  const level = characterLevel(levelId, 'en')
  if (asset === undefined || anchor === undefined) return null
  if (failure > 1) return <span className="vpo-assetFallback">Pony.ai</span>
  return <span className="vpo-pose" data-companion-pose={pose}>
    <img src={failure === 0 ? asset.webp : asset.png} alt="" draggable={false}
      onError={() => setFailure(value => value + 1)} />
    {level === null ? null : <img className="vpo-insignia" src={insigniaAssets[level.index]}
      data-companion-insignia={level.grade} alt="" draggable={false}
      style={{ left: `${anchor[0]}%`, top: `${anchor[1]}%`, transform: `translate(-50%,-50%) rotate(${anchor[2]}deg)` }} />}
  </span>
}
const recipes = { 'engine-scene': EngineScene, 'pose-sprite': PoseSprite } as const
export function CharacterVisual(props: Props): ReactElement {
  const Recipe = recipes[props.character.recipe]
  return <Recipe {...props} />
}
