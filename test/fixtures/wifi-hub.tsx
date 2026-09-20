// Local visual fixture: production components, no login/session/API mocks or secrets.
// Not imported by the production entry point or included in the APK.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import WifiNetworkScreen from '../../src/screens/WifiNetworkScreen';
import CheckDeviceStatusScreen from '../../src/screens/CheckDeviceStatusScreen';
import TopBar from '../../src/components/TopBar';
import BottomNav from '../../src/components/BottomNav';
import '../../src/index.css';
function Fixture() {
  const [screen, setScreen] = useState('wifi-network');
  return <div className="min-h-screen bg-surface font-body text-on-surface">
    {screen !== 'check-device-status' && <TopBar title="WiFi & Network" showBack onBack={() => setScreen('wifi-network')} menuItems={[{ label: 'Fixture only — no account', onClick: () => {} }]} />}
    <main>{screen === 'check-device-status' ? <CheckDeviceStatusScreen onBack={() => setScreen('wifi-network')} /> : <WifiNetworkScreen onNavigate={setScreen} />}</main>
    {screen !== 'check-device-status' && <BottomNav activeTab="wifi-network" setActiveTab={setScreen} />}
  </div>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
