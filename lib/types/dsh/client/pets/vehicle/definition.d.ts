/**
 * Vehicle reference pet presentation (DSH_PET_OVERLAY_ADAPTER_V8 §17): the
 * bundled `engine-scene` reference implementation over the `autonomous-fleet`
 * journey. This file is per-pet bundled data wiring — the only place the
 * vehicle's own facts (name, grade policy, levels, behavior, speech, license)
 * are assembled. Generic runtime consumes it through `pets/bundled.ts`; no
 * overlay or Engine core may gain vehicle semantics.
 */
import type { PetPresentation } from '../types';
export declare const vehiclePresentation: PetPresentation;
//# sourceMappingURL=definition.d.ts.map