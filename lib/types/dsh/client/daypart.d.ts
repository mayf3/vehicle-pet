/**
 * Device-local daypart buckets and pure weighting helpers
 * (DSH_PET_OVERLAY_ADAPTER_V7 CTR-OVERLAY-034). The only input is the
 * device-local clock; no calendar, location, or message source participates.
 * Daypart re-weights ambient/selection tendencies only — it never gates or
 * schedules a contracted reaction and never moralizes.
 */
export type DaypartBucket = 'morning' | 'daytime' | 'evening' | 'late-night';
/** Device-local hour buckets: MORNING 05–11, DAYTIME 11–17, EVENING 17–23, LATE_NIGHT 23–05. */
export declare function daypartFromHour(hour: number): DaypartBucket;
export declare function daypartFromDate(date: Date): DaypartBucket;
/**
 * Energy affinity of a bucket: morning favors energetic actions, late night
 * favors sleepy/restful ones. Pure multiplier input for selection weights.
 */
export declare function bucketEnergyBias(bucket: DaypartBucket): number;
//# sourceMappingURL=daypart.d.ts.map