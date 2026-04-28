import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch, getToken, setToken } from '../lib/api';

export type AdminMe = {
  id: string;
  email: string | null;
  nickname: string | null;
  role: string;
  status: string;
  permissions: string[];
};

type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'forbidden'; message: string }
  | { status: 'ready'; me: AdminMe };

type AuthContextValue = {
  state: AuthState;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (perm: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ status: 'anonymous' });
      return;
    }
    try {
      const me = await apiFetch<AdminMe>('/admin/me');
      if (me.role !== 'admin' && me.role !== 'moderator') {
        setToken(null);
        setState({ status: 'forbidden', message: '운영 콘솔 역할(admin/moderator)이 아닙니다.' });
        return;
      }
      setState({ status: 'ready', me });
    } catch (e) {
      setToken(null);
      const message = e instanceof Error ? e.message : '세션 확인 실패';
      if (message.includes('403') || message.includes('Admin')) {
        setState({ status: 'forbidden', message: '운영자 권한이 없습니다.' });
      } else {
        setState({ status: 'anonymous' });
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const base = import.meta.env.VITE_API_BASE ?? '/api/v1';
    let body: Response;
    try {
      body = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error('API에 연결할 수 없습니다. 터미널에서 apps/api 가 포트 4000에서 실행 중인지 확인하세요.');
    }
    const raw = await body.text();
    let json: {
      success?: boolean;
      data?: { access_token?: string; error?: string };
      error?: string;
    };
    try {
      json = raw ? (JSON.parse(raw) as typeof json) : {};
    } catch {
      throw new Error('서버 응답이 JSON이 아닙니다. API가 꺼졌거나 프록시 대상이 잘못됐을 수 있습니다.');
    }
    if (!body.ok || !json.success || !json.data?.access_token) {
      throw new Error(json.error ?? json.data?.error ?? '로그인 실패');
    }
    setToken(json.data.access_token);
    await refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    setToken(null);
    setState({ status: 'anonymous' });
  }, []);

  const can = useCallback(
    (perm: string) => {
      if (state.status !== 'ready') return false;
      return state.me.permissions.includes(perm);
    },
    [state],
  );

  const value = useMemo(
    () => ({ state, refresh, login, logout, can }),
    [state, refresh, login, logout, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
