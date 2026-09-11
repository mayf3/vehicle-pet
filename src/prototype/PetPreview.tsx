/**
 * Pet preview view (?petPreview=1): renders the REAL resident character
 * renderer (CharacterVisual) for every bundled pet — the same component the
 * DSH overlay mounts — with pet / expression / level / size selectors.
 * Closes the creator-preview gap (R5): "the journey shows" is not "my pet
 * shows". No engine, no scheduler, no persistence: pure presentation.
 */

import { useState, type ReactElement } from 'react'
import { CharacterVisual } from '../dsh/client/CharacterVisual'
import { userSelectablePets } from '../dsh/client/pets/bundled'
import type { VehiclePetExpressionVariant } from '../dsh/client/expressions'

const VARIANTS: readonly VehiclePetExpressionVariant[] = [
  'idle', 'idle-happy', 'idle-curious', 'idle-sleepy', 'working',
  'needs-input', 'completed', 'completed-proud', 'failed', 'cancelled',
]

const SIZES = [112, 216] as const

export function PetPreviewView(): ReactElement {
  const pets = userSelectablePets()
  const [petId, setPetId] = useState(pets[0]?.id ?? 'vehicle')
  const [variant, setVariant] = useState<VehiclePetExpressionVariant>('idle')
  const [levelIndex, setLevelIndex] = useState(0)
  const [size, setSize] = useState<(typeof SIZES)[number]>(216)

  const pet = pets.find((candidate) => candidate.id === petId) ?? pets[0]!
  const level = pet.gradeLevels[levelIndex]

  const rowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', margin: '8px 0' }

  return (
    <div style={{ fontFamily: 'sans-serif', color: '#285461', padding: 16, maxWidth: 900 }}>
      <h2 style={{ marginTop: 0 }}>Pet preview — the real resident renderer</h2>
      <p style={{ color: '#5a7681' }}>
        This view mounts the same <code>CharacterVisual</code> component the DSH overlay uses.
        What you see here is what ships on the resident surface for the selected pet.
      </p>
      <div style={rowStyle}>
        <strong>Pet:</strong>
        {pets.map((candidate) => (
          <button key={candidate.id} type="button" onClick={() => { setPetId(candidate.id); setLevelIndex(0) }}
            aria-pressed={candidate.id === pet.id}
            style={{ padding: '4px 10px', border: candidate.id === pet.id ? '2px solid #2a6f9e' : '1px solid #b9d4de', background: candidate.id === pet.id ? '#e3f2f8' : '#fff', borderRadius: 6, cursor: 'pointer' }}>
            {candidate.displayName['zh-CN']} ({candidate.id})
          </button>
        ))}
      </div>
      <div style={rowStyle}>
        <strong>Expression:</strong>
        {VARIANTS.map((candidate) => (
          <button key={candidate} type="button" onClick={() => setVariant(candidate)}
            aria-pressed={candidate === variant}
            style={{ padding: '3px 8px', fontSize: 12, border: candidate === variant ? '2px solid #2a6f9e' : '1px solid #b9d4de', background: candidate === variant ? '#e3f2f8' : '#fff', borderRadius: 6, cursor: 'pointer' }}>
            {candidate}
          </button>
        ))}
      </div>
      <div style={rowStyle}>
        <strong>Level:</strong>
        {pet.gradeLevels.map((candidate, index) => (
          <button key={candidate.id} type="button" onClick={() => setLevelIndex(index)}
            aria-pressed={index === levelIndex}
            style={{ padding: '3px 8px', fontSize: 12, border: index === levelIndex ? '2px solid #2a6f9e' : '1px solid #b9d4de', background: index === levelIndex ? '#e3f2f8' : '#fff', borderRadius: 6, cursor: 'pointer' }}>
            {candidate.id}
          </button>
        ))}
        <strong style={{ marginLeft: 16 }}>Size:</strong>
        {SIZES.map((candidate) => (
          <button key={candidate} type="button" onClick={() => setSize(candidate)}
            aria-pressed={candidate === size}
            style={{ padding: '3px 8px', fontSize: 12, border: candidate === size ? '2px solid #2a6f9e' : '1px solid #b9d4de', background: candidate === size ? '#e3f2f8' : '#fff', borderRadius: 6, cursor: 'pointer' }}>
            {candidate === 112 ? 'SMALL 112px' : 'LARGE 216px'}
          </button>
        ))}
      </div>
      <div style={{
        display: 'inline-block',
        width: size,
        height: size,
        position: 'relative',
        background: 'linear-gradient(#e8f1f4, #cfe0e8)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <CharacterVisual pet={pet} variant={variant} levelId={level?.id} locale="zh-CN" interactionCount={0} />
        </div>
      </div>
      {level ? (
        <p style={{ color: '#5a7681' }}>
          Caption policy for this pet: exact number {pet.gradePolicy.showExactLevelNumber ? 'shown' : 'hidden'},
          description {pet.gradePolicy.showDescription ? 'shown' : 'hidden'},
          insignia {pet.gradePolicy.insigniaMode}.
          {pet.gradePolicy.showDescription ? ` Description: ${level['zh-CN']}` : ''}
        </p>
      ) : null}
    </div>
  )
}
