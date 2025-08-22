import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Permet d'écraser l'URL d'API depuis app.json -> expo.extra.API_BASE_URL
// ou depuis une variable d'environnement PROCESS (process.env.API_BASE_URL).
// Compatible avec différentes versions d'Expo (manifest vs expoConfig).
const getBaseURL = () => {
  // priority: expo extra -> process.env -> platform defaults
  const expoExtra = (Constants.expoConfig && Constants.expoConfig.extra) || (Constants.manifest && Constants.manifest.extra) || (Constants.manifest2 && Constants.manifest2.extra);
  const extraUrl = expoExtra && expoExtra.API_BASE_URL;
  if (extraUrl) return extraUrl;

  if (process.env && process.env.API_BASE_URL) return process.env.API_BASE_URL;

  if (Platform.OS === 'web') {
    return 'http://localhost:5001';
  }
  // Pour mobile (iOS/Android) en local
  return 'http://192.168.1.89:5001';
};

export const API_BASE_URL = getBaseURL();

// Debug: afficher l'URL résolue en dev pour aider le diagnostic sur device
if (typeof global !== 'undefined' && __DEV__) {
  // eslint-disable-next-line no-console
  console.log('[config] API_BASE_URL =', API_BASE_URL);
}