import { useCallback, useEffect, useRef, useState } from 'react'
import type { VehiclePetExpressionState, VehiclePetExpressionVariant } from './expressions'
import type { CharacterId } from './types'

export const PLAYFUL_REACTIONS = [
  { id: 'wave', variant: 'idle-happy', decoration: 'hello' },
  { id: 'wink', variant: 'completed-proud', decoration: 'star' },
  { id: 'bounce', variant: 'completed', decoration: 'notes' },
  { id: 'peek', variant: 'idle-curious', decoration: 'question' },
  { id: 'shy', variant: 'cancelled', decoration: 'heart' },
  { id: 'sleepy', variant: 'idle-sleepy', decoration: 'sleep' },
  { id: 'proud', variant: 'completed-proud', decoration: 'sparkles' },
  { id: 'nod', variant: 'idle-happy', decoration: 'flower' },
] as const satisfies readonly { id: string; variant: VehiclePetExpressionVariant; decoration: string }[]
type Reaction = typeof PLAYFUL_REACTIONS[number]
interface Context {
  state: VehiclePetExpressionState
  terminalIdentity: string | null
  characterId: CharacterId
  menuOpen: boolean
  dragging: boolean
  ambientKey: number | null
}

export function usePlayfulReaction(context: Context) {
  const [reaction, setReaction] = useState<{ definition: Reaction; key: number; motionAllowed: boolean } | null>(null)
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const latest = useRef(context)
  latest.current = context
  const next = useRef(0)
  const serial = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const previous = useRef({ signature: `${context.state}:${context.terminalIdentity ?? ''}`, character: context.characterId })
  const previousAmbient = useRef(context.ambientKey)
  const cancel = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = undefined
    setReaction(null)
  }, [])
  const start = useCallback((definition: Reaction) => {
    const current = latest.current
    if (document.hidden || current.menuOpen || current.dragging) return
    clearTimeout(timer.current)
    setReaction({ definition, key: ++serial.current, motionAllowed: !(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false) })
    timer.current = setTimeout(() => { setReaction(null); timer.current = undefined }, 2400)
  }, [])
  const play = useCallback(() => {
    if (latest.current.state !== 'idle') return
    start(PLAYFUL_REACTIONS[next.current++ % PLAYFUL_REACTIONS.length]!)
  }, [start])

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!media) return
    const update = () => {
      setReduced(media.matches)
      // Restoring motion may animate future input, never replay this reaction.
      if (media.matches) setReaction(current => current ? { ...current, motionAllowed: false } : null)
    }
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    const hide = () => { if (document.hidden) cancel() }
    document.addEventListener('visibilitychange', hide)
    return () => { document.removeEventListener('visibilitychange', hide); clearTimeout(timer.current) }
  }, [cancel])
  useEffect(() => {
    const signature = `${context.state}:${context.terminalIdentity ?? ''}`
    const changed = previous.current.signature !== signature
    const switched = previous.current.character !== context.characterId
    previous.current = { signature, character: context.characterId }
    if (changed || switched || context.menuOpen || context.dragging) cancel()
    if (changed && !switched && context.state !== 'idle') {
      const index = context.state === 'completed' ? 2 : context.state === 'needs-input' ? 3 : context.state === 'working' ? 7 : 4
      start(PLAYFUL_REACTIONS[index]!)
    }
  }, [context.state, context.terminalIdentity, context.characterId, context.menuOpen, context.dragging, cancel, start])
  useEffect(() => {
    const changed = previousAmbient.current !== context.ambientKey
    previousAmbient.current = context.ambientKey
    if (changed && context.ambientKey !== null) play()
  }, [context.ambientKey, play])
  return { reaction, reduced: reduced || reaction?.motionAllowed === false, play, cancel }
}

export function ReactionDecoration({ kind }: { kind: Reaction['decoration'] }) {
  return <svg className="vpo-reactionDecoration" viewBox="0 0 48 48" aria-hidden="true" data-reaction-decoration={kind}>
    {kind === 'heart' ? <path d="M24 39 7 23C-3 11 13 1 24 14 35 1 51 11 41 23Z" fill="#ef88b1" stroke="white" strokeWidth="3" />
      : kind === 'star' || kind === 'sparkles' ? <g fill="#f1c657" stroke="white" strokeWidth="2"><path d="m24 3 5 14 15 1-12 10 4 15-12-8-12 8 4-15L4 18l15-1Z" />{kind === 'sparkles' && <path d="m6 2 2 5 5 2-5 2-2 5-2-5-4-2 4-2Z" fill="#5cb9c5" />}</g>
      : kind === 'flower' ? <g fill="#85ccd1" stroke="white" strokeWidth="2"><circle cx="24" cy="12" r="9"/><circle cx="36" cy="24" r="9"/><circle cx="24" cy="36" r="9"/><circle cx="12" cy="24" r="9"/><circle cx="24" cy="24" r="8" fill="#ffe48b"/></g>
      : <text x="24" y="33" textAnchor="middle" fill="#439cad" stroke="white" strokeWidth="3" paintOrder="stroke" fontSize={kind === 'sleep' ? 22 : 34} fontFamily="system-ui" fontWeight="700">{kind === 'question' ? '?' : kind === 'sleep' ? 'zZ' : kind === 'notes' ? '♪' : '✦'}</text>}
  </svg>
}
