import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.jherforth.plungetracker',
  appName: 'Plunge Tracker',
  webDir: 'dist',
  android: {
    // Everything is bundled in the APK; never allow http content from elsewhere.
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
