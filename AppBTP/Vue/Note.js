// Note.js
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import moment from 'moment';
import 'moment/locale/fr';
import axios from 'axios';
import Storage from '../utils/Storage';

import Header from './Header';
import ScreenWrapper from '../Controleur/ScreenWrapper';
import { displayCalendarScreen } from './Components/Calendar';
import { API_BASE_URL } from '../config';

moment.locale('fr');

export default function Note({ route, navigation }) {
  const { city, building, task } = route.params;
  const scrollViewRef = useRef(null);
  const windowHeight = Dimensions.get('window').height;

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [form, setForm] = useState({
    floor: '1er',
    apartment: '1',
    company: 'Entreprise A',
    open: false,
    closed: false,
    openTime: '',
    closedTime: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [showFloorPicker, setShowFloorPicker] = useState(false);
  const [showAptPicker, setShowAptPicker] = useState(false);
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);

  const companies = ['Entreprise A', 'Entreprise B', 'Entreprise C'];

  const updateForm = (field, value) =>
      setForm(prev => ({ ...prev, [field]: value }));

  const handleToggleOpen = v => {
    updateForm('open', v);
    updateForm('openTime', v ? moment().format('HH:mm') : '');
  };
  const handleToggleClosed = v => {
    updateForm('closed', v);
    updateForm('closedTime', v ? moment().format('HH:mm') : '');
  };

  // Fonction pour charger les notes depuis l'API
  const loadNotes = async () => {
    try {
      setLoading(true);
  const token = await Storage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté');
        return;
      }

  const response = await axios.get(`${API_BASE_URL}/notes?city=${city}&building=${building}&task=${task}&selectedDate=${selectedDate.toISOString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setNotes(response.data.notes.map(note => ({
          id: note._id,
          label: note.company,
          floor: note.floor,
          apartment: note.apartment,
          openTime: note.openTime,
          closedTime: note.closedTime,
        })));
      }
    } catch (err) {
      console.error('Error loading notes:', err);
      Alert.alert('Erreur', 'Impossible de charger les notes');
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    try {
      setLoading(true);
  const token = await Storage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté');
        return;
      }

      const noteData = {
        city,
        building, 
        task,
        floor: form.floor,
        apartment: form.apartment,
        company: form.company,
        openTime: form.openTime,
        closedTime: form.closedTime,
        selectedDate: selectedDate.toISOString(),
      };

  const response = await axios.post(`${API_BASE_URL}/notes`, noteData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        // Ajouter la nouvelle note à l'état local
        setNotes(prev => [
          {
            id: response.data.note._id,
            label: form.company,
            floor: form.floor,
            apartment: form.apartment,
            openTime: form.openTime,
            closedTime: form.closedTime,
          },
          ...prev,
        ]);

        // Réinitialiser le formulaire
        setForm({
          floor: '1er',
          apartment: '1',
          company: form.company,
          open: false,
          closed: false,
          openTime: '',
          closedTime: '',
        });
        setShowForm(false);
        // Rafraîchir les dates marquées pour le calendrier
        loadNoteDates();
      }
    } catch (err) {
      console.error('Error adding note:', err);
      Alert.alert('Erreur', 'Impossible d\'ajouter la note');
    } finally {
      setLoading(false);
    }
  };

  // Fermer une note (ajouter l'heure de fermeture)
  const closeNote = async (noteId) => {
    const currentTime = moment().format('HH:mm');

    Alert.alert(
      'Fermer la note',
      `Voulez-vous fermer cette note à ${currentTime} ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await Storage.getItem('token');
              if (!token) {
                Alert.alert('Erreur', 'Vous devez être connecté');
                return;
              }

              console.log('Closing note:', noteId);
              console.log('API URL:', `${API_BASE_URL}/notes/${noteId}`);
              console.log('Data:', { closedTime: currentTime });

              const response = await axios.put(
                `${API_BASE_URL}/notes/${noteId}`,
                { closedTime: currentTime },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              console.log('Response:', response.data);

              if (response.data.success) {
                // Mettre à jour la note dans l'état local
                setNotes(prev =>
                  prev.map(note =>
                    note.id === noteId
                      ? { ...note, closedTime: currentTime }
                      : note
                  )
                );
                Alert.alert('Succès', 'Note fermée avec succès');
              }
            } catch (err) {
              console.error('Error closing note:', err);
              console.error('Error details:', err.response?.data);
              Alert.alert('Erreur', `Impossible de fermer la note: ${err.response?.data?.message || err.message}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Quand le formulaire apparaît, on centre automatiquement
  const handleFormLayout = e => {
    const { y, height } = e.nativeEvent.layout;
    const offset = y - (windowHeight / 2 - height / 2);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: offset > 0 ? offset : 0,
        animated: true,
      });
    }
  };

  useEffect(() => {
    if (!showForm) {
      setShowFloorPicker(false);
      setShowAptPicker(false);
      setShowCompanyPicker(false);
    }
  }, [showForm]);

  // Charger les notes au montage du composant et quand la date change
  useEffect(() => {
    loadNotes();
  }, [city, building, task, selectedDate]);

  // Charger toutes les dates contenant des notes pour marquage global du calendrier
  const [noteDates, setNoteDates] = useState([]);
  const loadNoteDates = async () => {
    try {
  const token = await Storage.getItem('token');
      if (!token) return;
  const url = `${API_BASE_URL}/notes/dates?city=${city}&building=${building}&task=${task}`;
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success && Array.isArray(response.data.dates)) {
        setNoteDates(response.data.dates);
      }
    } catch (e) {
      // Fallback silencieux: récupérer toutes les notes et en déduire les dates
      try {
  const token = await Storage.getItem('token');
        if (!token) return;
  const urlAll = `${API_BASE_URL}/notes?city=${city}&building=${building}&task=${task}`;
        const respAll = await axios.get(urlAll, { headers: { Authorization: `Bearer ${token}` } });
        if (respAll.data.success && Array.isArray(respAll.data.notes)) {
          const set = new Set();
          respAll.data.notes.forEach(n => {
            if (n.selectedDate) {
              const d = moment(n.selectedDate).format('YYYY-MM-DD');
              set.add(d);
            }
          });
          setNoteDates(Array.from(set));
        }
      } catch {}
    }
  };

  useEffect(() => {
    loadNoteDates();
  }, [city, building, task]);

  // Liste des dates avec notes (YYYY-MM-DD)
  const datesWithNotes = noteDates;

  // Composant pour une note
  const NoteCard = ({ note, onClose }) => {
    const isNoteOpen = note.openTime && !note.closedTime;

    return (
      <View style={styles.noteContainer}>
        <View style={styles.noteCard}>
          {/* Badge Entreprise */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {note.label}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={isNoteOpen ? 0.7 : 1}
            onPress={() => isNoteOpen && onClose && onClose()}
            disabled={!isNoteOpen}
          >
            <View style={styles.noteContent}>
              <View style={styles.noteRow}>
                <Text style={styles.noteField}>
                  Étage : {note.floor}
                </Text>
                <Text style={styles.noteField}>
                  Apt : {note.apartment}
                </Text>
                <Text style={[styles.noteField, isNoteOpen && styles.openNoteHighlight]}>
                  Ouvert : {note.openTime || '-'}
                </Text>
                <Text style={styles.noteField}>
                  Fermé : {note.closedTime || '-'}
                </Text>
              </View>
              {isNoteOpen && (
                <View style={styles.tapHint}>
                  <Text style={styles.tapHintText}>Appuyez pour fermer</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
      <ScreenWrapper>
        <SafeAreaView style={styles.container}>
          <Header
              navigation={navigation}
              isHomePage={false}
              city={city}
              building={building}
              task={task}
          />

          <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.contentContainer}
          >
            {/* Calendrier */}
            <View style={styles.calendarContainer}>
              {displayCalendarScreen(selectedDate, setSelectedDate, datesWithNotes)}
            </View>

            {/* Notes existantes */}
            {(() => {
              // Séparer les notes ouvertes et fermées
              const openNotes = notes.filter(note => note.openTime && !note.closedTime);
              const closedNotes = notes.filter(note => note.closedTime);

              return (
                <>
                  {/* Section Notes Ouvertes */}
                  {openNotes.length > 0 && (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderText}>📂 Ouvert ({openNotes.length})</Text>
                      </View>
                      {openNotes.map((note, idx) => (
                        <NoteCard
                          key={note.id || idx}
                          note={note}
                          onClose={() => closeNote(note.id)}
                        />
                      ))}
                    </>
                  )}

                  {/* Section Notes Fermées */}
                  {closedNotes.length > 0 && (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderText}>✅ Fermé ({closedNotes.length})</Text>
                      </View>
                      {closedNotes.map((note, idx) => (
                        <NoteCard
                          key={note.id || idx}
                          note={note}
                          onClose={() => closeNote(note.id)}
                        />
                      ))}
                    </>
                  )}
                </>
              );
            })()}

            {/* Bouton “＋” cercle pour ouvrir */}
            {!showForm && (
                <TouchableOpacity
                    style={styles.toggleCircle}
                    onPress={() => setShowForm(true)}
                >
                  <Text style={styles.toggleCircleText}>＋</Text>
                </TouchableOpacity>
            )}

            {/* Formulaire */}
            {showForm && (
                <View style={styles.formCard} onLayout={handleFormLayout}>
                  {/* Bouton ✕ */}
                  <TouchableOpacity
                      style={styles.closeFormBtn}
                      onPress={() => setShowForm(false)}
                  >
                    <Text style={styles.closeFormText}>✕</Text>
                  </TouchableOpacity>

                  {/* Ligne Étage/Appart/+ */}
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

                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={addNote}
                    >
                      <Text style={styles.addText}>＋</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Picker Étages */}
                  {showFloorPicker && (
                      <>
                        <View style={styles.pickerContainer}>
                          <Picker
                              selectedValue={form.floor}
                              onValueChange={v => updateForm('floor', v)}
                          >
                            <Picker.Item label="1er" value="1er" />
                            <Picker.Item label="2ème" value="2ème" />
                            <Picker.Item label="3ème" value="3ème" />
                          </Picker>
                        </View>
                        <TouchableOpacity
                            style={styles.okButton}
                            onPress={() => setShowFloorPicker(false)}
                        >
                          <Text style={styles.okButtonText}>OK</Text>
                        </TouchableOpacity>
                      </>
                  )}

                  {/* Picker Appart */}
                  {showAptPicker && (
                      <>
                        <View style={styles.pickerContainer}>
                          <Picker
                              selectedValue={form.apartment}
                              onValueChange={v => updateForm('apartment', v)}
                          >
                            {[...Array(20)].map((_, i) => (
                                <Picker.Item key={i} label={`${i + 1}`} value={`${i + 1}`} />
                            ))}
                          </Picker>
                        </View>
                        <TouchableOpacity
                            style={styles.okButton}
                            onPress={() => setShowAptPicker(false)}
                        >
                          <Text style={styles.okButtonText}>OK</Text>
                        </TouchableOpacity>
                      </>
                  )}

                  {/* Picker Entreprise */}
                  {showCompanyPicker && (
                      <>
                        <View style={styles.pickerContainer}>
                          <Picker
                              selectedValue={form.company}
                              onValueChange={v => updateForm('company', v)}
                          >
                            {companies.map(c => (
                                <Picker.Item key={c} label={c} value={c} />
                            ))}
                          </Picker>
                        </View>
                        <TouchableOpacity
                            style={styles.okButton}
                            onPress={() => setShowCompanyPicker(false)}
                        >
                          <Text style={styles.okButtonText}>OK</Text>
                        </TouchableOpacity>
                      </>
                  )}

                  {/* Champ Entreprise */}
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

                  {/* Switches */}
                  <View style={styles.switchRow}>
                    <View style={styles.switchWrapper}>
                      <Text style={styles.switchLabel}>Ouvert</Text>
                      <Switch value={form.open} onValueChange={handleToggleOpen} />
                    </View>
                    <View style={styles.switchWrapper}>
                      <Text style={styles.switchLabel}>Fermé</Text>
                      <Switch value={form.closed} onValueChange={handleToggleClosed} />
                    </View>
                  </View>
                </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  contentContainer: { padding: 16 },

  calendarContainer: { marginBottom: 24 },

  sectionHeader: {
    backgroundColor: '#f26463',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  sectionHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  noteCard: {
    borderWidth: 1,
    borderColor: '#f26463',
    borderRadius: 30,
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    position: 'relative',
    overflow: 'visible',
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
    maxWidth: 120,
    zIndex: 100,
    elevation: 10,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },

  noteContent: {
    marginTop: 10,
    paddingHorizontal: 8,
  },
  noteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteField: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 13, 
    color: '#111',
    paddingHorizontal: 2,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: '#fff', fontSize: 20 },

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

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  switchLabel: { marginRight: 6, fontSize: 13 },

  // Styles pour le conteneur de note
  noteContainer: {
    marginTop: 20,
    marginBottom: 16,
    paddingTop: 15,
  },
  openNoteHighlight: {
    fontWeight: 'bold',
    color: '#f26463',
  },
  tapHint: {
    marginTop: 8,
    alignItems: 'center',
  },
  tapHintText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});
