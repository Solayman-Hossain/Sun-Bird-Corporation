'use client';

import { useSyncExternalStore } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'super_admin' | 'hospital_procurement' | 'doctor' | 'customer' | 'pharmacist';
  organization?: string;
  isVerified?: boolean;
  bmdcOrDgdaNo?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const STORAGE_KEY = 'sunbird_auth_session';

const getInitialState = (): AuthState => {
  if (typeof window === 'undefined') {
    return { user: null, token: null, isAuthenticated: false, isLoading: false };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        user: parsed.user || null,
        token: parsed.token || null,
        isAuthenticated: !!parsed.token,
        isLoading: false,
      };
    }
  } catch {
    // fallback
  }
  return { user: null, token: null, isAuthenticated: false, isLoading: false };
};

let state: AuthState = getInitialState();
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const authStore = {
  getState(): AuthState {
    return state;
  },

  setState(partial: Partial<AuthState>) {
    state = { ...state, ...partial };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ user: state.user, token: state.token })
        );
      } catch {
        // storage quota exceeded or disabled
      }
    }
    notify();
  },

  login(user: AuthUser, token: string) {
    this.setState({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout() {
    this.setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useAuthStore(): AuthState & {
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
} {
  const currentSnapshot = useSyncExternalStore(
    authStore.subscribe,
    () => authStore.getState(),
    () => ({ user: null, token: null, isAuthenticated: false, isLoading: false })
  );

  return {
    ...currentSnapshot,
    login: (user, token) => authStore.login(user, token),
    logout: () => authStore.logout(),
  };
}

