// TEST-ONLY actual App route; synthetic session, no production credentials.
// Transport must remain unused. No production auth bypass is introduced.
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../../src/App';
import { sessionClient } from '../../src/auth/session';
import '../../src/index.css';

document.documentElement.dataset.fixtureCalls = '0';
sessionClient.restore = async () => true;
sessionClient.request = async () => {
  document.documentElement.dataset.fixtureCalls = String(Number(document.documentElement.dataset.fixtureCalls) + 1);
  throw new Error('Unexpected transport in local registration preview');
};
if (!location.hash) location.hash = 'register-device';
createRoot(document.getElementById('root')!).render(<>
  <p className="bg-secondary-container text-on-secondary-container text-center text-xs py-1">LOCAL FIXTURE · actual App route · no registration</p>
  <App />
</>);
