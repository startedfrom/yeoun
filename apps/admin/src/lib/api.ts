const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1';

const TOKEN_KEY = 'gamdojang_admin_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (res.status === 401) {
    setToken(null);
  }

  if (!res.ok) {
    const msg = typeof json.error === 'string' ? json.error : res.statusText;
    throw new Error(msg || '요청 실패');
  }

  if (json.success !== true) {
    const msg = typeof json.error === 'string' ? json.error : '요청 실패';
    throw new Error(msg);
  }

  return json.data as T;
}

export function adminAction(body: Record<string, unknown>) {
  return apiFetch<{ id: string }>('/admin/actions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
