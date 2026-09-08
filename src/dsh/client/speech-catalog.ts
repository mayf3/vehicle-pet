/**
 * Speech catalog (DSH_PET_OVERLAY_ADAPTER_V3 CTR-OVERLAY-018): bundled,
 * versioned, curated original lines. All copy is original to this repository;
 * the installed whale reference's strings are forbidden. Triggers stay within
 * the structured sources of CTR-OVERLAY-018; selection is a pure function in
 * speech-rules.ts. Lines are short, companionable, and never report status
 * codes, percentages, or token counts.
 */

export type SpeechCategory =
  | 'idle'
  | 'working'
  | 'needs-input'
  | 'completed'
  | 'failed'
  | 'milestone'

export interface SpeechCatalogEntry {
  readonly category: SpeechCategory
  readonly text: string
}

const ZH: readonly SpeechCatalogEntry[] = [
  // idle
  { category: 'idle', text: '我在这儿。' },
  { category: 'idle', text: '发会儿呆也不错。' },
  { category: 'idle', text: '在呢，随时出发。' },
  { category: 'idle', text: '今天想先做点啥？' },
  { category: 'idle', text: '休息也是一种前进。' },
  { category: 'idle', text: '窗外天气不错呀。' },
  { category: 'idle', text: '慢慢来，我等你。' },
  // working
  { category: 'working', text: '我去跑一趟。' },
  { category: 'working', text: '正在忙～' },
  { category: 'working', text: '交给我一会儿。' },
  { category: 'working', text: '路上小心，我来开。' },
  { category: 'working', text: '引擎已经热好了。' },
  { category: 'working', text: '这一段交给我。' },
  // needs-input
  { category: 'needs-input', text: '到你啦。' },
  { category: 'needs-input', text: '这里要你看看。' },
  { category: 'needs-input', text: '我等你一下。' },
  { category: 'needs-input', text: '有个路口要你选。' },
  { category: 'needs-input', text: '看一下再继续？' },
  { category: 'needs-input', text: '等你的答案。' },
  // completed
  { category: 'completed', text: '搞定。' },
  { category: 'completed', text: '跑完啦！' },
  { category: 'completed', text: '这次很顺。' },
  { category: 'completed', text: '平稳到达。' },
  { category: 'completed', text: '一路畅通。' },
  { category: 'completed', text: '准时送达～' },
  // failed / cancelled
  { category: 'failed', text: '这次没跑通。' },
  { category: 'failed', text: '换条路再来。' },
  { category: 'failed', text: '没事，我们再试。' },
  { category: 'failed', text: '小磕碰，不碍事。' },
  { category: 'failed', text: '先停一停也行。' },
  { category: 'failed', text: '下一趟会更好。' },
  // level-up / milestone
  { category: 'milestone', text: '又向前一格！' },
  { category: 'milestone', text: '新阶段，出发！' },
  { category: 'milestone', text: '慢慢长大啦。' },
  { category: 'milestone', text: '这一步很值得。' },
  { category: 'milestone', text: '收藏好这一刻。' },
  { category: 'milestone', text: '今天也一起跑了。' },
]

const EN: readonly SpeechCatalogEntry[] = [
  // idle
  { category: 'idle', text: 'Right here.' },
  { category: 'idle', text: 'A little daydream is fine too.' },
  { category: 'idle', text: 'Here whenever you are.' },
  { category: 'idle', text: 'What shall we do first?' },
  { category: 'idle', text: 'Resting counts as moving too.' },
  { category: 'idle', text: 'Nice weather out there.' },
  { category: 'idle', text: 'Take your time.' },
  // working
  { category: 'working', text: 'On it.' },
  { category: 'working', text: 'Busy for a bit~' },
  { category: 'working', text: 'Leave this one to me.' },
  { category: 'working', text: 'Sit tight, I drive.' },
  { category: 'working', text: 'Engine warmed up.' },
  { category: 'working', text: 'This stretch is mine.' },
  // needs-input
  { category: 'needs-input', text: 'Your turn.' },
  { category: 'needs-input', text: 'Need your eyes here.' },
  { category: 'needs-input', text: 'I can wait.' },
  { category: 'needs-input', text: 'A fork ahead for you.' },
  { category: 'needs-input', text: 'One look and we go?' },
  { category: 'needs-input', text: 'Waiting on your answer.' },
  // completed
  { category: 'completed', text: 'Done.' },
  { category: 'completed', text: 'Made it!' },
  { category: 'completed', text: 'Smooth run.' },
  { category: 'completed', text: 'Arrived safe.' },
  { category: 'completed', text: 'Clear road all the way.' },
  { category: 'completed', text: 'Right on time~' },
  // failed / cancelled
  { category: 'failed', text: 'That road was blocked.' },
  { category: 'failed', text: 'Another way, then.' },
  { category: 'failed', text: "It's fine. Again?" },
  { category: 'failed', text: 'Small bump, no harm.' },
  { category: 'failed', text: 'Pausing is okay too.' },
  { category: 'failed', text: 'Next run will be better.' },
  // level-up / milestone
  { category: 'milestone', text: 'One notch further!' },
  { category: 'milestone', text: 'New stage, off we go!' },
  { category: 'milestone', text: 'Growing nicely.' },
  { category: 'milestone', text: 'This step was worth it.' },
  { category: 'milestone', text: 'Keeping this moment.' },
  { category: 'milestone', text: 'Good running with you today.' },
]

const CATALOGS: Readonly<Record<'zh-CN' | 'en', readonly SpeechCatalogEntry[]>> = {
  'zh-CN': ZH,
  en: EN,
}

/** The bundled catalog for a locale; unknown locales fall back to zh-CN. */
export function speechCatalog(locale: string | undefined): readonly SpeechCatalogEntry[] {
  return CATALOGS[locale === 'en' ? 'en' : 'zh-CN'] ?? ZH
}

/** Catalog floors (V3 CTR-OVERLAY-018): ≥30 lines per locale, ≥5 per category. */
export function assertCatalogFloors(): void {
  for (const [locale, entries] of Object.entries(CATALOGS)) {
    if (entries.length < 30) throw new Error(`speech catalog ${locale}: ${entries.length} < 30 lines`)
    const perCategory = new Map<string, number>()
    for (const entry of entries) perCategory.set(entry.category, (perCategory.get(entry.category) ?? 0) + 1)
    for (const category of ['idle', 'working', 'needs-input', 'completed', 'failed', 'milestone']) {
      const count = perCategory.get(category) ?? 0
      if (count < 5) throw new Error(`speech catalog ${locale}: category ${category} has ${count} < 5 lines`)
    }
  }
}
