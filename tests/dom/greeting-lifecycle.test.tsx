import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryBackingStore, MemoryPetStorageAdapter } from '../../src/engine'
import { MockProgressSource } from '../../src/prototype/MockProgressSource'
import { PetEngineProvider, usePetEngine } from '../../src/react'
import { fixturePackBundle } from '../helpers/fixtures'

const bundles = [fixturePackBundle()]
const defaultPackId = 'fixture-garden'

function GreetingProbe({ id }: { id: string }) {
  const { greeting, snapshot } = usePetEngine()
  return (
    <output data-testid={id} data-subject={snapshot.viewModel?.subjectId ?? ''}>
      {greeting?.localDay ?? 'none'}
    </output>
  )
}

function mountProbe(options: {
  id: string
  source: MockProgressSource
  storage: MemoryPetStorageAdapter
  now: () => Date
}) {
  return render(
    <PetEngineProvider
      bundles={bundles}
      defaultPackId={defaultPackId}
      storage={options.storage}
      source={options.source}
      now={options.now}
    >
      <GreetingProbe id={options.id} />
    </PetEngineProvider>,
  )
}

afterEach(() => cleanup())

describe('daily greeting lifecycle key', () => {
  it('rechecks after midnight on a later interaction instead of consuming a once-only listener', async () => {
    let now = new Date('2026-08-22T10:00:00Z')
    const source = new MockProgressSource()
    mountProbe({ id: 'greeting', source, storage: new MemoryPetStorageAdapter(), now: () => now })

    await waitFor(() => expect(screen.getByTestId('greeting')).toHaveTextContent('2026-08-22'))
    act(() => document.dispatchEvent(new PointerEvent('pointerdown')))

    now = new Date('2026-08-23T10:00:00Z')
    // No forced midnight transition.
    expect(screen.getByTestId('greeting')).toHaveTextContent('2026-08-22')
    act(() => document.dispatchEvent(new PointerEvent('pointerdown')))
    await waitFor(() => expect(screen.getByTestId('greeting')).toHaveTextContent('2026-08-23'))
  })

  it('gives a reset subject an independent greeting on the same local day', async () => {
    const now = () => new Date('2026-08-22T10:00:00Z')
    const source = new MockProgressSource()
    mountProbe({ id: 'greeting', source, storage: new MemoryPetStorageAdapter(), now })
    await waitFor(() => expect(screen.getByTestId('greeting')).toHaveTextContent('2026-08-22'))

    act(() => source.resetSubject())
    await waitFor(() => expect(screen.getByTestId('greeting')).toHaveAttribute('data-subject', 'subject-2'))
    await waitFor(() => expect(screen.getByTestId('greeting')).toHaveTextContent('2026-08-22'))
  })

  it('uses the atomic source-subject-day storage key across tabs and rechecks on visibility regain', async () => {
    let now = new Date('2026-08-22T10:00:00Z')
    const shared = createMemoryBackingStore()
    const sourceA = new MockProgressSource()
    const sourceB = new MockProgressSource()
    mountProbe({ id: 'tab-a', source: sourceA, storage: new MemoryPetStorageAdapter(shared), now: () => now })
    mountProbe({ id: 'tab-b', source: sourceB, storage: new MemoryPetStorageAdapter(shared), now: () => now })

    await waitFor(() => {
      const shown = ['tab-a', 'tab-b'].filter((id) => screen.getByTestId(id).textContent === '2026-08-22')
      expect(shown).toHaveLength(1)
    })

    now = new Date('2026-08-23T10:00:00Z')
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    await waitFor(() => {
      const shown = ['tab-a', 'tab-b'].filter((id) => screen.getByTestId(id).textContent === '2026-08-23')
      expect(shown).toHaveLength(1)
    })
  })
})
