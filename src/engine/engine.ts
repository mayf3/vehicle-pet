/**
 * The framework-agnostic Pet Engine runtime.
 *
 * Owns: snapshot ingestion with entire-snapshot rejection and ordering
 * (CTR-PET-002, CTR-PET-026), pure derivation, Pack lifecycle with atomic
 * switching and pack-unavailable (CTR-PET-005, CTR-PET-006, CTR-PET-025),
 * receipts and consume-before-play ceremonies (CTR-PET-012..CTR-PET-015),
 * keepsakes (CTR-PET-023), daily greeting (CTR-PET-028), Host activity
 * feedback (CTR-PET-024), and locale / reduced-motion handling.
 *
 * It persists neither an authoritative ProgressSnapshot nor a derived level;
 * the per-subject applied-snapshot runtime record used for ordering is
 * in-memory only and is neither of those.
 */

import type {
  EngineDiagnostic,
  EngineState,
  Locale,
  ProgressSnapshotV1,
} from './types/core'
import type { PetPackManifestV1 } from './types/manifest'
import type {
  PetViewModel,
  SceneRenderPlan,
  UnlockedKeepsakeKey,
  UpgradeReceipt,
} from './types/derived'
import { validateProgressSnapshot } from './validation/validate-snapshot'
import { derivePetViewModel, deriveProgress } from './progress/derive'
import { buildSceneRenderPlan } from './rendering/render-plan'
import type { PetStorageAdapter } from './storage/adapter'
import { computeLocalDay, receiptId } from './storage/keys'
import { PackRegistry, type PackBundleInput, type RegisteredPack } from './packs/registry'
import { createUpgradeReceipt, crossedLevelRange } from './presentation/receipts'
import { buildMergedCeremony, type CeremonyPlan } from './presentation/ceremony'
import {
  HostActivityDispatcher,
  type HostFeedbackPresentation,
} from './events/host-activity'
import { DEFAULT_LOCALE } from './localization'

export interface PetEngineOptions {
  bundles: PackBundleInput[]
  defaultPackId: string
  storage: PetStorageAdapter
  locale?: Locale
  reducedMotion?: boolean
  now?: () => Date
  requireBundledKeepsakes?: boolean
}

interface AppliedRecord {
  sourceId: string
  subjectId: string
  progressPoints: number
  revision: number
  observedAt: string
}

export interface EngineSnapshot {
  initialized: boolean
  state: EngineState
  activePack: RegisteredPack | null
  availablePacks: RegisteredPack[]
  defaultPackId: string
  viewModel: PetViewModel | null
  plan: SceneRenderPlan | null
  /** Presentation-time metadata for the current level's upgrade preset (§10). */
  stagePack: PetPackManifestV1 | null
  stageLevelId: string | null
  pendingReceipts: UpgradeReceipt[]
  unlockedKeepsakes: UnlockedKeepsakeKey[]
  hostFeedback: HostFeedbackPresentation | null
  diagnostics: EngineDiagnostic[]
  locale: Locale
  reducedMotion: boolean
  lastValidSnapshot: ProgressSnapshotV1 | null
}

const MAX_DIAGNOSTICS = 100

export class PetEngine {
  private readonly options: Required<Omit<PetEngineOptions, 'bundles' | 'storage' | 'defaultPackId'>>
  private readonly bundles: PackBundleInput[]
  private readonly storage: PetStorageAdapter
  private readonly defaultPackId: string
  private readonly registry: PackRegistry
  private readonly appliedBySubject = new Map<string, AppliedRecord>()
  private readonly hostDispatcher = new HostActivityDispatcher()
  private readonly listeners = new Set<() => void>()

  private initialized = false
  private state: EngineState = 'waiting-for-valid-progress'
  private activePack: RegisteredPack | null = null
  private localeValue: Locale
  private reducedMotionValue: boolean
  private lastValidSnapshot: ProgressSnapshotV1 | null = null
  private boundSourceId: string | null = null
  private presentationEpoch = 0
  private pendingReceipts: UpgradeReceipt[] = []
  private unlockedKeepsakes: UnlockedKeepsakeKey[] = []
  private hostFeedback: HostFeedbackPresentation | null = null
  private diagnostics: EngineDiagnostic[] = []
  private ops = new Set<Promise<unknown>>()
  private snapshotCache: EngineSnapshot | null = null

  constructor(options: PetEngineOptions) {
    this.options = {
      locale: options.locale ?? DEFAULT_LOCALE,
      reducedMotion: options.reducedMotion ?? false,
      now: options.now ?? (() => new Date()),
      requireBundledKeepsakes: options.requireBundledKeepsakes ?? true,
    }
    this.bundles = options.bundles
    this.storage = options.storage
    this.defaultPackId = options.defaultPackId
    this.localeValue = this.options.locale
    this.reducedMotionValue = this.options.reducedMotion
    const created = PackRegistry.create(this.bundles, this.options.now, this.options.requireBundledKeepsakes)
    this.registry = created.registry
    this.pushDiagnostics(created.diagnostics)
  }

  async initialize(): Promise<void> {
    const persisted = await this.storage.getActivePackId().catch(() => null)
    const defaultPack = this.registry.get(this.defaultPackId)
    let candidateId = persisted ?? this.defaultPackId
    let pack = defaultPack === undefined ? undefined : this.registry.get(candidateId)
    if (defaultPack !== undefined && pack === undefined) {
      this.pushDiagnostic(
        'pack-startup-invalid',
        `startup pack ${candidateId} is invalid or missing; falling back to ${this.defaultPackId}`,
      )
      candidateId = this.defaultPackId
      pack = defaultPack
    }
    if (pack !== undefined) {
      this.activePack = pack
      await this.storage.setActivePackId(pack.manifest.packId).catch(() => undefined)
      this.track(this.refreshKeepsakes())
    } else {
      this.activePack = null
      this.state = 'pack-unavailable'
      this.pushDiagnostic(
        'pack-unavailable',
        'no valid pack is available (default pack invalid); entering pack-unavailable',
      )
    }
    this.initialized = true
    this.notify()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot(): EngineSnapshot {
    if (this.snapshotCache === null) {
      this.snapshotCache = {
        initialized: this.initialized,
        state: this.state,
        activePack: this.activePack,
        availablePacks: this.registry.list(),
        defaultPackId: this.defaultPackId,
        viewModel: this.buildViewModel(),
        plan: this.buildPlan(),
        stagePack: this.activePack?.manifest ?? null,
        stageLevelId: this.viewModelLevelId(),
        pendingReceipts: [...this.pendingReceipts],
        unlockedKeepsakes: [...this.unlockedKeepsakes],
        hostFeedback: this.hostFeedback,
        diagnostics: [...this.diagnostics],
        locale: this.localeValue,
        reducedMotion: this.reducedMotionValue,
        lastValidSnapshot: this.lastValidSnapshot,
      }
    }
    return this.snapshotCache
  }

  // --- snapshot ingestion ---------------------------------------------------

  ingestSnapshot(candidate: unknown): void {
    const validation = validateProgressSnapshot(candidate)
    if (!validation.ok) {
      this.pushDiagnostic('invalid-snapshot', `snapshot rejected entire: ${validation.reason}`)
      this.notify()
      return
    }
    const snapshot = validation.snapshot
    const applied = this.appliedBySubject.get(snapshot.subjectId)

    if (this.boundSourceId !== null && this.boundSourceId !== snapshot.sourceId) {
      this.pushDiagnostic(
        'source-mismatch',
        `sourceId changed mid-session from ${this.boundSourceId} to ${snapshot.sourceId}; configuration error, snapshot rejected`,
      )
      this.notify()
      return
    }

    if (applied !== undefined) {
      if (snapshot.revision <= applied.revision) {
        const kind = snapshot.revision === applied.revision ? 'duplicate/conflict revision' : 'stale revision'
        this.pushDiagnostic(
          'stale-snapshot',
          `snapshot with ${kind} ${snapshot.revision} (applied ${applied.revision}) ignored`,
        )
        this.notify()
        return
      }
      if (snapshot.progressPoints < applied.progressPoints) {
        this.pushDiagnostic(
          'regressing-points',
          `snapshot with progressPoints ${snapshot.progressPoints} < applied ${applied.progressPoints} ignored`,
        )
        this.notify()
        return
      }
    }

    const isFirstForSubject = applied === undefined
    const isSubjectReset = this.lastValidSnapshot !== null && this.lastValidSnapshot.subjectId !== snapshot.subjectId
    if (this.boundSourceId === null) this.boundSourceId = snapshot.sourceId
    if (isSubjectReset) this.invalidatePendingPresentation()
    this.appliedBySubject.set(snapshot.subjectId, {
      sourceId: snapshot.sourceId,
      subjectId: snapshot.subjectId,
      progressPoints: snapshot.progressPoints,
      revision: snapshot.revision,
      observedAt: snapshot.observedAt,
    })
    this.lastValidSnapshot = snapshot

    const pack = this.activePack
    if (pack === null || this.state === 'pack-unavailable') {
      // Progress is retained; derivation resumes when a valid pack is active.
      this.notify()
      return
    }

    if (isFirstForSubject) {
      this.establishBaseline(pack, snapshot)
      // A new subject is a new keepsake namespace; refresh the visible set.
      this.track(this.refreshKeepsakes())
    } else {
      this.issueCrossings(pack, applied!, snapshot)
    }

    this.state = 'ready'
    this.notify()
  }

  /** Marks every non-initial level up to the derived level as already presented (no replay). */
  private establishBaseline(pack: RegisteredPack, snapshot: ProgressSnapshotV1): void {
    const { levelIndex } = deriveProgress(snapshot.progressPoints, pack.manifest)
    for (const levelIdx of crossedLevelRange(0, levelIndex - 1)) {
      const level = pack.manifest.levels[levelIdx]
      if (level === undefined) continue
      const id = receiptId(
        snapshot.sourceId,
        snapshot.subjectId,
        pack.manifest.packId,
        pack.manifest.packVersion,
        level.levelId,
      )
      this.track(
        this.storage
          .claimReceipt(snapshot.sourceId, snapshot.subjectId, id)
          .then(() => undefined)
          .catch(() => {
            this.pushDiagnostic('storage-error', `baseline claim failed for ${id}; continuing`)
          }),
      )
    }
  }

  /** Issues receipts and keepsake unlocks for a forward crossing. */
  private issueCrossings(
    pack: RegisteredPack,
    previous: AppliedRecord,
    snapshot: ProgressSnapshotV1,
  ): void {
    const before = deriveProgress(previous.progressPoints, pack.manifest)
    const after = deriveProgress(snapshot.progressPoints, pack.manifest)
    if (after.levelIndex <= before.levelIndex) {
      this.notify()
      return
    }
    const issuedAt = this.options.now().toISOString()
    const newReceipts: UpgradeReceipt[] = []
    let fromIndex = before.levelIndex - 1
    for (const levelIdx of crossedLevelRange(before.levelIndex - 1, after.levelIndex - 1)) {
      const toLevel = pack.manifest.levels[levelIdx]!
      const fromLevel = pack.manifest.levels[fromIndex]!
      newReceipts.push(
        createUpgradeReceipt({
          sourceId: snapshot.sourceId,
          subjectId: snapshot.subjectId,
          packId: pack.manifest.packId,
          packVersion: pack.manifest.packVersion,
          fromLevelId: fromLevel.levelId,
          toLevelId: toLevel.levelId,
          revision: snapshot.revision,
          issuedAt,
        }),
      )
      if (toLevel.keepsakeId !== undefined) {
        const keepsakeId = toLevel.keepsakeId
        this.track(
          this.storage
            .unlockKeepsake({
              sourceId: snapshot.sourceId,
              subjectId: snapshot.subjectId,
              packId: pack.manifest.packId,
              packVersion: pack.manifest.packVersion,
              keepsakeId,
            })
            .then(() => this.refreshKeepsakes())
            .catch(() => {
              this.pushDiagnostic('storage-error', `keepsake unlock failed for ${keepsakeId}`)
            }),
        )
      }
      fromIndex = levelIdx
    }
    if (newReceipts.length > 0) {
      this.pendingReceipts = [...this.pendingReceipts, ...newReceipts]
    }
  }

  // --- pack lifecycle ---------------------------------------------------------

  async setActivePack(packId: string): Promise<boolean> {
    const pack = this.registry.get(packId)
    if (pack === undefined) {
      this.pushDiagnostic('pack-switch-rejected', `switch to ${packId} rejected: pack invalid or unknown`)
      this.notify()
      return false
    }
    if (
      this.activePack !== null &&
      this.activePack.manifest.packId === pack.manifest.packId &&
      this.activePack.manifest.packVersion === pack.manifest.packVersion
    ) {
      return true
    }
    this.invalidatePendingPresentation()
    this.activePack = pack
    if (this.state === 'pack-unavailable') {
      this.state = this.lastValidSnapshot !== null ? 'ready' : 'waiting-for-valid-progress'
    }
    // Silent switch/version change: render immediately, current level already presented.
    const snapshot = this.lastValidSnapshot
    if (snapshot !== null) {
      this.establishBaseline(pack, snapshot)
    }
    await this.storage.setActivePackId(pack.manifest.packId).catch(() => {
      this.pushDiagnostic('storage-error', 'failed to persist activePackId preference')
    })
    this.track(this.refreshKeepsakes())
    this.notify()
    return true
  }

  // --- presentation claims ------------------------------------------------------

  /** Consume-before-play: atomically claims the deterministic receipt batch before any ceremony. */
  async claimPendingCeremony(): Promise<{ receipts: UpgradeReceipt[]; plan: CeremonyPlan } | null> {
    const receipts = [...this.pendingReceipts]
    const pack = this.activePack
    if (receipts.length === 0 || pack === null) {
      this.pendingReceipts = []
      return null
    }
    const snapshot = this.lastValidSnapshot
    const outsideActiveDomain =
      snapshot === null ||
      receipts.some(
        (receipt) =>
          receipt.sourceId !== snapshot.sourceId ||
          receipt.subjectId !== snapshot.subjectId ||
          receipt.packId !== pack.manifest.packId ||
          receipt.packVersion !== pack.manifest.packVersion,
      )
    if (outsideActiveDomain) {
      this.invalidatePendingPresentation()
      this.notify()
      return null
    }

    const epoch = this.presentationEpoch
    this.pendingReceipts = []
    this.notify()
    const first = receipts[0]!
    try {
      const result = await this.storage.claimReceiptBatch(
        first.sourceId,
        first.subjectId,
        receipts.map((receipt) => receipt.receiptId),
      )
      if (result === 'lost' || epoch !== this.presentationEpoch) return null
    } catch {
      // Storage failure may skip this celebration but must never duplicate it.
      this.pushDiagnostic('storage-error', `batch claim failed for ${receipts.length} receipt(s); skipping ceremony`)
      return null
    }

    const plan = buildMergedCeremony(receipts, pack.manifest, this.localeValue)
    return plan === null ? null : { receipts, plan }
  }

  completeCeremony(): void {
    // The claimed batch was removed before its atomic claim; do not erase receipts
    // that may have arrived while that ceremony was playing.
    this.notify()
  }

  /** At-most-once daily greeting per (sourceId, subjectId, localDay). */
  async claimDailyGreeting(): Promise<{ localDay: string } | null> {
    const snapshot = this.lastValidSnapshot
    if (snapshot === null) return null
    const localDay = computeLocalDay(this.options.now())
    try {
      const result = await this.storage.claimGreetingDay(snapshot.sourceId, snapshot.subjectId, localDay)
      return result === 'won' ? { localDay } : null
    } catch {
      this.pushDiagnostic('storage-error', 'greeting claim failed; skipping greeting without duplicate')
      return null
    }
  }

  // --- host activity ------------------------------------------------------------

  dispatchHostActivity(candidate: unknown): HostFeedbackPresentation | null {
    const result = this.hostDispatcher.dispatch(candidate, this.options.now)
    this.pushDiagnostics(result.diagnostics)
    if (result.feedback !== null) {
      this.hostFeedback = result.feedback
      this.notify()
    } else if (result.diagnostics.length > 0) {
      this.notify()
    }
    return result.feedback
  }

  clearHostFeedback(): void {
    if (this.hostFeedback !== null) {
      this.hostFeedback = null
      this.notify()
    }
  }

  // --- preferences ---------------------------------------------------------------

  setLocale(locale: Locale): void {
    if (this.localeValue === locale) return
    this.localeValue = locale
    this.notify()
  }

  setReducedMotion(reduced: boolean): void {
    if (this.reducedMotionValue === reduced) return
    this.reducedMotionValue = reduced
    this.notify()
  }

  /** Waits for all tracked async side effects (tests and deterministic flows). */
  async settled(): Promise<void> {
    while (this.ops.size > 0) {
      const current = [...this.ops]
      await Promise.allSettled(current)
      for (const op of current) this.ops.delete(op)
    }
  }

  // --- internals -------------------------------------------------------------------

  private buildViewModel(): PetViewModel | null {
    const snapshot = this.lastValidSnapshot
    const pack = this.activePack
    if (snapshot === null || pack === null) return null
    return derivePetViewModel({
      sourceId: snapshot.sourceId,
      subjectId: snapshot.subjectId,
      progressPoints: snapshot.progressPoints,
      revision: snapshot.revision,
      pack: pack.manifest,
      locale: this.localeValue,
      reducedMotion: this.reducedMotionValue,
    })
  }

  private buildPlan(): SceneRenderPlan | null {
    const snapshot = this.lastValidSnapshot
    const pack = this.activePack
    if (snapshot === null || pack === null) return null
    const derived = deriveProgress(snapshot.progressPoints, pack.manifest)
    return buildSceneRenderPlan({
      manifest: pack.manifest,
      level: derived.level,
      locale: this.localeValue,
    })
  }

  private viewModelLevelId(): string | null {
    const viewModel = this.buildViewModel()
    return viewModel?.derivedLevelId ?? null
  }

  private async refreshKeepsakes(): Promise<void> {
    const snapshot = this.lastValidSnapshot
    if (snapshot === null) return
    try {
      const unlocked = await this.storage.listUnlockedKeepsakes(snapshot.sourceId, snapshot.subjectId)
      const activeIdentity = this.activePack?.manifest
      this.unlockedKeepsakes = activeIdentity === undefined
        ? unlocked
        : unlocked.filter(
            (key) => key.packId !== activeIdentity.packId || key.packVersion === activeIdentity.packVersion,
          )
      this.notify()
    } catch {
      this.pushDiagnostic('storage-error', 'failed to list unlocked keepsakes')
    }
  }

  private invalidatePendingPresentation(): void {
    this.presentationEpoch++
    this.pendingReceipts = []
  }

  private track(op: Promise<unknown>): void {
    this.ops.add(op)
    void op.finally(() => {
      this.ops.delete(op)
    })
  }

  private pushDiagnostics(diagnostics: EngineDiagnostic[]): void {
    if (diagnostics.length === 0) return
    this.diagnostics = [...this.diagnostics, ...diagnostics].slice(-MAX_DIAGNOSTICS)
    this.notify()
  }

  private pushDiagnostic(code: string, message: string): void {
    this.pushDiagnostics([{ code, message, at: this.options.now().toISOString() }])
  }

  private notify(): void {
    this.snapshotCache = null
    for (const listener of this.listeners) listener()
  }
}
