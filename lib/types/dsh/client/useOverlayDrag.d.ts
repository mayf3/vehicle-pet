/**
 * Overlay drag / keyboard movement / viewport clamping controller
 * (V3 CTR-OVERLAY-003). Ratios always describe the user's pet/launcher anchor.
 * An open secondary menu temporarily projects that anchor through the complete
 * active Pet + gap + Menu surface, flips the Menu, and clamps the final union.
 */
import { type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { type VehiclePetOverlayPreferences, type VehiclePetSize } from './types';
export interface OverlayBounds {
    readonly width: number;
    readonly height: number;
}
export interface OverlayPoint {
    readonly x: number;
    readonly y: number;
}
export interface PanelPlacement {
    readonly horizontal: 'left' | 'right';
    readonly vertical: 'above' | 'below';
}
export interface ActiveSurfaceBounds {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
}
export interface CompleteActiveSurfaceLayout {
    readonly point: OverlayPoint;
    readonly panelPlacement: PanelPlacement;
    readonly activeBounds: ActiveSurfaceBounds;
}
export interface UseOverlayDragOptions {
    readonly preferences: VehiclePetOverlayPreferences;
    readonly menuOpen: boolean;
    readonly commitPreferences: (update: (current: VehiclePetOverlayPreferences) => VehiclePetOverlayPreferences) => void;
    /** Called after a real drag ended (never for a suppressed click). */
    readonly onDragEnd?: () => void;
}
export interface OverlayDragController {
    readonly rootRef: RefObject<HTMLDivElement>;
    readonly menuRef: RefObject<HTMLElement | null>;
    readonly bounds: OverlayBounds;
    readonly point: OverlayPoint;
    readonly panelPlacement: PanelPlacement;
    readonly activeBounds: ActiveSurfaceBounds;
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
/**
 * Deterministic composer- and coexistence-safe default (V3 CTR-OVERLAY-003).
 * No Harness DOM, route, copy, CSS-class, or other-plugin inspection
 * participates in production placement: the LARGE default reserves the
 * recorded coexistence footprint constant from OVERLAY_GEOMETRY.
 */
export declare function defaultBottomSafeInsetPx(size: VehiclePetSize): number;
export declare function pointFromRatios(preferences: VehiclePetOverlayPreferences, bounds: OverlayBounds, size: number): OverlayPoint;
/**
 * Resolve and clamp the complete active surface without mutating the persisted
 * anchor. `horizontal=left` means the Menu grows right from the Pet's left;
 * `horizontal=right` means it grows left from the Pet's right.
 */
export declare function resolveCompleteActiveSurfaceLayout(anchor: OverlayPoint, viewport: OverlayBounds, surfaceSize: number, menuOpen: boolean, menuSize: OverlayBounds, preferred: PanelPlacement): CompleteActiveSurfaceLayout;
/**
 * Apply one pointer/keyboard delta from the currently rendered Pet anchor.
 * This is deliberately distinct from the latent preference anchor: an open
 * menu may project that preference to keep the full Pet + Menu union visible,
 * and the first real input must start from that projected on-screen position.
 */
export declare function moveCompleteActiveSurface(renderedPoint: OverlayPoint, delta: OverlayPoint, viewport: OverlayBounds, surfaceSize: number, menuOpen: boolean, menuSize: OverlayBounds, currentPlacement: PanelPlacement): CompleteActiveSurfaceLayout;
export declare function useOverlayDrag({ preferences, menuOpen, commitPreferences, onDragEnd, }: UseOverlayDragOptions): OverlayDragController;
export declare const OVERLAY_KEYBOARD_STEPS: {
    readonly normal: 8;
    readonly large: 32;
};
//# sourceMappingURL=useOverlayDrag.d.ts.map