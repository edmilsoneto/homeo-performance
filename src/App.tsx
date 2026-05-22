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
  } = useAppData();

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
      <div style={{ position: 'relative' }}>
        <RegistrationScreen
          userName={user.name}
          todayEntries={getTodayEntries(user.id)}
          onSave={(entry) => saveEntry(user.id, entry)}
        />
        {/* Simple logout button floating top right */}
        <button
          onClick={logout}
          style={{
            position: 'absolute', top: 24, right: 24, zIndex: 50,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12, padding: '8px 12px', color: '#fff', fontSize: 12,
            fontFamily: "'Inter', sans-serif", cursor: 'pointer',
          }}
        >
          Sair
        </button>
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
      />
    </Layout>
  );
}

export default App;
