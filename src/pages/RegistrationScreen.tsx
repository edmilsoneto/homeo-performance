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
  const [selectedGroup, setSelectedGroup] = useState<GroupType | null>(null);
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
    setSelectedGroup(null);
  }, [nextShift]);

  const handleSave = () => {
    if (!selectedGroup || !nextShift) return;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    onSave({
      id: `${dateStr}-${nextShift}`,
      date: dateStr,
      shift: nextShift,
      feedback: selectedGroup,
      intensity: 0, // intensity is set to 0 for categorial direct groups
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
                    <span style={{ fontSize: 11, fontWeight: 700, color: GROUP_LABELS[group].color }}>
                      {GROUP_LABELS[group].title}
                    </span>
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
            Selecione a categoria da <span style={{ color: nextShiftColor }}>{nextShift}</span>:
          </h2>
        </div>

        {/* 4 Groups Grid Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(Object.keys(GROUP_LABELS) as GroupType[]).map(group => {
            const isSelected = selectedGroup === group;
            const meta = GROUP_LABELS[group];

            return (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 18,
                  background: isSelected ? meta.bg : '#000',
                  border: `2px solid ${isSelected ? meta.color : '#1e293b'}`,
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', transition: 'all 0.25s', textAlign: 'left',
                  boxShadow: isSelected ? `0 0 20px ${meta.border}` : 'none'
                }}
              >
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: isSelected ? meta.color : '#e2e8f0', margin: '0 0 2px 0' }}>
                    {meta.title}
                  </p>
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                    {meta.desc}
                  </p>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${isSelected ? meta.color : '#334155'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSelected ? meta.color : 'transparent', flexShrink: 0
                }}>
                  {isSelected && <Check style={{ width: 12, height: 12, color: '#000', strokeWidth: 3 }} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!selectedGroup}
          style={{
            width: '100%', padding: '16px', borderRadius: 18, border: 'none',
            background: selectedGroup ? 'linear-gradient(135deg, #0077cc, #00a8ff)' : '#1e293b',
            color: selectedGroup ? '#fff' : '#475569',
            fontSize: 16, fontWeight: 700, cursor: selectedGroup ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: selectedGroup ? '0 0 25px rgba(0,168,255,0.3)' : 'none',
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
                  {e.shift}: {GROUP_LABELS[group].title}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
