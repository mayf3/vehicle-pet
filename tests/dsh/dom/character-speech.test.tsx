import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useVehiclePetSpeech } from '../../../src/dsh/client/VehiclePetSpeech'
import { characterSpeechCatalog } from '../../../src/dsh/client/speech-catalog'
import type { CharacterId, VehiclePetSessionView } from '../../../src/dsh/client/types'

afterEach(()=>{cleanup();vi.useRealTimers()})
it('switches catalogs without resetting quiet, click cooldown, or replaying terminal edges',()=>{
  vi.useFakeTimers()
  const idle: VehiclePetSessionView={live:'idle',terminal:null}
  const {result,rerender}=renderHook(({id,view}:{id:CharacterId;view:VehiclePetSessionView})=>useVehiclePetSpeech({characterId:id,sessionView:view,locale:'zh-CN',enabled:true}),{initialProps:{id:'vehicle',view:idle}})
  act(()=>vi.advanceTimersByTime(31000))
  act(()=>result.current.speakForClick('idle'))
  const first=result.current.bubble
  expect(first).not.toBeNull()
  rerender({id:'companion',view:idle})
  act(()=>result.current.speakForClick('idle'))
  expect(result.current.bubble).toEqual(first)
  act(()=>vi.advanceTimersByTime(30001))
  act(()=>result.current.speakForClick('idle'))
  expect(characterSpeechCatalog('companion','zh-CN').some(l=>l.text===result.current.bubble?.text)).toBe(true)
  const terminal: VehiclePetSessionView={live:'idle',terminal:{identity:'s1#t1#4',status:'cancelled'}}
  rerender({id:'companion',view:terminal})
  const terminalBubble=result.current.bubble
  rerender({id:'vehicle',view:terminal})
  expect(result.current.bubble).toEqual(terminalBubble)
  act(()=>vi.advanceTimersByTime(4001))
  expect(result.current.bubble).toBeNull()
})
