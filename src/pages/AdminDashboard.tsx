import { useState, useMemo } from 'react';
import type { User, ShiftEntry } from '../types';
import { determineGroup, generateDailyEntropyPoints, calculateDeltaPercentage } from '../utils/entropy';
import { AthleteDashboard } from './AthleteDashboard';
import {
  Users, ChevronRight, AlertTriangle, ArrowLeft,
  Database, Trash2, Calendar, UserPlus, X, Activity
} from 'lucide-react';

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
        <DailySummary athletes={athletes} getTodayEntries={getTodayEntries} getAllEntries={getAllEntries} />
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
              const all = getAllEntries(athlete.id);
              const points = generateDailyEntropyPoints(all);
              const recent7 = getEntries(athlete.id, 7);

              let isAlert = false;
              let deltaStr = 'Sem dados';

              if (points.length >= 2) {
                const todayPt = points[points.length - 1];
                const yesterdayPt = points[points.length - 2];
                const delta = calculateDeltaPercentage(todayPt.generalEntropy, yesterdayPt.generalEntropy);
                isAlert = Math.abs(delta) > 15;
                deltaStr = `${delta > 0 ? '+' : ''}${delta.toFixed(1)}% variação`;
              } else if (points.length === 1) {
                deltaStr = 'Calibrado';
              } else {
                deltaStr = 'Fase de Calibração';
              }

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
                        color: isAlert ? '#ef4444' : points.length > 0 ? '#10b981' : '#475569',
                      }}>
                        {deltaStr}
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
function DailySummary({ athletes, getTodayEntries, getAllEntries }: { athletes: User[], getTodayEntries: (id: string) => ShiftEntry[], getAllEntries: (id: string) => ShiftEntry[] }) {
  const { pendingCount, alertCount } = useMemo(() => {
    let pending = 0;
    let alerts = 0;

    athletes.forEach(athlete => {
      const today = getTodayEntries(athlete.id);
      if (today.length < 3) pending++;
      
      const all = getAllEntries(athlete.id);
      const points = generateDailyEntropyPoints(all);
      if (points.length >= 2) {
        const todayPt = points[points.length - 1];
        const yesterdayPt = points[points.length - 2];
        const delta = calculateDeltaPercentage(todayPt.generalEntropy, yesterdayPt.generalEntropy);
        if (Math.abs(delta) > 15) {
          alerts++;
        }
      }
    });

    return { pendingCount: pending, alertCount: alerts };
  }, [athletes, getTodayEntries, getAllEntries]);

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
          Turnos Preenchidos Hoje (Feedback Categórico)
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
                  {today.map(e => {
                    const group = determineGroup(e);
                    const color = group === 'Grupo A' ? '#10b981' : group === 'Grupo B' ? '#3b82f6' : group === 'Grupo C' ? '#f59e0b' : '#ef4444';
                    const bg = group === 'Grupo A' ? 'rgba(16,185,129,0.15)' : group === 'Grupo B' ? 'rgba(59,130,246,0.15)' : group === 'Grupo C' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)';
                    return (
                      <span key={e.id} style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                        background: bg, color
                      }}>
                        {e.shift}: {group.replace('Grupo ', '')}
                      </span>
                    );
                  })}
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
function AthleteDetail({ athlete, allEntries, onBack, onGenerateMock, onClear }: {
  athlete: User;
  allEntries: ShiftEntry[];
  onBack: () => void;
  onGenerateMock: () => void;
  onClear: () => void;
}) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#8b5cf6',
        }}>
          {athlete.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{athlete.name}</p>
          <p style={{ fontSize: 12, color: '#64748b' }}>Análise detalhada do sismógrafo de entropia</p>
        </div>
      </div>

      {/* Reusable premium AthleteDashboard */}
      <AthleteDashboard entries={allEntries} />
    </div>
  );
}
