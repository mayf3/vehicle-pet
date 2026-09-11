/**
 * Frozen identifier and value patterns from CONFIGURABLE_PET_ENGINE_V1 §9.1.
 * These are duplicated mechanically inside the JSON Schema; the schema is the
 * pack-side authority and these constants drive engine-side input validation.
 */
export declare const ID_PATTERN: RegExp;
export declare const SOURCE_ID_PATTERN: RegExp;
export declare const SUBJECT_ID_PATTERN: RegExp;
export declare const EVENT_ID_PATTERN: RegExp;
export declare const ACTIVITY_ID_PATTERN: RegExp;
export declare const VERSION_PATTERN: RegExp;
export declare const TIMESTAMP_PATTERN: RegExp;
export declare const LOCAL_DAY_PATTERN: RegExp;
export declare const MAX_SAFE_INTEGER = 9007199254740991;
export declare function isSafeNonNegativeInteger(value: unknown): value is number;
export declare function isPlainObject(value: unknown): value is Record<string, unknown>;
export declare function hasNoUnknownFields(value: Record<string, unknown>, known: readonly string[]): boolean;
//# sourceMappingURL=patterns.d.ts.map