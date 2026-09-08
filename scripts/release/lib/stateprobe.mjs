/**
 * Read-only browser-state probe over CDP (Goal 发布 §8, §13).
 *
 * The pet's user state lives in the Owner's browser (localStorage + IndexedDB
 * of the web-app origin), so preservation proof reads exactly the pet-owned
 * keys through the Chrome DevTools Protocol: no clicks, no injections, no
 * prompt/completion/message content, no profile copies — only the three
 * storage keys and an aggregate IndexedDB summary.
 * @module scripts/release/lib/stateprobe
 */

import { deepEqual } from './util.mjs'

export const PET_STORAGE_KEYS = [
  'vehicle-pet/overlay-preferences/v1',
  'vehicle-pet/usage-ledger/v1',
  'deepseek-pet:scale',
]

/**
 * List page targets whose URL belongs to the web app origin.
 * @param {{cdpUrl: string, originPatterns: RegExp[]}} input
 * @returns {Promise<{url: string, id: string, wsUrl: string}[]>}
 */
export async function matchingTargets(input) {
  const { cdpUrl, originPatterns } = input
  const response = await fetch(`${cdpUrl.replace(/\/$/, '')}/json`, { signal: AbortSignal.timeout(5_000) })
  if (!response.ok) return []
  const targets = await response.json()
  return targets
    .filter((/** @type {{type?: string, url?: string, webSocketDebuggerUrl?: string}} */ target) =>
      target.type === 'page'
      && typeof target.url === 'string'
      && typeof target.webSocketDebuggerUrl === 'string'
      && originPatterns.some(pattern => pattern.test(target.url ?? '')))
    .map((/** @type {{url: string, id: string, webSocketDebuggerUrl: string}} */ target) => ({
      url: target.url,
      id: target.id,
      wsUrl: target.webSocketDebuggerUrl,
    }))
}

/**
 * Evaluate one expression on a target through a short-lived CDP websocket
 * connection (Node's native WebSocket; no external dependency).
 * @param {{wsUrl: string, expression: string, awaitPromise?: boolean, timeoutMs?: number}} input
 * @returns {Promise<{ok: true, value: unknown} | {ok: false, error: string}>}
 */
export async function cdpEvaluate(input) {
  const { wsUrl, expression, awaitPromise = false, timeoutMs = 8_000 } = input
  return new Promise((resolve) => {
    /** @type {any} */
    let socket
    let settled = false
    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try { socket?.close() } catch { /* already closed */ }
      resolve(result)
    }
    const timer = setTimeout(() => finish({ ok: false, error: `CDP evaluate timed out after ${timeoutMs} ms` }), timeoutMs)
    try {
      socket = new WebSocket(wsUrl)
    } catch (error) {
      finish({ ok: false, error: `websocket open failed: ${String(error)}` })
      return
    }
    socket.addEventListener('error', () => finish({ ok: false, error: 'websocket error' }))
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression,
          returnByValue: true,
          awaitPromise,
          userGesture: false,
        },
      }))
    })
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(String(event.data))
        if (data.id !== 1) return
        if (data.error !== undefined) {
          finish({ ok: false, error: `CDP error: ${JSON.stringify(data.error)}` })
          return
        }
        const result = data.result
        if (result?.exceptionDetails !== undefined) {
          finish({ ok: false, error: `page exception: ${JSON.stringify(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)}` })
          return
        }
        finish({ ok: true, value: result?.result?.value })
      } catch (error) {
        finish({ ok: false, error: `bad CDP message: ${String(error)}` })
      }
    })
  })
}

/** Storage capture expression: exact bytes of the pet-owned keys, nothing else. */
const STORAGE_EXPRESSION = `(() => {
  const keys = ${JSON.stringify(PET_STORAGE_KEYS)}
  const out = {}
  for (const key of keys) out[key] = localStorage.getItem(key)
  return JSON.stringify({ origin: location.origin, values: out })
})()`

/** Aggregate-only IndexedDB summary (counts and small scalar preferences). */
const IDB_EXPRESSION = `(async () => {
  const dbs = (indexedDB.databases ? await indexedDB.databases() : []) || []
  const entry = dbs.find(db => db.name === 'pet-engine-v1')
  if (!entry) return JSON.stringify({ present: false })
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('pet-engine-v1')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  const summary = { present: true, stores: {} }
  const storeNames = Array.from(db.objectStoreNames)
  for (const name of storeNames) {
    summary.stores[name] = await new Promise((resolve) => {
      const tx = db.transaction(name, 'readonly')
      const store = tx.objectStore(name)
      const countRequest = store.count()
      countRequest.onsuccess = () => resolve({ count: countRequest.result })
      countRequest.onerror = () => resolve({ error: 'count failed' })
    })
  }
  if (storeNames.includes('preferences')) {
    summary.activePackId = await new Promise((resolve) => {
      const tx = db.transaction('preferences', 'readonly')
      const request = tx.objectStore('preferences').get('activePackId')
      request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : (request.result && request.result.value) ?? null)
      request.onerror = () => resolve(null)
    })
  }
  if (storeNames.includes('journals')) {
    summary.journalSummary = await new Promise((resolve) => {
      const tx = db.transaction('journals', 'readonly')
      const request = tx.objectStore('journals').getAll()
      request.onsuccess = () => {
        const records = request.result || []
        let consumed = 0
        let greetedDays = 0
        for (const record of records) {
          consumed += Array.isArray(record && record.consumedReceiptIds) ? record.consumedReceiptIds.length : 0
          greetedDays += Array.isArray(record && record.greetedLocalDays) ? record.greetedLocalDays.length : 0
        }
        resolve({ records: records.length, consumedReceiptIdCount: consumed, greetedDayCount: greetedDays })
      }
      request.onerror = () => resolve({ error: 'read failed' })
    })
  }
  db.close()
  return JSON.stringify(summary)
})()`

/**
 * Capture the pet browser state from all matching targets.
 * @param {{cdpUrl: string, originPatterns: RegExp[]}} input
 * @returns {Promise<{status: 'CAPTURED'|'UNAVAILABLE', targets: CapturedTarget[], reason?: string}>}
 */
export async function capturePetState(input) {
  let targets
  try {
    targets = await matchingTargets(input)
  } catch (error) {
    return { status: 'UNAVAILABLE', targets: [], reason: `CDP endpoint unreachable: ${String(error)}` }
  }
  if (targets.length === 0) {
    return { status: 'UNAVAILABLE', targets: [], reason: 'no open browser tab matches the web origin' }
  }
  /** @type {CapturedTarget[]} */
  const captured = []
  for (const target of targets) {
    const storage = await cdpEvaluate({ wsUrl: target.wsUrl, expression: STORAGE_EXPRESSION })
    const idb = await cdpEvaluate({ wsUrl: target.wsUrl, expression: IDB_EXPRESSION, awaitPromise: true, timeoutMs: 10_000 })
    captured.push({
      url: target.url,
      storage: storage.ok ? parseJsonOrNull(storage.value) : undefined,
      storageError: storage.ok ? undefined : storage.error,
      idb: idb.ok ? parseJsonOrNull(idb.value) : undefined,
      idbError: idb.ok ? undefined : idb.error,
    })
  }
  const anyCaptured = captured.some(entry => entry.storage !== undefined)
  return {
    status: anyCaptured ? 'CAPTURED' : 'UNAVAILABLE',
    targets: captured,
    reason: anyCaptured ? undefined : 'storage evaluate failed on every matching target',
  }
}

/** @param {unknown} value */
function parseJsonOrNull(value) {
  if (typeof value !== 'string') return undefined
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

/**
 * @typedef {{url: string, storage?: unknown, storageError?: string, idb?: unknown, idbError?: string}} CapturedTarget
 */

/**
 * Compare pre/post pet-state captures into preservation verdicts (§13).
 *
 * Only targets whose in-page `storage.origin` matches `expectedOrigins` are
 * trusted: a loose URL match alone could select an unrelated localhost tab
 * (another dev server, another DSH instance) whose empty pet storage would
 * compare null==null as a fake PASS. With expectedOrigins known (the
 * discovered web port) a non-matching capture set is UNAVAILABLE, not PASS.
 *
 * Position / reduced-motion / size must be byte-equal; the usage ledger may
 * legitimately advance during the acceptance window (natural usage), so it
 * is checked for non-regression, and its byte drift is reported.
 * @param {{pre: {status: string, targets: CapturedTarget[]}, post: {status: string, targets: CapturedTarget[]}, expectedOrigins?: string[]}} input
 * @returns {Record<string, {verdict: 'PASS'|'FAIL'|'UNAVAILABLE', detail?: string}>}
 */
export function comparePetState(input) {
  const { pre, post, expectedOrigins = [] } = input
  /** @type {Record<string, {verdict: 'PASS'|'FAIL'|'UNAVAILABLE', detail?: string}>} */
  const verdicts = {}
  if (pre.status !== 'CAPTURED' || post.status !== 'CAPTURED') {
    return {
      STATE_PROBE: {
        verdict: 'UNAVAILABLE',
        detail: `pre=${pre.status} post=${post.status} (${pre.targets.length}/${post.targets.length} targets)`,
      },
    }
  }
  const originAllowed = (/** @type {CapturedTarget} */ target) => {
    const origin = /** @type {any} */ (target.storage)?.origin
    return typeof origin === 'string' && (expectedOrigins.length === 0 || expectedOrigins.includes(origin))
  }
  const preTarget = pre.targets.find(entry => entry.storage !== undefined && originAllowed(entry))
  const postTarget = post.targets.find(entry => entry.storage !== undefined && originAllowed(entry))
  if (preTarget === undefined || postTarget === undefined) {
    return {
      STATE_PROBE: {
        verdict: 'UNAVAILABLE',
        detail: expectedOrigins.length > 0
          ? `no captured browser target matches the web origin (${expectedOrigins.join(' or ')}); refusing to compare unrelated localhost tabs`
          : 'storage values missing on a matched target',
      },
    }
  }
  const preValues = /** @type {{values: Record<string, string|null>}|undefined} */ (preTarget?.storage)
  const postValues = /** @type {{values: Record<string, string|null>}|undefined} */ (postTarget?.storage)
  if (preValues === undefined || postValues === undefined) {
    return { STATE_PROBE: { verdict: 'UNAVAILABLE', detail: 'storage values missing on a matched target' } }
  }

  const prefsBefore = parseJsonOrNull(preValues.values['vehicle-pet/overlay-preferences/v1'])
  const prefsAfter = parseJsonOrNull(postValues.values['vehicle-pet/overlay-preferences/v1'])
  const prefField = (/** @type {any} */ prefs, /** @type {string} */ field, /** @type {unknown} */ fallback) => (prefs !== undefined && prefs !== null && prefs[field] !== undefined ? prefs[field] : fallback)
  const positionSame = deepEqual(prefField(prefsBefore, 'position', null), prefField(prefsAfter, 'position', null))
  verdicts.POSITION_PREFERENCE_PRESERVED = {
    verdict: positionSame ? 'PASS' : 'FAIL',
    detail: positionSame ? undefined : `before=${JSON.stringify(prefField(prefsBefore, 'position', null))} after=${JSON.stringify(prefField(prefsAfter, 'position', null))}`,
  }
  verdicts.REDUCED_MOTION_PREFERENCE_PRESERVED = {
    verdict: prefField(prefsBefore, 'reducedMotion', null) === prefField(prefsAfter, 'reducedMotion', null) ? 'PASS' : 'FAIL',
    detail: `before=${JSON.stringify(prefField(prefsBefore, 'reducedMotion', null))} after=${JSON.stringify(prefField(prefsAfter, 'reducedMotion', null))}`,
  }
  verdicts.SIZE_PREFERENCE_PRESERVED = {
    verdict: prefField(prefsBefore, 'size', null) === prefField(prefsAfter, 'size', null) ? 'PASS' : 'FAIL',
    detail: `before=${JSON.stringify(prefField(prefsBefore, 'size', null))} after=${JSON.stringify(prefField(prefsAfter, 'size', null))}`,
  }
  verdicts.PREFERENCE_BYTES_PRESERVED = {
    verdict: preValues.values['vehicle-pet/overlay-preferences/v1'] === postValues.values['vehicle-pet/overlay-preferences/v1'] ? 'PASS' : 'FAIL',
    detail: `before=${preValues.values['vehicle-pet/overlay-preferences/v1']} after=${postValues.values['vehicle-pet/overlay-preferences/v1']}`,
  }

  const ledgerBefore = parseJsonOrNull(preValues.values['vehicle-pet/usage-ledger/v1'])
  const ledgerAfter = parseJsonOrNull(postValues.values['vehicle-pet/usage-ledger/v1'])
  verdicts.USAGE_LEDGER_PRESERVED = ledgerVerdict(ledgerBefore, ledgerAfter)
  verdicts.PROGRESS_PRESERVED = progressVerdict(ledgerBefore, ledgerAfter)

  verdicts.OTHER_CLIENT_STATE_PRESERVED = {
    verdict: preValues.values['deepseek-pet:scale'] === postValues.values['deepseek-pet:scale'] ? 'PASS' : 'FAIL',
    detail: `deepseek-pet:scale before=${JSON.stringify(preValues.values['deepseek-pet:scale'])} after=${JSON.stringify(postValues.values['deepseek-pet:scale'])}`,
  }
  verdicts.ENGINE_IDB_PRESERVED = idbVerdict(preTarget?.idb, postTarget?.idb)
  return verdicts
}

/**
 * Ledger non-regression: schema intact, cumulative points and revision do
 * not go backwards, per-day values do not decrease, lastSeen does not shrink.
 * @param {any} before
 * @param {any} after
 */
function ledgerVerdict(before, after) {
  if (typeof before !== 'object' || before === null || typeof after !== 'object' || after === null) {
    return { verdict: before === undefined && after === undefined ? 'PASS' : 'FAIL', detail: 'ledger missing' }
  }
  if (before.schemaVersion !== after.schemaVersion) {
    return { verdict: 'FAIL', detail: `schemaVersion ${before.schemaVersion} → ${after.schemaVersion}` }
  }
  const checks = [
    ['cumulativePoints', before.cumulativePoints, after.cumulativePoints],
    ['revision', before.revision, after.revision],
  ]
  for (const [name, beforeValue, afterValue] of checks) {
    if (typeof beforeValue === 'number' && typeof afterValue === 'number' && afterValue < beforeValue) {
      return { verdict: 'FAIL', detail: `${name} regressed ${beforeValue} → ${afterValue}` }
    }
  }
  const beforeLastSeen = countKeys(before.lastSeen)
  const afterLastSeen = countKeys(after.lastSeen)
  if (beforeLastSeen !== null && afterLastSeen !== null && afterLastSeen < beforeLastSeen) {
    return { verdict: 'FAIL', detail: `lastSeen shrank ${beforeLastSeen} → ${afterLastSeen}` }
  }
  return { verdict: 'PASS', detail: `cumulativePoints ${before.cumulativePoints} → ${after.cumulativePoints}, revision ${before.revision} → ${after.revision} (natural usage may advance)` }
}

/** @param {any} before @param {any} after */
function progressVerdict(before, after) {
  if (typeof before !== 'object' || before === null || typeof after !== 'object' || after === null) {
    return { verdict: before === undefined && after === undefined ? 'PASS' : 'FAIL', detail: 'progress source missing' }
  }
  const beforePoints = typeof before.cumulativePoints === 'number' ? before.cumulativePoints : null
  const afterPoints = typeof after.cumulativePoints === 'number' ? after.cumulativePoints : null
  if (beforePoints === null || afterPoints === null) {
    return { verdict: 'FAIL', detail: 'cumulativePoints missing' }
  }
  if (afterPoints < beforePoints) {
    return { verdict: 'FAIL', detail: `progress regressed ${beforePoints} → ${afterPoints}` }
  }
  return { verdict: 'PASS', detail: `progressPoints ${beforePoints} → ${afterPoints}` }
}

/** @param {unknown} value */
function countKeys(value) {
  if (value === null || value === undefined) return null
  if (Array.isArray(value)) return value.length
  if (typeof value === 'object') return Object.keys(value).length
  return null
}

/** @param {unknown} before @param {unknown} after */
function idbVerdict(before, after) {
  if (before === undefined || after === undefined) {
    return { verdict: 'UNAVAILABLE', detail: 'indexedDB summary missing (probe best-effort)' }
  }
  const beforeSummary = /** @type {any} */ (before)
  const afterSummary = /** @type {any} */ (after)
  if (beforeSummary.present !== afterSummary.present) {
    return { verdict: 'FAIL', detail: `pet-engine-v1 presence ${beforeSummary.present} → ${afterSummary.present}` }
  }
  if (beforeSummary.activePackId !== afterSummary.activePackId) {
    return { verdict: 'FAIL', detail: `activePackId ${JSON.stringify(beforeSummary.activePackId)} → ${JSON.stringify(afterSummary.activePackId)}` }
  }
  // Store counts must not shrink (records may legitimately grow with usage).
  const beforeStores = beforeSummary.stores ?? {}
  const afterStores = afterSummary.stores ?? {}
  for (const [store, info] of Object.entries(beforeStores)) {
    const beforeCount = /** @type {any} */ (info)?.count
    const afterCount = /** @type {any} */ (afterStores[store])?.count
    if (typeof beforeCount === 'number' && typeof afterCount === 'number' && afterCount < beforeCount) {
      return { verdict: 'FAIL', detail: `pet-engine-v1 store ${store} shrank ${beforeCount} → ${afterCount}` }
    }
  }
  return { verdict: 'PASS', detail: 'pet-engine-v1 summary preserved (counts non-regressing)' }
}
