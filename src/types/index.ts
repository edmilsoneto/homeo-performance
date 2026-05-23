export type ShiftType = 'Manhã' | 'Tarde' | 'Noite';
export type GroupType = 'Grupo A' | 'Grupo B' | 'Grupo C' | 'Grupo D';
export type FeedbackType = 'Bom' | 'Ruim' | GroupType | 'A' | 'B' | 'C' | 'D';
export type UserRole = 'atleta' | 'admin' | 'athlete';

export interface ShiftEntry {
  id: string;
  date: string;
  shift: ShiftType;
  feedback: FeedbackType;
  intensity: number;
  timestamp: number;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  currentUser: User | null;
}

export interface AppData {
  users: User[];
  entries: Record<string, ShiftEntry[]>; // keyed by user id
}
