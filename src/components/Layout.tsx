import type { ReactNode } from 'react';
import type { UserRole } from '../types';
import { Activity, BarChart3, LogOut, Users, Atom } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
  userName: string;
  userRole: UserRole;
}

export const Layout = ({ children, activeTab, onChangeTab, onLogout, userName, userRole }: LayoutProps) => {
  const isAdmin = userRole === 'admin';

  const tabs = isAdmin
    ? [{ id: 'athletes', icon: Users, label: 'Atletas' }]
    : [
        { id: 'registro', icon: Activity, label: 'Registro' },
        { id: 'dashboard', icon: BarChart3, label: 'Painel' },
      ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh', background: '#000',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1e293b',
        padding: '14px 20px',
      }}>
        <div style={{
          maxWidth: 480, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: isAdmin ? 'rgba(139,92,246,0.12)' : 'rgba(0,168,255,0.12)',
              border: `1px solid ${isAdmin ? 'rgba(139,92,246,0.25)' : 'rgba(0,168,255,0.25)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Atom style={{ width: 16, height: 16, color: isAdmin ? '#8b5cf6' : '#00a8ff' }} />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 900, color: '#f1f5f9', lineHeight: 1.2 }}>Homeo</p>
              <p style={{ fontSize: 10, color: '#475569', lineHeight: 1.2 }}>{userName}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              color: '#475569', fontSize: 11, fontFamily: "'Inter', sans-serif",
              padding: '6px 10px', borderRadius: 8,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = '#475569'}
          >
            <LogOut style={{ width: 14, height: 14 }} />
            Sair
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        flex: 1, padding: '20px 16px 100px',
        maxWidth: 480, margin: '0 auto', width: '100%',
      }}>
        {children}
      </main>

      {/* Bottom Nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid #1e293b',
      }}>
        <div style={{
          maxWidth: 480, margin: '0 auto', height: 72,
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          padding: '0 16px',
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 4,
                  width: 72, padding: '8px 0', borderRadius: 16,
                  background: active ? (isAdmin ? 'rgba(139,92,246,0.08)' : 'rgba(0,168,255,0.08)') : 'transparent',
                  border: 'none', cursor: 'pointer',
                  color: active ? (isAdmin ? '#8b5cf6' : '#00a8ff') : '#475569',
                  transition: 'all 0.3s',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <Icon style={{
                  width: 20, height: 20,
                  filter: active ? `drop-shadow(0 0 8px ${isAdmin ? 'rgba(139,92,246,0.5)' : 'rgba(0,168,255,0.5)'})` : 'none',
                }} />
                <span style={{ fontSize: 10, fontWeight: 600 }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
