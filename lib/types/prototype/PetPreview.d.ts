/**
 * Pet preview view (?petPreview=1): renders the REAL resident character
 * renderer (CharacterVisual) for every bundled pet — the same component the
 * DSH overlay mounts — with pet / expression / level / size selectors.
 * Closes the creator-preview gap (R5): "the journey shows" is not "my pet
 * shows". The engine context supplies the scene/asset data path only (zero
 * points from the mock source); no scheduler runs here — the engine's own
 * dev-local preference writes (e.g. active pack in IndexedDB) still apply.
 */
import { type ReactElement } from 'react';
export declare function PetPreviewView(): ReactElement;
//# sourceMappingURL=PetPreview.d.ts.map