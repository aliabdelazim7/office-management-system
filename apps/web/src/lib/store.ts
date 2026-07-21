import { create } from 'zustand';
import { apiFetch, ApiRequestError, tokenStore } from './api';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  tenant: { id: string; name: string; slug: string; logoUrl?: string | null };
}

export interface CustomUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  jobTitle?: string;
  permissions: string[];
}

interface AuthState {
  user: SessionUser | null;
  permissions: Set<string>;
  status: 'unknown' | 'authenticated' | 'anonymous';

  login: (email: string, password: string, tenantSlug?: string) => Promise<void>;
  createDirectUser: (userData: { name: string; email: string; password: string; role: string; jobTitle?: string; permissions: string[] }) => void;
  getCustomUsers: () => CustomUserRecord[];
  setSessionData: (data: { accessToken: string; refreshToken: string; user: SessionUser & { permissions?: string[] } }) => void;
  restore: () => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser & { permissions: string[] };
}

interface MeResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  permissions: string[];
  tenant: { id: string; name: string; slug: string; logoUrl?: string | null };
}



const CUSTOM_USERS_KEY = 'office_erp_custom_users';

function getStoredCustomUsers(): CustomUserRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomUsers(users: CustomUserRecord[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(users));
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: new Set<string>(),
  status: 'unknown',

  getCustomUsers: () => getStoredCustomUsers(),

  createDirectUser: (userData) => {
    const current = getStoredCustomUsers();
    const newUser: CustomUserRecord = {
      id: `usr-${Date.now().toString(36)}`,
      name: userData.name,
      email: userData.email.trim().toLowerCase(),
      passwordHash: userData.password,
      role: userData.role,
      jobTitle: userData.jobTitle || '',
      permissions: userData.permissions,
    };
    const updated = [newUser, ...current.filter((u) => u.email !== newUser.email)];
    saveCustomUsers(updated);
  },

  setSessionData: (data) => {
    tokenStore.set(data.accessToken, data.refreshToken);
    set({
      user: {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatarUrl: data.user.avatarUrl,
        jobTitle: data.user.jobTitle,
        tenant: data.user.tenant,
      },
      permissions: new Set(data.user.permissions ?? []),
      status: 'authenticated',
    });
  },

  login: async (email, password, tenantSlug) => {
    const cleanEmail = email.trim().toLowerCase();
    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email: cleanEmail, password, ...(tenantSlug ? { tenantSlug } : {}) }),
    });

    get().setSessionData(data);
  },

  restore: async () => {
    if (!tokenStore.access && !tokenStore.refresh) {
      set({ status: 'anonymous', user: null, permissions: new Set() });
      return;
    }

    try {
      const me = await apiFetch<MeResponse>('/auth/me');
      set({
        user: {
          id: me.id,
          name: me.name,
          email: me.email,
          role: me.role,
          avatarUrl: me.avatarUrl,
          jobTitle: me.jobTitle,
          tenant: me.tenant,
        },
        permissions: new Set(me.permissions),
        status: 'authenticated',
      });
    } catch {
      tokenStore.clear();
      set({ status: 'anonymous', user: null, permissions: new Set() });
    }
  },

  logout: async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      tokenStore.clear();
      set({ user: null, permissions: new Set(), status: 'anonymous' });
    }
  },

  can: (permission: string) => {
    const { permissions, user } = get();
    if (!user) return false;
    if (user.role === 'OWNER' || permissions.has('*')) return true;
    return permissions.has(permission);
  },
}));
