import { useState, useMemo } from 'react';
import type { ShiftEntry } from '../types';
import {
  generateDailyEntropyPoints,
  downsampleToWeekly
} from '../utils/entropy';
import { Sun, Sunset, Moon, Sparkles, Activity, Clock, Info, Check, AlertTriangle, ShieldCheck, Calendar as CalendarIcon, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  entries: ShiftEntry[];
}

type TimeFilter = '7D' | '1M' | '6M' | '1A';
type DashboardTab = 'charts' | 'history';
type StatusFilter = 'all' | 'ruptura' | 'rigidez' | 'estavel';

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
  const [activeTab, setActiveTab] = useState<DashboardTab>('charts');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateSearch, setDateSearch] = useState<string>('');

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

  // Combined filtering logic for Tab 2 (Chronological list with filters)
  const processedHistoryPoints = useMemo(() => {
    return filteredDailyPoints.filter(pt => {
      // 1. Filter by Status Pill
      if (statusFilter !== 'all') {
        const delta = pt.generalDelta;
        if (statusFilter === 'ruptura' && delta <= 15) return false;
        if (statusFilter === 'rigidez' && delta >= -15) return false;
        if (statusFilter === 'estavel' && (delta > 15 || delta < -15)) return false;
      }

      // 2. Filter by Date search
      if (dateSearch) {
        if (pt.date !== dateSearch) return false;
      }

      return true;
    });
  }, [filteredDailyPoints, statusFilter, dateSearch]);

  // Calculate top badge and diagnostic details based on today's data
  const todayDiagnostic = useMemo(() => {
    if (dailyPoints.length === 0) return null;
    const todayPt = dailyPoints[dailyPoints.length - 1];
    
    const delta = todayPt.generalDelta;
    let label = 'Estável';
    let desc = 'Rotina consistente com o padrão adaptativo normal.';
    let color = '#10b981'; // Green
    let bg = 'rgba(16, 185, 129, 0.08)';
    let border = 'rgba(16, 185, 129, 0.2)';
    let Icon = ShieldCheck;

    if (delta > 15) {
      label = 'Ruptura (Alta Instabilidade)';
      desc = `Desorganização acentuada na rotina em relação a ontem (+${delta}%). Alerta de pico de estresse, sono desregulado ou quebras drásticas de hábitos.`;
      color = '#ef4444'; // Red
      bg = 'rgba(239, 68, 68, 0.08)';
      border = 'rgba(239, 68, 68, 0.2)';
      Icon = AlertTriangle;
    } else if (delta < -15) {
      label = 'Rigidez (Volatilidade Baixa)';
      desc = `Queda acentuada de variação em relação a ontem (${delta}%). Alerta para rotinas excessivamente monótonas ou início de quadro de fadiga crônica por monotonia.`;
      color = '#f59e0b'; // Amber
      bg = 'rgba(245, 158, 11, 0.08)';
      border = 'rgba(245, 158, 11, 0.2)';
      Icon = AlertTriangle;
    }

    return {
      value: todayPt.generalEntropy,
      morningEntropy: todayPt.morningEntropy,
      afternoonEntropy: todayPt.afternoonEntropy,
      nightEntropy: todayPt.nightEntropy,
      delta,
      deltaText: delta > 0 ? `+${delta}%` : `${delta}%`,
      label,
      desc,
      color,
      bg,
      border,
      Icon
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

  const handleResetFilters = () => {
    setStatusFilter('all');
    setDateSearch('');
  };

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
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Análise avançada da variação de rotina por Entropia de Shannon</p>
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

      {/* METRIC HEADER CARD (DIAGNOSTICS & DETAILS INSTANTANEO) */}
      {todayDiagnostic && (
        <div style={{
          borderRadius: 24, padding: '24px', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(0,168,255,0.05), #000)',
          border: '1px solid rgba(0,168,255,0.15)',
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
                Meta-Entropia Geral de Hoje (Balanço dos Turnos)
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{
                  fontSize: 48, fontWeight: 900, color: '#00a8ff',
                  textShadow: '0 0 20px rgba(0,168,255,0.3)'
                }}>
                  {todayDiagnostic.value.toFixed(3)}
                </span>
                <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>/ 1.585 max</span>
              </div>
            </div>

            {/* Delta% Badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                Variação Diária
              </span>
              <div style={{
                padding: '6px 12px', borderRadius: 12, fontSize: 14, fontWeight: 800,
                background: todayDiagnostic.bg,
                border: `1px solid ${todayDiagnostic.border}`,
                color: todayDiagnostic.color,
                boxShadow: `0 0 15px ${todayDiagnostic.border}`
              }}>
                {todayDiagnostic.deltaText}
              </div>
            </div>
          </div>

          {/* Detailed Instant Diagnosis Panel */}
          <div style={{
            background: todayDiagnostic.bg,
            border: `1px solid ${todayDiagnostic.border}`,
            borderRadius: 16,
            padding: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}>
            <todayDiagnostic.Icon style={{ width: 20, height: 20, color: todayDiagnostic.color, flexShrink: 0, marginTop: 2 }} />
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: todayDiagnostic.color, margin: '0 0 4px 0' }}>
                Status: {todayDiagnostic.label}
              </h4>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                {todayDiagnostic.desc}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(30,41,59,0.3)', width: '100%' }} />

          {/* Entropias por Turno de Hoje */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, margin: 0 }}>
              Detalhamento de Hoje por Turno
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
            }}>
              {/* Manhã */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid #1e293b',
                borderRadius: 14,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sun style={{ width: 12, height: 12, color: '#f59e0b' }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Manhã</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#f59e0b', textShadow: '0 0 10px rgba(245,158,11,0.1)' }}>
                  {todayDiagnostic.morningEntropy.toFixed(3)}
                </span>
              </div>

              {/* Tarde */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid #1e293b',
                borderRadius: 14,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sunset style={{ width: 12, height: 12, color: '#f97316' }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tarde</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#f97316', textShadow: '0 0 10px rgba(249,115,22,0.1)' }}>
                  {todayDiagnostic.afternoonEntropy.toFixed(3)}
                </span>
              </div>

              {/* Noite */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid #1e293b',
                borderRadius: 14,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Moon style={{ width: 12, height: 12, color: '#6366f1' }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Noite</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#6366f1', textShadow: '0 0 10px rgba(99,102,241,0.1)' }}>
                  {todayDiagnostic.nightEntropy.toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD TAB SELECTOR */}
      <div style={{ display: 'flex', gap: 8, background: '#0a0e17', border: '1px solid #1e293b', padding: 6, borderRadius: 16 }}>
        <button
          onClick={() => setActiveTab('charts')}
          style={{
            flex: 1, padding: '10px', borderRadius: 12, border: 'none',
            background: activeTab === 'charts' ? 'rgba(0,168,255,0.1)' : 'transparent',
            color: activeTab === 'charts' ? '#00a8ff' : '#64748b',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}
        >
          <Activity style={{ width: 15, height: 15 }} />
          Gráficos Analíticos
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            flex: 1, padding: '10px', borderRadius: 12, border: 'none',
            background: activeTab === 'history' ? 'rgba(0,168,255,0.1)' : 'transparent',
            color: activeTab === 'history' ? '#00a8ff' : '#64748b',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}
        >
          <Clock style={{ width: 15, height: 15 }} />
          Histórico e Anomalias
        </button>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'charts' ? (
        /* TAB 1: CHARTS GRID 2x2 */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20
        }}>
          {/* CHART 1: Meta-Entropy */}
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
                  <Tooltip content={<CustomTooltip deltaKey="generalDelta" />} />
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
                  <Tooltip content={<CustomTooltip deltaKey="morningDelta" />} />
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
                  <Tooltip content={<CustomTooltip deltaKey="afternoonDelta" />} />
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
                  <Tooltip content={<CustomTooltip deltaKey="nightDelta" />} />
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
      ) : (
        /* TAB 2: DETAILED HISTORY & ANOMALIES (CHRONOLOGICAL ORDER + CATEGORIAL & CALENDAR FILTERS) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* SCIENTIFIC EXPLANATORY LEGEND CARD */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid #1e293b',
            borderRadius: 20,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #1e293b', paddingBottom: 10 }}>
              <Info style={{ width: 16, height: 16, color: '#00a8ff' }} />
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9', margin: 0, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Legenda Científica do Painel de Anomalias
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12, lineHeight: 1.5, color: '#94a3b8' }}>
              <p style={{ margin: 0 }}>
                O painel de anomalias analisa a <strong>oscilação diária (Meta-Entropia Geral)</strong> para detectar quebras abruptas na consistência de hábitos do atleta.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginTop: 4 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                    ⚠️ Ruptura (&gt; +15%)
                  </span>
                  <span style={{ color: '#64748b' }}>
                    Ocorre quando há um pico súbito de entropia. Indica desorganização expressiva, quebra de rotina, variações drásticas nos turnos ou pico de estresse comportamental.
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                    ⚠️ Rigidez (&lt; -15%)
                  </span>
                  <span style={{ color: '#64748b' }}>
                    Ocorre quando a entropia despenca. Indica rotina puramente mecânica, monotonia excessiva ou início de quadro de fadiga (monotonia biológica prejudicial à adaptação).
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                    ✓ Estável (Dentro de ±15%)
                  </span>
                  <span style={{ color: '#64748b' }}>
                    Oscilação dentro dos limites fisiológicos normais. Representa consistência comportamental saudável e hábitos adaptativos estáveis.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ADVANCED FILTERING CONTROLS (PILLS + DATEPICKER CALENDAR) */}
          <div style={{
            background: '#0a0e17',
            border: '1px solid #1e293b',
            borderRadius: 20,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            {/* 1. Status Filter Pills */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Filtrar por Status de Anomalia
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setStatusFilter('all')}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: '1px solid',
                    background: statusFilter === 'all' ? 'rgba(0,168,255,0.08)' : 'transparent',
                    borderColor: statusFilter === 'all' ? '#00a8ff' : '#1e293b',
                    color: statusFilter === 'all' ? '#00a8ff' : '#64748b',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  Todos os Dias
                </button>
                <button
                  onClick={() => setStatusFilter('ruptura')}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: '1px solid',
                    background: statusFilter === 'ruptura' ? 'rgba(239,68,68,0.08)' : 'transparent',
                    borderColor: statusFilter === 'ruptura' ? '#ef4444' : '#1e293b',
                    color: statusFilter === 'ruptura' ? '#ef4444' : '#64748b',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  ⚠️ Rupturas
                </button>
                <button
                  onClick={() => setStatusFilter('rigidez')}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: '1px solid',
                    background: statusFilter === 'rigidez' ? 'rgba(245,158,11,0.08)' : 'transparent',
                    borderColor: statusFilter === 'rigidez' ? '#f59e0b' : '#1e293b',
                    color: statusFilter === 'rigidez' ? '#f59e0b' : '#64748b',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  ⚠️ Rigidez
                </button>
                <button
                  onClick={() => setStatusFilter('estavel')}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: '1px solid',
                    background: statusFilter === 'estavel' ? 'rgba(16,185,129,0.08)' : 'transparent',
                    borderColor: statusFilter === 'estavel' ? '#10b981' : '#1e293b',
                    color: statusFilter === 'estavel' ? '#10b981' : '#64748b',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  ✓ Estáveis
                </button>
              </div>
            </div>

            {/* 2. Date Picker (Calendar) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderTop: '1px solid rgba(30,41,59,0.3)', paddingTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
                <CalendarIcon style={{ width: 14, height: 14, color: '#00a8ff' }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Buscar Data Específica:</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="date"
                  value={dateSearch}
                  onChange={e => setDateSearch(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    backgroundColor: '#000',
                    border: '1px solid #1e293b',
                    color: '#fff',
                    fontSize: 12,
                    fontFamily: "'Inter', sans-serif",
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                {(statusFilter !== 'all' || dateSearch) && (
                  <button
                    onClick={handleResetFilters}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '8px 12px',
                      borderRadius: 10,
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <X style={{ width: 11, height: 11 }} />
                    Limpar Filtros
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* CHRONOLOGICAL LIST OF DAILY CARDS */}
          {processedHistoryPoints.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 20,
              fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center'
            }}>
              <AlertTriangle style={{ width: 28, height: 28, color: '#f59e0b' }} />
              <div>
                <p style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700, margin: '0 0 4px 0' }}>
                  Nenhum registro encontrado
                </p>
                <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
                  Nenhum dia corresponde aos critérios de status e data selecionados.
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                style={{
                  padding: '8px 16px', borderRadius: 10, background: '#00a8ff', border: 'none',
                  color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(0,168,255,0.2)'
                }}
              >
                Restaurar Histórico
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Natural chronological order: Older to Newer, following weekday order! */}
              {processedHistoryPoints.map(pt => {
                const delta = pt.generalDelta;
                let label = 'Estável';
                let color = '#10b981';
                let bg = 'rgba(16, 185, 129, 0.06)';
                let border = 'rgba(16, 185, 129, 0.15)';
                let Icon = Check;
                let diagnosis = `Variação normal de rotina (${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%). Indica adaptação saudável e consistência comportamental estável.`;

                if (delta > 15) {
                  label = 'Ruptura (Alta Instabilidade)';
                  color = '#ef4444';
                  bg = 'rgba(239, 68, 68, 0.06)';
                  border = 'rgba(239, 68, 68, 0.15)';
                  Icon = AlertTriangle;
                  diagnosis = `Desorganização acentuada na rotina em relação ao dia anterior (+${delta.toFixed(1)}%). Alerta para picos de estresse, sono desregulado ou quebras drásticas de hábitos e horários.`;
                } else if (delta < -15) {
                  label = 'Rigidez (Volatilidade Baixa)';
                  color = '#f59e0b';
                  bg = 'rgba(245, 158, 11, 0.06)';
                  border = 'rgba(245, 158, 11, 0.15)';
                  Icon = AlertTriangle;
                  diagnosis = `Queda acentuada na oscilação dos turnos (${delta.toFixed(1)}%). Alerta para rotinas excessivamente mecânicas, monotonia de estímulos ou início de fadiga crônica por falta de carga adaptativa.`;
                }

                // Get complete weekday name in Portuguese
                const dateObj = new Date(pt.date + 'T12:00:00');
                const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
                const shortDateStr = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

                return (
                  <div key={pt.date} style={{
                    background: '#0a0e17',
                    border: `1px solid ${border}`,
                    borderRadius: 22,
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s'
                  }}>
                    
                    {/* Card Header (Date & Status) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 900, color: '#f1f5f9', margin: '0 0 3px 0', textTransform: 'capitalize' }}>
                          {weekday}
                        </h4>
                        <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                          {shortDateStr}
                        </p>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 12px',
                        borderRadius: 10,
                        background: bg,
                        border: `1px solid ${border}`,
                        color,
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}>
                        <Icon style={{ width: 12, height: 12 }} />
                        {label}
                      </div>
                    </div>

                    {/* Scientific Diagnostic text */}
                    <p style={{
                      fontSize: 12,
                      color: '#94a3b8',
                      lineHeight: 1.5,
                      margin: 0,
                      paddingLeft: 8,
                      borderLeft: `2px solid ${color}`
                    }}>
                      {diagnosis}
                    </p>

                    {/* Individual Metrics Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 10,
                      background: '#000',
                      border: '1px solid #1e293b',
                      borderRadius: 16,
                      padding: '12px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Geral (Meta)</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#00a8ff' }}>{pt.generalEntropy.toFixed(3)}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Manhã</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{pt.morningEntropy.toFixed(3)}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Tarde</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#f97316' }}>{pt.afternoonEntropy.toFixed(3)}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Noite</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#6366f1' }}>{pt.nightEntropy.toFixed(3)}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
export type { EntropyPoint };
