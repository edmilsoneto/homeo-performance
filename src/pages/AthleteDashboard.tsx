import { useState, useMemo } from 'react';
import type { ShiftEntry } from '../types';
import {
  generateDailyEntropyPoints,
  downsampleToWeekly,
  calculateDeltaPercentage,
  type EntropyPoint
} from '../utils/entropy';
import { TrendingUp, Sun, Sunset, Moon, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  entries: ShiftEntry[];
}

type TimeFilter = '7D' | '1M' | '6M' | '1A';

const SHIFT_ICON = {
  Manhã: Sun,
  Tarde: Sunset,
  Noite: Moon
};

const SHIFT_COLOR = {
  Manhã: '#f59e0b',
  Tarde: '#f97316',
  Noite: '#6366f1'
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
    const yesterdayPt = dailyPoints[dailyPoints.length - 2];

    const delta = calculateDeltaPercentage(todayPt.generalEntropy, yesterdayPt.generalEntropy);

    return {
      value: delta,
      text: delta > 0 ? `+${delta}%` : `${delta}%`
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
      night: p.nightEntropy
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24, fontFamily: "'Inter', sans-serif" }}>
      
      {/* FILTER BUTTONS & TITLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: '0 0 4px 0' }}>Sismógrafo Analítico</h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Análise de oscilações da rotina via Entropia de Shannon</p>
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
            Entropia Geral de Hoje
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{
              fontSize: 48, fontWeight: 900, color: '#00a8ff',
              textShadow: '0 0 20px rgba(0,168,255,0.3)'
            }}>
              {latestEntropy.toFixed(3)}
            </span>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>/ 2.000 max</span>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 6, margin: '6px 0 0 0' }}>
            Baseado na janela móvel de 21 turnos (7 dias).
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

      {/* MAIN LINE CHART CONTAINER */}
      <div style={{ background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 24, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <TrendingUp style={{ width: 14, height: 14, color: '#00a8ff' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2 }}>
            Oscilações da Entropia Geral {isLongTerm ? '(Média Semanal)' : '(Pontos Diários)'}
          </span>
        </div>
        
        <div style={{ height: 220, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="generalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00a8ff" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#00a8ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} minTickGap={20} />
              <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} domain={[0, 2]} tick={{ fill: '#64748b' }} tickFormatter={(v: number) => v.toFixed(1)} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0e17', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12, color: '#f1f5f9' }}
                labelStyle={{ fontWeight: 700, color: '#00a8ff', marginBottom: 4 }}
                formatter={(v: any) => [`${Number(v).toFixed(3)}`, 'Entropia']}
              />
              <Line
                type="monotone"
                dataKey="general"
                stroke="#00a8ff"
                strokeWidth={3}
                dot={chartData.length <= 31 ? { r: 3, fill: '#000', stroke: '#00a8ff', strokeWidth: 2 } : false}
                activeDot={{ r: 6, fill: '#00a8ff', stroke: '#000', strokeWidth: 2 }}
                name="Geral"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* THREE SPARKLINES GRID (1x3 on Desktop, 3x1 on Mobile) */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          Entropias por Turno (Sparklines 7 dias móveis)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {(['Manhã', 'Tarde', 'Noite'] as ('Manhã' | 'Tarde' | 'Noite')[]).map(shift => {
            const Icon = SHIFT_ICON[shift];
            const color = SHIFT_COLOR[shift];
            const rawKey = (shift === 'Manhã' ? 'morningEntropy' : shift === 'Tarde' ? 'afternoonEntropy' : 'nightEntropy') as keyof EntropyPoint;
            const chartKey = shift === 'Manhã' ? 'morning' : shift === 'Tarde' ? 'afternoon' : 'night';

            return (
              <div key={shift} style={{ background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon style={{ width: 14, height: 14, color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{shift}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color }}>
                    {Number(filteredDailyPoints[filteredDailyPoints.length - 1]?.[rawKey] || 0).toFixed(2)}
                  </span>
                </div>

                {/* Minimalist Sparkline chart */}
                <div style={{ height: 60, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 2, right: 2, left: -35, bottom: 2 }}>
                      <YAxis domain={[0, 2]} hide />
                      <XAxis dataKey="name" hide />
                      <Line
                        type="monotone"
                        dataKey={chartKey}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: color }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

