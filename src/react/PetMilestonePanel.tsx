/**
 * PetMilestonePanel: stage name, summary, milestone copy, and scene label of
 * the current level. Pure pack data — the component has no pack branches.
 */

import { usePetEngine } from './PetEngineProvider'

export function PetMilestonePanel() {
  const { snapshot, copy, resolveText } = usePetEngine()
  const pack = snapshot.activePack
  const viewModel = snapshot.viewModel

  if (pack === null || viewModel === null) {
    return (
      <section className="vp-panel">
        <h3>{copy.waitingProgress}</h3>
      </section>
    )
  }

  const level = pack.manifest.levels.find((l) => l.levelId === viewModel.derivedLevelId)
  const scene = level !== undefined ? pack.manifest.scenes.find((s) => s.sceneId === level.sceneId) : undefined

  return (
    <section className="vp-panel" data-pet-milestone-panel="true">
      <h3>{level !== undefined ? resolveText(level.stageName) : viewModel.derivedLevelId}</h3>
      {level !== undefined ? (
        <>
          <p style={{ margin: '0 0 6px', fontSize: 14 }}>{resolveText(level.summary)}</p>
          <p style={{ margin: '0 0 6px', fontSize: 14, color: '#ffd88a' }} data-pet-milestone="true">
            {resolveText(level.milestone)}
          </p>
        </>
      ) : null}
      {scene !== undefined ? (
        <p style={{ margin: 0, fontSize: 12, color: '#9fb4d8' }}>{resolveText(scene.sceneLabel)}</p>
      ) : null}
    </section>
  )
}
