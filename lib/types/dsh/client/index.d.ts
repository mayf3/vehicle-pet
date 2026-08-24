/**
 * Client entry (`./client` export): registers one additive `shell.overlay`
 * entry with stable id `vehicle-pet` through the pinned slot API
 * (CTR-OVERLAY-002). Every registration, dictionary, style, session
 * subscription, and observable owns a disposer through the plugin fiber, so
 * stop/uninstall leaves no live resource (CTR-OVERLAY-012). HMR/reload/
 * reinstall never double-register: the slot contribution is disposed with the
 * fiber and a fresh fiber re-registers exactly one entry.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
export type { VehiclePetInjected, VehiclePetOverlayProps } from './VehiclePetOverlay';
export type { ConversationLike, SessionBindingLike, SessionListLike, SessionSummaryLike, VehiclePetSessionsSource, } from './session-state-adapter';
//# sourceMappingURL=index.d.ts.map