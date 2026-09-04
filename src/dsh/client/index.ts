/**
 * Client entry (`./client` export): registers one additive `shell.overlay`
 * entry with stable id `vehicle-pet` through the pinned slot API
 * (CTR-OVERLAY-002). Every registration, dictionary, style, session
 * subscription, and observable owns a disposer through the plugin fiber, so
 * stop/uninstall leaves no live resource (CTR-OVERLAY-012). HMR/reload/
 * reinstall never double-register: the slot contribution is disposed with the
 * fiber and a fresh fiber re-registers exactly one entry.
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only: declares `ctx.locale` (LocaleRuntime service) on Context.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { vehiclePetClientGeneration } from './build-generation'
import { createE2EResourceLedger } from './e2e-resource-ledger'
import { NS, en, zh } from './locales'
import { VehiclePetSessionAdapter, type VehiclePetSessionsSource } from './session-state-adapter'
import { adoptStyles } from './styles'
import { VehiclePetOverlay, type VehiclePetInjected } from './VehiclePetOverlay'

export const inject = ['slots', 'sessions', 'locale']

export function apply(ctx: ClientContext): void {
  const ledger = createE2EResourceLedger(vehiclePetClientGeneration)
  if (vehiclePetClientGeneration.startsWith('e2e-r3-disabled-')) return
  const untrackFiber = ledger.track('plugin-fiber')
  ctx.effect(() => () => { untrackFiber() }, 'vehicle-pet: e2e fiber ledger')

  // Structured session state only (CTR-OVERLAY-007/008): typed snapshots via
  // the injected sessions service; never DOM text/classes/observers.
  const sessions = ctx.sessions as unknown as VehiclePetSessionsSource
  const timerResources = new Map<unknown, () => void>()
  const adapter = new VehiclePetSessionAdapter(sessions, {
    trackResource: ledger.enabled ? ledger.track : undefined,
    setTimer: ledger.enabled
      ? (callback, delay) => {
          const untrack = ledger.track('timer')
          const handle = globalThis.setTimeout(() => {
            timerResources.delete(handle)
            untrack()
            callback()
          }, delay)
          timerResources.set(handle, untrack)
          return handle
        }
      : undefined,
    clearTimer: ledger.enabled
      ? handle => {
          globalThis.clearTimeout(handle as number)
          timerResources.get(handle)?.()
          timerResources.delete(handle)
        }
      : undefined,
  })
  ctx.effect(() => () => {
    adapter.dispose()
  }, 'vehicle-pet: session adapter')

  ctx.effect(() => {
    const untrack = ledger.track('locale-dictionary')
    const dispose = ctx.locale.register(NS, { zh, en })
    return () => {
      dispose()
      untrack()
    }
  }, 'vehicle-pet: dictionaries')

  ctx.effect(() => {
    const untrack = ledger.track('injected-style')
    const dispose = adoptStyles()
    return () => {
      dispose()
      untrack()
    }
  }, 'vehicle-pet: styles')

  ctx.slots.inject('shell.overlay', () => {
    const untrack = ledger.track('shell-overlay-slot')
    const dispose = ctx.slots.register({
      name: 'shell.overlay',
      id: 'vehicle-pet',
      order: 900,
      locale: NS,
      inject: (): VehiclePetInjected => ({
        usageSessions: sessions,
        hooks: {
          sessionView: adapter,
          locale: ctx.locale,
        },
        sessionBinding: adapter.getBindingInfo,
        clientGeneration: vehiclePetClientGeneration,
      }),
    }, VehiclePetOverlay)
    return () => {
      dispose()
      untrack()
    }
  })
}

export type { VehiclePetInjected, VehiclePetOverlayProps } from './VehiclePetOverlay'
export type {
  ConversationLike, SessionBindingLike, SessionListLike, SessionSummaryLike,
  VehiclePetSessionsSource,
} from './session-state-adapter'
