import React, { useState, useMemo } from 'react';
import { Network, ArrowRight, Brain, AlertTriangle } from 'lucide-react';
import type { User, ShiftEntry } from '../types';
import { generateDailyEntropyPoints } from '../utils/entropy';
import { buildTransitionMatrix, getEntropyState, getStateLabel, getStateColor } from '../utils/markov';
import type { MarkovState } from '../utils/markov';

interface Props {
  athletes: User[];
  getAllEntries: (userId: string) => ShiftEntry[];
}

export const MarkovGuide: React.FC<Props> = ({ athletes, getAllEntries }) => {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1); // 1 = Monday
  const [simulatedEntropy, setSimulatedEntropy] = useState<number>(0.8); // Default state 2

  const weekdayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const nextWeekdayIndex = (selectedWeekday + 1) % 7;

  const simulatedState = getEntropyState(simulatedEntropy);

  const { transitionMatrix, historicalAverage, dataCount } = useMemo(() => {
    if (!selectedAthleteId) return { points: [], transitionMatrix: null, historicalAverage: null, dataCount: 0 };
    
    const all = getAllEntries(selectedAthleteId);
    const pts = generateDailyEntropyPoints(all);
    
    // Calculate the historical average for the selected weekday
    const weekdayPts = pts.filter(p => new Date(p.date + 'T12:00:00').getDay() === selectedWeekday);
    const avg = weekdayPts.length > 0 ? weekdayPts.reduce((acc, p) => acc + p.generalEntropy, 0) / weekdayPts.length : null;

    // We build the matrix focusing specifically on transitions from `selectedWeekday` to `nextWeekdayIndex`
    const matrix = buildTransitionMatrix(pts, selectedWeekday);
    
    // Count how many transitions from simulatedState occurred on this weekday
    let count = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const ptToday = pts[i];
      const dateToday = new Date(ptToday.date + 'T12:00:00');
      if (dateToday.getDay() === selectedWeekday) {
        const ptTomorrow = pts[i + 1];
        const dateTomorrow = new Date(ptTomorrow.date + 'T12:00:00');
        const diffDays = Math.round(Math.abs(dateTomorrow.getTime() - dateToday.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1 && getEntropyState(ptToday.generalEntropy) === simulatedState) {
          count++;
        }
      }
    }

    return { transitionMatrix: matrix, historicalAverage: avg, dataCount: count };
  }, [selectedAthleteId, getAllEntries, selectedWeekday, simulatedState]);

  const probs = transitionMatrix ? transitionMatrix[simulatedState] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Settings Row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>Selecione o Atleta</label>
          <select 
            value={selectedAthleteId}
            onChange={e => setSelectedAthleteId(e.target.value)}
            style={{
              padding: '12px 16px', borderRadius: 14, background: '#0a0e17', border: '1px solid #1e293b',
              color: '#f1f5f9', fontSize: 14, outline: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif"
            }}
          >
            <option value="">-- Escolha um Atleta --</option>
            {athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>Dia da Semana Atual ("Hoje")</label>
          <select 
            value={selectedWeekday}
            onChange={e => setSelectedWeekday(Number(e.target.value))}
            style={{
              padding: '12px 16px', borderRadius: 14, background: '#0a0e17', border: '1px solid #1e293b',
              color: '#f1f5f9', fontSize: 14, outline: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif"
            }}
          >
            {weekdayNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
          </select>
        </div>
      </div>

      {!selectedAthleteId ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 20,
        }}>
          <Network style={{ width: 48, height: 48, color: '#334155', margin: '0 auto 16px' }} />
          <p style={{ color: '#94a3b8', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Modelo Preditivo Inativo</p>
          <p style={{ color: '#475569', fontSize: 13 }}>Selecione um atleta acima para carregar a matriz de transição.</p>
        </div>
      ) : (
        <>
          {/* Simulator Panel */}
          <div style={{ background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 20, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <Brain style={{ width: 18, height: 18, color: '#8b5cf6' }} />
                Simulador de Impacto
              </h3>
              {historicalAverage !== null && (
                <span style={{ fontSize: 12, color: '#64748b', background: '#0f1520', padding: '6px 12px', borderRadius: 10, border: '1px solid #1e293b' }}>
                  A média real deste atleta em {weekdayNames[selectedWeekday]}s é <strong>{historicalAverage.toFixed(2)}</strong>
                </span>
              )}
            </div>

            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              Qual valor de Entropia você quer simular para <strong>{weekdayNames[selectedWeekday]}</strong>?
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <input 
                type="range" min="0" max="1.6" step="0.01" 
                value={simulatedEntropy}
                onChange={e => setSimulatedEntropy(Number(e.target.value))}
                style={{ flex: 1, accentColor: getStateColor(simulatedState) }}
              />
              <div style={{
                background: `${getStateColor(simulatedState)}15`,
                border: `1px solid ${getStateColor(simulatedState)}40`,
                padding: '10px 16px', borderRadius: 14, minWidth: 140, textAlign: 'center',
                display: 'flex', flexDirection: 'column', gap: 4
              }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: getStateColor(simulatedState) }}>
                  {simulatedEntropy.toFixed(2)}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: getStateColor(simulatedState) }}>
                  {getStateLabel(simulatedState)}
                </span>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <ArrowRight style={{ width: 18, height: 18, color: '#10b981' }} />
              Previsão para {weekdayNames[nextWeekdayIndex]}
            </h3>
            
            {dataCount === 0 ? (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle style={{ width: 18, height: 18, color: '#f59e0b' }} />
                <p style={{ fontSize: 13, color: '#fcd34d', margin: 0 }}>
                  Não há dados históricos suficientes em que este atleta terminou uma <strong>{weekdayNames[selectedWeekday]}</strong> em estado de <strong>{getStateLabel(simulatedState).toUpperCase()}</strong>.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {([1, 2, 3, 4] as MarkovState[]).map(targetState => {
                  const p = probs ? probs[targetState] : 0;
                  const isZero = p === 0;
                  
                  return (
                    <div key={targetState} style={{
                      background: isZero ? '#0a0e17' : `${getStateColor(targetState)}10`,
                      border: `1px solid ${isZero ? '#1e293b' : getStateColor(targetState)}30`,
                      padding: '20px 16px', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      opacity: isZero ? 0.5 : 1
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {getStateLabel(targetState)}
                      </span>
                      <span style={{ fontSize: 24, fontWeight: 900, color: isZero ? '#475569' : getStateColor(targetState) }}>
                        {p.toFixed(1)}%
                      </span>
                      {targetState === 1 && <span style={{ fontSize: 10, color: '#64748b' }}>0.0 a 0.5</span>}
                      {targetState === 2 && <span style={{ fontSize: 10, color: '#64748b' }}>0.5 a 0.9</span>}
                      {targetState === 3 && <span style={{ fontSize: 10, color: '#64748b' }}>0.9 a 1.3</span>}
                      {targetState === 4 && <span style={{ fontSize: 10, color: '#64748b' }}>&gt; 1.3</span>}
                    </div>
                  );
                })}
              </div>
            )}
            
            {dataCount > 0 && (
              <p style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 16 }}>
                Baseado em {dataCount} ocorrência(s) histórica(s) onde o atleta terminou a {weekdayNames[selectedWeekday]} com esse estado de entropia.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
