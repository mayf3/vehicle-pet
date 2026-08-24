/**
 * Bilingual generic UI copy owned by the engine React layer.
 * These strings are pack-neutral; all pack content comes from manifests.
 */
import type { Locale, LocalizedTextV1 } from '../engine';
export declare function engineCopy(locale: Locale): {
    readonly currentLevel: "当前等级";
    readonly nextGoal: "下一目标";
    readonly remainingPoints: "点成长值";
    readonly capped: "已达最终等级";
    readonly waitingProgress: "等待有效进度数据…";
    readonly packUnavailable: "没有可用的 Pet Pack（默认 Pack 无效）。";
    readonly switchPack: "切换 Pet Pack";
    readonly activePack: "当前 Pet Pack";
    readonly language: "界面语言";
    readonly keepsakes: "纪念收藏";
    readonly keepsakeLocked: "尚未解锁";
    readonly skip: "跳过";
    readonly upgradeTo: "成长到";
    readonly greetingVariants: string[];
    readonly hostCompleted: "完成啦，继续加油。";
    readonly hostFailed: "这次没有完成，没有任何惩罚。";
    readonly hostCancelled: "已取消，随时可以再来。";
    readonly clickFeedback: "叮！";
} | {
    readonly currentLevel: "Current level";
    readonly nextGoal: "Next goal";
    readonly remainingPoints: "progress points to go";
    readonly capped: "Final level reached";
    readonly waitingProgress: "Waiting for valid progress…";
    readonly packUnavailable: "No Pet Pack available (default pack invalid).";
    readonly switchPack: "Switch Pet Pack";
    readonly activePack: "Active Pet Pack";
    readonly language: "Language";
    readonly keepsakes: "Keepsakes";
    readonly keepsakeLocked: "Not unlocked yet";
    readonly skip: "Skip";
    readonly upgradeTo: "Grew to";
    readonly greetingVariants: string[];
    readonly hostCompleted: "Done. Keep it up.";
    readonly hostFailed: "Not completed this time — no penalty at all.";
    readonly hostCancelled: "Cancelled. You can come back anytime.";
    readonly clickFeedback: "Ping!";
};
export declare function textResolver(locale: Locale): (text: LocalizedTextV1) => string;
/** Deterministic non-cryptographic hash for daily greeting variant selection. */
export declare function stableVariantIndex(seed: string, count: number): number;
//# sourceMappingURL=copy.d.ts.map