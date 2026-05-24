import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import type { User, ShiftEntry, AuthState } from '../types';

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('homeo_auth');
    return saved ? JSON.parse(saved) : { isLoggedIn: false, currentUser: null };
  });

  const login = async (name: string, pin?: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin })
      });
      if (res.ok) {
        const user = await res.json();
        const newAuth = { isLoggedIn: true, currentUser: user };
        setAuth(newAuth);
        localStorage.setItem('homeo_auth', JSON.stringify(newAuth));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setAuth({ isLoggedIn: false, currentUser: null });
    localStorage.removeItem('homeo_auth');
  };

  return { auth, login, logout };
}

export function useAthletes() {
  return useQuery<User[]>({
    queryKey: ['athletes'],
    queryFn: () => apiFetch('/api/athletes')
  });
}

export function useAthleteEntries(userId: string) {
  return useQuery<ShiftEntry[]>({
    queryKey: ['entries', userId],
    queryFn: () => apiFetch(`/api/entries?userId=${userId}`),
    enabled: !!userId,
  });
}

export function useMutateAthlete() {
  const queryClient = useQueryClient();
  
  const register = useMutation({
    mutationFn: (data: { name: string, pin: string, whatsapp?: string }) => 
      apiFetch('/api/athletes', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['athletes'] })
  });

  const remove = useMutation({
    mutationFn: (userId: string) => apiFetch(`/api/athletes?id=${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
    }
  });

  return { register: register.mutateAsync, remove: remove.mutateAsync };
}

export function useMutateEntries() {
  const queryClient = useQueryClient();

  const saveEntry = useMutation({
    mutationFn: (data: any) => apiFetch('/api/entries', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entries', variables.userId] });
    }
  });

  const clearEntries = useMutation({
    mutationFn: (userId: string) => apiFetch(`/api/entries?userId=${userId}`, { method: 'DELETE' }),
    onSuccess: (_, userId) => queryClient.invalidateQueries({ queryKey: ['entries', userId] })
  });

  return { saveEntry: saveEntry.mutateAsync, clearEntries: clearEntries.mutateAsync };
}

export function usePushSubscription() {
  return useCallback(async (userId: string) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    try {
      const { publicKey } = await apiFetch('/api/push');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;
      
      const registration = await navigator.serviceWorker.ready;
      
      const padding = '='.repeat((4 - publicKey.length % 4) % 4);
      const base64 = (publicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray
      });
      
      await apiFetch('/api/push', { method: 'POST', body: JSON.stringify({ userId, subscription }) });
      return true;
    } catch {
      return false;
    }
  }, []);
}
