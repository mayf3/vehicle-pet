import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { CharacterVisual } from '../../../src/dsh/client/CharacterVisual'
import { CHARACTER_DEFINITIONS, COMPANION_POSES } from '../../../src/dsh/client/characters'
import type { VehiclePetExpressionVariant } from '../../../src/dsh/client/expressions'

afterEach(cleanup)
it('renders all 120 grade/expression combinations as one companion with the matching insignia',()=>{
  const props={character:CHARACTER_DEFINITIONS.companion,interactionCount:0}
  const {container,rerender}=render(<CharacterVisual {...props} levelId="l1" variant="idle" />)
  for(let level=1;level<=12;level++) for(const [variant,pose] of Object.entries(COMPANION_POSES)) {
    rerender(<CharacterVisual {...props} levelId={`l${level}`} variant={variant as VehiclePetExpressionVariant} />)
    expect(container.querySelectorAll('[data-companion-pose]')).toHaveLength(1)
    expect(container.querySelector('[data-companion-pose]')).toHaveAttribute('data-companion-pose',String(pose))
    expect(container.querySelector('[data-companion-insignia]')).toHaveAttribute('data-companion-insignia',`L${level}`)
    expect(container.querySelectorAll('button,input,[tabindex]')).toHaveLength(0)
  }
})
it('falls back WebP to same-pose PNG then an identity text without switching characters',()=>{
  const {container}=render(<CharacterVisual character={CHARACTER_DEFINITIONS.companion} interactionCount={0} levelId="l2" variant="working" />)
  const body=container.querySelector('img')!
  expect(body.src).toContain('pose-2.webp')
  fireEvent.error(body)
  expect(body.src).toContain('pose-2.png')
  fireEvent.error(body)
  expect(container.textContent).toBe('Pony.ai')
  expect(container.querySelector('[data-companion-pose]')).toBeNull()
})
