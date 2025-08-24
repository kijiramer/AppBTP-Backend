import { Platform } from 'react-native';

// Configuration des URLs pour différentes plateformes
const getBaseURL = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5001';
  }
  // Pour mobile (iOS/Android)
  return 'http://192.168.1.89:5001';
};

export const API_BASE_URL = getBaseURL();