import { create } from 'zustand';
import { api, ApiClientError } from '../../../lib/api';

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialLoading: boolean;
  error: string | null;

  // Actions
  fetchCurrentUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  fetchCurrentUser: async () => {
    try {
      set({ isLoading: true });
      const data = await api.getMe();
      set({ user: data.user, error: null });
    } catch {
      // Unauthenticated / guest session — expected for guests, so no error message shown
      set({ user: null });
    } finally {
      set({ isLoading: false, isInitialLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.login(email, password);
      set({ user: data.user, error: null });
      return true;
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Login failed. Please check your credentials.';
      set({ error: message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.register(email, password);
      set({ user: data.user, error: null });
      return true;
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Registration failed. Please try again.';
      set({ error: message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await api.logout();
      set({ user: null, error: null });
    } catch {
      // Even if the network call fails, clear local user state
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAccount: async (password: string) => {
    try {
      set({ isLoading: true, error: null });
      await api.deleteAccount(password);
      set({ user: null, error: null });
      return true;
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Account deletion failed.';
      set({ error: message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));
