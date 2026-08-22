/**
 * PackSelector: switches between bundled Packs through the engine registry.
 * Switching is silent (CTR-PET-029); progress is shared and never resets.
 */

import { usePetEngine } from './PetEngineProvider'

export function PackSelector() {
  const { snapshot, copy, resolveText, switchPack } = usePetEngine()
  const activeId = snapshot.activePack?.manifest.packId ?? null

  return (
    <section className="vp-panel" aria-label={copy.switchPack}>
      <h3>{copy.switchPack}</h3>
      <div className="vp-selector" role="group" data-pet-pack-selector="true">
        {snapshot.availablePacks.map((pack) => (
          <button
            key={pack.manifest.packId}
            type="button"
            aria-pressed={pack.manifest.packId === activeId ? 'true' : 'false'}
            data-pet-pack-option={pack.manifest.packId}
            onClick={() => switchPack(pack.manifest.packId)}
          >
            {resolveText(pack.manifest.name)}
          </button>
        ))}
      </div>
    </section>
  )
}
