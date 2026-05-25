import React, { useState, useMemo } from 'react';
import { AlertTriangle, Brain } from 'lucide-react';
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
  const weekdayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  const { summary } = useMemo(() => {
    if (!selectedAthleteId) return { summary: null };
    
    const all = getAllEntries(selectedAthleteId);
    const pts = generateDailyEntropyPoints(all);
    
    if (pts.length < 1) return { summary: null };

    const ptToday = pts[pts.length - 1];
    const todayDate = new Date(ptToday.date + 'T12:00:00');
    const todayWeekday = todayDate.getDay();
    const nextWeekday = (todayWeekday + 1) % 7;

    // Calculate historical average for THIS weekday (excluding today itself to get the pure past average, or including it, let's include all past)
    const weekdayPts = pts.filter(p => new Date(p.date + 'T12:00:00').getDay() === todayWeekday);
    const historicalAverage = weekdayPts.length > 0 ? weekdayPts.reduce((acc, p) => acc + p.generalEntropy, 0) / weekdayPts.length : ptToday.generalEntropy;

    // Delta is now compared to the historical average for this weekday
    const delta = ptToday.generalEntropy - historicalAverage;

    const matrix = buildTransitionMatrix(pts, todayWeekday);
    const todayState = getEntropyState(ptToday.generalEntropy);
    
    const probs = matrix.percentages[todayState];
    const totalOccurrences = matrix.rowTotals[todayState];
    const chanceToChange = totalOccurrences > 0 ? (100 - probs[todayState]) : 0;

    return { 
      summary: {
        todayEntropy: ptToday.generalEntropy,
        todayState,
        todayWeekday,
        nextWeekday,
        delta,
        historicalAverage,
        chanceToChange,
        probs,
        totalOccurrences
      }
    };
  }, [selectedAthleteId, getAllEntries]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
      </div>

      {!summary ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 20,
        }}>
          <Brain style={{ width: 48, height: 48, color: '#334155', margin: '0 auto 16px' }} />
          <p style={{ color: '#94a3b8', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Assistente Preditivo Automático</p>
          <p style={{ color: '#475569', fontSize: 13 }}>Selecione um atleta para analisar a entropia atual e prever o dia seguinte.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hoje */}
          <div style={{
            background: 'linear-gradient(135deg, #0f1520, #0a0e17)',
            border: `1px solid ${getStateColor(summary.todayState)}40`,
            borderRadius: 20, padding: 24, position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: getStateColor(summary.todayState) }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', margin: '0 0 16px 0', letterSpacing: 1 }}>
                  Entropia Atual ({weekdayNames[summary.todayWeekday]})
                </h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
                  <span style={{ fontSize: 48, fontWeight: 900, color: getStateColor(summary.todayState), lineHeight: 1 }}>
                    {summary.todayEntropy.toFixed(2)}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 4 }}>
                    <span style={{
                      background: `${getStateColor(summary.todayState)}20`, color: getStateColor(summary.todayState),
                      padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 800, textTransform: 'uppercase'
                    }}>
                      {getStateLabel(summary.todayState)}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Oscilação do Padrão ({summary.historicalAverage.toFixed(2)})
                </span>
                <span style={{ 
                  fontSize: 18, fontWeight: 800, 
                  color: summary.delta > 0 ? '#ef4444' : summary.delta < 0 ? '#10b981' : '#64748b',
                  background: summary.delta > 0 ? 'rgba(239,68,68,0.1)' : summary.delta < 0 ? 'rgba(16,185,129,0.1)' : '#1e293b',
                  padding: '6px 12px', borderRadius: 10
                }}>
                  {summary.delta > 0 ? '▲ Acima' : summary.delta < 0 ? '▼ Abaixo' : '▬ Na Média'} {Math.abs(summary.delta).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Amanhã (Previsão) */}
          <div style={{ background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 20, padding: 24 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', margin: '0 0 20px 0', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain style={{ width: 16, height: 16, color: '#8b5cf6' }} />
              Previsão de Impacto para Amanhã ({weekdayNames[summary.nextWeekday]})
            </h3>

            {summary.totalOccurrences === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, background: '#0f1520', borderRadius: 12 }}>
                <AlertTriangle style={{ width: 16, height: 16, color: '#64748b' }} />
                <span style={{ fontSize: 13, color: '#94a3b8' }}>
                  Não há histórico estatístico suficiente deste atleta terminando a {weekdayNames[summary.todayWeekday]} em estado {getStateLabel(summary.todayState).toUpperCase()}.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <p style={{ fontSize: 15, color: '#f1f5f9', margin: 0, lineHeight: 1.5 }}>
                  Estatisticamente, quando este atleta termina a <strong>{weekdayNames[summary.todayWeekday]}</strong> neste estado, 
                  existe <strong>{summary.chanceToChange.toFixed(1)}% de chance</strong> da entropia mudar de nível na <strong>{weekdayNames[summary.nextWeekday]}</strong>.
                </p>

                <div style={{ display: 'flex', gap: 12 }}>
                  {([1, 2, 3, 4] as MarkovState[])
                    .filter(t => summary.probs[t] > 0)
                    .map(targetState => {
                      const p = summary.probs[targetState];
                      const isHighest = Math.max(...Object.values(summary.probs)) === p;
                      
                      return (
                        <div key={targetState} style={{
                          flex: 1,
                          background: isHighest ? `${getStateColor(targetState)}15` : '#0f1520',
                          border: `1px solid ${isHighest ? getStateColor(targetState) : '#334155'}`,
                          padding: '16px 12px', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
                        }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Chance de {getStateLabel(targetState)}
                          </span>
                          <span style={{ fontSize: 24, fontWeight: 900, color: getStateColor(targetState) }}>
                            {p.toFixed(1)}%
                          </span>
                        </div>
                      );
                  })}
                </div>
                
                <p style={{ fontSize: 11, color: '#64748b', margin: 0, textAlign: 'center' }}>
                  Análise baseada em {summary.totalOccurrences} semanas do histórico real do atleta.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
