import { Capacitor } from '@capacitor/core';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

const SECURE_KEY_PREFIX = 'ict_ops_';
const SECURE_TOKEN_KEY = 'auth_token';
const SECURE_CREDS_KEY = 'auth_creds_v1';

export type BiometricCredentials = {
  username: string;
  password: string;
};

let secureInit: Promise<void> | null = null;

async function initSecureStorage() {
  if (!Capacitor.isNativePlatform()) return;
  if (!secureInit) secureInit = SecureStorage.setKeyPrefix(SECURE_KEY_PREFIX);
  await secureInit;
}

export function getBiometricEnabled() {
  return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
}

export function setBiometricEnabled(enabled: boolean) {
  localStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function getAuthToken() {
  if (Capacitor.isNativePlatform()) {
    await initSecureStorage();
    return await SecureStorage.getItem(SECURE_TOKEN_KEY);
  }
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string | null) {
  if (Capacitor.isNativePlatform()) {
    await initSecureStorage();
    if (token) await SecureStorage.setItem(SECURE_TOKEN_KEY, token);
    else await SecureStorage.removeItem(SECURE_TOKEN_KEY);
    return;
  }

  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getAuthUserRaw() {
  return localStorage.getItem(AUTH_USER_KEY);
}

export function setAuthUserRaw(userRaw: string | null) {
  if (userRaw) localStorage.setItem(AUTH_USER_KEY, userRaw);
  else localStorage.removeItem(AUTH_USER_KEY);
}

export async function getBiometricCredentials(): Promise<BiometricCredentials | null> {
  if (!Capacitor.isNativePlatform()) return null;
  await initSecureStorage();

  const raw = await SecureStorage.getItem(SECURE_CREDS_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<BiometricCredentials> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.username !== 'string' || typeof parsed.password !== 'string') return null;
    return { username: parsed.username, password: parsed.password };
  } catch {
    return null;
  }
}

export async function setBiometricCredentials(creds: BiometricCredentials) {
  if (!Capacitor.isNativePlatform()) return;
  await initSecureStorage();
  await SecureStorage.setItem(SECURE_CREDS_KEY, JSON.stringify(creds));
}

export async function clearBiometricCredentials() {
  if (!Capacitor.isNativePlatform()) return;
  await initSecureStorage();
  await SecureStorage.removeItem(SECURE_CREDS_KEY);
}

export async function clearSavedSession() {
  await setAuthToken(null);
  setAuthUserRaw(null);
  setBiometricEnabled(false);
  await clearBiometricCredentials();
}

