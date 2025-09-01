import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configuration des URLs pour différentes plateformes
const TUNNEL_URL = 'https://chubby-cloths-marry.loca.lt';
const LOCAL_HOST_IP = '192.168.1.89';
const LOCAL_PORT = '8081'; // Port du backend

const getBaseURL = () => {
  if (Platform.OS === 'web') {
    return `http://${LOCAL_HOST_IP}:${LOCAL_PORT}`;
  }

  if (Platform.OS === 'ios') {
    if (!Constants.isDevice) {
      return `http://${LOCAL_HOST_IP}:${LOCAL_PORT}`;
    }
    // Sur appareil physique, utiliser aussi l'IP locale si le téléphone est sur le
    // même réseau Wi‑Fi. Gardez le tunnel comme fallback si besoin.
    return `http://${LOCAL_HOST_IP}:${LOCAL_PORT}`;
  }

  if (Platform.OS === 'android') {
  // Pour l'émulateur Android on utilise l'adresse IP locale du poste de dev
  // afin que l'application (AVD ou device) contacte le backend localement.
  return `http://${LOCAL_HOST_IP}:${LOCAL_PORT}`;
  }

  return TUNNEL_URL;
};

export const API_BASE_URL = getBaseURL();