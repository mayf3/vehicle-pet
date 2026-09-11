import keepsakeVersionAliases from '../packs/keepsake-compatibility.json'
/**
 * Prototype shell App: the V1 Host. Runs only on MockProgressSource and the
 * build-time bundled registry; no network, model, or Host transport exists.
 */

import { useEffect, useMemo, useState } from 'react'
import { PetEngine, MemoryPetStorageAdapter, type PetStorageAdapter } from '../engine'
import {
  DailyGreeting,
  HostActivityFeedback,
  LocaleSelector,
  PackSelector,
  PetEngineProvider,
  PetKeepsakeCollection,
  PetMilestonePanel,
  PetProgressPanel,
  PetSceneRenderer,
  UpgradeCeremony,
  usePetEngine,
} from '../react'
import { MockProgressSource } from './MockProgressSource'
import { ShowcaseView } from './showcase'
import { PetPreviewView } from './PetPreview'
import { bundledPackBundles, defaultPackId } from '../packs/bundledRegistry'

export interface AppProps {
  source: MockProgressSource
  storage: PetStorageAdapter
  initialReducedMotion?: boolean
  dev?: boolean
  showcase?: boolean
  petPreview?: boolean
}

export function App(props: AppProps) {
  const { source, storage } = props
  const bundles = useMemo(() => bundledPackBundles, [])

  if (props.showcase === true) {
    return <ShowcaseView bundles={bundles} locale="zh-CN" />
  }

  if (props.petPreview === true) {
    return <PetPreviewView />
  }

  return (
    <PetEngineProvider
      keepsakeVersionAliases={keepsakeVersionAliases}
      bundles={bundles}
      defaultPackId={defaultPackId}
      storage={storage}
      source={source}
      reducedMotion={props.initialReducedMotion}
    >
      <Shell source={source} storage={storage} dev={props.dev === true} />
    </PetEngineProvider>
  )
}

function Shell({ source, storage, dev }: { source: MockProgressSource; storage: PetStorageAdapter; dev: boolean }) {
  const { snapshot, dispatchHostActivity, setReducedMotion } = usePetEngine()
  const [exactPoints, setExactPoints] = useState('0')
  const [failSubjectAsset, setFailSubjectAsset] = useState(false)
  const [journalView, setJournalView] = useState<string[] | null>(null)
  const [showPackUnavailableDemo, setShowPackUnavailableDemo] = useState(false)
  const [packUnavailableState, setPackUnavailableState] = useState<string>('')

  useEffect(() => {
    if (!showPackUnavailableDemo || packUnavailableState !== '') return
    let cancelled = false
    void (async () => {
      // A throwaway engine over an invalid default-pack registry demonstrates
      // the explicit pack-unavailable terminal path using the public engine API.
      const engine = new PetEngine({
        bundles: [
          { manifestCandidate: { schemaVersion: 1, packId: 'broken-pack' }, resolveAssetUrl: () => undefined },
        ],
        defaultPackId: 'autonomous-fleet',
        storage: new MemoryPetStorageAdapter(),
      })
      await engine.initialize()
      if (!cancelled) setPackUnavailableState(engine.getSnapshot().state)
    })()
    return () => {
      cancelled = true
    }
  }, [showPackUnavailableDemo, packUnavailableState])

  const viewModel = snapshot.viewModel

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 16px 80px', display: 'grid', gap: 16 }}>
      <header className="vp-product-header" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 className="vp-product-title" style={{ fontSize: 20, margin: 0 }}>Vehicle Pet</h1>
        <span className="vp-product-tagline" style={{ fontSize: 12 }}>陪你一起成长的旅程伙伴</span>
      </header>

      <DailyGreeting />

      {snapshot.state === 'pack-unavailable' ? (
        <section className="vp-panel" data-pet-state="pack-unavailable">
          <h3>伙伴正在休息</h3>
          <p>当前旅程暂时无法载入，请稍后再试。</p>
        </section>
      ) : null}

      <PetSceneRenderer simulateFailAssetIds={failSubjectAsset ? ['sprite-subject-pod'] : undefined} />

      <UpgradeCeremony />
      <HostActivityFeedback />

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <PetProgressPanel />
        <PetMilestonePanel />
      </div>

      <PetKeepsakeCollection />

      {dev ? (
      <section className="vp-panel" data-prototype-controls="true">
        <h3>开发控制台</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" onClick={() => source.addPoints(100)}>+100</button>
          <button type="button" onClick={() => source.addPoints(10000)}>+10,000</button>
          <button type="button" onClick={() => source.addPoints(100000)}>+100,000</button>
          <button type="button" onClick={() => source.addPoints(500000)}>+500,000</button>
          <button type="button" onClick={() => source.emitDuplicate()}>重复快照</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
          <label htmlFor="exact-points" style={{ fontSize: 13 }}>精确输入 progressPoints</label>
          <input
            id="exact-points"
            type="number"
            value={exactPoints}
            min={0}
            step={1}
            style={{ background: '#16223a', color: '#e8eefb', border: '1px solid #2b3d5c', borderRadius: 8, padding: '4px 8px', width: 140 }}
            onChange={(e) => setExactPoints(e.target.value)}
          />
          <button type="button" onClick={() => source.setPoints(Math.max(0, Math.floor(Number(exactPoints) || 0)))}>应用</button>
          <button type="button" onClick={() => source.setPoints(-5)}>注入非法负数快照</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 13, color: '#9fb4d8' }}>Host 活动：</span>
          <button type="button" data-host-completed="true" onClick={() => dispatchHostActivity({ schemaVersion: 1, eventId: `evt-${Date.now()}-c`, activityId: 'demo-task', status: 'completed', occurredAt: new Date().toISOString() })}>completed</button>
          <button type="button" data-host-failed="true" onClick={() => dispatchHostActivity({ schemaVersion: 1, eventId: `evt-${Date.now()}-f`, activityId: 'demo-task', status: 'failed', occurredAt: new Date().toISOString() })}>failed</button>
          <button type="button" data-host-cancelled="true" onClick={() => dispatchHostActivity({ schemaVersion: 1, eventId: `evt-${Date.now()}-x`, activityId: 'demo-task', status: 'cancelled', occurredAt: new Date().toISOString() })}>cancelled</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
          <button type="button" onClick={() => source.resetSubject()} data-subject-reset="true">重置 subject（新命名空间）</button>
          <button type="button" aria-pressed={failSubjectAsset ? 'true' : 'false'} data-fail-asset="true" onClick={() => setFailSubjectAsset((v) => !v)}>
            {failSubjectAsset ? '恢复主体资产' : '模拟主体资产失败'}
          </button>
          <button type="button" data-pack-unavailable-demo="true" onClick={() => setShowPackUnavailableDemo((v) => !v)}>
            {showPackUnavailableDemo ? '收起 pack-unavailable 状态' : '查看 pack-unavailable 状态'}
          </button>
          <button
            type="button"
            data-view-journal="true"
            onClick={() => {
              const s = snapshot.lastValidSnapshot
              if (s === null) {
                setJournalView(['（尚无有效快照）'])
                return
              }
              void snapshotJournal(storage, s.sourceId, s.subjectId).then(setJournalView)
            }}
          >
            查看 Journal / Keepsake 状态
          </button>
          <button type="button" data-reset-demo="true" onClick={() => resetLocalDemoData()}>重置本地演示数据</button>
        </div>
        {showPackUnavailableDemo ? (
          <p style={{ marginTop: 10, fontSize: 13, color: '#fca5a5' }} data-pet-pack-unavailable-demo="true">
            默认 Pack 无效时引擎状态 = <code>{packUnavailableState || '计算中…'}</code>（无崩溃、无回退循环、进度不变、无 Receipt）
          </p>
        ) : null}
        {journalView !== null ? (
          <pre style={{ marginTop: 10, fontSize: 11, color: '#9fb4d8', overflowX: 'auto', maxHeight: 200 }} data-journal-view="true">
            {journalView.join('\n')}
          </pre>
        ) : null}
      </section>
      ) : null}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <PackSelector />
        <LocaleSelector />
        <section className="vp-panel">
          <h3>Reduced Motion</h3>
          <div className="vp-selector">
            <button type="button" aria-pressed={snapshot.reducedMotion ? 'false' : 'true'} onClick={() => setReducedMotion(false)} data-reduced-motion="off">全动效</button>
            <button type="button" aria-pressed={snapshot.reducedMotion ? 'true' : 'false'} onClick={() => setReducedMotion(true)} data-reduced-motion="on">Reduced Motion</button>
          </div>
          <p style={{ fontSize: 12, color: '#9fb4d8', margin: '8px 0 0' }}>
            当前：{snapshot.reducedMotion ? 'reduced（瞬时过渡、静态结构完整保留）' : '完整动效'} · 主体：{viewModel !== null ? `${viewModel.derivedLevelIndex} 级` : '等待快照'}
          </p>
        </section>
      </div>

      {dev ? (
      <section className="vp-panel">
        <h3>引擎诊断（最近 {snapshot.diagnostics.length} 条）</h3>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#9fb4d8' }} data-diagnostics="true">
          {snapshot.diagnostics.slice(-8).reverse().map((d, i) => (
            <li key={`${d.at}-${i}`}>
              <code>{d.code}</code> — {d.message}
            </li>
          ))}
          {snapshot.diagnostics.length === 0 ? <li>（无诊断）</li> : null}
        </ul>
      </section>
      ) : null}
    </div>
  )
}

async function snapshotJournal(storage: PetStorageAdapter, sourceId: string, subjectId: string): Promise<string[]> {
  const [receipts, days, keepsakes] = await Promise.all([
    storage.listConsumedReceipts(sourceId, subjectId),
    storage.listGreetedDays(sourceId, subjectId),
    storage.listUnlockedKeepsakes(sourceId, subjectId),
  ])
  return [
    `consumedReceiptIds (${receipts.length}):`,
    ...receipts.map((r) => `  ${r}`),
    `greetedLocalDays (${days.length}): ${days.join(', ') || '（无）'}`,
    `unlockedKeepsakes (${keepsakes.length}):`,
    ...keepsakes.map((k) => `  ${k.packId}@${k.packVersion} / ${k.keepsakeId}`),
  ]
}

function resetLocalDemoData(): void {
  void (async () => {
    if (typeof indexedDB !== 'undefined') {
      indexedDB.deleteDatabase('pet-engine-v1')
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    if (typeof location !== 'undefined') {
      location.reload()
    }
  })()
}
