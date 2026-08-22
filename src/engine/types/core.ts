/**
 * Core engine types for external inputs, localized text, and engine diagnostics.
 * Field-level shapes are frozen by CONFIGURABLE_PET_ENGINE_V1 §9.
 */

export type Locale = 'zh-CN' | 'en'

export interface LocalizedTextV1 {
  'zh-CN': string
  en?: string
}

export type HostActivityStatus = 'completed' | 'failed' | 'cancelled'

export interface ProgressSnapshotV1 {
  schemaVersion: 1
  sourceId: string
  subjectId: string
  progressPoints: number
  revision: number
  observedAt: string
}

export interface HostActivityEventV1 {
  schemaVersion: 1
  eventId: string
  activityId: string
  status: HostActivityStatus
  occurredAt: string
}

export type EngineState =
  | 'ready'
  | 'waiting-for-valid-progress'
  | 'pack-unavailable'

export interface EngineDiagnostic {
  readonly code: string
  readonly message: string
  readonly at: string
}

/** Framework-agnostic progress source contract; V1 registers only the prototype mock source. */
export interface ProgressSource {
  readonly sourceId: string
  subscribe(listener: (snapshot: unknown) => void): () => void
}
