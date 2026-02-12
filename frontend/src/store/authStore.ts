import { create } from 'zustand';
import type { AuthState, User } from '@/types';
import { authApi } from '@/api/auth';

const TOKEN_KEY = 'eaw_token';
const USER_KEY = 'eaw_user';

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => {
  const token = getStoredToken();
  const user = getStoredUser();

  return {
    token,
    user,
    isAuthenticated: !!token && !!user,

    login: async (username: string, password: string) => {
      const response = await authApi.login(username, password);
      const { token: newToken, user: newUser } = response;
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      set({ token: newToken, user: newUser, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      set({ token: null, user: null, isAuthenticated: false });
    },

    setAuth: (newToken: string, newUser: User) => {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      set({ token: newToken, user: newUser, isAuthenticated: true });
    },
  };
});
