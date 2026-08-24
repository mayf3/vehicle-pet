/**
 * Validation for HostActivityEventV1 (CTR-PET-024, §9.4).
 * Events are local in-process input only; there is no transport here.
 */
import type { HostActivityEventV1 } from '../types/core';
export type HostEventValidationResult = {
    ok: true;
    event: HostActivityEventV1;
} | {
    ok: false;
    reason: string;
};
export declare function validateHostActivityEvent(candidate: unknown): HostEventValidationResult;
//# sourceMappingURL=validate-host-event.d.ts.map