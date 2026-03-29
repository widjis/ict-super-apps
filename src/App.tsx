import { useState } from 'react';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import HubScreen from './screens/HubScreen';
import MonitoringScreen from './screens/MonitoringScreen';
import ServiceScreen from './screens/ServiceScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import UserManagementScreen from './screens/UserManagementScreen';
import PrfMonitoringScreen from './screens/PrfMonitoringScreen';
import PrfDetailsScreen from './screens/PrfDetailsScreen';

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
      default: return 'Good morning, Operator';
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      {activeTab !== 'prf-details' && (
        <TopBar 
          title={getTopBarTitle()} 
          showBack={activeTab === 'profile' || activeTab === 'user-management' || activeTab === 'prf-monitoring'} 
          onBack={() => {
            if (activeTab === 'user-management' || activeTab === 'prf-monitoring') setActiveTab('hub');
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
        {activeTab === 'user-management' && <UserManagementScreen />}
        {activeTab === 'prf-monitoring' && <PrfMonitoringScreen onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'prf-details' && <PrfDetailsScreen onBack={() => setActiveTab('prf-monitoring')} />}
      </main>

      {activeTab !== 'prf-details' && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}
