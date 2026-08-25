/**
 * PetSceneRenderer: the single generic renderer for every Pack (CTR-PET-007).
 * It renders the declarative plan within the mechanical DOM budget and maps
 * every whitelisted presentation preset to engine-owned visual semantics.
 */
export interface PetSceneRendererProps {
    /** Prototype-only fault injection: asset ids forced to render their fallback. */
    simulateFailAssetIds?: readonly string[];
    /** Compact hosts can own the activation control and render the subject non-interactively. */
    subjectInteractive?: boolean;
    /** Host-owned interaction count used for the same click-feedback presentation. */
    interactionCount?: number;
    /** A 112px host keeps the generic subject legible without changing its plan. */
    viewport?: 'scene' | 'compact';
    'aria-label'?: string;
}
export declare function PetSceneRenderer(props: PetSceneRendererProps): import("react").JSX.Element;
//# sourceMappingURL=PetSceneRenderer.d.ts.map