import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '../lib/types';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const TOKEN_KEY = 'auth_token';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.login(email, password);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Login failed',
        isLoading: false
      });
      throw error;
    }
  },

  register: async (email: string, password: string, username: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.register(email, password, username);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Registration failed',
        isLoading: false
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.logout();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        set({ isAuthenticated: false, isLoading: false });
        return;
      }

      const user = await api.getMe();
      set({
        user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  clearError: () => set({ error: null }),
}));
