import { Component, type ErrorInfo, type ReactNode } from 'react';
interface Props {
    children: ReactNode;
}
interface State {
    error: Error | null;
}
/**
 * Creator-facing failure surface for the pet preview route (CTR-OVERLAY-038
 * local preview): a broken pet pack, presentation, or asset must never
 * collapse the page into a silent blank screen. The boundary keeps the error
 * visible and names the two creator-owned recovery paths — pet:validate for
 * data errors and the Creator Kit docs for the preview contract.
 */
export declare class PreviewErrorBoundary extends Component<Props, State> {
    state: State;
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error, info: ErrorInfo): void;
    render(): ReactNode;
}
export {};
//# sourceMappingURL=PreviewErrorBoundary.d.ts.map