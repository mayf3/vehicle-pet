/**
 * Overlay drag / keyboard movement / viewport clamping controller
 * (CTR-OVERLAY-003). Pointer drags have a threshold so a plain click never
 * counts as a drag and never toggles the panel; the active surface is clamped
 * inside the viewport; positions persist as normalized x/y ratios, never
 * absolute pixels. Viewport resize recomputes from the ratios.
 */
import { type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { type VehiclePetOverlayPreferences } from './types';
export interface OverlayBounds {
    readonly width: number;
    readonly height: number;
}
export interface OverlayPoint {
    readonly x: number;
    readonly y: number;
}
export interface UseOverlayDragOptions {
    readonly preferences: VehiclePetOverlayPreferences;
    readonly commitPreferences: (update: (current: VehiclePetOverlayPreferences) => VehiclePetOverlayPreferences) => void;
    /** Called after a real drag ended (never for a suppressed click). */
    readonly onDragEnd?: () => void;
}
export interface OverlayDragController {
    readonly rootRef: RefObject<HTMLDivElement>;
    readonly bounds: OverlayBounds;
    readonly point: OverlayPoint;
    readonly shellStyle: CSSProperties;
    readonly isDragging: boolean;
    /** True exactly once after a drag; consumes the flag so the click is ignored. */
    readonly consumeSuppressedClick: () => boolean;
    readonly moveByKeyboard: (dx: number, dy: number) => void;
    readonly onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    readonly onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    readonly onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
    readonly onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
}
export declare function useOverlayDrag({ preferences, commitPreferences, onDragEnd, }: UseOverlayDragOptions): OverlayDragController;
export declare const OVERLAY_KEYBOARD_STEPS: {
    readonly normal: 8;
    readonly large: 32;
};
//# sourceMappingURL=useOverlayDrag.d.ts.map