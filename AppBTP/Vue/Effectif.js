// Effectif.js
<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
=======
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import moment from 'moment';
import axios from 'axios';
import Storage from '../utils/Storage';
import Header from './Header';
import ScreenWrapper from '../Controleur/ScreenWrapper';
import { displayCalendarScreen } from './Components/Calendar';
import { useUserRole } from '../Controleur/UserRoleContext';
import { API_BASE_URL } from '../config';

<<<<<<< HEAD
export default function Effectif({ route, navigation }) {
  const { city, building, task } = route.params || {};
  const { canAddItem } = useUserRole();
=======
// Fonction helper pour formater une date en YYYY-MM-DD (heure locale)
const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function Effectif({ route, navigation }) {
  const { city, building, task } = route.params || {};
  const { canAddItem, canDelete } = useUserRole();
>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b
  const [effectifs, setEffectifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datesWithEffectifs, setDatesWithEffectifs] = useState([]);
  const [form, setForm] = useState({
    floor: '',
    apartment: '',
    company: '',
    nombrePersonnes: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Suggestions pour autocomplete
  const [floorSuggestions, setFloorSuggestions] = useState([]);
  const [apartmentSuggestions, setApartmentSuggestions] = useState([]);
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [showFloorSuggestions, setShowFloorSuggestions] = useState(false);
  const [showApartmentSuggestions, setShowApartmentSuggestions] = useState(false);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Désactiver le scroll quand le formulaire s'ouvre
  useEffect(() => {
    if (showForm) {
      setScrollEnabled(false);
    } else {
      setScrollEnabled(true);
    }
  }, [showForm]);

  // Charger l'historique des valeurs saisies
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const floorHistory = await AsyncStorage.getItem('effectif_floor_history');
        const apartmentHistory = await AsyncStorage.getItem('effectif_apartment_history');
        const companyHistory = await AsyncStorage.getItem('effectif_company_history');

        if (floorHistory) {
          const floors = JSON.parse(floorHistory);
          setFloorSuggestions(floors.sort((a, b) => {
            const numA = parseInt(a) || 0;
            const numB = parseInt(b) || 0;
            return numA - numB;
          }));
        }
        if (apartmentHistory) {
          const apartments = JSON.parse(apartmentHistory);
          setApartmentSuggestions(apartments.sort((a, b) => {
            const numA = parseInt(a) || 0;
            const numB = parseInt(b) || 0;
            return numA - numB;
          }));
        }
        if (companyHistory) {
          const companies = JSON.parse(companyHistory);
          setCompanySuggestions(companies.sort());
        }

        // Charger aussi le nom de l'entreprise sauvegardé
        const savedCompany = await Storage.getItem('lastEffectifCompany');
        if (savedCompany) {
          setForm(prev => ({ ...prev, company: savedCompany }));
        }
      } catch (error) {
        console.error('Error loading history:', error);
      }
    };
    loadHistory();
    loadEffectifs();
    loadEffectifDates();
  }, [selectedDate]);

<<<<<<< HEAD
=======
  // Refresh automatique quand la page devient active
  useFocusEffect(
    useCallback(() => {
      loadEffectifs();
      loadEffectifDates();
    }, [selectedDate])
  );

>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b
  // Charger les effectifs depuis l'API pour la date sélectionnée
  const loadEffectifs = async () => {
    try {
      setLoading(true);
      const token = await Storage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté');
        return;
      }

<<<<<<< HEAD
      const dateStr = moment(selectedDate).format('YYYY-MM-DD');
=======
      const dateStr = formatLocalDate(selectedDate);
      console.log('🔍 Loading effectifs for date:', dateStr);
>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b
      const response = await axios.get(`${API_BASE_URL}/effectifs?city=${city}&building=${building}&task=${task}&selectedDate=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

<<<<<<< HEAD
=======
      console.log('✅ Effectifs response:', response.data.effectifs?.length || 0, 'items');
>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b
      if (response.data.success) {
        setEffectifs(response.data.effectifs || []);
      }
    } catch (error) {
<<<<<<< HEAD
      console.error('Error loading effectifs:', error);
=======
      console.error('❌ Error loading effectifs:', error);
>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b
      Alert.alert('Erreur', 'Impossible de charger les effectifs');
    } finally {
      setLoading(false);
    }
  };

  // Charger les dates où il y a des effectifs
  const loadEffectifDates = async () => {
    try {
      const token = await Storage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/effectifs?city=${city}&building=${building}&task=${task}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const dates = response.data.effectifs.map(effectif =>
          moment(effectif.selectedDate).format('YYYY-MM-DD')
        );
        setDatesWithEffectifs(dates);
      }
    } catch (error) {
      console.error('Error loading effectif dates:', error);
    }
  };

  const handleSubmit = async () => {
    if (!form.nombrePersonnes || form.nombrePersonnes.trim() === '' || isNaN(Number(form.nombrePersonnes)) || Number(form.nombrePersonnes) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un nombre de personnes valide');
      return;
    }
    if (!form.apartment || form.apartment.trim() === '' || !form.company.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    try {
      setLoading(true);
      const token = await Storage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté');
        return;
      }

      // Sauvegarder le nom de l'entreprise pour la prochaine fois
      await Storage.setItem('lastEffectifCompany', form.company);

      const effectifData = {
        city,
        building,
        task,
        floor: form.floor,
        apartment: form.apartment,
        company: form.company,
        nombrePersonnes: Number(form.nombrePersonnes),
<<<<<<< HEAD
        selectedDate: moment(selectedDate).format('YYYY-MM-DD'),
=======
        selectedDate: formatLocalDate(selectedDate),
>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b
      };

      const response = await axios.post(`${API_BASE_URL}/effectif`, effectifData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.data.success) {
        // Sauvegarder dans l'historique
        const updateHistory = async (key, value, suggestions, setSuggestions) => {
          const newSuggestions = [...suggestions];
          if (!newSuggestions.includes(value)) {
            newSuggestions.push(value);
            await AsyncStorage.setItem(key, JSON.stringify(newSuggestions));

            // Trier les suggestions
            if (key.includes('floor') || key.includes('apartment')) {
              setSuggestions(newSuggestions.sort((a, b) => {
                const numA = parseInt(a) || 0;
                const numB = parseInt(b) || 0;
                return numA - numB;
              }));
            } else {
              setSuggestions(newSuggestions.sort());
            }
          }
        };

        if (form.floor.trim()) {
          await updateHistory('effectif_floor_history', form.floor, floorSuggestions, setFloorSuggestions);
        }
        if (form.apartment.trim()) {
          await updateHistory('effectif_apartment_history', form.apartment, apartmentSuggestions, setApartmentSuggestions);
        }
        if (form.company.trim()) {
          await updateHistory('effectif_company_history', form.company, companySuggestions, setCompanySuggestions);
        }

        // Pas d'alerte de succès
        setShowForm(false);
        // Conserver le nom de l'entreprise
        const savedCompany = form.company;
        setForm({
          floor: '',
          apartment: '',
          company: savedCompany,
          nombrePersonnes: '',
        });
        loadEffectifs();
        loadEffectifDates();
      } else {
        Alert.alert('Erreur', response.data.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      console.error('Error submitting effectif:', err);
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'effectif');
    } finally {
      setLoading(false);
    }
  };

  const deleteEffectif = async (effectifId) => {
    Alert.alert(
      'Supprimer l\'effectif',
      'Êtes-vous sûr de vouloir supprimer cet effectif ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await Storage.getItem('token');
              if (!token) {
                Alert.alert('Erreur', 'Vous devez être connecté');
                return;
              }

              await axios.delete(`${API_BASE_URL}/effectifs/${effectifId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });

              Alert.alert('Succès', 'Effectif supprimé');
              loadEffectifs();
            } catch (error) {
              console.error('Error deleting effectif:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'effectif');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.safeArea}>
        <Header
          navigation={navigation}
          isHomePage={false}
          city={city}
          building={building}
          task={task}
        />
        <ScrollView style={styles.content} scrollEnabled={scrollEnabled}>
          {/* Calendrier */}
          <View style={styles.calendarContainer}>
            {displayCalendarScreen(selectedDate, setSelectedDate, datesWithEffectifs)}
          </View>

          {/* Liste des effectifs existants */}
          {effectifs.length > 0 && (
            <View style={styles.effectifsList}>
              {effectifs.map((effectif) => (
                <View key={effectif._id} style={styles.effectifCard}>
                  {/* Badge Entreprise */}
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{effectif.company}</Text>
                  </View>

                  <View style={styles.effectifContent}>
                    <View style={styles.effectifRow}>
                      <Text style={styles.effectifField}>Appart : {effectif.apartment}</Text>
                      <Text style={styles.effectifField}>Étage : {effectif.floor}</Text>
                      <Text style={styles.effectifField}>Nombre de personnes : {effectif.nombrePersonnes}</Text>
                    </View>
                  </View>

<<<<<<< HEAD
                  {/* Bouton supprimer */}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteEffectif(effectif._id)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
=======
                  {/* Bouton supprimer - seulement pour admin */}
                  {canDelete() && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteEffectif(effectif._id)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  )}
>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b
                </View>
              ))}
            </View>
          )}

          {/* Bouton "＋" cercle pour ouvrir le formulaire */}
          {!showForm && canAddItem('Effectif') && (
            <TouchableOpacity
              style={styles.toggleCircle}
              onPress={() => setShowForm(true)}
            >
              <Text style={styles.toggleCircleText}>＋</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Modal formulaire */}
        <Modal
          visible={showForm}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowForm(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            {/* Fond sombre cliquable pour fermer */}
            <TouchableOpacity
              activeOpacity={1}
              style={styles.overlayBackdrop}
              onPress={() => setShowForm(false)}
            />

            <View style={styles.formCardOverlay}>
              <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 200 }}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={true}
              >
                <TouchableOpacity style={styles.closeFormBtn} onPress={() => setShowForm(false)}>
                  <Text style={styles.closeFormText}>✕</Text>
                </TouchableOpacity>

                <Text style={styles.formTitle}>Nouvel Effectif</Text>

                {/* Ligne Étage/Appart */}
                <View style={styles.formRow}>
                  <View style={{ flex: 1, position: 'relative' }}>
                    <Text style={styles.label}>Étage</Text>
                    <TextInput
                      value={form.floor}
                      onChangeText={(v) => updateForm('floor', v)}
                      placeholder="Ex: 1"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      style={styles.textInput}
                      onFocus={() => setShowFloorSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowFloorSuggestions(false), 200)}
                    />
                    {showFloorSuggestions && floorSuggestions.length > 0 && (
                      <ScrollView
                        style={styles.suggestionsContainer}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="always"
                        showsVerticalScrollIndicator={true}
                      >
                        {floorSuggestions.map((suggestion, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.suggestionItem}
                            activeOpacity={0.7}
                            onPress={() => {
                              updateForm('floor', suggestion);
                              setShowFloorSuggestions(false);
                            }}
                          >
                            <Text style={styles.suggestionText}>{suggestion}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>

                  <View style={{ flex: 1, marginLeft: 12, position: 'relative' }}>
                    <Text style={styles.label}>Appart</Text>
                    <TextInput
                      value={form.apartment}
                      onChangeText={(v) => updateForm('apartment', v)}
                      placeholder="Ex: 101"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      style={styles.textInput}
                      onFocus={() => setShowApartmentSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowApartmentSuggestions(false), 200)}
                    />
                    {showApartmentSuggestions && apartmentSuggestions.length > 0 && (
                      <ScrollView
                        style={styles.suggestionsContainer}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="always"
                        showsVerticalScrollIndicator={true}
                      >
                        {apartmentSuggestions.map((suggestion, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.suggestionItem}
                            activeOpacity={0.7}
                            onPress={() => {
                              updateForm('apartment', suggestion);
                              setShowApartmentSuggestions(false);
                            }}
                          >
                            <Text style={styles.suggestionText}>{suggestion}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                </View>

                {/* Champ Entreprise */}
                <View style={{ marginTop: 12, position: 'relative' }}>
                  <Text style={styles.label}>Entreprise</Text>
                  <TextInput
                    value={form.company}
                    onChangeText={(v) => updateForm('company', v)}
                    placeholder="Ex: HOPRA"
                    placeholderTextColor="#999"
                    style={[styles.textInput, { width: '100%' }]}
                    onFocus={() => setShowCompanySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 200)}
                  />
                  {showCompanySuggestions && companySuggestions.length > 0 && (
                    <ScrollView
                      style={styles.suggestionsContainer}
                      nestedScrollEnabled={true}
                      keyboardShouldPersistTaps="always"
                      showsVerticalScrollIndicator={true}
                    >
                      {companySuggestions.map((suggestion, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.suggestionItem}
                          activeOpacity={0.7}
                          onPress={() => {
                            updateForm('company', suggestion);
                            setShowCompanySuggestions(false);
                          }}
                        >
                          <Text style={styles.suggestionText}>{suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Champ nombre de personnes */}
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.label}>Nombre de personnes</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={form.nombrePersonnes}
                    onChangeText={v => updateForm('nombrePersonnes', v)}
                    placeholder="0"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Bouton enregistrer */}
                <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
                  <Text style={styles.addText}>Enregistrer</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  calendarContainer: {
    marginVertical: 16,
  },
  toggleCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f26463',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  toggleCircleText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeFormBtn: { alignSelf: 'flex-end', marginBottom: 8 },
  closeFormText: { fontSize: 18, color: '#f26463' },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: { fontSize: 14, fontWeight: '500', color: '#333' },
  inputBtn: {
    flex: 1,
    minWidth: 60,
    marginHorizontal: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#f26463',
    width: 120,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 12,
  },
  addText: { color: '#fff', fontSize: 16 },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginHorizontal: 4,
    marginTop: 8,
  },
  okButton: {
    alignSelf: 'center',
    backgroundColor: '#f26463',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 16,
    marginBottom: 12,
  },
  okButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  // Styles pour la liste des effectifs
  effectifsList: {
    marginBottom: 20,
  },
  effectifCard: {
    borderWidth: 1,
    borderColor: '#f26463',
    borderRadius: 30,
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    position: 'relative',
    overflow: 'visible',
    marginTop: 20,
    marginBottom: 16,
  },
  badge: {
    position: 'absolute',
    top: -10,
    left: 16,
    backgroundColor: '#f26463',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 150,
    zIndex: 100,
    elevation: 10,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  effectifContent: {
    marginTop: 10,
    paddingHorizontal: 8,
  },
  effectifRow: {
    flexDirection: 'column',
    gap: 8,
  },
  effectifField: {
    fontSize: 14,
    color: '#111',
    paddingVertical: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  formCardOverlay: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '65%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#f26463'
  },
  // Suggestions dropdown
  suggestionsContainer: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 180,
    zIndex: 10000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    backgroundColor: '#fff',
  },
  suggestionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '400',
  },
});
