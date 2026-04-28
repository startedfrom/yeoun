import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_KEY = 'gamdojang.session-token';
const REFRESH_KEY = 'gamdojang.refresh-token';

function webGet(key: string): Promise<string | null> {
  try {
    if (typeof globalThis.localStorage === 'undefined') return Promise.resolve(null);
    return Promise.resolve(globalThis.localStorage.getItem(key));
  } catch {
    return Promise.resolve(null);
  }
}

function webSet(key: string, value: string): Promise<void> {
  try {
    if (typeof globalThis.localStorage !== 'undefined') {
      globalThis.localStorage.setItem(key, value);
    }
  } catch {
    /* ignore quota / private mode */
  }
  return Promise.resolve();
}

function webRemove(key: string): Promise<void> {
  try {
    if (typeof globalThis.localStorage !== 'undefined') {
      globalThis.localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
  return Promise.resolve();
}

export async function loadSessionToken() {
  if (Platform.OS === 'web') return webGet(SESSION_KEY);
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function loadRefreshToken() {
  if (Platform.OS === 'web') return webGet(REFRESH_KEY);
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  if (Platform.OS === 'web') {
    await webSet(SESSION_KEY, accessToken);
    await webSet(REFRESH_KEY, refreshToken);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export async function clearTokens() {
  if (Platform.OS === 'web') {
    await webRemove(SESSION_KEY);
    await webRemove(REFRESH_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
