/**
 * Overlay locale dictionaries registered into the Harness locale service
 * (`ctx.locale.register`). The engine keeps its own zh-CN/en copy for Pack
 * text; these keys cover only the adapter-owned overlay chrome. Harness
 * locale switches re-render the entry without a second page-level authority.
 */
export declare const NS = "vehicle-pet";
export declare const zh: {
    readonly 'overlay.label': "成长伙伴挂件，当前状态：{state}";
    readonly 'state.idle': "待机";
    readonly 'state.running': "工作中";
    readonly 'state.needs-input': "等待你的操作";
    readonly 'state.completed': "任务完成";
    readonly 'state.failed': "任务遇到问题";
    readonly 'state.cancelled': "任务已取消";
    readonly 'launcher.restore': "展开成长伙伴";
    readonly 'panel.title': "成长伙伴";
    readonly 'panel.pack': "当前伙伴";
    readonly 'panel.stage': "当前阶段";
    readonly 'panel.progress': "成长进度";
    readonly 'panel.nextThreshold': "下一目标 {points}";
    readonly 'panel.keepsake': "最近纪念品";
    readonly 'panel.keepsake.none': "还没有纪念品";
    readonly 'panel.packSwitch': "切换伙伴";
    readonly 'panel.reducedMotion': "减少动效";
    readonly 'panel.reducedMotion.system': "跟随系统";
    readonly 'panel.collapse': "收起挂件";
    readonly 'panel.viewJourney': "查看完整旅程";
    readonly 'panel.close': "关闭面板";
    readonly 'dialog.title': "成长旅程";
    readonly 'dialog.close': "关闭旅程";
};
export type VehiclePetLocaleKey = keyof typeof zh;
export declare const en: Record<VehiclePetLocaleKey, string>;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'vehicle-pet': VehiclePetLocaleKey;
    }
}
//# sourceMappingURL=locales.d.ts.map