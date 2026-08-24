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
import { NS, en, zh } from './locales'
import { VehiclePetSessionAdapter, type VehiclePetSessionsSource } from './session-state-adapter'
import { adoptStyles } from './styles'
import { VehiclePetOverlay, type VehiclePetInjected } from './VehiclePetOverlay'

export const inject = ['slots', 'sessions', 'locale']

export function apply(ctx: ClientContext): void {
  // Structured session state only (CTR-OVERLAY-007/008): typed snapshots via
  // the injected sessions service; never DOM text/classes/observers.
  const sessions = ctx.sessions as unknown as VehiclePetSessionsSource
  const adapter = new VehiclePetSessionAdapter(sessions)
  ctx.effect(() => () => {
    adapter.dispose()
  }, 'vehicle-pet: session adapter')

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'vehicle-pet: dictionaries')

  ctx.effect(() => adoptStyles(), 'vehicle-pet: styles')

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'vehicle-pet',
    order: 900,
    locale: NS,
    inject: (): VehiclePetInjected => ({
      hooks: {
        sessionView: adapter,
        locale: ctx.locale,
      },
    }),
  }, VehiclePetOverlay))
}

export type { VehiclePetInjected, VehiclePetOverlayProps } from './VehiclePetOverlay'
export type {
  ConversationLike, SessionBindingLike, SessionListLike, SessionSummaryLike,
  VehiclePetSessionsSource,
} from './session-state-adapter'
