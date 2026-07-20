const API_BASE_URL = 'http://localhost:4000/api/v1';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('saas_token') || 'demo-jwt-token-active-session' : '';

  const headers = {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP Error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.warn(`API call failed for ${endpoint}:`, error.message);
    throw error;
  }
}
