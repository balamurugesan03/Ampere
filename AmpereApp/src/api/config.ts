import { Platform } from 'react-native';

// Dev-only default resolution: web talks to the same machine over localhost,
// Android emulators route host-loopback through 10.0.2.2. A physical device
// needs the dev machine's LAN IP instead (e.g. http://192.168.1.4:4000) —
// override with EXPO_PUBLIC_API_URL in that case.
function resolveDefaultBaseUrl() {
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000';
  return 'http://localhost:4000';
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || resolveDefaultBaseUrl();
