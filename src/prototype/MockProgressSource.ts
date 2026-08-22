/**
 * MockProgressSource: the ONLY Progress Source registered in V1 (CTR-PET-001,
 * CTR-PET-020, DEC-PET-009). Entirely local and in-process; no network, model,
 * or Host transport is reachable from here.
 */

import type { ProgressSource } from '../engine'

export class MockProgressSource implements ProgressSource {
  readonly sourceId = 'mock-progress'
  private subjectCounter = 1
  private subjectId = 'subject-1'
  private points = 0
  private revision = 0
  private readonly listeners = new Set<(snapshot: unknown) => void>()

  constructor(initialPoints = 0) {
    this.points = initialPoints
  }

  subscribe(listener: (snapshot: unknown) => void): () => void {
    this.listeners.add(listener)
    listener(this.snapshot())
    return () => {
      this.listeners.delete(listener)
    }
  }

  addPoints(delta: number): void {
    this.points = this.points + delta
    this.revision++
    this.emit()
  }

  /** Exact input; regressions are still emitted so the engine's ordering rules are demonstrable. */
  setPoints(exact: number): void {
    this.points = exact
    this.revision++
    this.emit()
  }

  /** Re-emits the current snapshot unchanged (same revision) to demonstrate duplicate handling. */
  emitDuplicate(): void {
    this.emit()
  }

  /** Subject reset: a new subjectId starts a new growth journey namespace. */
  resetSubject(): void {
    this.subjectCounter++
    this.subjectId = `subject-${this.subjectCounter}`
    this.points = 0
    this.revision = 0
    this.emit()
  }

  get currentSubjectId(): string {
    return this.subjectId
  }

  private snapshot() {
    return {
      schemaVersion: 1 as const,
      sourceId: this.sourceId,
      subjectId: this.subjectId,
      progressPoints: this.points,
      revision: this.revision,
      observedAt: new Date().toISOString(),
    }
  }

  private emit(): void {
    const snapshot = this.snapshot()
    for (const listener of this.listeners) listener(snapshot)
  }
}
