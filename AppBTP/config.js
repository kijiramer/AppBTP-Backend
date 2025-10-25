import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configuration des URLs pour différentes plateformes
// Backend Vercel (production)
const VERCEL_BACKEND_URL = 'https://appbtp-backend.vercel.app';

const getBaseURL = () => {
  // Utiliser le backend Vercel pour tous les environnements
  return VERCEL_BACKEND_URL;
};

export const API_BASE_URL = getBaseURL();
