import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  username: string | null;
  role: 'admin' | 'officer' | 'management' | null;
  isAuthenticated: boolean;
  login: (token: string, username: string, role: 'admin' | 'officer' | 'management') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      role: null,
      isAuthenticated: false,
      login: (token, username, role) =>
        set({ token, username, role, isAuthenticated: true }),
      logout: () =>
        set({ token: null, username: null, role: null, isAuthenticated: false }),
    }),
    { name: 'admission-auth' }
  )
);
