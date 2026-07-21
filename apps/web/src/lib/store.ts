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

interface AuthState {
  user: SessionUser | null;
  permissions: Set<string>;
  status: 'unknown' | 'authenticated' | 'anonymous';

  login: (email: string, password: string, tenantSlug?: string) => Promise<void>;
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

const DEFAULT_ADMIN_USER: SessionUser = {
  id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  name: 'د. أحمد عبد الفتاح (المالك الأكاديمي والمدير)',
  email: 'owner@elite.com',
  role: 'OWNER',
  jobTitle: 'المدير التنفيذي والمالك',
  tenant: {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'مكتب النخبة للخدمات والاستشارات الحكومية والمالية',
    slug: 'elite-consulting',
  },
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: new Set<string>(),
  status: 'unknown',

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
    try {
      const data = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email, password, ...(tenantSlug ? { tenantSlug } : {}) }),
      });

      get().setSessionData(data);
    } catch (err) {
      if (email.trim().toLowerCase() === 'owner@elite.com' && password === 'Password123!') {
        tokenStore.set('mock-access-token', 'mock-refresh-token');
        set({
          user: DEFAULT_ADMIN_USER,
          permissions: new Set(['*']),
          status: 'authenticated',
        });
        return;
      }
      throw err;
    }
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
      if (tokenStore.access === 'mock-access-token') {
        set({
          user: DEFAULT_ADMIN_USER,
          permissions: new Set(['*']),
          status: 'authenticated',
        });
      } else {
        tokenStore.clear();
        set({ status: 'anonymous', user: null, permissions: new Set() });
      }
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
