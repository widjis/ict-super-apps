import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.ictsuperapps',
  appName: 'ICT Super Apps',
  webDir: 'dist',
  // Native bridge debug logging must never retain OCR text or lookup data.
  loggingBehavior: 'none'
};

export default config;
