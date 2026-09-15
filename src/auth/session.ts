import { Capacitor } from '@capacitor/core';
import { getSavedSession, saveSession, clearSavedSession } from './storage';
import { SessionClient } from './session-client';
import { getApiBaseUrl } from '../lib/api';
export const SESSION_EXPIRED_EVENT = 'ict-session-expired';
export const sessionClient = new SessionClient({
  load: getSavedSession, save: saveSession, clear: clearSavedSession,
  fetch: (input, init) => fetch(input, init),
  authUrl: path => `${getApiBaseUrl()}/api/auth/${path}`,
  native: Capacitor.isNativePlatform(),
  onExpired: () => window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT)),
  lock: fn => typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request('ict-session', fn) : fn(),
});
