/**
 * PetKeepsakeCollection: milestone keepsakes with unlock state from the engine
 * storage adapter. Copy and accessibility semantics survive asset failure;
 * there is no currency, rarity, draw, task, or penalty surface (CTR-PET-023).
 */

import { usePetEngine } from './PetEngineProvider'
import { IconKeepsake, IconLock } from './icons'

export function PetKeepsakeCollection() {
  const { snapshot, copy, resolveText, assetUrl } = usePetEngine()
  const pack = snapshot.activePack
  const viewModel = snapshot.viewModel

  if (pack === null || viewModel === null) {
    return (
      <section className="vp-panel">
        <h3>{copy.keepsakes}</h3>
      </section>
    )
  }

  const keepsakes = pack.manifest.keepsakes ?? []
  const unlocked = new Set(
    snapshot.unlockedKeepsakes
      .filter(
        (k) =>
          k.subjectId === viewModel.subjectId &&
          k.packId === pack.manifest.packId &&
          k.packVersion === pack.manifest.packVersion,
      )
      .map((k) => k.keepsakeId),
  )

  return (
    <section className="vp-panel" aria-label={copy.keepsakes}>
      <h3>
        {copy.keepsakes} · {unlocked.size}/{keepsakes.length}
      </h3>
      <ul className="vp-keepsake-list" data-pet-keepsakes={`${unlocked.size}/${keepsakes.length}`}>
        {keepsakes.map((keepsake) => {
          const isUnlocked = unlocked.has(keepsake.keepsakeId)
          const level = pack.manifest.levels.find((l) => l.levelId === keepsake.levelId)
          const url = keepsake.assetId !== undefined ? assetUrl(keepsake.assetId) : undefined
          return (
            <li
              key={keepsake.keepsakeId}
              className={`vp-keepsake-item${isUnlocked ? ' vp-keepsake-item-unlocked' : ''}`}
              data-pet-keepsake={keepsake.keepsakeId}
              data-unlocked={isUnlocked ? 'true' : 'false'}
            >
              {isUnlocked ? (
                <span style={{ color: '#facc15', fontSize: 20 }} aria-hidden="true">
                  <IconKeepsake />
                </span>
              ) : (
                <span style={{ color: '#64748b', fontSize: 18 }} aria-hidden="true">
                  <IconLock />
                </span>
              )}
              <span>
                {isUnlocked ? (
                  <>
                    <span className="vp-keepsake-title">{resolveText(keepsake.title)}</span>
                    <br />
                    <span className="vp-keepsake-desc">{resolveText(keepsake.accessDescription)}</span>
                    {url !== undefined ? (
                      <img
                        src={url}
                        alt=""
                        aria-hidden="true"
                        width={40}
                        height={40}
                        style={{ objectFit: 'contain', verticalAlign: 'middle', marginLeft: 6, borderRadius: 6 }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : null}
                  </>
                ) : (
                  <span className="vp-keepsake-desc">
                    {level !== undefined ? resolveText(level.stageName) : keepsake.levelId} · {copy.keepsakeLocked}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
