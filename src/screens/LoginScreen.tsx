import React, { useEffect, useMemo, useState } from 'react';
import { Shield, HelpCircle, Terminal, User, Lock, EyeOff, ArrowRight, Key, Fingerprint } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { getApiBaseUrl } from '../lib/api';
import {
  clearBiometricCredentials,
  getBiometricCredentials,
  getBiometricEnabled,
  setAuthToken,
  setAuthUserRaw,
  setBiometricCredentials,
  setBiometricEnabled,
} from '../auth/storage';

interface LoginScreenProps {
  onLogin: () => void;
  onLogout?: () => void;
}

export default function LoginScreen({ onLogin, onLogout }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enableBiometric, setEnableBiometric] = useState(() => getBiometricEnabled());
  const [biometricLoginReady, setBiometricLoginReady] = useState(false);

  const apiBaseUrl = useMemo(() => {
    return getApiBaseUrl();
  }, []);

  useEffect(() => {
    let active = true;
    if (!Capacitor.isNativePlatform()) return;

    void (async () => {
      const creds = await getBiometricCredentials();
      if (!active) return;
      setBiometricLoginReady(Boolean(creds));
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.ok) {
        const code = typeof data?.error === 'string' ? data.error : null;
        if (code === 'INVALID_CREDENTIALS' || code === 'NOT_FOUND') {
          setError('Login failed. Check your username and password.');
        } else if (code === 'NOT_ALLOWED') {
          setError('Login blocked. Your account is not in the allowed AD group.');
        } else if (code === 'LDAP_TLS_FAILED') {
          setError('LDAPS connection failed (TLS/certificate). Check backend TLS configuration.');
        } else if (code?.startsWith('LDAP_')) {
          setError(`Login failed (${code}).`);
        } else {
          setError('Login failed. Please try again.');
        }
        return;
      }

      if (typeof data.token === 'string') {
        await setAuthToken(data.token);
      }
      if (data.user) {
        setAuthUserRaw(JSON.stringify(data.user));
      }

      if (enableBiometric) {
        if (!Capacitor.isNativePlatform()) {
          setBiometricEnabled(false);
          setBiometricLoginReady(false);
          await clearBiometricCredentials();
        } else {
          try {
            const info = await BiometricAuth.checkBiometry();
            if (info.isAvailable || info.deviceIsSecure) {
              await BiometricAuth.authenticate({
                reason: 'Enable biometric unlock',
                cancelTitle: 'Cancel',
                allowDeviceCredential: true,
                iosFallbackTitle: 'Use passcode',
                androidTitle: 'Enable biometrics',
                androidSubtitle: 'Authenticate to enable biometric unlock',
                androidConfirmationRequired: false,
              });
              await setBiometricCredentials({ username, password });
              setBiometricEnabled(true);
              setBiometricLoginReady(true);
            } else {
              setBiometricEnabled(false);
              setBiometricLoginReady(false);
              await clearBiometricCredentials();
            }
          } catch {
            setBiometricEnabled(false);
            setBiometricLoginReady(false);
            await clearBiometricCredentials();
          }
        }
      } else {
        setBiometricEnabled(false);
        setBiometricLoginReady(false);
        await clearBiometricCredentials();
      }

      onLogin();
    } catch {
      setError('Unable to reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!Capacitor.isNativePlatform()) {
        setError('Biometric login is only available on mobile.');
        return;
      }

      const info = await BiometricAuth.checkBiometry();
      if (!info.isAvailable && !info.deviceIsSecure) {
        setError('Biometrics are not available on this device.');
        return;
      }

      await BiometricAuth.authenticate({
        reason: 'Sign in',
        cancelTitle: 'Cancel',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Use passcode',
        androidTitle: 'Sign in',
        androidSubtitle: 'Authenticate to sign in',
        androidConfirmationRequired: false,
      });

      const creds = await getBiometricCredentials();
      if (!creds) {
        setError('No biometric login is set up on this device.');
        setBiometricEnabled(false);
        setBiometricLoginReady(false);
        return;
      }

      const resp = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: creds.username, password: creds.password }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.ok) {
        const code = typeof data?.error === 'string' ? data.error : null;
        if (code === 'INVALID_CREDENTIALS' || code === 'NOT_FOUND') {
          setError('Login failed. Check your username and password.');
        } else if (code === 'NOT_ALLOWED') {
          setError('Login blocked. Your account is not in the allowed AD group.');
        } else if (code === 'LDAP_TLS_FAILED') {
          setError('LDAPS connection failed (TLS/certificate). Check backend TLS configuration.');
        } else if (code?.startsWith('LDAP_')) {
          setError(`Login failed (${code}).`);
        } else {
          setError('Login failed. Please try again.');
        }
        return;
      }

      if (typeof data.token === 'string') {
        await setAuthToken(data.token);
      }
      if (data.user) {
        setAuthUserRaw(JSON.stringify(data.user));
      }

      setBiometricEnabled(true);
      onLogin();
    } catch {
      setError('Authentication was canceled or failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col items-center justify-between">
      {/* Top Navigation Anchor */}
      <header className="fixed top-0 left-0 w-full z-50 bg-slate-50/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Shield className="text-primary w-6 h-6" />
            <h1 className="text-xl font-black tracking-tighter text-blue-700 font-headline">Slate Nexus</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-blue-600 transition-all duration-300">
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow w-full max-w-md px-6 pt-32 pb-12 flex flex-col justify-center mx-auto">
        {/* Login Card Architecture */}
        <section className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_8px_24px_rgba(42,52,57,0.06)] relative overflow-hidden">
          {/* Tonal Accent Background Decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8"></div>
          
          {/* Branding/Identity */}
          <div className="mb-10 text-center relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-surface-container-high rounded-xl mb-4">
              <Terminal className="text-primary w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight font-headline text-on-surface mb-2">ICT Ops Mobile</h2>
            <p className="text-on-surface-variant text-sm font-medium">ICT Super App Ecosystem</p>
          </div>

          {/* Login Form */}
          <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
            {/* Operator ID/Email Field */}
            <div className="space-y-2">
              <label className="block text-[11px] uppercase tracking-widest font-label text-on-surface-variant font-semibold ml-1">
                Username (or Email)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="text-outline w-5 h-5 group-focus-within:text-primary transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="nexus-ops-742" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={loading}
                  className="w-full bg-surface-container-highest border-none rounded-lg py-3.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all duration-250 placeholder:text-outline outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] uppercase tracking-widest font-label text-on-surface-variant font-semibold">
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-outline w-5 h-5 group-focus-within:text-primary transition-colors" />
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full bg-surface-container-highest border-none rounded-lg py-3.5 pl-10 pr-10 text-sm focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all duration-250 placeholder:text-outline outline-none"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
                  <EyeOff className="text-outline w-5 h-5 hover:text-on-surface-variant transition-colors" />
                </div>
              </div>
            </div>

            {Capacitor.isNativePlatform() && (
              <label className="flex items-center gap-3 text-sm font-medium text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={enableBiometric}
                  onChange={(e) => setEnableBiometric(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 rounded border-outline-variant/40 text-primary focus:ring-primary/40"
                />
                <span>Enable biometric login on this device</span>
              </label>
            )}

            {error && (
              <div className="bg-error-container/25 text-on-error-container px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {/* Primary Action */}
            <button 
              type="submit" 
              disabled={loading || !username.trim() || !password}
              className="w-full bg-gradient-to-br from-[#0053db] to-[#0048c1] text-on-primary font-bold py-4 rounded-xl shadow-[0_8px_24px_rgba(42,52,57,0.06)] hover:brightness-110 active:scale-[0.98] transition-all duration-250 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {Capacitor.isNativePlatform() && biometricLoginReady && (
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-surface-container border border-outline-variant/15 py-3.5 rounded-xl hover:bg-surface-container-high transition-colors"
              >
                <Fingerprint className="w-5 h-5 text-slate-800" />
                <span className="text-sm font-semibold text-slate-800">Sign in with biometrics</span>
              </button>
            )}
          </form>

          {/* Secondary Actions: Asymmetric Spacing */}
          <div className="mt-8 pt-8 flex flex-col gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-grow bg-surface-variant"></div>
              <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest">Enterprise Auth</span>
              <div className="h-[1px] flex-grow bg-surface-variant"></div>
            </div>
            <button 
              type="button" 
              className="w-full flex items-center justify-center gap-3 bg-surface-container border border-outline-variant/15 py-3.5 rounded-xl hover:bg-surface-container-high transition-colors"
            >
              <Key className="w-5 h-5 text-slate-800" />
              <span className="text-sm font-semibold text-slate-800">Single Sign-On (SSO)</span>
            </button>
            <div className="flex justify-center">
              <a href="#" className="text-sm font-semibold text-primary hover:text-primary-dim transition-colors">Forgot Password?</a>
            </div>
            {onLogout && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors uppercase tracking-widest"
                >
                  Clear saved session
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Security Identity */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 bg-tertiary-container/30 px-4 py-2 rounded-full">
            <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
            <span className="text-[11px] font-bold text-on-tertiary-container uppercase tracking-wide">Secure Enterprise Connection</span>
          </div>
          <p className="text-center text-xs text-on-surface-variant leading-relaxed max-w-[280px]">
            Authorized personnel only. All access attempts are logged and encrypted via Nexus Shield Protocol.
          </p>
        </div>
      </main>

      {/* Predictable Footer Anchor */}
      <footer className="w-full py-12 bg-slate-50 mt-auto">
        <div className="flex flex-col items-center gap-4 w-full px-8">
          <div className="flex items-center gap-6 mb-2">
            <a href="#" className="font-label text-[11px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Privacy Policy</a>
            <a href="#" className="font-label text-[11px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Terms of Service</a>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              <a href="#" className="font-label text-[11px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">System Status</a>
            </div>
          </div>
          <p className="font-label text-[11px] uppercase tracking-widest text-slate-400 text-center">
            © 2024 Slate Nexus Enterprise. Precision ICT Operations.
          </p>
        </div>
      </footer>
    </div>
  );
}
