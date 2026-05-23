import { useState, useMemo, useEffect } from 'react';
import type { ShiftType, GroupType, ShiftEntry } from '../types';
import { determineGroup } from '../utils/entropy';
import { Check, Save, Sun, Sunset, Moon, Calendar, Info } from 'lucide-react';

interface Props {
  userName: string;
  todayEntries: ShiftEntry[];
  allEntries: ShiftEntry[];
  onSave: (entry: ShiftEntry) => void;
}

const SHIFT_ICON: Record<ShiftType, typeof Sun> = {
  'Manhã': Sun,
  'Tarde': Sunset,
  'Noite': Moon
};

const SHIFT_COLOR: Record<ShiftType, string> = {
  'Manhã': '#f59e0b', // warm amber
  'Tarde': '#f97316', // sunset orange
  'Noite': '#6366f1'  // neon indigo
};

const GROUP_LABELS: Record<GroupType, { title: string; desc: string; color: string; bg: string; border: string }> = {
  'Grupo A': { title: 'Grupo A', desc: 'Alto Rendimento / Estável', color: '#10b981', bg: 'rgba(16, 185, 129, 0.05)', border: 'rgba(16, 185, 129, 0.2)' },
  'Grupo B': { title: 'Grupo B', desc: 'Funcional / Leve Oscilação', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.05)', border: 'rgba(59, 130, 246, 0.2)' },
  'Grupo C': { title: 'Grupo C', desc: 'Fadiga Moderada / Alerta', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)', border: 'rgba(245, 158, 11, 0.2)' },
  'Grupo D': { title: 'Grupo D', desc: 'Fadiga Elevada / Desvio', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.05)', border: 'rgba(239, 68, 68, 0.2)' },
};

export const RegistrationScreen = ({ userName, todayEntries, allEntries, onSave }: Props) => {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  // Determine next shift
  const nextShift = useMemo<ShiftType | null>(() => {
    const hasManha = todayEntries.some(e => e.shift === 'Manhã');
    const hasTarde = todayEntries.some(e => e.shift === 'Tarde');
    const hasNoite = todayEntries.some(e => e.shift === 'Noite');
    if (!hasManha) return 'Manhã';
    if (!hasTarde) return 'Tarde';
    if (!hasNoite) return 'Noite';
    return null;
  }, [todayEntries]);

  // Reset selection when nextShift changes
  useEffect(() => {
    setSelectedScore(null);
  }, [nextShift]);

  const handleSave = () => {
    if (selectedScore === null || !nextShift) return;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Map score to Group A, B, C, D
    let group: GroupType = 'Grupo D';
    if (selectedScore >= 9) group = 'Grupo A';
    else if (selectedScore >= 7) group = 'Grupo B';
    else if (selectedScore >= 5) group = 'Grupo C';

    onSave({
      id: `${dateStr}-${nextShift}`,
      date: dateStr,
      shift: nextShift,
      feedback: group,
      intensity: selectedScore,
      timestamp: now.getTime(),
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 1400);
  };

  const todayStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const totalEntriesCount = allEntries.length;
  const isCalibrating = totalEntriesCount < 21;
  const progressPercent = Math.min((totalEntriesCount / 21) * 100, 100);

  // ========== SUCCESS SCREEN ==========
  if (saved) {
    return (
      <div style={{
        minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          boxShadow: '0 0 40px rgba(16, 185, 129, 0.2)',
        }}>
          <Check style={{ width: 40, height: 40, color: '#10b981' }} />
        </div>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>Salvo!</p>
        <p style={{ fontSize: 13, color: '#64748b' }}>Registro da {nextShift} salvo com sucesso</p>
      </div>
    );
  }

  // ========== ALL SHIFTS COMPLETED FOR TODAY ==========
  if (!nextShift) {
    return (
      <div style={{
        minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(0, 168, 255, 0.1)', border: '1px solid rgba(0, 168, 255, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          boxShadow: '0 0 40px rgba(0, 168, 255, 0.2)',
        }}>
          <Check style={{ width: 40, height: 40, color: '#00a8ff' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#f1f5f9', textAlign: 'center', marginBottom: 8 }}>
          Tudo certo por hoje!
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 32 }}>
          Você já registrou todos os seus turnos de hoje. Bom descanso!
        </p>

        {/* Display completed shifts of today */}
        <div style={{ width: '100%', maxWidth: 360, background: '#0a0e17', border: '1px solid #1e293b', borderRadius: 20, padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            Seus Registros de Hoje
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(['Manhã', 'Tarde', 'Noite'] as ShiftType[]).map(shift => {
              const entry = todayEntries.find(e => e.shift === shift);
              const Icon = SHIFT_ICON[shift];
              const color = SHIFT_COLOR[shift];
              const group = entry ? determineGroup(entry) : null;
              
              return (
                <div key={shift} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#000', borderRadius: 12, border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon style={{ width: 16, height: 16, color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{shift}</span>
                  </div>
                  {group ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#f1f5f9' }}>
                        {entry && entry.intensity > 0 ? `${entry.intensity}/10` : ''}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: GROUP_LABELS[group].color }}>
                        ({GROUP_LABELS[group].title})
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: '#475569' }}>Não registrado</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const NextShiftIcon = SHIFT_ICON[nextShift];
  const nextShiftColor = SHIFT_COLOR[nextShift];

  // Dynamic status text based on selected score
  let scoreFeedback = '';
  let feedbackColor = '#64748b';
  if (selectedScore !== null) {
    if (selectedScore >= 9) {
      scoreFeedback = `Excelente (${selectedScore}/10) · Grupo A`;
      feedbackColor = '#10b981';
    } else if (selectedScore >= 7) {
      scoreFeedback = `Bom (${selectedScore}/10) · Grupo B`;
      feedbackColor = '#3b82f6';
    } else if (selectedScore >= 5) {
      scoreFeedback = `Regular (${selectedScore}/10) · Grupo C`;
      feedbackColor = '#f59e0b';
    } else {
      scoreFeedback = `Crítico (${selectedScore}/10) · Grupo D`;
      feedbackColor = '#ef4444';
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: "'Inter', sans-serif",
    }}>
      {/* Top Welcome Panel */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
          Olá, atleta <span style={{ color: '#00a8ff', fontWeight: 600 }}>{userName}</span>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#475569', fontSize: 12, textTransform: 'capitalize' }}>
          <Calendar style={{ width: 12, height: 12 }} />
          <span>{todayStr}</span>
        </div>
      </div>

      {/* Main Glassmorphic Panel */}
      <div style={{
        width: '100%', maxWidth: 380, background: '#0a0e17', border: '1px solid #1e293b',
        borderRadius: 28, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        {/* Next Shift Prompt */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: `rgba(${nextShift === 'Manhã' ? '245,158,11' : nextShift === 'Tarde' ? '249,115,22' : '99,102,241'}, 0.1)`,
            border: `1px solid rgba(${nextShift === 'Manhã' ? '245,158,11' : nextShift === 'Tarde' ? '249,115,22' : '99,102,241'}, 0.2)`,
            display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center'
          }}>
            <NextShiftIcon style={{ width: 22, height: 22, color: nextShiftColor }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
            Como foi sua <span style={{ color: nextShiftColor }}>{nextShift.toLowerCase()}</span>?
          </h2>
        </div>

        {/* 0-10 Score Selector Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginBottom: 4 }}>
            Escolha uma nota de 0 a 10:
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 8,
          }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => {
              const isSelected = selectedScore === score;
              
              let scoreColor = '#ef4444'; // Red
              if (score >= 9) scoreColor = '#10b981'; // Green
              else if (score >= 7) scoreColor = '#3b82f6'; // Blue
              else if (score >= 5) scoreColor = '#f59e0b'; // Amber
              
              return (
                <button
                  key={score}
                  onClick={() => setSelectedScore(score)}
                  style={{
                    gridColumn: score === 10 ? 'span 2' : 'span 1',
                    height: 44,
                    borderRadius: 14,
                    background: isSelected ? scoreColor : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${isSelected ? scoreColor : '#1e293b'}`,
                    color: isSelected ? '#000' : '#f1f5f9',
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? `0 0 15px ${scoreColor}55` : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = scoreColor;
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#1e293b';
                      e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
                    }
                  }}
                >
                  {score}
                </button>
              );
            })}
          </div>

          {selectedScore !== null && (
            <div style={{
              marginTop: 10,
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid #1e293b',
              textAlign: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: feedbackColor,
              transition: 'all 0.2s'
            }}>
              {scoreFeedback}
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={selectedScore === null}
          style={{
            width: '100%', padding: '16px', borderRadius: 18, border: 'none',
            background: selectedScore !== null ? 'linear-gradient(135deg, #0077cc, #00a8ff)' : '#1e293b',
            color: selectedScore !== null ? '#fff' : '#475569',
            fontSize: 16, fontWeight: 700, cursor: selectedScore !== null ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: selectedScore !== null ? '0 0 25px rgba(0,168,255,0.3)' : 'none',
            transition: 'all 0.3s'
          }}
        >
          <Save style={{ width: 18, height: 18 }} />
          Salvar Registro
        </button>

        {/* Calibration Progress Bar */}
        {isCalibrating ? (
          <div style={{
            background: 'rgba(0,168,255,0.03)', border: '1px solid rgba(0,168,255,0.1)',
            borderRadius: 16, padding: '14px', display: 'flex', flexDirection: 'column', gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info style={{ width: 14, height: 14, color: '#00a8ff' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#00a8ff', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Calibrando Baseline
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
              <span>Coleta de turnos</span>
              <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{totalEntriesCount} / 21</span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#000', borderRadius: 10, border: '1px solid #1e293b', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #0077cc, #00a8ff)',
                boxShadow: '0 0 10px rgba(0,168,255,0.5)', transition: 'width 0.5s'
              }} />
            </div>
            <p style={{ fontSize: 10, color: '#64748b', margin: '4px 0 0 0', lineHeight: 1.4 }}>
              Precisamos de 21 turnos (1 semana completa) para mapear seu padrão inicial de oscilação rotineira.
            </p>
          </div>
        ) : (
          <div style={{
            background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.1)',
            borderRadius: 16, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8
          }}>
            <Check style={{ width: 14, height: 14, color: '#10b981' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981' }}>
              Baseline Calibrada com Sucesso!
            </span>
          </div>
        )}
      </div>

      {/* Footer Details showing logged shifts of today */}
      {todayEntries.length > 0 && (
        <div style={{ width: '100%', maxWidth: 380, marginTop: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#475569', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Registrados hoje
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {todayEntries.map(e => {
              const group = determineGroup(e);
              return (
                <span key={e.id} style={{
                  fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 8,
                  background: '#0a0e17', border: '1px solid #1e293b', color: GROUP_LABELS[group].color
                }}>
                  {e.shift}: {e.intensity > 0 ? `${e.intensity}/10` : GROUP_LABELS[group].title}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
