/**
 * Overlay locale dictionaries registered into the Harness locale service
 * (`ctx.locale.register`). The engine keeps its own zh-CN/en copy for Pack
 * text; these keys cover only the adapter-owned overlay chrome. Harness
 * locale switches re-render the entry without a second page-level authority.
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
  'panel.title': '成长伙伴',
  'panel.pack': '当前伙伴',
  'panel.stage': '当前阶段',
  'panel.progress': '成长进度',
  'panel.nextThreshold': '下一目标 {points}',
  'panel.keepsake': '最近纪念品',
  'panel.keepsake.none': '还没有纪念品',
  'panel.packSwitch': '切换伙伴',
  'panel.reducedMotion': '减少动效',
  'panel.reducedMotion.system': '跟随系统',
  'panel.collapse': '收起挂件',
  'panel.viewJourney': '查看完整旅程',
  'panel.close': '关闭面板',
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
  'panel.title': 'Growth Companion',
  'panel.pack': 'Current companion',
  'panel.stage': 'Current stage',
  'panel.progress': 'Growth progress',
  'panel.nextThreshold': 'Next milestone {points}',
  'panel.keepsake': 'Latest keepsake',
  'panel.keepsake.none': 'No keepsakes yet',
  'panel.packSwitch': 'Switch companion',
  'panel.reducedMotion': 'Reduced motion',
  'panel.reducedMotion.system': 'Follow system',
  'panel.collapse': 'Collapse overlay',
  'panel.viewJourney': 'View full journey',
  'panel.close': 'Close panel',
  'dialog.title': 'Growth Journey',
  'dialog.close': 'Close journey',
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'vehicle-pet': VehiclePetLocaleKey
  }
}
