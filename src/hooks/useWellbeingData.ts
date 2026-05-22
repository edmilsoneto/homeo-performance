import { useState, useEffect, useCallback } from 'react';
import type { User, AppData, ShiftEntry, AuthState } from '../types';

export function useAppData() {
  const [data, setData] = useState<AppData>({ users: [], entries: {} });
  const [auth, setAuth] = useState<AuthState>({ isLoggedIn: false, currentUser: null });
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

  const login = useCallback(async (userOrName: any, pin?: string) => {
    // If it's a direct user object (legacy fallback)
    if (userOrName.id && !pin) {
      setAuth({ isLoggedIn: true, currentUser: userOrName });
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
        setAuth({ isLoggedIn: true, currentUser: user });
        
        // Load entries for this user (if athlete) or all entries (if admin)
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
    setData({ users: [], entries: {} }); // clear data on logout for security
    // Reload users just in case
    fetch('/api/athletes').then(r => r.json()).then(athletes => {
      setData(prev => ({ ...prev, users: athletes }));
    });
  }, []);

  const registerAthlete = useCallback(async (name: string, pin: string) => {
    try {
      const res = await fetch('/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin })
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

  const generateMockData = useCallback(async (_userId: string) => {
    // For Vercel/Neon MVP, mocking large datasets directly via API might be slow.
    alert('A injeção de 1 ano de dados requer acesso direto ao banco. Utilize o app real para gerar dados diários.');
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
  };
}
