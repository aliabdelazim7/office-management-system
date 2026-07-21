const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '/api/v1';
  }
  return 'http://localhost:4000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

const ACCESS_KEY = 'office_erp_access';
const REFRESH_KEY = 'office_erp_refresh';

export interface ApiError {
  statusCode: number;
  message: string | string[];
  code?: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiError,
  ) {
    const rawMessage = body?.message;
    const msg = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : typeof rawMessage === 'string' && rawMessage.trim()
      ? rawMessage
      : 'حدث خطأ غير متوقع في الخادم';
    super(msg);
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

    const refreshed = await refreshInFlight;
    if (refreshed) {
      try {
        response = await send();
      } catch {
        throw new ApiRequestError(0, { statusCode: 0, message: 'تعذر الاتصال بالخادم' });
      }
    }
  }

  if (!response.ok) {
    let body: ApiError;
    try {
      body = (await response.json()) as ApiError;
    } catch {
      body = {
        statusCode: response.status,
        message: response.statusText || 'حدث خطأ غير متوقع في الخادم',
      };
    }
    throw new ApiRequestError(response.status, body);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}
