/**
 * T13.10 — Frontend unit: auth store tests.
 * Verifies auth store never writes tokens to browser storage,
 * and login/register/logout/deleteAccount work correctly.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { api } from '@/lib/api';

// Mock the api module
vi.mock('@/lib/api', () => {
  class ApiClientError extends Error {
    constructor(public code: string, public message: string, public status: number) {
      super(message);
      this.name = 'ApiClientError';
    }
  }
  return {
    api: {
      getMe: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      deleteAccount: vi.fn(),
    },
    ApiClientError,
  };
});

const mockApi = vi.mocked(api);

describe('auth store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    useAuthStore.setState({
      user: null,
      isLoading: false,
      isInitialLoading: true,
      error: null,
    });
  });

  it('login success sets user and returns true', async () => {
    mockApi.login.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } });

    const { login } = useAuthStore.getState();
    const result = await login('a@b.com', 'password123!');

    expect(result).toBe(true);
    expect(useAuthStore.getState().user).toEqual({ id: 'u1', email: 'a@b.com' });
    expect(mockApi.login).toHaveBeenCalledWith('a@b.com', 'password123!');
  });

  it('login failure sets error and returns false', async () => {
    mockApi.login.mockRejectedValue(new Error('Network error'));

    const { login } = useAuthStore.getState();
    const result = await login('a@b.com', 'wrong');

    expect(result).toBe(false);
    expect(useAuthStore.getState().error).toBe('Login failed. Please check your credentials.');
  });

  it('register success sets user and returns true', async () => {
    mockApi.register.mockResolvedValue({ user: { id: 'u2', email: 'c@d.com' } });

    const { register } = useAuthStore.getState();
    const result = await register('c@d.com', 'password123!');

    expect(result).toBe(true);
    expect(useAuthStore.getState().user).toEqual({ id: 'u2', email: 'c@d.com' });
  });

  it('logout clears user state', async () => {
    mockApi.logout.mockResolvedValue(undefined);

    useAuthStore.setState({ user: { id: 'u1', email: 'a@b.com' } });
    const { logout } = useAuthStore.getState();
    await logout();

    expect(useAuthStore.getState().user).toBeNull();
  });

  it('deleteAccount clears user state on success', async () => {
    mockApi.deleteAccount.mockResolvedValue(undefined);

    useAuthStore.setState({ user: { id: 'u1', email: 'a@b.com' } });
    const { deleteAccount } = useAuthStore.getState();
    const result = await deleteAccount('password123!');

    expect(result).toBe(true);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('never writes tokens to localStorage or sessionStorage', async () => {
    mockApi.login.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } });
    const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');
    const sessionStorageSpy = vi.spyOn(Storage.prototype, 'setItem');

    const { login } = useAuthStore.getState();
    await login('a@b.com', 'password123!');

    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(sessionStorageSpy).not.toHaveBeenCalled();

    localStorageSpy.mockRestore();
    sessionStorageSpy.mockRestore();
  });

  it('fetchCurrentUser handles unauthenticated gracefully', async () => {
    mockApi.getMe.mockRejectedValue(new Error('401 Unauthorized'));

    const { fetchCurrentUser } = useAuthStore.getState();
    await fetchCurrentUser();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isInitialLoading).toBe(false);
  });
});