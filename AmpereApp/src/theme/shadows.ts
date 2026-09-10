import { Platform } from 'react-native';

// Consistent elevation presets (visual polish only). Each spreads onto an
// existing style object; iOS uses shadow* props, Android uses elevation.
export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: {},
  }),
  raised: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.32,
      shadowRadius: 18,
    },
    android: { elevation: 8 },
    default: {},
  }),
  buttonGlow: Platform.select({
    ios: {
      shadowColor: '#3ecf5b',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const;
