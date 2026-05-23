import { useState, useMemo } from 'react';
import type { ShiftEntry } from '../types';
import {
  generateDailyEntropyPoints,
  downsampleToWeekly,
  type EntropyPoint
} from '../utils/entropy';
import { Sun, Sunset, Moon, Sparkles, Activity, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  entries: ShiftEntry[];
}

type TimeFilter = '7D' | '1M' | '6M' | '1A';

// Reusable premium Custom Tooltip Component for all 4 charts
const CustomTooltip = ({ active, payload, label, deltaKey }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const rawVal = item.value;
    const delta = item.payload[deltaKey] || 0;
    
    return (
      <div style={{
        backgroundColor: '#0a0e17',
        border: '1px solid #1e293b',
        borderRadius: 14,
        padding: '10px 14px',
        fontSize: 12,
        boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
        fontFamily: "'Inter', sans-serif"
      }}>
        <p style={{ fontWeight: 800, color: '#f1f5f9', margin: '0 0 6px 0' }}>{label}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <span style={{ color: '#64748b' }}>Entropia:</span>
            <span style={{ fontWeight: 700, color: item.color }}>{Number(rawVal).toFixed(3)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <span style={{ color: '#64748b' }}>Variação:</span>
            <span style={{
              fontWeight: 800,
              color: delta === 0 ? '#64748b' : delta > 0 ? '#ef4444' : '#10b981'
            }}>
              {delta === 0 ? '0.0% (estável)' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const AthleteDashboard = ({ entries }: Props) => {
  const [filter, setFilter] = useState<TimeFilter>('1M');

  // Generate all daily points (Cold start & Shannon Entropy calculations inside)
  const dailyPoints = useMemo(() => {
    return generateDailyEntropyPoints(entries);
  }, [entries]);

  // Determine current calibration state
  const totalShiftsCount = entries.length;
  const isCalibrating = totalShiftsCount < 21;

  // Filter daily points based on time range
  const filteredDailyPoints = useMemo(() => {
    if (dailyPoints.length === 0) return [];
    
    let daysToKeep = 7;
    if (filter === '7D') daysToKeep = 7;
    else if (filter === '1M') daysToKeep = 30;
    else if (filter === '6M') daysToKeep = 180;
    else if (filter === '1A') daysToKeep = 365;

    return dailyPoints.slice(-daysToKeep);
  }, [dailyPoints, filter]);

  // Calculate top badge variation Δ% (Today vs Yesterday)
  const deltaInfo = useMemo(() => {
    if (dailyPoints.length < 2) return { value: 0, text: 'Sem dados suficientes' };

    const todayPt = dailyPoints[dailyPoints.length - 1];

    return {
      value: todayPt.generalDelta,
      text: todayPt.generalDelta > 0 ? `+${todayPt.generalDelta}%` : `${todayPt.generalDelta}%`
    };
  }, [dailyPoints]);

  // Downsampling calculation for long-term views
  const isLongTerm = filter === '6M' || filter === '1A';

  const chartData = useMemo(() => {
    if (filteredDailyPoints.length === 0) return [];

    if (isLongTerm) {
      // Return downsampled weekly data
      return downsampleToWeekly(filteredDailyPoints);
    }

    // Return raw daily points
    return filteredDailyPoints.map(p => ({
      name: p.label,
      general: p.generalEntropy,
      morning: p.morningEntropy,
      afternoon: p.afternoonEntropy,
      night: p.nightEntropy,
      generalDelta: p.generalDelta,
      morningDelta: p.morningDelta,
      afternoonDelta: p.afternoonDelta,
      nightDelta: p.nightDelta
    }));
  }, [filteredDailyPoints, isLongTerm]);

  // Calibration/Cold-start screen
  if (isCalibrating) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px', background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 28,
        textAlign: 'center', fontFamily: "'Inter', sans-serif", color: '#94a3b8', gap: 20
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(0,168,255,0.06)', border: '1px solid rgba(0,168,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Sparkles style={{ width: 28, height: 28, color: '#00a8ff' }} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px 0' }}>
            Painel em Calibração
          </h3>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 300, margin: '0 auto', lineHeight: 1.5 }}>
            O sismógrafo analítico e o motor de entropia precisam de pelo menos 21 turnos registrados (1 semana completa) para mapear sua rotina inicial.
          </p>
        </div>
        <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
            <span>Calibração do Baseline</span>
            <span style={{ color: '#00a8ff' }}>{totalShiftsCount} / 21 registros</span>
          </div>
          <div style={{ width: '100%', height: 8, background: '#000', borderRadius: 10, border: '1px solid #1e293b', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${(totalShiftsCount / 21) * 100}%`,
              background: 'linear-gradient(90deg, #0077cc, #00a8ff)',
              boxShadow: '0 0 10px rgba(0,168,255,0.4)', transition: 'width 0.4s'
            }} />
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>
          Continue preenchendo seus registros diários para liberar os gráficos!
        </p>
      </div>
    );
  }

  const latestEntropy = dailyPoints[dailyPoints.length - 1]?.generalEntropy || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24, fontFamily: "'Inter', sans-serif" }}>
      
      {/* FILTER BUTTONS & TITLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: '0 0 4px 0' }}>Sismógrafo Analítico</h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Análise de desvio rotineiro ponto a ponto via Entropia de Shannon</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#0a0e17', border: '1px solid #1e293b', padding: 4, borderRadius: 12 }}>
          {(['7D', '1M', '6M', '1A'] as TimeFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none',
                background: filter === f ? 'rgba(0,168,255,0.1)' : 'transparent',
                color: filter === f ? '#00a8ff' : '#64748b',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* METRIC HEADER CARD */}
      <div style={{
        borderRadius: 24, padding: '20px 24px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(0,168,255,0.05), #000)',
        border: '1px solid rgba(0,168,255,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
            Meta-Entropia Geral de Hoje (Balanço dos Turnos)
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{
              fontSize: 48, fontWeight: 900, color: '#00a8ff',
              textShadow: '0 0 20px rgba(0,168,255,0.3)'
            }}>
              {latestEntropy.toFixed(3)}
            </span>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>/ 1.585 max</span>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 6, margin: '6px 0 0 0' }}>
            Calculada a partir das entropias individuais de cada turno.
          </p>
        </div>

        {/* Dynamic Delta% Badge */}
        {dailyPoints.length >= 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              Variação Diária
            </span>
            <div style={{
              padding: '6px 12px', borderRadius: 12, fontSize: 14, fontWeight: 800,
              background: deltaInfo.value === 0 
                ? 'rgba(71,85,105,0.1)' 
                : deltaInfo.value > 0 
                  ? 'rgba(239,68,68,0.08)' 
                  : 'rgba(16,185,129,0.08)',
              border: `1px solid ${
                deltaInfo.value === 0 
                  ? 'rgba(71,85,105,0.2)' 
                  : deltaInfo.value > 0 
                    ? 'rgba(239,68,68,0.2)' 
                    : 'rgba(16,185,129,0.2)'
              }`,
              color: deltaInfo.value === 0 
                ? '#94a3b8' 
                : deltaInfo.value > 0 
                  ? '#ef4444' 
                  : '#10b981',
              boxShadow: deltaInfo.value === 0 
                ? 'none' 
                : `0 0 15px ${deltaInfo.value > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'}`
            }}>
              {deltaInfo.text}
            </div>
            <span style={{ fontSize: 10, color: '#475569' }}>vs ontem</span>
          </div>
        )}
      </div>

      {/* 2X2 DASHBOARD GRID (4 LARGE LINE CHARTS) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20
      }}>
        {/* CHART 1: Meta-Entropy (Geral) */}
        <div style={{ background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 24, padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, paddingLeft: 8 }}>
            <Activity style={{ width: 14, height: 14, color: '#00a8ff' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              1. Meta-Entropia Geral {isLongTerm ? '(Semanal)' : '(Diário)'}
            </span>
          </div>
          <div style={{ height: 160, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#334155" fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} minTickGap={20} />
                <YAxis stroke="#334155" fontSize={9} tickLine={false} axisLine={false} domain={[0, 1.6]} tick={{ fill: '#64748b' }} tickFormatter={(v: number) => v.toFixed(1)} />
                <Tooltip content={<CustomTooltip dataKey="general" deltaKey="generalDelta" />} />
                <Line
                  type="monotone"
                  dataKey="general"
                  stroke="#00a8ff"
                  strokeWidth={2.5}
                  dot={chartData.length <= 31 ? { r: 2, fill: '#000', stroke: '#00a8ff', strokeWidth: 2 } : false}
                  activeDot={{ r: 5, fill: '#00a8ff', stroke: '#000', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Morning Entropy */}
        <div style={{ background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 24, padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, paddingLeft: 8 }}>
            <Sun style={{ width: 14, height: 14, color: '#f59e0b' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              2. Entropia da Manhã {isLongTerm ? '(Semanal)' : '(Diário)'}
            </span>
          </div>
          <div style={{ height: 160, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#334155" fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} minTickGap={20} />
                <YAxis stroke="#334155" fontSize={9} tickLine={false} axisLine={false} domain={[0, 2]} tick={{ fill: '#64748b' }} tickFormatter={(v: number) => v.toFixed(1)} />
                <Tooltip content={<CustomTooltip dataKey="morning" deltaKey="morningDelta" />} />
                <Line
                  type="monotone"
                  dataKey="morning"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={chartData.length <= 31 ? { r: 2, fill: '#000', stroke: '#f59e0b', strokeWidth: 2 } : false}
                  activeDot={{ r: 5, fill: '#f59e0b', stroke: '#000', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Afternoon Entropy */}
        <div style={{ background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 24, padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, paddingLeft: 8 }}>
            <Sunset style={{ width: 14, height: 14, color: '#f97316' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              3. Entropia da Tarde {isLongTerm ? '(Semanal)' : '(Diário)'}
            </span>
          </div>
          <div style={{ height: 160, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#334155" fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} minTickGap={20} />
                <YAxis stroke="#334155" fontSize={9} tickLine={false} axisLine={false} domain={[0, 2]} tick={{ fill: '#64748b' }} tickFormatter={(v: number) => v.toFixed(1)} />
                <Tooltip content={<CustomTooltip dataKey="afternoon" deltaKey="afternoonDelta" />} />
                <Line
                  type="monotone"
                  dataKey="afternoon"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={chartData.length <= 31 ? { r: 2, fill: '#000', stroke: '#f97316', strokeWidth: 2 } : false}
                  activeDot={{ r: 5, fill: '#f97316', stroke: '#000', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Night Entropy */}
        <div style={{ background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 24, padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, paddingLeft: 8 }}>
            <Moon style={{ width: 14, height: 14, color: '#6366f1' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              4. Entropia da Noite {isLongTerm ? '(Semanal)' : '(Diário)'}
            </span>
          </div>
          <div style={{ height: 160, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#334155" fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} minTickGap={20} />
                <YAxis stroke="#334155" fontSize={9} tickLine={false} axisLine={false} domain={[0, 2]} tick={{ fill: '#64748b' }} tickFormatter={(v: number) => v.toFixed(1)} />
                <Tooltip content={<CustomTooltip dataKey="night" deltaKey="nightDelta" />} />
                <Line
                  type="monotone"
                  dataKey="night"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={chartData.length <= 31 ? { r: 2, fill: '#000', stroke: '#6366f1', strokeWidth: 2 } : false}
                  activeDot={{ r: 5, fill: '#6366f1', stroke: '#000', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FULL DETAILED AUDITABLE DAILY HISTORY TABLE */}
      <div style={{ background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 24, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Clock style={{ width: 14, height: 14, color: '#00a8ff' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Detalhamento Diário Auditável (Histórico Completo)
          </span>
        </div>
        
        <div style={{ overflowX: 'auto', maxHeight: 350, border: '1px solid #1e293b', borderRadius: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#0a0e17', zIndex: 2 }}>
              <tr style={{ borderBottom: '2px solid #1e293b' }}>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 11 }}>Dia</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 11 }}>Meta-Entropia Geral</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 11 }}>Variação (Δ%)</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 11 }}>Manhã</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 11 }}>Tarde</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 11 }}>Noite</th>
              </tr>
            </thead>
            <tbody>
              {[...filteredDailyPoints].reverse().map((pt, idx) => {
                const isStable = pt.generalDelta === 0;
                const isRupture = pt.generalDelta > 0;
                
                return (
                  <tr key={pt.date} style={{ 
                    borderBottom: '1px solid rgba(30,41,59,0.5)',
                    background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
                  }}>
                    <td style={{ padding: '12px 16px', color: '#f1f5f9', fontWeight: 700 }}>{pt.label}</td>
                    <td style={{ padding: '12px 16px', color: '#00a8ff', fontWeight: 800 }}>{pt.generalEntropy.toFixed(3)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: 8, fontSize: 10, fontWeight: 800,
                        background: isStable ? 'rgba(71,85,105,0.1)' : isRupture ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                        border: `1px solid ${isStable ? 'rgba(71,85,105,0.2)' : isRupture ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                        color: isStable ? '#64748b' : isRupture ? '#ef4444' : '#10b981'
                      }}>
                        {isStable ? '0.0%' : `${isRupture ? '+' : ''}${pt.generalDelta.toFixed(1)}%`}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#f59e0b', fontWeight: 600 }}>{pt.morningEntropy.toFixed(3)}</td>
                    <td style={{ padding: '12px 16px', color: '#f97316', fontWeight: 600 }}>{pt.afternoonEntropy.toFixed(3)}</td>
                    <td style={{ padding: '12px 16px', color: '#6366f1', fontWeight: 600 }}>{pt.nightEntropy.toFixed(3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
export type { EntropyPoint };
