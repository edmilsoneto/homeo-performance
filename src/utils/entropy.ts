import type { ShiftEntry, GroupType } from '../types';

export const determineGroup = (entry: ShiftEntry): GroupType => {
  const fb = entry.feedback;
  if (fb === 'Grupo A' || fb === 'A') return 'Grupo A';
  if (fb === 'Grupo B' || fb === 'B') return 'Grupo B';
  if (fb === 'Grupo C' || fb === 'C') return 'Grupo C';
  if (fb === 'Grupo D' || fb === 'D') return 'Grupo D';

  // Legacy fallback
  if (fb === 'Bom') {
    if (entry.intensity >= 7) return 'Grupo A';
    return 'Grupo B';
  } else {
    // 'Ruim'
    if (entry.intensity <= 5) return 'Grupo C';
    return 'Grupo D';
  }
};

/**
 * Calculates Shannon Entropy for a list of groups.
 * Formula: H = - sum (p(x) * log2 p(x))
 * Max value for 4 states is log2(4) = 2.0
 */
export const calculateShannonEntropy = (groups: GroupType[]): number => {
  if (groups.length === 0) return 0;

  const counts: Record<GroupType, number> = {
    'Grupo A': 0,
    'Grupo B': 0,
    'Grupo C': 0,
    'Grupo D': 0,
  };

  groups.forEach(g => {
    counts[g]++;
  });

  const total = groups.length;
  let entropy = 0;

  (Object.values(counts) as number[]).forEach(count => {
    if (count > 0) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }
  });

  return Number(entropy.toFixed(3));
};

/**
 * Gets rolling entropy for a specific shift up to a target date.
 * Shift specific: last 7 registered shifts for that shift.
 */
export const calculateRollingShiftEntropy = (entriesUpToDate: ShiftEntry[], shift: 'Manhã' | 'Tarde' | 'Noite'): number => {
  const shiftEntries = entriesUpToDate.filter(e => e.shift === shift);
  const sorted = [...shiftEntries].sort((a, b) => a.timestamp - b.timestamp);
  const last7 = sorted.slice(-7);
  const groups = last7.map(determineGroup);
  return calculateShannonEntropy(groups);
};

/**
 * Calculates Rolling General Entropy (Meta-Entropy of shift entropies)
 * Formula: Shannon Entropy of the Morning, Afternoon, and Night entropies.
 * Maximum value is log2(3) = 1.585
 */
export const calculateRollingGeneralEntropy = (entriesUpToDate: ShiftEntry[]): number => {
  const morning = calculateRollingShiftEntropy(entriesUpToDate, 'Manhã');
  const afternoon = calculateRollingShiftEntropy(entriesUpToDate, 'Tarde');
  const night = calculateRollingShiftEntropy(entriesUpToDate, 'Noite');

  const sum = morning + afternoon + night;
  if (sum === 0) return 0;

  const pm = morning / sum;
  const pt = afternoon / sum;
  const pn = night / sum;

  let metaEntropy = 0;
  [pm, pt, pn].forEach(p => {
    if (p > 0) {
      metaEntropy -= p * Math.log2(p);
    }
  });

  return Number(metaEntropy.toFixed(3));
};

/**
 * Volatility percentage difference (Delta %):
 * ((H_hoje - H_ontem) / H_ontem) * 100
 */
export const calculateDeltaPercentage = (hToday: number, hYesterday: number): number => {
  if (hYesterday === 0) return hToday > 0 ? 100 : 0;
  const diff = ((hToday - hYesterday) / hYesterday) * 100;
  return Number(diff.toFixed(1));
};

export interface EntropyPoint {
  date: string; // YYYY-MM-DD
  label: string; // formatted date (e.g. DD/MM)
  generalEntropy: number;
  morningEntropy: number;
  afternoonEntropy: number;
  nightEntropy: number;
  rawShiftsCount: number;
  // Delta % compared to yesterday
  generalDelta: number;
  morningDelta: number;
  afternoonDelta: number;
  nightDelta: number;
}

/**
 * Computes daily rolling entropy points for all dates in range,
 * respecting the cold start rule (calibration requires 21 total shifts).
 */
export const generateDailyEntropyPoints = (allEntries: ShiftEntry[]): EntropyPoint[] => {
  if (allEntries.length === 0) return [];

  // Sort all entries chronologically
  const sortedEntries = [...allEntries].sort((a, b) => a.timestamp - b.timestamp);

  // Group entries by date
  const uniqueDates = Array.from(new Set(sortedEntries.map(e => e.date))).sort();

  const points: EntropyPoint[] = [];

  uniqueDates.forEach(date => {
    // Get all entries registered up to (and including) this date
    const entriesUpToDate = sortedEntries.filter(e => e.date <= date);

    const totalShiftsCount = entriesUpToDate.length;

    // COLD START: Must have at least 21 shifts (Calibration baseline)
    if (totalShiftsCount < 21) {
      return; // Skip drawing points before the 21st shift (night of 7th day)
    }

    const general = calculateRollingGeneralEntropy(entriesUpToDate);
    const morning = calculateRollingShiftEntropy(entriesUpToDate, 'Manhã');
    const afternoon = calculateRollingShiftEntropy(entriesUpToDate, 'Tarde');
    const night = calculateRollingShiftEntropy(entriesUpToDate, 'Noite');

    const [, month, day] = date.split('-');
    const label = `${day}/${month}`;

    points.push({
      date,
      label,
      generalEntropy: general,
      morningEntropy: morning,
      afternoonEntropy: afternoon,
      nightEntropy: night,
      rawShiftsCount: totalShiftsCount,
      generalDelta: 0,
      morningDelta: 0,
      afternoonDelta: 0,
      nightDelta: 0
    });
  });

  // Calculate delta percentages point-to-point (Today vs Yesterday)
  for (let i = 0; i < points.length; i++) {
    const today = points[i];
    if (i > 0) {
      const yesterday = points[i - 1];
      today.generalDelta = calculateDeltaPercentage(today.generalEntropy, yesterday.generalEntropy);
      today.morningDelta = calculateDeltaPercentage(today.morningEntropy, yesterday.morningEntropy);
      today.afternoonDelta = calculateDeltaPercentage(today.afternoonEntropy, yesterday.afternoonEntropy);
      today.nightDelta = calculateDeltaPercentage(today.nightEntropy, yesterday.nightEntropy);
    }
  }

  return points;
};

export interface WeeklyEntropyPoint {
  name: string;
  general: number;
  morning: number;
  afternoon: number;
  night: number;
  generalDelta: number;
  morningDelta: number;
  afternoonDelta: number;
  nightDelta: number;
}

/**
 * Downsamples daily points to weekly points (averaging the entropy values)
 * to avoid cluttering in large range views (6M and 1A).
 */
export const downsampleToWeekly = (points: EntropyPoint[]): WeeklyEntropyPoint[] => {
  if (points.length === 0) return [];

  const weeklyGroups: EntropyPoint[][] = [];
  let currentWeek: EntropyPoint[] = [];

  points.forEach((pt, index) => {
    currentWeek.push(pt);
    // Group in chunks of 7 days
    if (currentWeek.length === 7 || index === points.length - 1) {
      weeklyGroups.push(currentWeek);
      currentWeek = [];
    }
  });

  const weeklyPoints: WeeklyEntropyPoint[] = weeklyGroups.map((weekPts, index) => {
    const avgGeneral = weekPts.reduce((sum, p) => sum + p.generalEntropy, 0) / weekPts.length;
    const avgMorning = weekPts.reduce((sum, p) => sum + p.morningEntropy, 0) / weekPts.length;
    const avgAfternoon = weekPts.reduce((sum, p) => sum + p.afternoonEntropy, 0) / weekPts.length;
    const avgNight = weekPts.reduce((sum, p) => sum + p.nightEntropy, 0) / weekPts.length;

    const firstPt = weekPts[0];
    const lastPt = weekPts[weekPts.length - 1];

    return {
      name: `S${index + 1} (${firstPt.label}-${lastPt.label})`,
      general: Number(avgGeneral.toFixed(3)),
      morning: Number(avgMorning.toFixed(3)),
      afternoon: Number(avgAfternoon.toFixed(3)),
      night: Number(avgNight.toFixed(3)),
      generalDelta: 0,
      morningDelta: 0,
      afternoonDelta: 0,
      nightDelta: 0
    };
  });

  // Calculate delta percentages week-to-week
  for (let i = 0; i < weeklyPoints.length; i++) {
    const today = weeklyPoints[i];
    if (i > 0) {
      const yesterday = weeklyPoints[i - 1];
      today.generalDelta = calculateDeltaPercentage(today.general, yesterday.general);
      today.morningDelta = calculateDeltaPercentage(today.morning, yesterday.morning);
      today.afternoonDelta = calculateDeltaPercentage(today.afternoon, yesterday.afternoon);
      today.nightDelta = calculateDeltaPercentage(today.night, yesterday.night);
    }
  }

  return weeklyPoints;
};
