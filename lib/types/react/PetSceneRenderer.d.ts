/**
 * PetSceneRenderer: the single generic renderer for every Pack (CTR-PET-007).
 * It renders the declarative plan within the mechanical DOM budget and maps
 * every whitelisted presentation preset to engine-owned visual semantics.
 */
import { type ReactNode } from 'react';
export interface PetSceneRendererProps {
    /** Prototype-only fault injection: asset ids forced to render their fallback. */
    simulateFailAssetIds?: readonly string[];
    /** Compact hosts can own the activation control and render the subject non-interactively. */
    subjectInteractive?: boolean;
    /** Host-owned interaction count used for the same click-feedback presentation. */
    interactionCount?: number;
    /** Host presentation only; the same RenderPlan remains authoritative. */
    presentationMode?: 'standalone' | 'full-journey' | 'compact-overlay';
    /**
     * Optional host-owned decoration rendered inside the subject box after the
     * subject asset (e.g. the DSH overlay session-expression layer). It is
     * plain presentation: the RenderPlan, schema, and Pack data stay
     * authoritative, and the host element keeps its own pointer/focus surface.
     */
    subjectOverlay?: ReactNode;
    'aria-label'?: string;
}
export declare function PetSceneRenderer(props: PetSceneRendererProps): import("react").JSX.Element;
//# sourceMappingURL=PetSceneRenderer.d.ts.map