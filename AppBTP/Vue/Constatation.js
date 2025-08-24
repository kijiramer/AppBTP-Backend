import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, SafeAreaView, ScrollView, View, Text, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import Storage from '../utils/Storage';

import Header from './Header';
import ScreenWrapper from '../Controleur/ScreenWrapper';
import { displayCalendarScreen } from './Components/Calendar';

export default function Constatation({ route, navigation }) {
    const { city, building, task } = route.params;
    const scrollViewRef = useRef(null);
    const windowHeight = Dimensions.get('window').height;

    const [constatations, setConstatations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [form, setForm] = useState({ avant: null, apres: null, company: 'Entreprise A' });
    const [showForm, setShowForm] = useState(false);
    const [showCompanyPicker, setShowCompanyPicker] = useState(false);
    const [hasLibraryPermission, setHasLibraryPermission] = useState(null);

    const companies = ['Entreprise A', 'Entreprise B', 'Entreprise C'];

    // Demande de permission à l'ouverture du composant
    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            const granted = status === 'granted';
            setHasLibraryPermission(granted);
            if (!granted) {
                alert("Permission refusée pour accéder à la photothèque");
            }
        })();
    }, []);

    const updateForm = (field, value) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const pickImage = async (type) => {
        if (hasLibraryPermission === false) {
            alert("Pas de permission pour la photothèque");
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
            });

            if (!result.canceled) {
                setForm(prev => ({ ...prev, [type]: result.assets[0].uri }));
            }
        } catch (e) {
            console.warn("Erreur sélection image: ", e);
        }
    };

    // Fonction pour charger les constatations depuis l'API
    const loadConstatations = async () => {
        try {
            setLoading(true);
            const token = await Storage.getItem('token');
            if (!token) {
                Alert.alert('Erreur', 'Vous devez être connecté');
                return;
            }

            const response = await axios.get(`http://192.168.1.89:8081/constatations?city=${city}&building=${building}&task=${task}&selectedDate=${selectedDate.toISOString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                setConstatations(response.data.constatations.map(constatation => ({
                    company: constatation.company,
                    avant: constatation.imageAvant,
                    apres: constatation.imageApres,
                })));
            }
        } catch (err) {
            console.error('Error loading constatations:', err);
            Alert.alert('Erreur', 'Impossible de charger les constatations');
        } finally {
            setLoading(false);
        }
    };

    const addConstatation = async () => {
        if (!form.avant || !form.apres) {
            Alert.alert('Erreur', 'Veuillez sélectionner les deux photos (avant et après)');
            return;
        }

        try {
            setLoading(true);
            const token = await Storage.getItem('token');
            if (!token) {
                Alert.alert('Erreur', 'Vous devez être connecté');
                return;
            }

            const constatationData = {
                city,
                building,
                task,
                company: form.company,
                imageAvant: form.avant,
                imageApres: form.apres,
                selectedDate: selectedDate.toISOString(),
            };

            const response = await axios.post('http://192.168.1.89:8081/constatations', constatationData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                // Ajouter la nouvelle constatation à l'état local
                setConstatations(prev => [
                    {
                        company: form.company,
                        avant: form.avant,
                        apres: form.apres,
                    },
                    ...prev,
                ]);

                // Réinitialiser le formulaire
                setForm({ avant: null, apres: null, company: form.company });
                setShowForm(false);
                Alert.alert('Succès', 'Constatation ajoutée avec succès');
            }
        } catch (err) {
            console.error('Error adding constatation:', err);
            Alert.alert('Erreur', 'Impossible d\'ajouter la constatation');
        } finally {
            setLoading(false);
        }
    };

    const handleFormLayout = (e) => {
        const { y, height } = e.nativeEvent.layout;
        const offset = y - (windowHeight / 2 - height / 2);
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: offset > 0 ? offset : 0, animated: true });
        }
    };

    useEffect(() => {
        if (!showForm) setShowCompanyPicker(false);
    }, [showForm]);

    // Charger les constatations au montage du composant et quand la date change
    useEffect(() => {
        loadConstatations();
    }, [city, building, task, selectedDate]);

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

                <ScrollView ref={scrollViewRef} contentContainerStyle={styles.contentContainer}>
                    {/* Calendrier */}
                    <View style={styles.calendarContainer}>
                        {displayCalendarScreen(selectedDate, setSelectedDate)}
                    </View>

                    {/* Liste des constatations */}
                    {constatations.map((c, i) => (
                        <View key={i} style={styles.card}>
                            {/* Badge Entreprise */}
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{c.company}</Text>
                            </View>

                            <Text style={styles.cardTitle}>Constatation {i + 1}</Text>
                            <View style={styles.imageRow}>
                                <View style={styles.imageWrapper}>
                                    <Text style={styles.imageLabel}>Avant</Text>
                                    <Image source={{ uri: c.avant }} style={styles.image} />
                                </View>
                                <View style={styles.imageWrapper}>
                                    <Text style={styles.imageLabel}>Après</Text>
                                    <Image source={{ uri: c.apres }} style={styles.image} />
                                </View>
                            </View>
                        </View>
                    ))}

                    {/* Bouton “＋” */}
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

                            {/* Choix Entreprise */}
                            <Text style={styles.label}>Entreprise :</Text>
                            <TouchableOpacity
                                style={styles.inputBtn}
                                onPress={() => setShowCompanyPicker(d => !d)}
                            >
                                <Text>{form.company}</Text>
                            </TouchableOpacity>
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

                            {/* Sélection Avant */}
                            <Text style={styles.label}>Photo Avant :</Text>
                            <TouchableOpacity
                                style={styles.photoButton}
                                onPress={() => pickImage('avant')}
                            >
                                <Text style={styles.photoButtonText}>
                                    {form.avant ? 'Changer photo' : 'Choisir photo'}
                                </Text>
                            </TouchableOpacity>
                            {form.avant && <Image source={{ uri: form.avant }} style={styles.preview} />}

                            {/* Sélection Après */}
                            <Text style={styles.label}>Photo Après :</Text>
                            <TouchableOpacity
                                style={styles.photoButton}
                                onPress={() => pickImage('apres')}
                            >
                                <Text style={styles.photoButtonText}>
                                    {form.apres ? 'Changer photo' : 'Choisir photo'}
                                </Text>
                            </TouchableOpacity>
                            {form.apres && <Image source={{ uri: form.apres }} style={styles.preview} />}

                            {/* Bouton Ajouter */}
                            <TouchableOpacity
                                style={styles.validateButton}
                                onPress={addConstatation}
                            >
                                <Text style={styles.validateText}>Valider</Text>
                            </TouchableOpacity>
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

    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f26463',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -10,
        left: 16,
        backgroundColor: '#f26463',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },

    cardTitle: { fontWeight: '600', marginBottom: 8, fontSize: 16, marginTop: 8 },
    imageRow: { flexDirection: 'row', justifyContent: 'space-between' },
    image: { width: '100%', height: 160, borderRadius: 8 },

    toggleCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f26463',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 24,
        elevation: 5,
    },
    toggleCircleText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '600',
    },

    formCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 24,
        elevation: 3,
    },
    closeFormBtn: { alignSelf: 'flex-end', marginBottom: 8 },
    closeFormText: { fontSize: 18, color: '#f26463' },
    label: { fontSize: 14, fontWeight: '500', marginTop: 12, color: '#333' },
    inputBtn: {
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 8,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
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
    okButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
    photoButton: {
        backgroundColor: '#f26463',
        padding: 10,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 8,
    },
    photoButtonText: { color: '#fff', fontWeight: '600' },
    preview: {
        marginTop: 8,
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    validateButton: {
        marginTop: 16,
        backgroundColor: '#4caf50',
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    validateText: { color: '#fff', fontWeight: '600' },

    imageWrapper: {
        width: '48%',
        alignItems: 'center',
    },
    imageLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
        color: '#666',
    },
});
