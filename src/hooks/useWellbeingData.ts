import { useState, useEffect, useCallback } from 'react';
import type { User, AppData, ShiftEntry, AuthState } from '../types';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useAppData() {
  const [data, setData] = useState<AppData>({ users: [], entries: {} });
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('homeo_auth');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return { isLoggedIn: false, currentUser: null };
  });
  const [loading, setLoading] = useState(true);

  // Load all users on mount
  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch('/api/athletes');
        if (res.ok) {
          const athletes = await res.json();
          // We also need the admin user, but admin logs in directly via /api/auth
          // For the team list, we just need the athletes.
          // Let's store athletes in users. The admin user isn't strictly needed in the list.
          setData(prev => ({ ...prev, users: athletes }));
        }
      } catch (err) {
        console.error('Failed to load athletes', err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  // Load entries when logged in or when auth changes
  useEffect(() => {
    if (!auth.isLoggedIn || !auth.currentUser) return;
    
    async function loadEntries() {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const entriesRes = await fetch(user.role === 'admin' ? '/api/entries' : `/api/entries?userId=${user.id}`);
        if (entriesRes.ok) {
          const rawEntries = await entriesRes.json();
          // Group by user_id
          const entriesMap: Record<string, ShiftEntry[]> = {};
          rawEntries.forEach((e: any) => {
            if (!entriesMap[e.user_id]) entriesMap[e.user_id] = [];
            entriesMap[e.user_id].push({
              id: e.id,
              date: e.date,
              shift: e.shift,
              intensity: e.intensity,
              feedback: e.feedback,
              timestamp: Number(e.timestamp)
            });
          });
          setData(prev => ({ ...prev, entries: entriesMap }));
        }
      } catch (err) {
        console.error('Failed to load entries', err);
      }
    }
    loadEntries();
  }, [auth.isLoggedIn, auth.currentUser]);

  const login = useCallback(async (userOrName: any, pin?: string) => {
    // If it's a direct user object (legacy fallback)
    if (userOrName.id && !pin) {
      const newAuth = { isLoggedIn: true, currentUser: userOrName };
      setAuth(newAuth);
      localStorage.setItem('homeo_auth', JSON.stringify(newAuth));
      return true;
    }
    
    // API login
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userOrName, pin })
      });
      if (res.ok) {
        const user = await res.json();
        const newAuth = { isLoggedIn: true, currentUser: user };
        setAuth(newAuth);
        localStorage.setItem('homeo_auth', JSON.stringify(newAuth));
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setAuth({ isLoggedIn: false, currentUser: null });
    localStorage.removeItem('homeo_auth');
    setData({ users: [], entries: {} }); // clear data on logout for security
    // Reload users just in case
    fetch('/api/athletes').then(r => r.json()).then(athletes => {
      setData(prev => ({ ...prev, users: athletes }));
    });
  }, []);

  const registerAthlete = useCallback(async (name: string, pin: string, whatsapp?: string) => {
    try {
      const res = await fetch('/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin, whatsapp })
      });
      if (res.ok) {
        const user = await res.json();
        setData(prev => ({ ...prev, users: [...prev.users, user] }));
        return user;
      }
    } catch (err) {
      console.error('Failed to register', err);
    }
    return null;
  }, []);

  const getAthletes = useCallback((): User[] => {
    return data.users.filter(u => u.role === 'athlete');
  }, [data.users]);

  const saveEntry = useCallback(async (userId: string, entry: ShiftEntry) => {
    // Optimistic UI update
    setData(prev => {
      const userEntries = prev.entries[userId] || [];
      return { ...prev, entries: { ...prev.entries, [userId]: [...userEntries, entry] } };
    });

    try {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          date: entry.date,
          shift: entry.shift,
          intensity: entry.intensity,
          feedback: entry.feedback,
          timestamp: entry.timestamp
        })
      });
    } catch (err) {
      console.error('Failed to save entry', err);
    }
  }, []);

  const getEntries = useCallback((userId: string, days: number = 7): ShiftEntry[] => {
    const all = data.entries[userId] || [];
    if (days === 0) return [...all].sort((a, b) => a.timestamp - b.timestamp);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const cutoff = startOfToday - ((days - 1) * 86400000);
    return all.filter(e => e.timestamp >= cutoff).sort((a, b) => a.timestamp - b.timestamp);
  }, [data.entries]);

  const getTodayEntries = useCallback((userId: string): ShiftEntry[] => {
    const all = data.entries[userId] || [];
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    return all.filter(e => e.date === dateStr);
  }, [data.entries]);

  const getAllEntries = useCallback((userId: string): ShiftEntry[] => {
    return [...(data.entries[userId] || [])].sort((a, b) => a.timestamp - b.timestamp);
  }, [data.entries]);

  const deleteAthlete = useCallback(async (userId: string) => {
    setData(prev => {
      const newUsers = prev.users.filter(u => u.id !== userId);
      const newEntries = { ...prev.entries };
      delete newEntries[userId];
      return { ...prev, users: newUsers, entries: newEntries };
    });
    
    try {
      await fetch(`/api/athletes?id=${userId}`, { method: 'DELETE' });
      await fetch(`/api/entries?userId=${userId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete', err);
    }
  }, []);

  const generateMockData = useCallback(async (userId: string) => {
    const mockEntries: any[] = [];
    const now = new Date();
    const shifts = ['Manhã', 'Tarde', 'Noite'];
    
    for (let i = 364; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayIndex = 364 - i;
      
      let pList: string[] = [];
      if ((dayIndex % 30 >= 12 && dayIndex % 30 <= 18)) {
        // High volatility periods (spikes) periodically every 30 days
        pList = ['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D'];
      } else if (dayIndex % 30 >= 19 && dayIndex % 30 <= 25) {
        // Recovery periods
        pList = ['Grupo A', 'Grupo B', 'Grupo B', 'Grupo C', 'Grupo C'];
      } else {
        // Stable routine periods
        pList = ['Grupo A', 'Grupo A', 'Grupo B', 'Grupo B', 'Grupo B'];
      }

      shifts.forEach((shift, sIdx) => {
        const randomGroup = pList[Math.floor(Math.random() * pList.length)];
        const timestamp = new Date(dateStr + 'T12:00:00').getTime() + (sIdx * 1000 * 3600 * 4);
        
        mockEntries.push({
          userId,
          date: dateStr,
          shift,
          feedback: randomGroup,
          intensity: 0,
          timestamp
        });
      });
    }

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockEntries)
      });
      if (res.ok) {
        const result = await res.json();
        const mappedEntries = result.inserted.map((e: any) => ({
          id: e.id,
          date: e.date,
          shift: e.shift,
          intensity: e.intensity,
          feedback: e.feedback,
          timestamp: Number(e.timestamp)
        }));
        
        setData(prev => {
          return {
            ...prev,
            entries: {
              ...prev.entries,
              [userId]: mappedEntries
            }
          };
        });
        alert('1 ano de dados de calibração gerados com sucesso!');
      } else {
        alert('Erro ao gerar dados sintéticos.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao gerar dados.');
    }
  }, []);

  const clearEntries = useCallback(async (userId: string) => {
    setData(prev => {
      const newEntries = { ...prev.entries };
      delete newEntries[userId];
      return { ...prev, entries: newEntries };
    });
    try {
      await fetch(`/api/entries?userId=${userId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to clear', err);
    }
  }, []);

  // Removed findUser as auth is now API based via login()

  const subscribeToPushNotifications = useCallback(async (userId: string) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser.');
      return false;
    }

    try {
      // 1. Get VAPID public key
      const keyRes = await fetch('/api/push');
      if (!keyRes.ok) return false;
      const { publicKey } = await keyRes.json();

      // 2. Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Push notification permission denied.');
        return false;
      }

      // 3. Register subscription
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // 4. Save subscription on backend
      const saveRes = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscription })
      });

      return saveRes.ok;
    } catch (err) {
      console.error('Failed to subscribe to push notifications', err);
      return false;
    }
  }, []);

  return {
    loading,
    data,
    auth,
    login,
    logout,
    registerAthlete,
    getAthletes,
    saveEntry,
    getEntries,
    getTodayEntries,
    getAllEntries,
    generateMockData,
    clearEntries,
    deleteAthlete,
    subscribeToPushNotifications,
  };
}
