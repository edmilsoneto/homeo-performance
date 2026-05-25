import type { EntropyPoint } from './entropy';

export type MarkovState = 1 | 2 | 3 | 4;

export function getEntropyState(entropy: number): MarkovState {
  if (entropy <= 0.50) return 1;
  if (entropy <= 0.90) return 2;
  if (entropy <= 1.30) return 3;
  return 4;
}

export function getStateLabel(state: MarkovState): string {
  switch (state) {
    case 1: return 'Sólido';
    case 2: return 'Normal';
    case 3: return 'Alerta';
    case 4: return 'Caos';
  }
}

export function getStateColor(state: MarkovState): string {
  switch (state) {
    case 1: return '#e2e8f0'; // Slate 200
    case 2: return '#cbd5e1'; // Slate 300
    case 3: return '#94a3b8'; // Slate 400
    case 4: return '#64748b'; // Slate 500
  }
}

export interface TransitionProbabilities {
  [targetState: number]: number; // from 0 to 100
}

export type TransitionMatrix = Record<MarkovState, TransitionProbabilities>;

const createEmptyMatrix = (): TransitionMatrix => ({
  1: { 1: 0, 2: 0, 3: 0, 4: 0 },
  2: { 1: 0, 2: 0, 3: 0, 4: 0 },
  3: { 1: 0, 2: 0, 3: 0, 4: 0 },
  4: { 1: 0, 2: 0, 3: 0, 4: 0 },
});

export interface MarkovResult {
  percentages: TransitionMatrix;
  counts: TransitionMatrix;
  rowTotals: Record<MarkovState, number>;
}

export function buildTransitionMatrix(points: EntropyPoint[], fromWeekday?: number): MarkovResult {
  const matrix = createEmptyMatrix();
  const counts: Record<MarkovState, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  for (let i = 0; i < points.length - 1; i++) {
    const ptToday = points[i];
    const ptTomorrow = points[i + 1];

    const dateToday = new Date(ptToday.date + 'T12:00:00');
    
    // If fromWeekday is provided, filter specifically for that weekday
    if (fromWeekday === undefined || dateToday.getDay() === fromWeekday) {
      const dateTomorrow = new Date(ptTomorrow.date + 'T12:00:00');
      const diffTime = Math.abs(dateTomorrow.getTime() - dateToday.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Only count if they are actually consecutive days
      if (diffDays === 1) {
        const stateToday = getEntropyState(ptToday.generalEntropy);
        const stateTomorrow = getEntropyState(ptTomorrow.generalEntropy);

        matrix[stateToday][stateTomorrow] += 1;
        counts[stateToday] += 1;
      }
    }
  }

  const result = createEmptyMatrix();

  for (const s of [1, 2, 3, 4] as MarkovState[]) {
    const total = counts[s];
    if (total > 0) {
      for (const target of [1, 2, 3, 4] as MarkovState[]) {
        result[s][target] = (matrix[s][target] / total) * 100;
      }
    }
  }

  return { percentages: result, counts: matrix, rowTotals: counts };
}
