import { useState, useMemo } from 'react';
import type { User, ShiftEntry } from '../types';
import { calculateVolatility } from '../utils/entropy';
import {
  Users, ChevronRight, AlertTriangle, ArrowLeft,
  TrendingUp, Database, Trash2, Calendar, UserPlus, X, Activity, Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  athletes: User[];
  getEntries: (userId: string, days?: number) => ShiftEntry[];
  getAllEntries: (userId: string) => ShiftEntry[];
  getTodayEntries: (userId: string) => ShiftEntry[];
  registerAthlete: (name: string, pin: string) => Promise<any> | void;
  deleteAthlete: (userId: string) => void;
  generateMockData: (userId: string) => void;
  clearEntries: (userId: string) => void;
}

export const AdminDashboard = ({ athletes, getEntries, getAllEntries, getTodayEntries, registerAthlete, deleteAthlete, generateMockData, clearEntries }: Props) => {
  const [selectedAthlete, setSelectedAthlete] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'athletes'>('daily');
  const [isRegistering, setIsRegistering] = useState(false);

  if (selectedAthlete) {
    return (
      <AthleteDetail
        athlete={selectedAthlete}
        allEntries={getAllEntries(selectedAthlete.id)}
        onBack={() => setSelectedAthlete(null)}
        onGenerateMock={() => generateMockData(selectedAthlete.id)}
        onClear={() => clearEntries(selectedAthlete.id)}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Tabs */}
      <div style={{ display: 'flex', gap: 10, background: '#0a0e17', padding: '6px', borderRadius: 20, border: '1px solid #1e293b' }}>
        <button
          onClick={() => setActiveTab('daily')}
          style={{
            flex: 1, padding: '12px', borderRadius: 14, border: 'none',
            background: activeTab === 'daily' ? 'rgba(0,168,255,0.1)' : 'transparent',
            color: activeTab === 'daily' ? '#00a8ff' : '#64748b',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
          }}
        >
          <Calendar style={{ width: 16, height: 16 }} /> Resumo de Hoje
        </button>
        <button
          onClick={() => setActiveTab('athletes')}
          style={{
            flex: 1, padding: '12px', borderRadius: 14, border: 'none',
            background: activeTab === 'athletes' ? 'rgba(139,92,246,0.1)' : 'transparent',
            color: activeTab === 'athletes' ? '#8b5cf6' : '#64748b',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
          }}
        >
          <Users style={{ width: 16, height: 16 }} /> Equipe
        </button>
      </div>

      {activeTab === 'daily' && (
        <DailySummary athletes={athletes} getTodayEntries={getTodayEntries} getEntries={getEntries} />
      )}

      {activeTab === 'athletes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setIsRegistering(true)}
              style={{
                background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)', color: '#fff', border: 'none',
                padding: '12px 16px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 0 20px rgba(139,92,246,0.3)',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <UserPlus style={{ width: 16, height: 16 }} /> Novo Atleta
            </button>
          </div>

          {athletes.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 20,
            }}>
              <Users style={{ width: 48, height: 48, color: '#334155', margin: '0 auto 16px' }} />
              <p style={{ color: '#94a3b8', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Nenhum atleta na equipe</p>
              <p style={{ color: '#475569', fontSize: 13 }}>Cadastre o primeiro atleta clicando no botão acima.</p>
            </div>
          ) : (
            athletes.map(athlete => {
              const recent7 = getEntries(athlete.id, 7);
              const recent30 = getEntries(athlete.id, 30);
              
              const curVol = recent7.length > 0 ? calculateVolatility(recent7) : 0;
              const baseVol = recent30.length > 0 ? calculateVolatility(recent30) : curVol;
              
              const deviation = Math.abs(curVol - baseVol);
              const isAlert = deviation > 20;

              const lastEntry = recent7.length > 0 ? recent7[recent7.length - 1] : null;

              return (
                <button
                  key={athlete.id}
                  onClick={() => setSelectedAthlete(athlete)}
                  style={{
                    width: '100%', padding: '18px 20px', borderRadius: 20,
                    background: '#0a0e17', border: '1px solid #1e293b',
                    display: 'flex', alignItems: 'center', gap: 14,
                    cursor: 'pointer', transition: 'all 0.3s',
                    fontFamily: "'Inter', sans-serif", textAlign: 'left',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#334155';
                    e.currentTarget.style.background = '#0f1520';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#1e293b';
                    e.currentTarget.style.background = '#0a0e17';
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: isAlert ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.1)',
                    border: `1px solid ${isAlert ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700,
                    color: isAlert ? '#ef4444' : '#8b5cf6', flexShrink: 0,
                  }}>
                    {athlete.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 3 }}>
                      {athlete.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: isAlert ? '#ef4444' : recent7.length > 0 ? '#10b981' : '#475569',
                      }}>
                        {recent7.length > 0 ? `${deviation.toFixed(0)}% de desvio hoje` : 'Sem registros'}
                      </span>
                      {lastEntry && (
                        <span style={{ fontSize: 10, color: '#475569' }}>
                          · Último: {lastEntry.shift}
                        </span>
                      )}
                    </div>
                  </div>

                  {isAlert && (
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <AlertTriangle style={{ width: 14, height: 14, color: '#ef4444' }} />
                    </div>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('Tem certeza que deseja apagar este atleta?')) deleteAthlete(athlete.id); }}
                    style={{
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#ef4444', transition: 'all 0.2s', flexShrink: 0
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                    title="Apagar Atleta"
                  >
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>

                  <ChevronRight style={{ width: 18, height: 18, color: '#334155', flexShrink: 0 }} />
                </button>
              );
            })
          )}
        </div>
      )}

      {isRegistering && (
        <RegisterAthleteModal
          onClose={() => setIsRegistering(false)}
          onRegister={(name, pin) => {
            registerAthlete(name, pin);
            setIsRegistering(false);
          }}
        />
      )}
    </div>
  );
};

// ========== DAILY SUMMARY COMPONENT ==========
function DailySummary({ athletes, getTodayEntries, getEntries }: { athletes: User[], getTodayEntries: (id: string) => ShiftEntry[], getEntries: (id: string, days: number) => ShiftEntry[] }) {
  const { pendingCount, alertCount } = useMemo(() => {
    let pending = 0;
    let alerts = 0;

    athletes.forEach(athlete => {
      const today = getTodayEntries(athlete.id);
      if (today.length < 3) pending++;
      
      const recent7 = getEntries(athlete.id, 7);
      const recent30 = getEntries(athlete.id, 30);
      const curVol = recent7.length > 0 ? calculateVolatility(recent7) : 0;
      const baseVol = recent30.length > 0 ? calculateVolatility(recent30) : curVol;
      
      if (Math.abs(curVol - baseVol) > 20) {
        alerts++;
      }
    });

    return { pendingCount: pending, alertCount: alerts };
  }, [athletes, getTodayEntries, getEntries]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Quick Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.1), #0a0e17)', border: '1px solid rgba(239,68,68,0.2)',
          padding: 20, borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <AlertTriangle style={{ width: 24, height: 24, color: '#ef4444' }} />
          <div>
            <p style={{ fontSize: 24, fontWeight: 900, color: '#ef4444' }}>{alertCount}</p>
            <p style={{ fontSize: 11, color: '#fca5a5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Desvios Hoje</p>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(0,168,255,0.1), #0a0e17)', border: '1px solid rgba(0,168,255,0.2)',
          padding: 20, borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <Activity style={{ width: 24, height: 24, color: '#00a8ff' }} />
          <div>
            <p style={{ fontSize: 24, fontWeight: 900, color: '#00a8ff' }}>{pendingCount}</p>
            <p style={{ fontSize: 11, color: '#93c5fd', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Pendentes Hoje</p>
          </div>
        </div>
      </div>

      {/* Athletes requiring attention today */}
      <div style={{ background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 20, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>
          Turnos Preenchidos Hoje (Feedback Bruto)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {athletes.map(athlete => {
            const today = getTodayEntries(athlete.id);
            if (today.length === 0) return null;

            return (
              <div key={athlete.id} style={{
                background: '#0f1520', border: '1px solid #1e293b',
                padding: '12px 16px', borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{athlete.name}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {today.map(e => (
                    <span key={e.id} style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                      background: e.feedback === 'Bom' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', 
                      color: e.feedback === 'Bom' ? '#10b981' : '#ef4444'
                    }}>
                      {e.shift}: {e.intensity} ({e.feedback})
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {athletes.every(a => getTodayEntries(a.id).length === 0) && (
            <p style={{ color: '#64748b', fontSize: 12 }}>
              Nenhum turno registrado hoje.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RegisterAthleteModal({ onClose, onRegister }: { onClose: () => void, onRegister: (name: string, pin: string) => void }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    if (pin.length < 4) { setError('O PIN precisa ter pelo menos 4 dígitos'); return; }
    onRegister(name.trim(), pin);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 340, background: '#0a0e17', border: '1px solid #1e293b',
        borderRadius: 24, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
        >
          <X style={{ width: 20, height: 20 }} />
        </button>

        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>Cadastrar Atleta</h3>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 24 }}>Crie o acesso para o atleta e repasse a ele o Nome e PIN.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Nome do Atleta</label>
            <input
              type="text" placeholder="Ex: João Silva" value={name} onChange={e => setName(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 14, background: '#000', border: '1px solid #1e293b',
                color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Criar Senha</label>
            <input
              type="password" placeholder="Mínimo 4 dígitos" value={pin} onChange={e => setPin(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 14, background: '#000', border: '1px solid #1e293b',
                color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box', letterSpacing: 4,
              }}
            />
          </div>
          {error && <p style={{ fontSize: 12, color: '#ef4444' }}>{error}</p>}
          <button
            onClick={handleSubmit}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8, boxShadow: '0 0 20px rgba(139,92,246,0.2)', fontFamily: "'Inter', sans-serif",
            }}
          >
            Cadastrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== ATHLETE DETAIL COMPONENT ==========
const FILTERS = [
  { label: 'Tudo', days: 0 },
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1A', days: 365 },
];

function AthleteDetail({ athlete, allEntries, onBack, onGenerateMock, onClear }: {
  athlete: User;
  allEntries: ShiftEntry[];
  onBack: () => void;
  onGenerateMock: () => void;
  onClear: () => void;
}) {
  const [filterDays, setFilterDays] = useState<number>(0); // Default is 'Tudo'

  const { chartData } = useMemo(() => {
    if (allEntries.length === 0) return { chartData: [] };

    let daysToGenerate = filterDays;
    if (filterDays === 0) {
      const firstTime = Math.min(...allEntries.map(e => e.timestamp));
      const diff = new Date().getTime() - firstTime;
      daysToGenerate = Math.max(1, Math.ceil(diff / 86400000) + 1);
    }

    const daysList: string[] = [];
    const now = new Date();
    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      daysList.push(d.toISOString().split('T')[0]);
    }

    const chart = daysList.map(day => {
      // 7-day rolling window for current point
      const currentDayDate = new Date(day + 'T12:00:00');
      
      const sevenDaysAgo = new Date(currentDayDate);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cutoff7 = sevenDaysAgo.toISOString().split('T')[0];

      // 30-day rolling window for baseline point
      const thirtyDaysAgo = new Date(currentDayDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoff30 = thirtyDaysAgo.toISOString().split('T')[0];

      const rolling7 = allEntries.filter(e => e.date <= day && e.date > cutoff7);
      const rolling30 = allEntries.filter(e => e.date <= day && e.date > cutoff30);
      
      let formatOpts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric' };
      if (daysToGenerate > 90) formatOpts = { month: 'short', day: 'numeric' };
      if (daysToGenerate > 365) formatOpts = { month: 'short', year: '2-digit' };

      const v = rolling7.length > 0 ? Math.round(calculateVolatility(rolling7)) : 0;
      const b = rolling30.length > 0 ? Math.round(calculateVolatility(rolling30)) : v;

      return {
        name: currentDayDate.toLocaleDateString('pt-BR', formatOpts).replace('.', ''),
        vol: v,
        base: b,
      };
    });

    return { chartData: chart };
  }, [allEntries, filterDays]);

  // Overall current stats for the header based on the selected period!
  const { currentVolatility, baselineVolatility, deviation, isAlert, alertCount } = useMemo(() => {
    if (chartData.length === 0) return { currentVolatility: 0, baselineVolatility: 0, deviation: 0, isAlert: false, alertCount: 0 };
    
    let sumVol = 0;
    let sumBase = 0;
    let sumDev = 0;
    let alerts = 0;
    
    chartData.forEach(c => {
       sumVol += c.vol;
       sumBase += c.base;
       const dev = Math.abs(c.vol - c.base);
       sumDev += dev;
       if (dev > 20) alerts++;
    });

    const avgVol = sumVol / chartData.length;
    const avgBase = sumBase / chartData.length;
    const avgDev = sumDev / chartData.length;

    return {
      currentVolatility: avgVol,
      baselineVolatility: avgBase,
      deviation: avgDev,
      isAlert: avgDev > 20 || alerts > 0, // Mark alert if the average deviation is high OR if there are any critical breaks in the period
      alertCount: alerts
    };
  }, [chartData]);

  // Filter raw entries based on selected time range for the table
  const tableEntries = useMemo(() => {
    if (filterDays === 0) return allEntries;
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - ((filterDays - 1) * 86400000);
    return allEntries.filter(e => e.timestamp >= cutoff);
  }, [allEntries, filterDays]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Back + Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            color: '#64748b', fontSize: 13, fontFamily: "'Inter', sans-serif",
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Voltar
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onGenerateMock} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 10,
            background: 'rgba(0,168,255,0.08)', border: '1px solid rgba(0,168,255,0.15)', color: '#00a8ff', fontSize: 11, cursor: 'pointer',
          }}>
            <Database style={{ width: 11, height: 11 }} /> Gerar Ano
          </button>
          <button onClick={onClear} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 10,
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', color: '#ef4444', fontSize: 11, cursor: 'pointer',
          }}>
            <Trash2 style={{ width: 11, height: 11 }} /> Limpar
          </button>
        </div>
      </div>

      {/* Athlete Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#00a8ff',
        }}>
          {athlete.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{athlete.name}</p>
          <p style={{ fontSize: 12, color: '#64748b' }}>Análise de desvio de padrão</p>
        </div>
      </div>

      {/* Time Filters */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {FILTERS.map(f => (
          <button
            key={f.days}
            onClick={() => setFilterDays(f.days)}
            style={{
              padding: '8px 16px', borderRadius: 12, border: '1px solid',
              background: filterDays === f.days ? 'rgba(0,168,255,0.1)' : '#0a0e17',
              borderColor: filterDays === f.days ? '#00a8ff' : '#1e293b',
              color: filterDays === f.days ? '#00a8ff' : '#64748b',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", flexShrink: 0,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {tableEntries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 20 }}>
          <p style={{ color: '#64748b', fontSize: 14 }}>Nenhum dado neste período.</p>
        </div>
      ) : (
        <>
          {/* Volatility Overview */}
          <div style={{
            borderRadius: 20, padding: 20, overflow: 'hidden',
            background: isAlert ? 'linear-gradient(135deg, rgba(239,68,68,0.06), #000)' : 'linear-gradient(135deg, rgba(16,185,129,0.06), #000)',
            border: `1px solid ${isAlert ? 'rgba(239,68,68,0.18)' : 'rgba(16,185,129,0.18)'}`,
          }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
              Desvio de Padrão ({filterDays === 0 ? 'Total' : `${filterDays} Dias`})
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: isAlert ? '#ef4444' : '#10b981' }}>
                {deviation.toFixed(1)}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>% de desvio médio</span>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
              Padrão Atual Médio: {currentVolatility.toFixed(0)}% | Padrão Histórico Médio: {baselineVolatility.toFixed(0)}%
            </p>
            <div style={{ width: '100%', height: 5, borderRadius: 100, background: '#1e293b' }}>
              <div style={{
                height: '100%', borderRadius: 100, width: `${Math.min(deviation * 2, 100)}%`, // Visual amplification for the bar
                background: isAlert ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#10b981,#6ee7b7)',
              }} />
            </div>
            <p style={{ fontSize: 12, color: isAlert ? '#fca5a5' : '#86efac', marginTop: 10 }}>
              {isAlert ? `⚠️ Fugas expressivas de padrão detectadas no período (${alertCount} dias em alerta)` : '✓ Consistente com o padrão ao longo do período'}
            </p>
          </div>

          {/* Trend Chart */}
          <div style={{ background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 20, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp style={{ width: 12, height: 12, color: '#00a8ff' }} />
                <p style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 2 }}>
                  Meta-Volatilidade
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00a8ff' }} />
                  <span style={{ fontSize: 9, color: '#64748b' }}>Atual</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 2, background: '#475569' }} />
                  <span style={{ fontSize: 9, color: '#64748b' }}>Histórico (Base)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                  <span style={{ fontSize: 9, color: '#64748b' }}>Alerta (Quebra)</span>
                </div>
              </div>
            </div>
            <div style={{ height: 180, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#334155" fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} minTickGap={20} />
                  <YAxis stroke="#334155" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0a0e17', border: '1px solid #1e293b', borderRadius: 10, fontSize: 11 }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 4 }}
                    formatter={(v: any, name: any) => [`${v}%`, name === 'vol' ? 'Atual' : 'Base']}
                  />
                  
                  {/* Baseline (30-day average) */}
                  <Line type="monotone" dataKey="base" stroke="#475569" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} name="Padrão Base" />
                  
                  {/* Current (7-day average) */}
                  <Line type="monotone" dataKey="vol" stroke="#00a8ff" strokeWidth={chartData.length > 90 ? 1 : 2.5}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      const isBreak = Math.abs(payload.vol - payload.base) > 20;
                      if (isBreak) return <circle key={`dot-${payload.name}`} cx={cx} cy={cy} r={4} fill="#ef4444" stroke="#000" strokeWidth={1} />;
                      if (chartData.length <= 30) return <circle key={`dot-${payload.name}`} cx={cx} cy={cy} r={3} fill="#000" stroke="#00a8ff" strokeWidth={2} />;
                      return null;
                    }}
                    activeDot={{ r: 6, fill: '#00a8ff', stroke: '#000', strokeWidth: 2 }}
                    name="Atual"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Raw Entries Table */}
          <div style={{ background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 20, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Clock style={{ width: 12, height: 12, color: '#f59e0b' }} />
              <p style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 2 }}>
                Registros Brutos ({filterDays === 0 ? 'Total' : `${filterDays} dias`})
              </p>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 400 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: '#0a0e17', zIndex: 1 }}>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    {['Data', 'Turno', 'Avaliação', 'Intensidade'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 6px', color: '#475569', fontWeight: 600, fontSize: 10 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...tableEntries].reverse().map(entry => (
                    <tr key={entry.id} style={{ borderBottom: '1px solid rgba(30,41,59,0.5)' }}>
                      <td style={{ padding: '10px 6px', color: '#94a3b8' }}>{entry.date.substring(5).replace('-', '/')}</td>
                      <td style={{ padding: '10px 6px', color: '#f1f5f9', fontWeight: 500 }}>{entry.shift}</td>
                      <td style={{ padding: '10px 6px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                          background: entry.feedback === 'Bom' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: entry.feedback === 'Bom' ? '#10b981' : '#ef4444',
                        }}>{entry.feedback}</span>
                      </td>
                      <td style={{ padding: '10px 6px', color: '#00a8ff', fontWeight: 700 }}>{entry.intensity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
