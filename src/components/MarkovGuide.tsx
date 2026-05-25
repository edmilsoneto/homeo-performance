import React, { useState, useMemo } from 'react';
import { Network, ArrowRight, Activity, AlertTriangle } from 'lucide-react';
import type { User, ShiftEntry } from '../types';
import { generateDailyEntropyPoints } from '../utils/entropy';
import { buildTransitionMatrix, getStateLabel, getStateColor } from '../utils/markov';
import type { MarkovState } from '../utils/markov';

interface Props {
  athletes: User[];
  getAllEntries: (userId: string) => ShiftEntry[];
}

export const MarkovGuide: React.FC<Props> = ({ athletes, getAllEntries }) => {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1); // 1 = Monday

  const weekdayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const nextWeekdayIndex = (selectedWeekday + 1) % 7;

  const { transitionMatrix, historicalAverage, totalTransitions } = useMemo(() => {
    if (!selectedAthleteId) return { transitionMatrix: null, historicalAverage: null, totalTransitions: 0 };
    
    const all = getAllEntries(selectedAthleteId);
    const pts = generateDailyEntropyPoints(all);
    
    const weekdayPts = pts.filter(p => new Date(p.date + 'T12:00:00').getDay() === selectedWeekday);
    const avg = weekdayPts.length > 0 ? weekdayPts.reduce((acc, p) => acc + p.generalEntropy, 0) / weekdayPts.length : null;

    const matrix = buildTransitionMatrix(pts, selectedWeekday);
    
    // Count total valid transitions found for this weekday
    let count = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const ptToday = pts[i];
      const dateToday = new Date(ptToday.date + 'T12:00:00');
      if (dateToday.getDay() === selectedWeekday) {
        const ptTomorrow = pts[i + 1];
        const dateTomorrow = new Date(ptTomorrow.date + 'T12:00:00');
        const diffDays = Math.round(Math.abs(dateTomorrow.getTime() - dateToday.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          count++;
        }
      }
    }

    return { transitionMatrix: matrix, historicalAverage: avg, totalTransitions: count };
  }, [selectedAthleteId, getAllEntries, selectedWeekday]);


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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Activity style={{ width: 18, height: 18, color: '#10b981' }} />
              Matriz de Transição ({weekdayNames[selectedWeekday]} <ArrowRight style={{ width: 14, height: 14, color: '#64748b' }} /> {weekdayNames[nextWeekdayIndex]})
            </h3>
            {historicalAverage !== null && (
              <span style={{ fontSize: 12, color: '#64748b', background: '#0f1520', padding: '6px 12px', borderRadius: 10, border: '1px solid #1e293b' }}>
                A média real deste atleta em {weekdayNames[selectedWeekday]}s é <strong>{historicalAverage.toFixed(2)}</strong>
              </span>
            )}
          </div>

          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
            Baseado em <strong>{totalTransitions} semanas</strong> de dados históricos, veja as probabilidades exatas de como a performance da <strong>{weekdayNames[nextWeekdayIndex]}</strong> reage a cada estado da <strong>{weekdayNames[selectedWeekday]}</strong>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {([1, 2, 3, 4] as MarkovState[]).map(originState => {
              const probs = transitionMatrix ? transitionMatrix[originState] : null;
              
              // Verify if there is any data for this origin state
              const hasData = probs && Object.values(probs).some(v => v > 0);

              return (
                <div key={originState} style={{
                  background: '#0a0e17', border: `1px solid ${getStateColor(originState)}40`,
                  borderRadius: 20, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16,
                  position: 'relative', overflow: 'hidden'
                }}>
                  {/* Subtle background glow based on state */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px',
                    background: getStateColor(originState)
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b' }}>
                      Se a {weekdayNames[selectedWeekday]} terminar em:
                    </span>
                    <span style={{
                      background: `${getStateColor(originState)}15`,
                      border: `1px solid ${getStateColor(originState)}30`,
                      color: getStateColor(originState),
                      padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 800, textTransform: 'uppercase'
                    }}>
                      {getStateLabel(originState)}
                    </span>
                  </div>

                  {!hasData ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                      <AlertTriangle style={{ width: 14, height: 14, color: '#64748b' }} />
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        Sem ocorrências no histórico (o atleta nunca terminou uma {weekdayNames[selectedWeekday]} neste estado).
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                      {([1, 2, 3, 4] as MarkovState[]).map(targetState => {
                        const p = probs![targetState];
                        const isZero = p === 0;
                        const isHighest = Math.max(...Object.values(probs!)) === p && !isZero;
                        
                        return (
                          <div key={targetState} style={{
                            background: isHighest ? `${getStateColor(targetState)}15` : isZero ? 'transparent' : '#0f1520',
                            border: `1px solid ${isHighest ? getStateColor(targetState) : isZero ? '#1e293b' : '#334155'}`,
                            padding: '16px 12px', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                            opacity: isZero ? 0.4 : 1, transition: 'all 0.2s'
                          }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              {getStateLabel(targetState)} na {weekdayNames[nextWeekdayIndex]}
                            </span>
                            <span style={{ fontSize: 22, fontWeight: 900, color: isZero ? '#475569' : getStateColor(targetState) }}>
                              {p.toFixed(1)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
