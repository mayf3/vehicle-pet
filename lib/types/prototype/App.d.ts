/**
 * Prototype shell App: the V1 Host. Runs only on MockProgressSource and the
 * build-time bundled registry; no network, model, or Host transport exists.
 */
import { type PetStorageAdapter } from '../engine';
import { MockProgressSource } from './MockProgressSource';
export interface AppProps {
    source: MockProgressSource;
    storage: PetStorageAdapter;
    initialReducedMotion?: boolean;
    dev?: boolean;
    showcase?: boolean;
}
export declare function App(props: AppProps): import("react").JSX.Element;
//# sourceMappingURL=App.d.ts.map