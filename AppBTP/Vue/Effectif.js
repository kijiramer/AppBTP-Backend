// Effectif.js
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import moment from 'moment';
import Storage from '../utils/Storage';
import Header from './Header';
import ScreenWrapper from '../Controleur/ScreenWrapper';
import { displayCalendarScreen } from './Components/Calendar';
import { API_BASE_URL } from '../config';
import useScrollToForm from '../component/ScrollToForm';

moment.locale('fr');

export default function Effectif({ route, navigation }) {
  const { city, building, task } = route.params;
  const scrollViewRef = useRef(null);
  const handleFormLayout = useScrollToForm(scrollViewRef);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [effectifs, setEffectifs] = useState([]);
  const [form, setForm] = useState({
    floor: '1er',
    apartment: '1',
    company: 'Entreprise A',
    nombrePersonnes: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [showFloorPicker, setShowFloorPicker] = useState(false);
  const [showAptPicker, setShowAptPicker] = useState(false);
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const companies = ['Entreprise A', 'Entreprise B', 'Entreprise C'];

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Fonction pour récupérer les effectifs
  const fetchEffectifs = async () => {
    try {
      const token = await Storage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/effectifs?city=${city}&building=${building}&task=${task}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setEffectifs(data.effectifs || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des effectifs:', err);
    }
  };

  // Charger les effectifs au montage et quand la date change
  useEffect(() => {
    fetchEffectifs();
  }, [selectedDate]);

  const handleSubmit = async () => {
    if (!form.nombrePersonnes || isNaN(form.nombrePersonnes)) {
      Alert.alert('Erreur', 'Veuillez entrer un nombre de personnes valide');
      return;
    }
    try {
  const token = await Storage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté');
        return;
      }
      const effectifData = {
        city,
        building,
        task,
        floor: form.floor,
        apartment: form.apartment,
        company: form.company,
        nombrePersonnes: Number(form.nombrePersonnes),
        selectedDate: selectedDate.toISOString(),
      };
  const response = await fetch(`${API_BASE_URL}/effectif`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(effectifData),
      });
      const resJson = await response.json();
      if (resJson.success) {
        Alert.alert('Succès', 'Effectif enregistré');
        setShowForm(false);
        setForm({
          floor: '1er',
          apartment: '1',
          company: 'Entreprise A',
          nombrePersonnes: '',
        });
        // Recharger les effectifs
        fetchEffectifs();
      } else {
        Alert.alert('Erreur', resJson.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'effectif');
    }
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
  <ScrollView ref={scrollViewRef} style={styles.content}>
          {/* Calendrier */}
          <View style={styles.calendarContainer}>
            {displayCalendarScreen(selectedDate, setSelectedDate, [])}
          </View>

          {/* Effectifs existants pour la date sélectionnée */}
          {effectifs.filter(e => moment(e.selectedDate).format('YYYY-MM-DD') === moment(selectedDate).format('YYYY-MM-DD')).length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>
                  📊 Effectifs ({effectifs.filter(e => moment(e.selectedDate).format('YYYY-MM-DD') === moment(selectedDate).format('YYYY-MM-DD')).length})
                </Text>
              </View>
              {effectifs
                .filter(e => moment(e.selectedDate).format('YYYY-MM-DD') === moment(selectedDate).format('YYYY-MM-DD'))
                .map((effectif, idx) => (
                  <View key={effectif._id || idx} style={styles.effectifCard}>
                    {/* Badge Entreprise */}
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {effectif.company}
                      </Text>
                    </View>

                    <View style={styles.effectifContent}>
                      <View style={styles.effectifRowHorizontal}>
                        <Text style={styles.effectifField}>
                          Étage : {effectif.floor}
                        </Text>
                        <Text style={styles.effectifField}>
                          Appart : {effectif.apartment}
                        </Text>
                      </View>
                      <Text style={styles.effectifField}>
                        Nombre de personnes : {effectif.nombrePersonnes}
                      </Text>
                    </View>
                  </View>
                ))}
            </>
          )}

          {/* Bouton "＋" cercle pour ouvrir le formulaire */}
          {!showForm && (
            <TouchableOpacity
              style={styles.toggleCircle}
              onPress={() => setShowForm(true)}
            >
              <Text style={styles.toggleCircleText}>＋</Text>
            </TouchableOpacity>
          )}

          {/* Formulaire Effectif */}
          {showForm && (
            <View style={styles.formCard} onLayout={handleFormLayout}>
              <TouchableOpacity
                style={styles.closeFormBtn}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.closeFormText}>✕</Text>
              </TouchableOpacity>

              {/* Sélection étage/appartement/entreprise */}
              <View style={styles.formRow}>
                <Text style={styles.label}>Étage :</Text>
                <TouchableOpacity
                  style={styles.inputBtn}
                  onPress={() => {
                    setShowFloorPicker(d => !d);
                    setShowAptPicker(false);
                    setShowCompanyPicker(false);
                  }}
                >
                  <Text>{form.floor}</Text>
                </TouchableOpacity>

                <Text style={[styles.label, { marginLeft: 12 }]}>Appart :</Text>
                <TouchableOpacity
                  style={styles.inputBtn}
                  onPress={() => {
                    setShowAptPicker(d => !d);
                    setShowFloorPicker(false);
                    setShowCompanyPicker(false);
                  }}
                >
                  <Text>{form.apartment}</Text>
                </TouchableOpacity>
              </View>

              {/* Picker Étages */}
              {showFloorPicker && (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.floor}
                    onValueChange={v => updateForm('floor', v)}
                  >
                    <Picker.Item label="1er" value="1er" />
                    <Picker.Item label="2ème" value="2ème" />
                    <Picker.Item label="3ème" value="3ème" />
                  </Picker>
                  <TouchableOpacity style={styles.okButton} onPress={() => setShowFloorPicker(false)}>
                    <Text style={styles.okButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Picker Appartements */}
              {showAptPicker && (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.apartment}
                    onValueChange={v => updateForm('apartment', v)}
                  >
                    {[...Array(20)].map((_, i) => (
                      <Picker.Item key={i} label={`${i + 1}`} value={`${i + 1}`} />
                    ))}
                  </Picker>
                  <TouchableOpacity style={styles.okButton} onPress={() => setShowAptPicker(false)}>
                    <Text style={styles.okButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Sélection entreprise */}
              <View style={styles.companyRow}>
                <Text style={styles.label}>Entreprise :</Text>
                <TouchableOpacity
                  style={styles.inputBtn}
                  onPress={() => {
                    setShowCompanyPicker(d => !d);
                    setShowFloorPicker(false);
                    setShowAptPicker(false);
                  }}
                >
                  <Text>{form.company}</Text>
                </TouchableOpacity>
              </View>
              {showCompanyPicker && (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.company}
                    onValueChange={v => updateForm('company', v)}
                  >
                    {companies.map(c => (
                      <Picker.Item key={c} label={c} value={c} />
                    ))}
                  </Picker>
                  <TouchableOpacity style={styles.okButton} onPress={() => setShowCompanyPicker(false)}>
                    <Text style={styles.okButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Champ nombre de personnes */}
              <View style={styles.formRow}>
                <Text style={styles.label}>Nombre de personnes :</Text>
                <TextInput
                  style={styles.inputBtn}
                  keyboardType="numeric"
                  value={form.nombrePersonnes}
                  onChangeText={v => updateForm('nombrePersonnes', v)}
                  placeholder="0"
                />
              </View>

              {/* Bouton enregistrer */}
              <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
                <Text style={styles.addText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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
    marginBottom: 24,
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
  // Styles pour l'affichage des effectifs
  sectionHeader: {
    backgroundColor: '#f26463',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  effectifCard: {
    borderWidth: 1,
    borderColor: '#f26463',
    borderRadius: 30,
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#f26463',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  effectifContent: {
    paddingTop: 8,
  },
  effectifRow: {
    flexDirection: 'column',
    gap: 8,
  },
  effectifRowHorizontal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  effectifField: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
});
