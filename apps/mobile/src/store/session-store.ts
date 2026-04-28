import { create } from 'zustand';

import { getApiBaseUrl } from '../lib/api-base-url';
import { logout } from '../lib/api';
import { clearTokens, loadSessionToken, saveTokens } from '../lib/secure-store';

type SessionState = {
  isHydrated: boolean;
  sessionToken: string | null;
  hydrate: () => Promise<void>;
  signIn: (accessToken: string, refreshToken: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set) => ({
  isHydrated: false,
  sessionToken: null,
  hydrate: async () => {
    let token: string | null = null;
    try {
      token = await loadSessionToken();
      if (token) {
        const controller = new AbortController();
        const timeoutMs = 8000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(`${getApiBaseUrl()}/users/me/profile`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          });
          if (res.status === 401 || res.status === 403) {
            await clearTokens();
            token = null;
          }
        } catch {
          // 네트워크/타임아웃 시 토큰 유지 — API 복구 후 재시도 가능
        } finally {
          clearTimeout(timeoutId);
        }
      }
    } catch {
      await clearTokens().catch(() => undefined);
      token = null;
    } finally {
      set({
        isHydrated: true,
        sessionToken: token
      });
    }
  },
  signIn: async (accessToken, refreshToken) => {
    await saveTokens(accessToken, refreshToken);
    set({
      sessionToken: accessToken
    });
  },
  signOut: async () => {
    await logout();
    await clearTokens();
    set({
      sessionToken: null
    });
  }
}));
