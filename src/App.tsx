import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginScreen } from './pages/LoginScreen';
import { RegistrationScreen } from './pages/RegistrationScreen';
import { AdminDashboard } from './pages/AdminDashboard';
import { useAuth, useAthletes, useMutateAthlete, useMutateEntries, usePushSubscription, useAthleteEntries } from './hooks/useWellbeingData';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './lib/api';

const AthleteView = () => {
  const { auth, logout } = useAuth();
  const userId = auth.currentUser?.id;
  const { data: entries = [], isLoading } = useAthleteEntries(userId as string);
  const { saveEntry } = useMutateEntries();
  const subscribe = usePushSubscription();

  useEffect(() => {
    if (userId) subscribe(userId as string);
  }, [userId, subscribe]);

  if (isLoading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: 50 }}>Carregando...</div>;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(e => e.date === todayStr);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
       <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 24px', background: '#0a0e17', borderBottom: '1px solid #1e293b',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
            Painel do Atleta
          </span>
          <button
            onClick={() => { logout(); window.location.href='/login'; }}
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
          userName={auth.currentUser?.name || ''}
          todayEntries={todayEntries}
          allEntries={entries}
          onSave={async (entry) => {
            await saveEntry({ userId, ...entry });
          }}
        />
      </div>
    </motion.div>
  );
};

const AdminView = () => {
  const { auth, logout } = useAuth();
  const { data: athletes = [] } = useAthletes();
  const { register, remove } = useMutateAthlete();
  const { clearEntries } = useMutateEntries();
  const queryClient = useQueryClient();
  const subscribe = usePushSubscription();

  useEffect(() => {
    if (auth.currentUser?.id) subscribe(auth.currentUser.id as string);
  }, [auth.currentUser?.id, subscribe]);

  // O Admin precisa buscar todas as entries
  const queries = useQueries({
    queries: athletes.map(athlete => ({
      queryKey: ['entries', athlete.id],
      queryFn: () => apiFetch(`/api/entries?userId=${athlete.id}`),
    }))
  });

  const getEntriesCache = (userId: string, days: number = 7) => {
    // Encontra o indice do atleta na lista
    const athleteIndex = athletes.findIndex(a => String(a.id) === String(userId));
    const q = athleteIndex >= 0 ? queries[athleteIndex] : null;
    
    // Pega os dados do query hook ou tenta forçar no cache do client
    let all = [];
    if (q && Array.isArray(q.data)) {
      all = q.data;
    } else {
      const cached = queryClient.getQueryData(['entries', userId]) as any;
      if (Array.isArray(cached)) all = cached;
    }

    if (!all || all.length === 0) return [];
    
    const mapped = all.map((e:any) => ({
      id: e.id, date: e.date, shift: e.shift, intensity: Number(e.intensity), feedback: e.feedback, timestamp: Number(e.timestamp)
    }));

    if (days === 0) return [...mapped].sort((a: any, b: any) => a.timestamp - b.timestamp);
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - ((days - 1) * 86400000);
    return mapped.filter((e: any) => e.timestamp >= cutoff).sort((a: any, b: any) => a.timestamp - b.timestamp);
  };

  const getAllEntriesCache = (userId: string) => getEntriesCache(userId, 0);
  
  const getTodayEntriesCache = (userId: string) => {
    const all = getAllEntriesCache(userId);
    const dateStr = new Date().toISOString().split('T')[0];
    return all.filter((e: any) => e.date === dateStr);
  };

  const loadAthleteEntriesFn = async (userId: string) => {
    await queryClient.prefetchQuery({ queryKey: ['entries', userId], queryFn: () => apiFetch(`/api/entries?userId=${userId}`) });
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <Layout
        activeTab="athletes"
        onChangeTab={() => {}}
        onLogout={() => { logout(); window.location.href='/login'; }}
        userName={auth.currentUser?.name || ''}
        userRole={auth.currentUser?.role || 'athlete'}
      >
        <AdminDashboard
          athletes={athletes}
          getEntries={getEntriesCache as any}
          getAllEntries={getAllEntriesCache as any}
          getTodayEntries={getTodayEntriesCache as any}
          registerAthlete={(name, pin, whatsapp) => register({ name, pin, whatsapp }) as any}
          deleteAthlete={remove as any}
          generateMockData={async () => { alert('Geração de mock desativada temporariamente na reestruturação.'); }}
          clearEntries={clearEntries as any}
          loadAthleteEntries={loadAthleteEntriesFn as any}
        />
      </Layout>
    </motion.div>
  );
};

const ProtectedRoute = ({ children, adminOnly = false }: any) => {
  const { auth } = useAuth();
  if (!auth.isLoggedIn) return <Navigate to="/login" />;
  if (adminOnly && auth.currentUser?.role !== 'admin') return <Navigate to="/atleta" />;
  return children;
};

export default function App() {
  const { auth, login } = useAuth();

  const handleLogin = async (name: string, pin: string) => {
    const success = await login(name, pin);
    if (success) {
      window.location.reload();
    }
    return success;
  };

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/login" element={
          auth.isLoggedIn ? <Navigate to={auth.currentUser?.role === 'admin' ? '/admin' : '/atleta'} /> : 
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginScreen onLogin={handleLogin} />
          </motion.div>
        } />
        
        <Route path="/admin/*" element={
          <ProtectedRoute adminOnly={true}>
            <AdminView />
          </ProtectedRoute>
        } />

        <Route path="/atleta/*" element={
          <ProtectedRoute>
            <AthleteView />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </AnimatePresence>
  );
}
