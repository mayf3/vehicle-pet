import sharp from 'sharp'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { CharacterVisual, petHitStyle } from '../../../src/dsh/client/CharacterVisual'
import { petDefinition } from '../../../src/dsh/client/pets/bundled'

const companion = petDefinition('companion')
const variantPose = companion.poseSprite?.variantPose ?? {}
import type { VehiclePetExpressionVariant } from '../../../src/dsh/client/expressions'

afterEach(cleanup)
it('renders all 120 grade/expression combinations as one companion with the matching insignia',()=>{
  const props={pet:companion,locale:'en',interactionCount:0}
  const {container,rerender}=render(<CharacterVisual {...props} levelId="l1" variant="idle" />)
  for(let level=1;level<=12;level++) for(const [variant,pose] of Object.entries(variantPose)) {
    rerender(<CharacterVisual {...props} levelId={`l${level}`} variant={variant as VehiclePetExpressionVariant} />)
    expect(container.querySelectorAll('[data-companion-pose]')).toHaveLength(1)
    expect(container.querySelector('[data-companion-pose]')).toHaveAttribute('data-companion-pose',String(pose))
    expect(container.querySelector('[data-companion-insignia]')).toHaveAttribute('data-companion-insignia',`L${level}`)
    expect(container.querySelectorAll('button,input,[tabindex]')).toHaveLength(0)
  }
})
it('falls back WebP to same-pose PNG then an identity text without switching characters',()=>{
  const {container}=render(<CharacterVisual pet={companion} locale='en' interactionCount={0} levelId="l2" variant="working" />)
  const body=container.querySelector('img')!
  expect(body.src).toContain('pose-2.webp')
  fireEvent.error(body)
  expect(body.src).toContain('pose-2.png')
  fireEvent.error(body)
  expect(container.textContent).toBe('Companion')
  expect(container.querySelector('[data-companion-pose]')).toBeNull()
})

it('covers the real alpha bounds of all ten poses at both resident sizes within eight pixels',async()=>{
  for(const [variant,pose] of Object.entries(variantPose)) {
    const {data,info}=await sharp(`src/dsh/client/assets/companion/pose-${pose}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true})
    let x0=info.width,y0=info.height,x1=0,y1=0
    for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) if(data[(y*info.width+x)*4+3]!>0) {
      x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1)
    }
    for(const [size,scale] of [[112,.72],[216,.8]]) {
      const style=petHitStyle(companion,variant as VehiclePetExpressionVariant,size!)!
      const px=(value:string)=>parseFloat(value)/100*size!*scale!
      const actual=[((1-320/540)/2+x0/540)*size!*scale!,y0/540*size!*scale!,((1-320/540)/2+x1/540)*size!*scale!,y1/540*size!*scale!]
      const hit=[px(style.left),px(style.top),px(style.left)+px(style.width),px(style.top)+px(style.height)]
      for(let edge=0;edge<4;edge++) {
        const margin=edge<2?actual[edge]!-hit[edge]!:hit[edge]!-actual[edge]!
        expect(margin).toBeGreaterThanOrEqual(0)
        expect(margin).toBeLessThanOrEqual(8)
      }
    }
  }
})
