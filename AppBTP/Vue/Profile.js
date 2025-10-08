import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, Image, TextInput, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Modal from 'react-native-modal';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import ScreenWrapper from '../Controleur/ScreenWrapper';
import photodeprofile from '../assets/photodeprofile.png';
import Storage from '../utils/Storage';
import { useNavigation } from '@react-navigation/native';

export default function Profile() {
  const navigation = useNavigation();

  // Etats Email
  const [email, setEmail] = useState('kijiramer@hotmail.fr');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Etats Mot de passe
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      navigation.replace('LoginPage');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Charger l'avatar persistant
  React.useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('avatarUri');
        if (saved) setAvatarUri(saved);
      } catch {}
    })();
  }, []);

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status === 'granted' || status === 'limited') {
      return true;
    }
    Alert.alert(
      'Permission requise',
      "Nous avons besoin de l'autorisation pour accéder à vos photos.",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings && Linking.openSettings() },
      ]
    );
    return false;
  };

  const handlePickAvatar = async () => {
    try {
      const ok = await requestMediaLibraryPermission();
      if (!ok) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) {
        return;
      }
      const uri = result.assets?.[0]?.uri;
      if (!uri) {
        Alert.alert('Erreur', "Impossible de récupérer l'image sélectionnée.");
        return;
      }
      setAvatarUri(uri);
      await AsyncStorage.setItem('avatarUri', uri);
      // TODO: Uploader vers le backend si nécessaire
    } catch (e) {
      Alert.alert('Erreur', 'La sélection de la photo a échoué.');
    }
  };

  const handleContactPress = async () => {
    const email = 'kijiramer@icloud.com';
    const subject = encodeURIComponent('Contact Application BTP');
    const body = encodeURIComponent('');
    const url = `mailto:${email}?subject=${subject}&body=${body}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        alert(`Impossible d’ouvrir l’application mail. Adresse: ${email}`);
      }
    } catch (e) {
      alert("Impossible d’ouvrir l’application mail.");
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      alert('Veuillez entrer une adresse e-mail valide.');
      return;
    }
    setLoadingEmail(true);
    try {
      // TODO: Appeler l'API backend pour modifier l'email
      // const token = await AsyncStorage.getItem('token');
      // await fetch('http://192.168.1.89:5001/user/email', { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: newEmail }) });
      setEmail(newEmail);
      setShowEmailModal(false);
      setNewEmail('');
    } catch (err) {
      alert("Erreur lors de la modification de l'adresse e-mail");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Veuillez remplir tous les champs.');
      return;
    }
    if (newPassword.length < 6) {
      alert('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }
    if (currentPassword === newPassword) {
      alert("Le nouveau mot de passe doit être différent de l'actuel.");
      return;
    }

    setLoadingPassword(true);
    try {
      // TODO: Appeler l'API backend pour changer le mot de passe
      // const token = await AsyncStorage.getItem('token');
      // await fetch('http://192.168.1.89:5001/user/password', {
      //   method: 'PUT',
      //   headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ currentPassword, newPassword })
      // });

      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Mot de passe modifié.');
    } catch (err) {
      alert('Erreur lors du changement de mot de passe');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <ScreenWrapper>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={styles.container}>
          <View style={styles.profile}>
      <TouchableOpacity onPress={handlePickAvatar}>
              <View style={styles.profileAvatarWrapper}>
        <Image source={avatarUri ? { uri: avatarUri } : photodeprofile} style={styles.profileAvatar} />
        <TouchableOpacity onPress={handlePickAvatar}>
                  <View style={styles.profileAction}>
                    <FeatherIcon color="#fff" name="camera" size={15} />
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            <View>
              <Text style={styles.profileName}>Mehdi Akounad</Text>
              <Text style={styles.profileEmail}>{email}</Text>
              <Text style={styles.profileAddress}>1 rue du moutier, 93400 Saint-Ouen-Sur-Seine</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferences</Text>

              <TouchableOpacity onPress={() => setShowEmailModal(true)} style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: '#007afe' }]}>
                  <FeatherIcon color="#fff" name="mail" size={20} />
                </View>
                <Text style={styles.rowLabel}>Modifier mon adresse E-mail</Text>
                <View style={styles.rowSpacer} />
                <FeatherIcon color="#C6C6C6" name="chevron-right" size={20} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowPasswordModal(true)} style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: '#32c759' }]}>
                  <FeatherIcon color="#fff" name="key" size={20} />
                </View>
                <Text style={styles.rowLabel}>Changer mon mot de passe</Text>
                <View style={styles.rowSpacer} />
                <FeatherIcon color="#C6C6C6" name="chevron-right" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resources</Text>

              <TouchableOpacity onPress={handleContactPress} style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: '#007afe' }]}>
                  <FeatherIcon color="#fff" name="mail" size={20} />
                </View>
                <Text style={styles.rowLabel}>Nous contacter</Text>
                <View style={styles.rowSpacer} />
                <FeatherIcon color="#C6C6C6" name="chevron-right" size={20} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: '#fe9400' }]}>
                  <FeatherIcon color="#fff" name="shield" size={20} />
                </View>
                <Text style={styles.rowLabel}>Politique de confidentialité</Text>
                <View style={styles.rowSpacer} />
                <FeatherIcon color="#C6C6C6" name="chevron-right" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.logout}>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.logoutText}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Modal modification email */}
        <Modal isVisible={showEmailModal} onBackdropPress={() => setShowEmailModal(false)}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Modifier mon adresse e-mail</Text>
            <Text style={styles.inputLabel}>Nouvelle adresse e-mail</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16 }}
              placeholder="Nouvelle adresse e-mail"
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity
              style={{ backgroundColor: '#007afe', padding: 12, borderRadius: 8, alignItems: 'center' }}
              onPress={handleEmailChange}
              disabled={loadingEmail}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{loadingEmail ? 'Enregistrement...' : 'Valider'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setShowEmailModal(false)}>
              <Text style={{ color: '#007afe' }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Modal changement mot de passe */}
        <Modal isVisible={showPasswordModal} onBackdropPress={() => setShowPasswordModal(false)}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Changer mon mot de passe</Text>
            <Text style={styles.inputLabel}>Mot de passe actuel (ancien mot de passe)</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}
              placeholder="Mot de passe actuel"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}
              placeholder="Nouveau mot de passe"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <Text style={styles.inputLabel}>Confirmer le nouveau mot de passe</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16 }}
              placeholder="Confirmer le nouveau mot de passe"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={{ backgroundColor: '#32c759', padding: 12, borderRadius: 8, alignItems: 'center' }}
              onPress={handlePasswordChange}
              disabled={loadingPassword}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{loadingPassword ? 'Enregistrement...' : 'Valider'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setShowPasswordModal(false)}>
              <Text style={{ color: '#007afe' }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  /** Profile */
  profile: {
    padding: 24,
    backgroundColor: '#fff',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarWrapper: {
    position: 'relative',
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 9999,
  },
  profileAction: {
    position: 'absolute',
    right: -4,
    bottom: -10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 9999,
    backgroundColor: '#007bff',
  },
  profileName: {
    marginTop: 20,
    fontSize: 19,
    fontWeight: '600',
    color: '#414d63',
    textAlign: 'center',
  },
  profileAddress: {
    marginTop: 5,
    fontSize: 16,
    color: '#989898',
    textAlign: 'center',
  },
  profileEmail: {
    marginTop: 5,
    fontSize: 16,
    color: '#414d63',
    textAlign: 'center',
  },
  /** Section */
  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    paddingVertical: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#9e9e9e',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  /** Row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 50,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 17,
    fontWeight: '400',
    color: '#0c0c0c',
  },
  rowSpacer: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  inputLabel: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
  },
  scrollViewContent: {
    paddingBottom: 30, // Pour laisser de la place pour le bouton de déconnexion
    flexGrow: 1,
    justifyContent: 'space-between', // Ajouté pour distribuer l'espace entre les sections
  },
  logout: {
    marginTop: 'auto',
    marginBottom: 20,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#d9534f',
  },
});
