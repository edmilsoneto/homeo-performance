import { useState } from 'react';
import { Atom, UserCircle, ArrowRight, KeyRound, ChevronLeft } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (name: string, pin: string) => Promise<boolean>;
}

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [mode, setMode] = useState<'select' | 'athlete-login' | 'admin'>('select');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!name.trim() || !pin.trim()) { setError('Preencha todos os campos'); return; }
    if (!(await onLogin(name, pin))) setError('Nome ou PIN incorretos');
  };

  const handleAdminLogin = async () => {
    setError('');
    if (!pin.trim()) { setError('Digite a senha do admin'); return; }
    if (!(await onLogin('MatheusCordeiro', pin))) setError('Senha incorreta');
  };

  const resetForm = () => { setName(''); setPin(''); setError(''); setMode('select'); };

  // ========== ROLE SELECTION ==========
  if (mode === 'select') {
    return (
      <div style={{
        minHeight: '100vh', background: '#000',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: "'Inter', sans-serif",
      }}>
        {/* Logo */}
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'rgba(0, 168, 255, 0.1)',
          border: '1px solid rgba(0, 168, 255, 0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16, boxShadow: '0 0 40px rgba(0, 168, 255, 0.2)',
        }}>
          <Atom style={{ width: 36, height: 36, color: '#00a8ff' }} strokeWidth={1.5} />
        </div>

        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#f1f5f9', marginBottom: 4 }}>Homeo</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 48 }}>Monitoramento de Bem-Estar</p>

        {/* Role Buttons */}
        <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button
            onClick={() => setMode('athlete-login')}
            style={{
              width: '100%', padding: '20px 24px', borderRadius: 20,
              background: '#0a0e17', border: '1px solid #1e293b',
              display: 'flex', alignItems: 'center', gap: 16,
              cursor: 'pointer', transition: 'all 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0, 168, 255, 0.4)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 168, 255, 0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(0, 168, 255, 0.1)', border: '1px solid rgba(0, 168, 255, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <UserCircle style={{ width: 24, height: 24, color: '#00a8ff' }} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>Sou Atleta</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Registre seu bem-estar diário</div>
            </div>
            <ArrowRight style={{ width: 20, height: 20, color: '#334155' }} />
          </button>

          <button
            onClick={() => setMode('admin')}
            style={{
              width: '100%', padding: '20px 24px', borderRadius: 20,
              background: '#0a0e17', border: '1px solid #1e293b',
              display: 'flex', alignItems: 'center', gap: 16,
              cursor: 'pointer', transition: 'all 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(139, 92, 246, 0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Atom style={{ width: 24, height: 24, color: '#8b5cf6' }} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>Sou Admin</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Painel completo de todos os atletas</div>
            </div>
            <ArrowRight style={{ width: 20, height: 20, color: '#334155' }} />
          </button>
        </div>
      </div>
    );
  }

  // ========== FORM SCREENS ==========
  const isAdmin = mode === 'admin';

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Inter', sans-serif", position: 'relative',
    }}>
      <button
        onClick={resetForm}
        style={{
          position: 'absolute', top: 20, left: 20,
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          color: '#64748b', fontSize: 14,
        }}
      >
        <ChevronLeft style={{ width: 18, height: 18 }} /> Voltar
      </button>

      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: isAdmin ? 'rgba(139, 92, 246, 0.1)' : 'rgba(0, 168, 255, 0.1)',
            border: `1px solid ${isAdmin ? 'rgba(139, 92, 246, 0.25)' : 'rgba(0, 168, 255, 0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isAdmin ? <Atom style={{ width: 28, height: 28, color: '#8b5cf6' }} /> : <UserCircle style={{ width: 28, height: 28, color: '#00a8ff' }} />}
          </div>
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', textAlign: 'center', marginBottom: 6 }}>
          {isAdmin ? 'Acesso Admin' : 'Entrar'}
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 32 }}>
          {isAdmin ? 'Digite a senha do administrador' : 'Entre com o nome e PIN fornecido pelo seu instrutor'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!isAdmin && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Nome</label>
              <input
                type="text" placeholder="Seu nome" value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 14,
                  background: '#0a0e17', border: '1px solid #1e293b',
                  color: '#f1f5f9', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#00a8ff'}
                onBlur={e => e.currentTarget.style.borderColor = '#1e293b'}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <KeyRound style={{ width: 12, height: 12 }} /> {isAdmin ? 'Senha' : 'PIN'}
            </label>
            <input
              type="password"
              placeholder={isAdmin ? 'Senha do admin' : 'PIN numérico'}
              value={pin}
              onChange={e => setPin(e.target.value)}
              inputMode="numeric"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 14,
                background: '#0a0e17', border: '1px solid #1e293b',
                color: '#f1f5f9', fontSize: 15, outline: 'none',
                letterSpacing: 8, textAlign: 'center', boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = isAdmin ? '#8b5cf6' : '#00a8ff'}
              onBlur={e => e.currentTarget.style.borderColor = '#1e293b'}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: '#ef4444', textAlign: 'center', marginTop: 4 }}>{error}</p>}

          <button
            onClick={isAdmin ? handleAdminLogin : handleLogin}
            style={{
              width: '100%', padding: '16px', borderRadius: 16, border: 'none',
              background: isAdmin ? 'linear-gradient(135deg, #6d28d9, #8b5cf6)' : 'linear-gradient(135deg, #0077cc, #00a8ff)',
              color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: isAdmin ? '0 0 30px rgba(139, 92, 246, 0.3)' : '0 0 30px rgba(0, 168, 255, 0.3)', marginTop: 8,
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
};
