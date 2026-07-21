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
  setSessionData: (data: {
    accessToken: string;
    refreshToken: string;
    user: SessionUser & { permissions?: string[] };
  }) => void;
  /** Reads the session back from the API using the stored tokens. */
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
 * Session state — a mirror of what the server said, never a source of truth.
 *
 * Two things have been deliberately removed from this file and must not come
 * back:
 *
 *   1. `switchDemoRole`, which let anyone rewrite their own role in the browser.
 *   2. An offline fallback that accepted a hardcoded email and password when the
 *      API was unreachable and granted `permissions: ['*']`. Anyone who could
 *      make the API look unreachable — an adblocker, a captive portal, a wrong
 *      env var, or simply the API being down — got full owner access to the UI.
 *
 * Both existed to make a demo work without a backend. The correct fix for "the
 * API is not deployed" is to deploy the API. A login that succeeds without one
 * is not a login.
 */
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
    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password, ...(tenantSlug ? { tenantSlug } : {}) }),
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
    const refreshToken = tokenStore.refresh;
    if (refreshToken) {
      // Best effort: clear local state even if the call fails, so a network
      // problem cannot leave someone apparently signed in.
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
    tokenStore.clear();
    set({ user: null, permissions: new Set(), status: 'anonymous' });
  },

  /**
   * The server already expands OWNER to every permission in the catalogue, so
   * there is no role special-casing here. Adding `role === 'OWNER'` as a
   * shortcut would make the UI disagree with the API the moment an office
   * customises its matrix.
   */
  can: (permission) => get().permissions.has(permission),
}));
