/**
 * Device-local daypart buckets and pure weighting helpers
 * (DSH_PET_OVERLAY_ADAPTER_V7 CTR-OVERLAY-034). The only input is the
 * device-local clock; no calendar, location, or message source participates.
 * Daypart re-weights ambient/selection tendencies only — it never gates or
 * schedules a contracted reaction and never moralizes.
 */

export type DaypartBucket = 'morning' | 'daytime' | 'evening' | 'late-night'

/** Device-local hour buckets: MORNING 05–11, DAYTIME 11–17, EVENING 17–23, LATE_NIGHT 23–05. */
export function daypartFromHour(hour: number): DaypartBucket {
  const h = ((Math.floor(hour) % 24) + 24) % 24
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'daytime'
  if (h >= 17 && h < 23) return 'evening'
  return 'late-night'
}

export function daypartFromDate(date: Date): DaypartBucket {
  return daypartFromHour(date.getHours())
}

/**
 * Energy affinity of a bucket: morning favors energetic actions, late night
 * favors sleepy/restful ones. Pure multiplier input for selection weights.
 */
export function bucketEnergyBias(bucket: DaypartBucket): number {
  switch (bucket) {
    case 'morning': return 0.5
    case 'daytime': return 0
    case 'evening': return -0.25
    case 'late-night': return -0.75
  }
}
