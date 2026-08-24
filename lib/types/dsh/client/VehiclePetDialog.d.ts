/**
 * VehiclePetDialog: the in-Harness full journey dialog (CTR-OVERLAY-005).
 * Opens inside the same React slot subtree and reuses the existing React
 * product surface (scene, progress, milestones, keepsakes, greeting,
 * ceremony). Accessible: role="dialog", accessible name, focus moves in on
 * open, Escape and a close button close it, focus is constrained inside, and
 * focus returns to the triggering control. The background is covered so it
 * cannot be interacted with while open. Closing changes no progression.
 */
import { type ReactElement } from 'react';
export interface VehiclePetDialogProps {
    readonly onClose: () => void;
}
export declare function VehiclePetDialog({ onClose }: VehiclePetDialogProps): ReactElement;
//# sourceMappingURL=VehiclePetDialog.d.ts.map