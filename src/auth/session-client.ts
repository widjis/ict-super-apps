export type SavedSession = { token: string; refreshToken?: string; refreshExpiresAt?: string };
type Options = {
  load: () => Promise<SavedSession | null>;
  save: (session: SavedSession) => Promise<void>;
  clear: () => Promise<void>;
  fetch: typeof fetch;
  authUrl: (path: string) => string;
  native: boolean;
  onExpired: () => void;
  lock?: <T>(fn: () => Promise<T>) => Promise<T>;
};
const authErrors = new Set(['TOKEN_EXPIRED', 'INVALID_TOKEN', 'MISSING_TOKEN', 'SESSION_REVOKED']);
const refreshErrors = new Set(['INVALID_REFRESH_TOKEN', 'REFRESH_EXPIRED', 'REFRESH_REUSED', 'SESSION_REVOKED']);
const expired = () => Object.assign(new Error('SESSION_EXPIRED'), { status: 401 });
export class SessionClient {
  private tail: Promise<unknown> = Promise.resolve();
  constructor(private options: Options) {}
  private lock<T>(fn: () => Promise<T>): Promise<T> {
    const run = () => this.options.lock ? this.options.lock(fn) : fn();
    const result = this.tail.then(run, run);
    this.tail = result.catch(() => undefined);
    return result;
  }
  private async invalidate() {
    await this.options.clear();
    this.options.onExpired();
  }
  async saveLogin(session: SavedSession) {
    if (typeof session.token !== 'string' || !session.token) throw new Error('INVALID_LOGIN_RESPONSE');
    await this.lock(() => this.options.save(session));
  }
  async login(username: string, password: string) {
    return this.lock(async () => {
      const response = await this.options.fetch(this.options.authUrl('login'), {
        method: 'POST', credentials: this.options.native ? 'omit' : 'include', headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({ username, password, sessionTransport: this.options.native ? 'native' : 'web' }),
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.ok) {
        if (typeof data.token !== 'string' || !data.token) throw new Error('INVALID_LOGIN_RESPONSE');
        await this.options.save({ token: data.token, refreshToken: data.refreshToken, refreshExpiresAt: data.refreshExpiresAt });
      }
      return { response, data };
    });
  }
  private async authRequest(path: string, session: SavedSession) {
    return this.options.fetch(this.options.authUrl(path), {
      method: 'POST', credentials: this.options.native ? 'omit' : 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionTransport: this.options.native ? 'native' : 'web', ...(this.options.native ? { refreshToken: session.refreshToken } : {}) }),
      signal: AbortSignal.timeout(15_000),
    });
  }
  private async refresh(failedToken: string) {
    return this.lock(async () => {
      const current = await this.options.load();
      if (!current) throw expired();
      if (current.token !== failedToken) return current; // another request/tab won
      if (!current.refreshToken && !current.refreshExpiresAt) {
        await this.invalidate(); throw expired(); // legacy JWT, no refresh available
      }
      const response = await this.authRequest('refresh', current);
      const data = await response.json().catch(() => null);
      if (response.status === 401 && refreshErrors.has(data?.error)) {
        await this.invalidate(); throw expired();
      }
      if (!response.ok || !data?.ok || typeof data.token !== 'string' || (this.options.native && typeof data.refreshToken !== 'string')) {
        throw Object.assign(new Error('REFRESH_UNAVAILABLE'), { status: response.status });
      }
      const next = { token: data.token, refreshToken: data.refreshToken, refreshExpiresAt: data.refreshExpiresAt };
      await this.options.save(next);
      return next;
    });
  }
  async request(url: string, init: RequestInit = {}) {
    const initial = await this.options.load();
    if (!initial) throw expired();
    const send = (token: string) => {
      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${token}`);
      return this.options.fetch(url, { ...init, headers, signal: init.signal ?? AbortSignal.timeout(30_000) });
    };
    let response = await send(initial.token);
    if (response.status !== 401) return response;
    const error = await response.clone().json().catch(() => null);
    if (!authErrors.has(error?.error)) return response; // e.g. upstream API auth
    if (error.error === 'SESSION_REVOKED') {
      await this.lock(async () => { if ((await this.options.load())?.token === initial.token) await this.invalidate(); });
      throw expired();
    }
    const next = await this.refresh(initial.token);
    // Logout may have acquired the lock while the refresh was finishing.
    if ((await this.options.load())?.token !== next.token) throw expired();
    response = await send(next.token); // one replay only; auth middleware runs before handlers
    if (response.status === 401) {
      const retryError = await response.clone().json().catch(() => null);
      if (authErrors.has(retryError?.error)) {
        await this.lock(async () => { if ((await this.options.load())?.token === next.token) await this.invalidate(); });
        throw expired();
      }
    }
    return response;
  }
  async restore(meUrl: string): Promise<boolean> {
    if (!(await this.options.load())) return false;
    try {
      const response = await this.request(meUrl);
      if (!response.ok) throw Object.assign(new Error('SESSION_CHECK_UNAVAILABLE'), { status: response.status });
      const data = await response.clone().json().catch(() => null);
      if (!data?.ok) throw new Error('SESSION_CHECK_UNAVAILABLE');
      return Boolean(await this.options.load());
    } catch (err) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') return false;
      throw err; // server/network failures never delete credentials
    }
  }
  async logout() {
    await this.lock(async () => {
      const session = await this.options.load();
      if (session && (session.refreshToken || session.refreshExpiresAt)) {
        const response = await this.authRequest('logout', session);
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) throw new Error('LOGOUT_UNAVAILABLE');
      }
      await this.invalidate();
    });
  }
}
