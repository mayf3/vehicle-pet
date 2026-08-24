/**
 * HostActivityEventV1 handling (CTR-PET-024).
 * Local in-process injection only: no network, no model, no Host transport.
 * The same eventId feeds back at most once (first wins); duplicates emit a
 * diagnostic. Events never change progressPoints and never issue receipts.
 */
import type { EngineDiagnostic, HostActivityEventV1 } from '../types/core';
export interface HostFeedbackPresentation {
    eventId: string;
    activityId: string;
    status: HostActivityEventV1['status'];
    receivedAt: string;
}
export interface HostActivityDispatchResult {
    feedback: HostFeedbackPresentation | null;
    diagnostics: EngineDiagnostic[];
}
export declare class HostActivityDispatcher {
    private readonly seenEventIds;
    dispatch(candidate: unknown, now: () => Date): HostActivityDispatchResult;
}
//# sourceMappingURL=host-activity.d.ts.map