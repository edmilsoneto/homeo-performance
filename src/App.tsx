import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { LoginScreen } from './pages/LoginScreen';
import { RegistrationScreen } from './pages/RegistrationScreen';
import { AdminDashboard } from './pages/AdminDashboard';
import { useAppData } from './hooks/useWellbeingData';

function App() {
  const {
    loading, auth, login, logout, registerAthlete,
    getAthletes, saveEntry, getEntries, getAllEntries,
    generateMockData, clearEntries, getTodayEntries, deleteAthlete,
    loadAthleteEntries,
    subscribeToPushNotifications,
  } = useAppData();

  // Automatic push notification subscription on login
  useEffect(() => {
    if (auth.isLoggedIn && auth.currentUser) {
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          const timer = setTimeout(() => {
            subscribeToPushNotifications(auth.currentUser!.id);
          }, 1500);
          return () => clearTimeout(timer);
        } else if (Notification.permission === 'granted') {
          subscribeToPushNotifications(auth.currentUser.id);
        }
      }
    }
  }, [auth.isLoggedIn, auth.currentUser, subscribeToPushNotifications]);

  // Auto-refresh admin entries every 30 seconds
  useEffect(() => {
    if (!auth.isLoggedIn || !auth.currentUser || auth.currentUser.role !== 'admin') return;
    const refreshAll = async () => {
      const athletes = getAthletes();
      for (const a of athletes) {
        await loadAthleteEntries(a.id);
      }
    };
    const interval = setInterval(refreshAll, 30000);
    return () => clearInterval(interval);
  }, [auth.isLoggedIn, auth.currentUser, getAthletes, loadAthleteEntries]);

  const handleLogin = async (name: string, pin: string): Promise<boolean> => {
    return await login(name, pin);
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000', color: '#00a8ff', fontFamily: "'Inter', sans-serif" }}>
        Carregando sistema...
      </div>
    );
  }

  // ===== NOT LOGGED IN =====
  if (!auth.isLoggedIn || !auth.currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const user = auth.currentUser;
  const isAdmin = user.role === 'admin';

  // ===== ATHLETE =====
  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: "'Inter', sans-serif", paddingBottom: 60 }}>
        {/* Sleek Top Navigation Bar for Athlete */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 24px', background: '#0a0e17', borderBottom: '1px solid #1e293b',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
            Painel do Atleta
          </span>
          
          <button
            onClick={logout}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10, padding: '6px 12px', color: '#fff', fontSize: 12,
              cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s'
            }}
          >
            Sair
          </button>
        </div>

        <div style={{ padding: '0 16px', maxWidth: 480, margin: '0 auto' }}>
          <RegistrationScreen
            userName={user.name}
            todayEntries={getTodayEntries(user.id)}
            allEntries={getAllEntries(user.id)}
            onSave={(entry) => saveEntry(user.id, entry)}
          />
        </div>
      </div>
    );
  }

  // ===== ADMIN =====
  return (
    <Layout
      activeTab="athletes"
      onChangeTab={() => {}}
      onLogout={logout}
      userName={user.name}
      userRole={user.role}
    >
      <AdminDashboard
        athletes={getAthletes()}
        getEntries={getEntries}
        getAllEntries={getAllEntries}
        getTodayEntries={getTodayEntries}
        registerAthlete={registerAthlete}
        deleteAthlete={deleteAthlete}
        generateMockData={generateMockData}
        clearEntries={clearEntries}
        loadAthleteEntries={loadAthleteEntries}
      />
    </Layout>
  );
}

export default App;
