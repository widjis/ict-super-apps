import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import HubScreen from './screens/HubScreen';
import MonitoringScreen from './screens/MonitoringScreen';
import ServiceScreen from './screens/ServiceScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import BiometricUnlockScreen from './screens/BiometricUnlockScreen';
import UserManagementScreen from './screens/UserManagementScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import PrfMonitoringScreen from './screens/PrfMonitoringScreen';
import PrfDetailsScreen from './screens/PrfDetailsScreen';
import WifiNetworkScreen from './screens/WifiNetworkScreen';
import RegisterDeviceScreen from './screens/RegisterDeviceScreen';
import CheckDeviceStatusScreen from './screens/CheckDeviceStatusScreen';
import LeaseExpirationReportScreen from './screens/LeaseExpirationReportScreen';
import { clearSavedSession, getAuthToken, getAuthUserRaw, getBiometricEnabled, setAuthToken } from './auth/storage';
import { getApiBaseUrl } from './lib/api';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [biometricUnlocked, setBiometricUnlocked] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedUserSam, setSelectedUserSam] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const subPromise = CapacitorApp.addListener('backButton', () => {
      setActiveTab((current) => {
        if (current === 'prf-details') return 'prf-monitoring';
        if (current === 'user-profile') {
          setSelectedUserSam(null);
          return 'user-management';
        }
        if (current === 'register-device' || current === 'check-device-status' || current === 'lease-expiration') return 'wifi-network';
        if (current === 'wifi-network' || current === 'user-management' || current === 'prf-monitoring') return 'hub';
        if (current === 'profile' || current === 'hub' || current === 'monitoring' || current === 'service') return 'home';

        CapacitorApp.exitApp();
        return current;
      });
    });

    return () => {
      void subPromise.then((sub) => sub.remove());
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      let token = await getAuthToken();
      if (!active) return;

      if (token) {
        const apiBaseUrl = getApiBaseUrl();
        if (apiBaseUrl) {
          try {
            const resp = await fetch(`${apiBaseUrl}/api/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!resp.ok) {
              await setAuthToken(null);
              token = null;
            }
          } catch {}
        }
      }

      const enabled = getBiometricEnabled();
      const hasToken = Boolean(token);
      const needs = enabled && Capacitor.isNativePlatform() && hasToken;

      setIsAuthenticated(hasToken);
      setBiometricUnlocked(!needs);
      setBooting(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const logout = () => {
    void (async () => {
      await clearSavedSession();
      setBiometricUnlocked(true);
      setIsAuthenticated(false);
      setActiveTab('home');
      setSelectedUserSam(null);
    })();
  };

  if (booting) {
    return <div className="min-h-screen bg-surface font-body text-on-surface" />;
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={() => {
          setBiometricUnlocked(true);
          setIsAuthenticated(true);
        }}
        onLogout={logout}
      />
    );
  }

  if (!biometricUnlocked) {
    return (
      <BiometricUnlockScreen
        onUnlocked={() => {
          setBiometricUnlocked(true);
        }}
        onLogout={logout}
      />
    );
  }

  const getFirstName = () => {
    const raw = getAuthUserRaw();
    if (!raw) return null;

    try {
      const user = JSON.parse(raw) as any;
      const displayName = typeof user?.displayName === 'string' ? user.displayName : null;
      const email = typeof user?.email === 'string' ? user.email : null;
      const username = typeof user?.username === 'string' ? user.username : null;

      const fromDisplayName = displayName?.trim().split(/\s+/)[0] ?? null;
      if (fromDisplayName) return fromDisplayName;

      const base = (email ? email.split('@')[0] : username) ?? null;
      const fromUsername = base?.trim().split(/[._-]+/)[0] ?? null;
      if (fromUsername) return fromUsername;

      return null;
    } catch {
      return null;
    }
  };

  const getTimeGreeting = () => {
    const h = now.getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 17) return 'Good afternoon';
    if (h >= 17 && h < 21) return 'Good evening';
    return 'Good night';
  };

  const getGreetingTitle = () => {
    const firstName = getFirstName();
    const greeting = getTimeGreeting();
    return firstName ? `${greeting}, ${firstName}` : greeting;
  };

  const getTopBarTitle = () => {
    switch (activeTab) {
      case 'home': return getGreetingTitle();
      case 'hub': return 'Feature Hub';
      case 'monitoring': return getGreetingTitle();
      case 'service': return getGreetingTitle();
      case 'profile': return 'Profile';
      case 'user-management': return 'User Management';
      case 'prf-monitoring': return 'PRF Monitoring';
      case 'prf-details': return 'PRF Details';
      case 'wifi-network': return 'WiFi & Network';
      case 'register-device': return 'Register Device';
      case 'check-device-status': return 'Check Device Status';
      case 'lease-expiration': return 'Lease Expiration Report';
      default: return getGreetingTitle();
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      {activeTab !== 'prf-details' && activeTab !== 'register-device' && activeTab !== 'check-device-status' && activeTab !== 'lease-expiration' && activeTab !== 'user-profile' && (
        <TopBar 
          title={getTopBarTitle()} 
          showBack={activeTab === 'profile' || activeTab === 'user-management' || activeTab === 'prf-monitoring' || activeTab === 'wifi-network'} 
          onBack={() => {
            if (activeTab === 'user-management' || activeTab === 'prf-monitoring' || activeTab === 'wifi-network') setActiveTab('hub');
            else setActiveTab('home');
          }}
          menuItems={
            activeTab === 'prf-monitoring'
              ? [
                  { label: 'Hub', onClick: () => setActiveTab('hub') },
                  { label: 'Logout', onClick: logout },
                ]
              : activeTab === 'user-management' || activeTab === 'wifi-network'
                ? [{ label: 'Logout', onClick: logout }]
                : []
          }
        />
      )}
      
      <main>
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'hub' && <HubScreen onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'monitoring' && <MonitoringScreen />}
        {activeTab === 'service' && <ServiceScreen />}
        {activeTab === 'profile' && <ProfileScreen onLogout={logout} />}
        {activeTab === 'user-management' && (
          <UserManagementScreen
            onOpenUser={(sam) => {
              setSelectedUserSam(sam);
              setActiveTab('user-profile');
            }}
          />
        )}
        {activeTab === 'user-profile' && selectedUserSam && (
          <UserProfileScreen
            samAccountName={selectedUserSam}
            onBack={() => setActiveTab('user-management')}
          />
        )}
        {activeTab === 'prf-monitoring' && <PrfMonitoringScreen onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'prf-details' && <PrfDetailsScreen onBack={() => setActiveTab('prf-monitoring')} />}
        {activeTab === 'wifi-network' && <WifiNetworkScreen onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'register-device' && (
          <>
            <header className="fixed top-0 w-full z-50 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm dark:shadow-none flex justify-between items-center px-6 h-safe-16">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveTab('wifi-network')} className="text-slate-500 hover:bg-slate-200/50 p-2 rounded-full transition-colors active:scale-95 duration-200">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-extrabold tracking-tighter text-slate-900 dark:text-slate-50">Slate Nexus</h1>
              </div>
            </header>
            <div className="pt-safe-16">
              <RegisterDeviceScreen onBack={() => setActiveTab('wifi-network')} />
            </div>
          </>
        )}
        {activeTab === 'check-device-status' && (
          <>
            <header className="fixed top-0 w-full z-50 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm dark:shadow-none flex justify-between items-center px-6 h-safe-16">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveTab('wifi-network')} className="text-slate-500 hover:bg-slate-200/50 p-2 rounded-full transition-colors active:scale-95 duration-200">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-extrabold tracking-tighter text-slate-900 dark:text-slate-50">Slate Nexus</h1>
              </div>
            </header>
            <div className="pt-safe-16">
              <CheckDeviceStatusScreen onBack={() => setActiveTab('wifi-network')} />
            </div>
          </>
        )}
        {activeTab === 'lease-expiration' && (
          <>
            <header className="fixed top-0 w-full z-50 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm dark:shadow-none flex justify-between items-center px-6 h-safe-16">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveTab('wifi-network')} className="text-slate-500 hover:bg-slate-200/50 p-2 rounded-full transition-colors active:scale-95 duration-200">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-extrabold tracking-tighter text-slate-900 dark:text-slate-50">Slate Nexus</h1>
              </div>
            </header>
            <div className="pt-safe-16">
              <LeaseExpirationReportScreen onBack={() => setActiveTab('wifi-network')} />
            </div>
          </>
        )}
      </main>

      {activeTab !== 'prf-details' && activeTab !== 'register-device' && activeTab !== 'check-device-status' && activeTab !== 'lease-expiration' && activeTab !== 'user-profile' && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}
