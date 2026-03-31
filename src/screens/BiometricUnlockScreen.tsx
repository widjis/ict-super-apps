import React, { useEffect, useState } from 'react';
import { Fingerprint, LogOut, RefreshCw } from 'lucide-react';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { getCopyrightText } from '../lib/copyright';

interface BiometricUnlockScreenProps {
  onUnlocked: () => void;
  onLogout: () => void;
}

export default function BiometricUnlockScreen({ onUnlocked, onLogout }: BiometricUnlockScreenProps) {
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const info = await BiometricAuth.checkBiometry();
        if (!active) return;
        setAvailable(info.isAvailable || info.deviceIsSecure);
      } catch {
        if (!active) return;
        setAvailable(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const authenticate = async () => {
    setError(null);
    setLoading(true);
    try {
      await BiometricAuth.authenticate({
        reason: 'Please authenticate to continue',
        cancelTitle: 'Cancel',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Use passcode',
        androidTitle: 'Unlock',
        androidSubtitle: 'Authenticate to continue',
        androidConfirmationRequired: false,
      });
      onUnlocked();
    } catch {
      setError('Authentication was canceled or failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col items-center justify-between">
      <header className="fixed top-0 left-0 w-full z-50 bg-slate-50/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 h-safe-16 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Fingerprint className="text-primary w-6 h-6" />
            <h1 className="text-xl font-black tracking-tighter text-blue-700 font-headline">Slate Nexus</h1>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="text-slate-500 hover:text-blue-600 transition-all duration-300"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-grow w-full max-w-md px-6 pt-safe-32 pb-12 flex flex-col justify-center mx-auto">
        <section className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_8px_24px_rgba(42,52,57,0.06)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8"></div>

          <div className="mb-10 text-center relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-surface-container-high rounded-xl mb-4">
              <Fingerprint className="text-primary w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight font-headline text-on-surface mb-2">Unlock</h2>
            <p className="text-on-surface-variant text-sm font-medium">Use biometrics or device credential to continue.</p>
          </div>

          {available === false && (
            <div className="bg-error-container/25 text-on-error-container px-4 py-3 rounded-xl text-sm font-medium">
              Biometrics are not available on this device.
            </div>
          )}

          {error && (
            <div className="bg-error-container/25 text-on-error-container px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={authenticate}
              disabled={loading || available === false}
              className="w-full bg-gradient-to-br from-[#0053db] to-[#0048c1] text-on-primary font-bold py-4 rounded-xl shadow-[0_8px_24px_rgba(42,52,57,0.06)] hover:brightness-110 active:scale-[0.98] transition-all duration-250 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Unlock with biometrics'}</span>
              <Fingerprint className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setAvailable(null);
                setError(null);
                void (async () => {
                  try {
                    const info = await BiometricAuth.checkBiometry();
                    setAvailable(info.isAvailable || info.deviceIsSecure);
                  } catch {
                    setAvailable(false);
                  }
                })();
              }}
              className="w-full flex items-center justify-center gap-3 bg-surface-container border border-outline-variant/15 py-3.5 rounded-xl hover:bg-surface-container-high transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-slate-800" />
              <span className="text-sm font-semibold text-slate-800">Retry</span>
            </button>
          </div>
        </section>
      </main>

      <footer className="w-full py-12 bg-slate-50 mt-auto">
        <div className="flex flex-col items-center gap-4 w-full px-8">
          <p className="font-label text-[11px] uppercase tracking-widest text-slate-400 text-center">
            {getCopyrightText()}
          </p>
        </div>
      </footer>
    </div>
  );
}
