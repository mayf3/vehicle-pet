/**
 * Deterministic preset semantics frozen by CONFIGURABLE_PET_ENGINE_V1 §10.
 */
import type { CameraPreset, DensityPreset, MilestonePresentationPreset, PlacementPreset, ScalePreset } from '../types/manifest';
export declare const MAX_NODES_PER_POPULATION = 32;
export declare const MAX_NODES_PER_PET_SCENE = 64;
export declare const SCALE_SUBJECT_PERMILLE: Record<ScalePreset, number>;
export declare const CAMERA_ZOOM_PERMILLE: Record<CameraPreset, number>;
export declare const DENSITY_LIMIT_MULTIPLIER: Record<DensityPreset, number>;
export declare function populationRenderLimit(density: DensityPreset): number;
/** Milestone node placement semantics (§10). */
export declare const MILESTONE_PLACEMENT: Record<MilestonePresentationPreset, {
    x: number;
    y: number;
}>;
/**
 * Deterministic placement formulas on the 10000×10000 scene box (§10).
 * `n` = nodes in the placement group, `i` = 0-based index; float64 math, floored.
 */
export declare function placementPoint(preset: PlacementPreset, i: number, n: number): {
    x: number;
    y: number;
};
//# sourceMappingURL=presets.d.ts.map