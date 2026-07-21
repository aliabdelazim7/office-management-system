import { create } from 'zustand';
import { apiFetch, tokenStore } from './api';

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
  /** Effective permissions from the server. The UI renders from these. */
  permissions: Set<string>;
  status: 'unknown' | 'authenticated' | 'anonymous';

  login: (email: string, password: string, tenantSlug?: string) => Promise<void>;
  /** Reads the session back from the API using the stored refresh token. */
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

/**
 * Session state.
 *
 * Permissions come from the server on every restore and are never inferred
 * client-side. A previous version of this store shipped a `switchDemoRole`
 * action that let anyone rewrite their own role in the browser — the UI would
 * then render an owner's screens for a viewer. The API is the only authority on
 * what a session may do; this store just mirrors what it was told.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: new Set<string>(),
  status: 'unknown',

  login: async (email, password, tenantSlug) => {
    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password, ...(tenantSlug ? { tenantSlug } : {}) }),
    });

    tokenStore.set(data.accessToken, data.refreshToken);
    set({
      user: {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatarUrl: data.user.avatarUrl,
        tenant: data.user.tenant,
      },
      permissions: new Set(data.user.permissions),
      status: 'authenticated',
    });
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
    const refreshToken = tokenStore.refresh;
    if (refreshToken) {
      // Best effort: clear local state even if the server call fails, so a
      // network problem cannot leave someone apparently signed in.
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
    tokenStore.clear();
    set({ user: null, permissions: new Set(), status: 'anonymous' });
  },

  can: (permission) => get().permissions.has(permission),
}));
