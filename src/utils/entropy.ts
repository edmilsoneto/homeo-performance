import type { ShiftEntry } from '../types';

export type State = 'Grupo A' | 'Grupo B' | 'Grupo C' | 'Grupo D';

export const determineState = (entry: ShiftEntry): State => {
  if (entry.feedback === 'Bom') {
    if (entry.intensity >= 7) return 'Grupo A';
    return 'Grupo B';
  } else {
    // Ruim
    if (entry.intensity <= 5) return 'Grupo C';
    return 'Grupo D';
  }
};

export const calculateVolatility = (entries: ShiftEntry[]): number => {
  // If no entries, volatility is 0%
  if (entries.length === 0) return 0;

  const stateCounts: Record<State, number> = {
    'Grupo A': 0,
    'Grupo B': 0,
    'Grupo C': 0,
    'Grupo D': 0,
  };

  entries.forEach(entry => {
    const state = determineState(entry);
    stateCounts[state]++;
  });

  const total = entries.length;
  let entropy = 0;

  (Object.values(stateCounts) as number[]).forEach(count => {
    if (count > 0) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }
  });

  // Max entropy for 4 states is log2(4) = 2
  const maxEntropy = 2;
  const volatilityPercentage = (entropy / maxEntropy) * 100;

  return volatilityPercentage;
};
