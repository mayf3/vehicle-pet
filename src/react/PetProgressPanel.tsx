/**
 * PetProgressPanel: current level, within-level progress, next goal, and the
 * Pack-owned display conversion. At the final level it shows the stable capped
 * state with no fabricated next goal (CTR-PET-016, ACC-PET-016).
 */

import { usePetEngine } from './PetEngineProvider'

export function PetProgressPanel() {
  const { snapshot, copy, resolveText } = usePetEngine()
  const viewModel = snapshot.viewModel
  const pack = snapshot.activePack

  if (viewModel === null || pack === null) {
    return (
      <section className="vp-panel" aria-label={copy.currentLevel}>
        <h3>{copy.currentLevel}</h3>
        <p>{copy.waitingProgress}</p>
      </section>
    )
  }

  const level = pack.manifest.levels.find((l) => l.levelId === viewModel.derivedLevelId)
  const stageName = level !== undefined ? resolveText(level.stageName) : viewModel.derivedLevelId
  const percent = viewModel.capped ? 100 : Math.floor((viewModel.withinLevelEarned / viewModel.withinLevelSpan) * 100)
  const conversion = pack.manifest.displayConversion
  const converted =
    conversion !== undefined
      ? Math.floor(viewModel.progressPoints / conversion.pointsPerUnit)
      : null
  const unitLabel = conversion !== undefined ? resolveText(conversion.unitLabel) : null

  return (
    <section className="vp-panel" aria-label={copy.currentLevel}>
      <h3>{copy.currentLevel}</h3>
      <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>
        {viewModel.derivedLevelIndex}. {stageName}
      </p>
      <div
        className="vp-progressbar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`${copy.currentLevel} ${viewModel.derivedLevelIndex}`}
      >
        <div className="vp-progressbar-fill" style={{ width: `${percent}%` }} />
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 13, color: '#9fb4d8' }}>
        {viewModel.capped ? (
          <span data-pet-capped="true">{copy.capped}</span>
        ) : (
          <>
            {copy.nextGoal}: {viewModel.remainingPoints.toLocaleString('en-US')} {copy.remainingPoints}
          </>
        )}
        {converted !== null && unitLabel !== null ? (
          <span data-pet-conversion="true">
            {' '}
            · ≈ {converted.toLocaleString('en-US')} {unitLabel}
          </span>
        ) : null}
      </p>
    </section>
  )
}
