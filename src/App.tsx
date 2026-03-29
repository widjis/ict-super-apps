import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import HubScreen from './screens/HubScreen';
import MonitoringScreen from './screens/MonitoringScreen';
import ServiceScreen from './screens/ServiceScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import UserManagementScreen from './screens/UserManagementScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import PrfMonitoringScreen from './screens/PrfMonitoringScreen';
import PrfDetailsScreen from './screens/PrfDetailsScreen';
import WifiNetworkScreen from './screens/WifiNetworkScreen';
import RegisterDeviceScreen from './screens/RegisterDeviceScreen';
import CheckDeviceStatusScreen from './screens/CheckDeviceStatusScreen';
import LeaseExpirationReportScreen from './screens/LeaseExpirationReportScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  const getTopBarTitle = () => {
    switch (activeTab) {
      case 'home': return 'Good morning, Operator';
      case 'hub': return 'Feature Hub';
      case 'monitoring': return 'Good morning, Operator';
      case 'service': return 'Good morning, Operator';
      case 'profile': return 'Profile';
      case 'user-management': return 'User Management';
      case 'prf-monitoring': return 'PRF Monitoring';
      case 'prf-details': return 'PRF Details';
      case 'wifi-network': return 'WiFi & Network';
      case 'register-device': return 'Register Device';
      case 'check-device-status': return 'Check Device Status';
      case 'lease-expiration': return 'Lease Expiration Report';
      default: return 'Good morning, Operator';
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
        />
      )}
      
      <main>
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'hub' && <HubScreen onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'monitoring' && <MonitoringScreen />}
        {activeTab === 'service' && <ServiceScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
        {activeTab === 'user-management' && <UserManagementScreen onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'user-profile' && <UserProfileScreen onBack={() => setActiveTab('user-management')} />}
        {activeTab === 'prf-monitoring' && <PrfMonitoringScreen onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'prf-details' && <PrfDetailsScreen onBack={() => setActiveTab('prf-monitoring')} />}
        {activeTab === 'wifi-network' && <WifiNetworkScreen onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'register-device' && (
          <>
            <header className="fixed top-0 w-full z-50 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm dark:shadow-none flex justify-between items-center px-6 h-16">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveTab('wifi-network')} className="text-slate-500 hover:bg-slate-200/50 p-2 rounded-full transition-colors active:scale-95 duration-200">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-extrabold tracking-tighter text-slate-900 dark:text-slate-50">Slate Nexus</h1>
              </div>
            </header>
            <div className="pt-16">
              <RegisterDeviceScreen onBack={() => setActiveTab('wifi-network')} />
            </div>
          </>
        )}
        {activeTab === 'check-device-status' && (
          <>
            <header className="fixed top-0 w-full z-50 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm dark:shadow-none flex justify-between items-center px-6 h-16">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveTab('wifi-network')} className="text-slate-500 hover:bg-slate-200/50 p-2 rounded-full transition-colors active:scale-95 duration-200">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-extrabold tracking-tighter text-slate-900 dark:text-slate-50">Slate Nexus</h1>
              </div>
            </header>
            <div className="pt-16">
              <CheckDeviceStatusScreen onBack={() => setActiveTab('wifi-network')} />
            </div>
          </>
        )}
        {activeTab === 'lease-expiration' && (
          <>
            <header className="fixed top-0 w-full z-50 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm dark:shadow-none flex justify-between items-center px-6 h-16">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveTab('wifi-network')} className="text-slate-500 hover:bg-slate-200/50 p-2 rounded-full transition-colors active:scale-95 duration-200">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-extrabold tracking-tighter text-slate-900 dark:text-slate-50">Slate Nexus</h1>
              </div>
            </header>
            <div className="pt-16">
              <LeaseExpirationReportScreen onBack={() => setActiveTab('wifi-network')} />
            </div>
          </>
        )}
      </main>

      {activeTab !== 'prf-details' && activeTab !== 'register-device' && activeTab !== 'check-device-status' && activeTab !== 'lease-expiration' && activeTab !== 'user-profile' && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}
