const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const ACCESS_KEY = 'office_erp_access';
const REFRESH_KEY = 'office_erp_refresh';

export interface ApiError {
  statusCode: number;
  message: string;
  code?: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiError,
  ) {
    super(body.message);
    this.name = 'ApiRequestError';
  }
}

export const tokenStore = {
  get access(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_KEY);
  },
  set(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

/**
 * Serialises refresh attempts.
 *
 * When a page fires several requests at once and the access token has expired,
 * every one of them gets a 401. Without this, each would rotate the refresh
 * token independently — and the API treats a reused refresh token as theft and
 * revokes the entire session family. So the first refresh wins and the rest
 * wait on its result.
 */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return false;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => null);

  if (!response?.ok) {
    tokenStore.clear();
    return false;
  }

  const data = await response.json();
  tokenStore.set(data.accessToken, data.refreshToken);
  return true;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth, ...init } = options;

  const send = async (): Promise<Response> => {
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }
    const token = tokenStore.access;
    if (!skipAuth && token) headers.set('Authorization', `Bearer ${token}`);

    return fetch(`${API_BASE_URL}${endpoint}`, { ...init, headers });
  };

  let response: Response;
  try {
    response = await send();
  } catch {
    throw new ApiRequestError(0, { statusCode: 0, message: 'تعذر الاتصال بالخادم' });
  }

  if (response.status === 401 && !skipAuth && tokenStore.refresh) {
    refreshInFlight ??= refreshTokens().finally(() => {
      refreshInFlight = null;
    });

    if (await refreshInFlight) {
      response = await send();
    }
  }

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => ({
    statusCode: response.status,
    message: 'تعذر قراءة رد الخادم',
  }));

  if (!response.ok) {
    // A failed refresh means the session is genuinely over. Send the user to
    // the login page rather than leaving them on a screen that cannot load.
    if (response.status === 401 && typeof window !== 'undefined' && !skipAuth) {
      tokenStore.clear();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    throw new ApiRequestError(response.status, body as ApiError);
  }

  return body as T;
}

export { API_BASE_URL };
