/**
 * Pure level derivation (DEC-PET-001, CLM-PET-001).
 * Level and within-level progress are derived only from the last applied valid
 * snapshot plus the active Pack; nothing here is persisted.
 */
import type { Locale } from '../types/core';
import type { LevelDefinition, PetPackManifestV1 } from '../types/manifest';
import type { PetViewModel } from '../types/derived';
export interface DerivedProgress {
    level: LevelDefinition;
    levelIndex: number;
    withinLevelEarned: number;
    withinLevelSpan: number;
    nextLevelId: string | null;
    remainingPoints: number;
    capped: boolean;
}
export declare function deriveLevel(points: number, pack: PetPackManifestV1): {
    level: LevelDefinition;
    levelIndex: number;
};
export declare function deriveProgress(points: number, pack: PetPackManifestV1): DerivedProgress;
export interface DeriveViewModelInput {
    sourceId: string;
    subjectId: string;
    progressPoints: number;
    revision: number;
    pack: PetPackManifestV1;
    locale: Locale;
    reducedMotion: boolean;
}
export declare function derivePetViewModel(input: DeriveViewModelInput): PetViewModel;
//# sourceMappingURL=derive.d.ts.map