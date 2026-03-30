import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mijedu.app',
  appName: 'Mijedu',
  webDir: 'dist',
  server: {
    url: 'https://116cd538-678f-4e8c-9096-2c098c849faa.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
