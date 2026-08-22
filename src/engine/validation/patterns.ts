/**
 * Frozen identifier and value patterns from CONFIGURABLE_PET_ENGINE_V1 §9.1.
 * These are duplicated mechanically inside the JSON Schema; the schema is the
 * pack-side authority and these constants drive engine-side input validation.
 */

export const ID_PATTERN = /^[a-z][a-z0-9-]{0,63}$/
export const SOURCE_ID_PATTERN = /^[a-z][a-z0-9-]{0,63}$/
export const SUBJECT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/
export const EVENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/
export const ACTIVITY_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/
export const VERSION_PATTERN = /^([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)$/
export const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/
export const LOCAL_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const MAX_SAFE_INTEGER = 9007199254740991

export function isSafeNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function hasNoUnknownFields(value: Record<string, unknown>, known: readonly string[]): boolean {
  return Object.keys(value).every((key) => known.includes(key))
}
