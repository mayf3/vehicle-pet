/**
 * Overlay locale dictionaries registered into the Harness locale service
 * (`ctx.locale.register`). The engine keeps its own zh-CN/en copy for Pack
 * text; these keys cover only the adapter-owned overlay chrome. Harness
 * locale switches re-render the entry without a second page-level authority.
 * Speech lines are NOT locale keys: they live in the bundled speech catalog
 * (speech-catalog.ts, V3 CTR-OVERLAY-018).
 */

export const NS = 'vehicle-pet'

export const zh = {
  'overlay.label': '成长伙伴挂件，当前状态：{state}',
  'state.idle': '待机',
  'state.running': '工作中',
  'state.needs-input': '等待你的操作',
  'state.completed': '任务完成',
  'state.failed': '任务遇到问题',
  'state.cancelled': '任务已取消',
  'launcher.restore': '展开成长伙伴',
  'menu.open': '打开设置',
  'menu.title': '成长伙伴设置',
  'menu.size': '大小',
  'menu.size.small': '小',
  'menu.size.large': '大',
  'menu.reducedMotion': '减少动效',
  'menu.reducedMotion.system': '跟随系统',
  'menu.collapse': '收起挂件',
  'menu.viewJourney': '查看完整旅程',
  'dialog.title': '成长旅程',
  'dialog.close': '关闭旅程',
} as const

export type VehiclePetLocaleKey = keyof typeof zh

export const en: Record<VehiclePetLocaleKey, string> = {
  'overlay.label': 'Growth companion overlay, current state: {state}',
  'state.idle': 'Idle',
  'state.running': 'Working',
  'state.needs-input': 'Needs your input',
  'state.completed': 'Task completed',
  'state.failed': 'Task hit a problem',
  'state.cancelled': 'Task cancelled',
  'launcher.restore': 'Expand growth companion',
  'menu.open': 'Open settings',
  'menu.title': 'Growth companion settings',
  'menu.size': 'Size',
  'menu.size.small': 'Small',
  'menu.size.large': 'Large',
  'menu.reducedMotion': 'Reduced motion',
  'menu.reducedMotion.system': 'Follow system',
  'menu.collapse': 'Collapse overlay',
  'menu.viewJourney': 'View full journey',
  'dialog.title': 'Growth Journey',
  'dialog.close': 'Close journey',
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'vehicle-pet': VehiclePetLocaleKey
  }
}
