import { useMemo } from 'react';
import type { ShiftEntry, ShiftType } from '../types';
import { calculateVolatility } from '../utils/entropy';
import { AlertTriangle, Shield, TrendingUp, Sun, Sunset, Moon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface Props {
  entries: ShiftEntry[];
}

const SHIFT_ORDER: ShiftType[] = ['Manhã', 'Tarde', 'Noite'];
const SHIFT_ICON: Record<ShiftType, typeof Sun> = { 'Manhã': Sun, 'Tarde': Sunset, 'Noite': Moon };
const SHIFT_COLOR: Record<ShiftType, string> = { 'Manhã': '#f59e0b', 'Tarde': '#f97316', 'Noite': '#6366f1' };

export const AthleteDashboard = ({ entries }: Props) => {
  const { currentVolatility, baselineVolatility, deviation, isAlert } = useMemo(() => {
    const cutoff7 = new Date().getTime() - (7 * 86400000);
    const recent7 = entries.filter(e => e.timestamp >= cutoff7);
    const cutoff30 = new Date().getTime() - (30 * 86400000);
    const recent30 = entries.filter(e => e.timestamp >= cutoff30);
    
    const curVol = calculateVolatility(recent7);
    const baseVol = recent30.length > 0 ? calculateVolatility(recent30) : curVol;
    const dev = Math.abs(curVol - baseVol);
    
    return {
      currentVolatility: curVol,
      baselineVolatility: baseVol,
      deviation: dev,
      isAlert: dev > 20
    };
  }, [entries]);

  const { chartData, shiftCharts } = useMemo(() => {
    const daysList: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      daysList.push(d.toISOString().split('T')[0]);
    }

    // Meta-Volatility trend
    const chart = daysList.map(day => {
      const currentDayDate = new Date(day + 'T12:00:00');
      
      const sevenDaysAgo = new Date(currentDayDate);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cutoff7 = sevenDaysAgo.toISOString().split('T')[0];

      const thirtyDaysAgo = new Date(currentDayDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoff30 = thirtyDaysAgo.toISOString().split('T')[0];

      const rolling7 = entries.filter(e => e.date <= day && e.date > cutoff7);
      const rolling30 = entries.filter(e => e.date <= day && e.date > cutoff30);
      
      const v = rolling7.length > 0 ? Math.round(calculateVolatility(rolling7)) : 0;
      const b = rolling30.length > 0 ? Math.round(calculateVolatility(rolling30)) : v;

      return {
        name: currentDayDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        vol: v,
        base: b,
      };
    });

    // Per-shift bar charts
    const sc: Record<ShiftType, { name: string; nota: number; color: string }[]> = {
      'Manhã': [], 'Tarde': [], 'Noite': [],
    };
    daysList.forEach(day => {
      const short = day.substring(5).replace('-', '/'); // MM/DD
      SHIFT_ORDER.forEach(shift => {
        const entry = entries.find(e => e.date === day && e.shift === shift);
        sc[shift].push({
          name: short,
          nota: entry ? (entry.feedback === 'Bom' ? entry.intensity : -entry.intensity) : 0,
          color: entry ? (entry.feedback === 'Bom' ? '#10b981' : '#ef4444') : '#1e293b',
        });
      });
    });

    return { chartData: chart, shiftCharts: sc };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 60, color: '#64748b', fontSize: 14 }}>
        <p style={{ marginBottom: 4 }}>Sem dados ainda</p>
        <p style={{ fontSize: 12 }}>Registre seu primeiro turno na aba Registro</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24 }}>
      {/* VOLATILITY CARD */}
      <div style={{
        borderRadius: 24, padding: '24px', position: 'relative', overflow: 'hidden',
        background: isAlert
          ? 'linear-gradient(135deg, rgba(239,68,68,0.07), #000)'
          : 'linear-gradient(135deg, rgba(16,185,129,0.07), #000)',
        border: `1px solid ${isAlert ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
      }}>
        <div style={{ position: 'absolute', top: 16, right: 16, opacity: 0.05 }}>
          {isAlert
            ? <AlertTriangle style={{ width: 100, height: 100, color: '#ef4444' }} />
            : <Shield style={{ width: 100, height: 100, color: '#10b981' }} />
          }
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
            Desvio de Padrão (Meta-Volatilidade)
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
            <span style={{
              fontSize: 44, fontWeight: 900,
              color: isAlert ? '#ef4444' : '#10b981',
              textShadow: `0 0 25px ${isAlert ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.35)'}`,
            }}>{deviation.toFixed(1)}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#475569' }}>%</span>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
            Semana: {currentVolatility.toFixed(0)}% | Seu Padrão Histórico: {baselineVolatility.toFixed(0)}%
          </p>
          {/* Bar */}
          <div style={{ width: '100%', height: 6, borderRadius: 100, background: '#1e293b', marginBottom: 12 }}>
            <div style={{
              height: '100%', borderRadius: 100, transition: 'width 0.7s',
              width: `${Math.min(deviation * 2, 100)}%`, // Visual amplifier
              background: isAlert ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#10b981,#6ee7b7)',
              boxShadow: `0 0 12px ${isAlert ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
            }} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: isAlert ? '#fca5a5' : '#86efac' }}>
            {isAlert ? '⚠️ Comportamento diferente do seu normal.' : '✓ Você está dentro do seu padrão histórico.'}
          </p>
        </div>
      </div>

      {/* VOLATILITY TREND LINE */}
      <div style={{ background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 20, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp style={{ width: 14, height: 14, color: '#00a8ff' }} />
            <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2 }}>
              Seu Desvio nos últimos 7 dias
            </p>
          </div>
        </div>
        <div style={{ height: 180, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0077cc" />
                  <stop offset="100%" stopColor="#00a8ff" />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
              <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} tick={{ fill: '#64748b' }} tickFormatter={(v: number) => `${v}%`} />
              
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0e17', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#00a8ff' }}
                formatter={(v: any) => [`${v}%`, 'Vol']}
              />
              <Line type="monotone" dataKey="base" stroke="#475569" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} name="Seu Normal" />
              
              <Line type="monotone" dataKey="vol" stroke="url(#lg1)" strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isBreak = Math.abs(payload.vol - payload.base) > 20;
                  if (isBreak) return <circle key={`dot-${payload.name}`} cx={cx} cy={cy} r={4} fill="#ef4444" stroke="#000" strokeWidth={1} />;
                  return <circle key={`dot-${payload.name}`} cx={cx} cy={cy} r={4} fill="#000" stroke="#00a8ff" strokeWidth={2} />;
                }}
                activeDot={{ r: 6, fill: '#00a8ff', stroke: '#000', strokeWidth: 2 }}
                name="Sua Semana"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00a8ff' }} />
            <span style={{ fontSize: 9, color: '#64748b' }}>Sua Semana</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 2, background: '#475569' }} />
            <span style={{ fontSize: 9, color: '#64748b' }}>Seu Normal (Base)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ fontSize: 9, color: '#64748b' }}>Alerta (Quebra)</span>
          </div>
        </div>
      </div>

      {/* PER-SHIFT CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 16 }}>
        {SHIFT_ORDER.map(shift => {
          const Icon = SHIFT_ICON[shift];
          const color = SHIFT_COLOR[shift];
          const data = shiftCharts[shift];
          return (
            <div key={shift} style={{ background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 20, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Icon style={{ width: 14, height: 14, color }} />
                <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2 }}>
                  Notas de {shift} (Últimos 7 dias)
                </p>
              </div>
              <div style={{ height: 140, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#334155" fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                    <YAxis stroke="#334155" fontSize={9} tickLine={false} axisLine={false} domain={[-10, 10]} tick={{ fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0e17', border: '1px solid #1e293b', borderRadius: 12, fontSize: 11, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                      formatter={(v: any) => {
                        const absVal = Math.abs(Number(v));
                        const label = Number(v) >= 0 ? 'Bom' : 'Ruim';
                        return [`${absVal} (${label})`, 'Nota'];
                      }}
                    />
                    <Bar dataKey="nota" radius={[6, 6, 0, 0]}>
                      {data.map((d, i) => (
                        <Cell key={i} fill={d.color} opacity={d.nota === 0 ? 0.15 : 0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
