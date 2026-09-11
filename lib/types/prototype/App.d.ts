import { type PetStorageAdapter } from '../engine';
import { MockProgressSource } from './MockProgressSource';
export interface AppProps {
    source: MockProgressSource;
    storage: PetStorageAdapter;
    initialReducedMotion?: boolean;
    dev?: boolean;
    showcase?: boolean;
    petPreview?: boolean;
}
export declare function App(props: AppProps): import("react").JSX.Element;
//# sourceMappingURL=App.d.ts.map