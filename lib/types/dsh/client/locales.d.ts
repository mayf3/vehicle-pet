/**
 * Overlay locale dictionaries registered into the Harness locale service
 * (`ctx.locale.register`). The engine keeps its own zh-CN/en copy for Pack
 * text; these keys cover only the adapter-owned overlay chrome. Harness
 * locale switches re-render the entry without a second page-level authority.
 * Speech lines are NOT locale keys: they live in the bundled speech catalog
 * (speech-catalog.ts, V3 CTR-OVERLAY-018).
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
    readonly 'menu.open': "打开设置";
    readonly 'menu.title': "成长伙伴设置";
    readonly 'menu.character': "角色";
    readonly 'menu.character.vehicle': "车";
    readonly 'menu.character.companion': "伙伴";
    readonly 'menu.size': "大小";
    readonly 'menu.size.small': "小";
    readonly 'menu.size.large': "大";
    readonly 'menu.reducedMotion': "减少动效";
    readonly 'menu.reducedMotion.system': "跟随系统";
    readonly 'menu.reducedMotion.on': "开";
    readonly 'menu.reducedMotion.off': "关";
    readonly 'menu.collapse': "收起挂件";
    readonly 'menu.viewJourney': "查看完整旅程";
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