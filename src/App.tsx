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
      default: return 'Good morning, Operator';
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <TopBar 
        title={getTopBarTitle()} 
        showBack={activeTab === 'profile' || activeTab === 'user-management'} 
        onBack={() => {
          if (activeTab === 'user-management') setActiveTab('hub');
          else setActiveTab('home');
        }}
      />
      
      <main>
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'hub' && <HubScreen onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'monitoring' && <MonitoringScreen />}
        {activeTab === 'service' && <ServiceScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
        {activeTab === 'user-management' && <UserManagementScreen />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
