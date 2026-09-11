/**
 * Entire-snapshot validation for ProgressSnapshotV1 (CTR-PET-002, DEC-PET-012).
 * Any violation rejects the whole snapshot: no clamping, rounding, or partial application.
 */
import type { ProgressSnapshotV1 } from '../types/core';
export type SnapshotValidationResult = {
    ok: true;
    snapshot: ProgressSnapshotV1;
} | {
    ok: false;
    reason: string;
};
export declare function validateProgressSnapshot(candidate: unknown): SnapshotValidationResult;
//# sourceMappingURL=validate-snapshot.d.ts.map