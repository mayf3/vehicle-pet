/**
 * Bilingual generic UI copy owned by the engine React layer.
 * These strings are pack-neutral; all pack content comes from manifests.
 */

import type { Locale, LocalizedTextV1 } from '../engine'

const copy = {
  'zh-CN': {
    currentLevel: '当前等级',
    nextGoal: '下一目标',
    remainingPoints: '点成长值',
    capped: '已达最终等级',
    waitingProgress: '等待有效进度数据…',
    packUnavailable: '没有可用的 Pet Pack（默认 Pack 无效）。',
    switchPack: '切换 Pet Pack',
    activePack: '当前 Pet Pack',
    language: '界面语言',
    keepsakes: '纪念收藏',
    keepsakeLocked: '尚未解锁',
    skip: '跳过',
    upgradeTo: '成长到',
    greetingVariants: [
      '今天也在这里，继续慢慢成长。',
      '新的一天，Pet 陪你一起长大。',
      '欢迎回来，成长还在继续。',
    ] as string[],
    hostCompleted: '完成啦，继续加油。',
    hostFailed: '这次没有完成，没有任何惩罚。',
    hostCancelled: '已取消，随时可以再来。',
    clickFeedback: '叮！',
  },
  en: {
    currentLevel: 'Current level',
    nextGoal: 'Next goal',
    remainingPoints: 'progress points to go',
    capped: 'Final level reached',
    waitingProgress: 'Waiting for valid progress…',
    packUnavailable: 'No Pet Pack available (default pack invalid).',
    switchPack: 'Switch Pet Pack',
    activePack: 'Active Pet Pack',
    language: 'Language',
    keepsakes: 'Keepsakes',
    keepsakeLocked: 'Not unlocked yet',
    skip: 'Skip',
    upgradeTo: 'Grew to',
    greetingVariants: [
      'Here again today, still growing gently.',
      'A new day — growing together with your pet.',
      'Welcome back, the journey continues.',
    ] as string[],
    hostCompleted: 'Done. Keep it up.',
    hostFailed: 'Not completed this time — no penalty at all.',
    hostCancelled: 'Cancelled. You can come back anytime.',
    clickFeedback: 'Ping!',
  },
} as const

export function engineCopy(locale: Locale) {
  return copy[locale]
}

export function textResolver(locale: Locale) {
  return (text: LocalizedTextV1) => (locale === 'en' && text.en !== undefined ? text.en : text['zh-CN'])
}

/** Deterministic non-cryptographic hash for daily greeting variant selection. */
export function stableVariantIndex(seed: string, count: number): number {
  let sum = 0
  for (let i = 0; i < seed.length; i++) {
    sum = (sum + seed.charCodeAt(i) * (i + 7)) % 100003
  }
  return sum % count
}
