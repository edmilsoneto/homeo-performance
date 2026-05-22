import { useState, useMemo, useEffect } from 'react';
import type { ShiftType, FeedbackType, ShiftEntry } from '../types';
import { ChevronLeft, ThumbsUp, ThumbsDown, Check, Save } from 'lucide-react';

interface Props {
  userName: string;
  todayEntries: ShiftEntry[];
  onSave: (entry: ShiftEntry) => void;
}

export const RegistrationScreen = ({ userName, todayEntries, onSave }: Props) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [intensity, setIntensity] = useState(5);
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

  // Reset step when nextShift changes
  useEffect(() => {
    setStep(1);
    setFeedback(null);
    setIntensity(5);
  }, [nextShift]);

  const handleFeedback = (fb: FeedbackType) => { setFeedback(fb); setStep(2); };

  const handleSave = () => {
    if (!feedback || !nextShift) return;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    onSave({
      id: `${dateStr}-${nextShift}`,
      date: dateStr,
      shift: nextShift,
      feedback,
      intensity,
      timestamp: now.getTime(),
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 1400);
  };

  const todayStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  // ========== ALL DONE SCREEN ==========
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
        <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>
          Você já registrou todos os seus turnos de hoje. Bom descanso!
        </p>
      </div>
    );
  }

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

  // ========== STEP 1: BOM / RUIM ==========
  if (step === 1) {
    return (
      <div style={{
        minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter', sans-serif",
      }}>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4, textAlign: 'center' }}>
          Olá, <span style={{ color: '#00a8ff', fontWeight: 600 }}>{userName}</span>
        </p>
        <p style={{ fontSize: 12, color: '#475569', marginBottom: 40, textAlign: 'center', textTransform: 'capitalize' }}>
          {todayStr}
        </p>

        <h2 style={{
          fontSize: 26, fontWeight: 800, color: '#f1f5f9',
          textAlign: 'center', marginBottom: 40, lineHeight: 1.3,
        }}>
          Como foi o seu turno da <span style={{ color: '#00a8ff', textShadow: '0 0 20px rgba(0,168,255,0.4)' }}>{nextShift}</span>?
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 320 }}>
          {/* BOM Button */}
          <button
            onClick={() => handleFeedback('Bom')}
            style={{
              width: '100%', padding: '28px 24px', borderRadius: 24,
              background: '#0a0e17', border: '1px solid rgba(16, 185, 129, 0.2)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 12, transition: 'all 0.3s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.15)';
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = '#0a0e17';
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ThumbsUp style={{ width: 28, height: 28, color: '#10b981' }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>Bom</span>
          </button>

          {/* RUIM Button */}
          <button
            onClick={() => handleFeedback('Ruim')}
            style={{
              width: '100%', padding: '28px 24px', borderRadius: 24,
              background: '#0a0e17', border: '1px solid rgba(239, 68, 68, 0.2)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 12, transition: 'all 0.3s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = '#0a0e17';
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ThumbsDown style={{ width: 28, height: 28, color: '#ef4444' }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>Ruim</span>
          </button>
        </div>
      </div>
    );
  }

  // ========== STEP 2: INTENSITY (0 to 10) ==========
  return (
    <div style={{
      minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter', sans-serif",
      position: 'relative'
    }}>
      <button
        onClick={() => { setStep(1); setFeedback(null); }}
        style={{
          position: 'absolute', top: 20, left: 20,
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          color: '#64748b', fontSize: 13,
        }}
      >
        <ChevronLeft style={{ width: 18, height: 18 }} /> Voltar
      </button>

      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8, textAlign: 'center' }}>
        Você respondeu que a {nextShift} foi: <span style={{
          fontWeight: 700,
          color: feedback === 'Bom' ? '#10b981' : '#ef4444',
        }}>{feedback}</span>
      </p>
      
      <h2 style={{
        fontSize: 26, fontWeight: 800, color: '#f1f5f9',
        textAlign: 'center', marginBottom: 48,
      }}>
        Qual a <span style={{ color: '#00a8ff', textShadow: '0 0 20px rgba(0,168,255,0.4)' }}>intensidade</span>?
      </h2>

      {/* Big Number Display */}
      <div style={{
        width: 140, height: 140, borderRadius: '50%',
        background: `radial-gradient(circle, ${feedback === 'Bom' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}, transparent)`,
        border: `2px solid ${feedback === 'Bom' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 48,
        boxShadow: `0 0 50px ${feedback === 'Bom' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
      }}>
        <span style={{
          fontSize: 64, fontWeight: 900,
          color: feedback === 'Bom' ? '#10b981' : '#ef4444',
          textShadow: `0 0 20px ${feedback === 'Bom' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`
        }}>{intensity}</span>
      </div>

      {/* Horizontal Neon Slider (0 to 10) */}
      <div style={{ width: '100%', maxWidth: 340, marginBottom: 48, position: 'relative' }}>
        <input
          type="range" min="0" max="10" value={intensity}
          onChange={e => setIntensity(parseInt(e.target.value))}
          style={{ 
            width: '100%', accentColor: feedback === 'Bom' ? '#10b981' : '#ef4444',
            cursor: 'pointer', height: 8, borderRadius: 4, background: '#1e293b', outline: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          {Array.from({ length: 11 }, (_, i) => i).map(i => (
            <span key={i} style={{
              width: 20, textAlign: 'center', fontSize: 12,
              color: i === intensity ? (feedback === 'Bom' ? '#10b981' : '#ef4444') : '#475569',
              fontWeight: i === intensity ? 800 : 500,
              textShadow: i === intensity ? `0 0 10px ${feedback === 'Bom' ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}` : 'none'
            }}>{i}</span>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        style={{
          width: '100%', maxWidth: 340, padding: '18px', borderRadius: 18, border: 'none',
          background: 'linear-gradient(135deg, #0077cc, #00a8ff)',
          color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 0 30px rgba(0,168,255,0.3)',
        }}
      >
        <Save style={{ width: 20, height: 20 }} />
        Salvar Registro
      </button>
    </div>
  );
};
