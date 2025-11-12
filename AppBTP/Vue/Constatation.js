import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import Storage from '../utils/Storage';
import { API_BASE_URL } from '../config';

import Header from './Header';
import ScreenWrapper from '../Controleur/ScreenWrapper';
import { displayCalendarScreen } from './Components/Calendar';

export default function Constatation({ route, navigation }) {
    const { city, building, task } = route.params;

    const [constatations, setConstatations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [form, setForm] = useState({
        photo: null,
        floor: '',
        apartment: '',
        description: ''
    });
    const [showForm, setShowForm] = useState(false);
    const [hasLibraryPermission, setHasLibraryPermission] = useState(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(null);
    const [showImageSourceModal, setShowImageSourceModal] = useState(false);

    // Suggestions pour autocomplete
    const [floorSuggestions, setFloorSuggestions] = useState([]);
    const [apartmentSuggestions, setApartmentSuggestions] = useState([]);
    const [showFloorSuggestions, setShowFloorSuggestions] = useState(false);
    const [showApartmentSuggestions, setShowApartmentSuggestions] = useState(false);

    // État pour les dates avec constatations (pour le calendrier)
    const [datesWithConstatations, setDatesWithConstatations] = useState([]);
    const [allConstatations, setAllConstatations] = useState([]);

    // Charger l'historique des valeurs saisies
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const floorHistory = await AsyncStorage.getItem('constatation_floor_history');
                const apartmentHistory = await AsyncStorage.getItem('constatation_apartment_history');

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
            } catch (error) {
                console.error('Error loading history:', error);
            }
        };
        loadHistory();
    }, []);

    // Demande de permissions à l'ouverture du composant
    useEffect(() => {
        (async () => {
            const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
            setHasLibraryPermission(libraryStatus.status === 'granted');

            const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
            setHasCameraPermission(cameraStatus.status === 'granted');

            if (libraryStatus.status !== 'granted' && cameraStatus.status !== 'granted') {
                Alert.alert(
                    "Permissions requises",
                    "L'application nécessite l'accès à la caméra et à la galerie pour fonctionner correctement."
                );
            }
        })();
    }, []);

    // Charger les constatations au montage et quand la date change
    useEffect(() => {
        loadConstatations();
    }, [city, building, task, selectedDate]);

    // Charger toutes les dates avec constatations pour le calendrier
    useEffect(() => {
        fetchAllConstatations();
    }, [city, building, task]);

    const updateForm = (field, value) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const openImageSourceModal = () => {
        setShowImageSourceModal(true);
    };

    const pickImageFromGallery = async () => {
        if (hasLibraryPermission === false) {
            Alert.alert(
                "Permission refusée",
                "Veuillez autoriser l'accès à la galerie dans les paramètres de l'application."
            );
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.7,
                allowsEditing: true,
            });

            if (!result.canceled) {
                updateForm('photo', result.assets[0].uri);
                setShowImageSourceModal(false);
            }
        } catch (e) {
            console.warn("Erreur sélection image: ", e);
            Alert.alert("Erreur", "Impossible de sélectionner l'image");
        }
    };

    const takePhoto = async () => {
        if (hasCameraPermission === false) {
            Alert.alert(
                "Permission refusée",
                "Veuillez autoriser l'accès à la caméra dans les paramètres de l'application."
            );
            return;
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: 0.7,
                allowsEditing: true,
            });

            if (!result.canceled) {
                updateForm('photo', result.assets[0].uri);
                setShowImageSourceModal(false);
            }
        } catch (e) {
            console.warn("Erreur prise photo: ", e);
            Alert.alert("Erreur", "Impossible de prendre la photo");
        }
    };

    // Fonction pour charger les constatations depuis l'API
    const loadConstatations = async () => {
        try {
            setLoading(true);
            const token = await Storage.getItem('token');
            if (!token) return;

            const dateStr = selectedDate.toISOString().split('T')[0];
            const response = await axios.get(
                `${API_BASE_URL}/constatations?city=${city}&building=${building}&task=${task}&selectedDate=${dateStr}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                const constList = response.data.constatations || [];
                setConstatations(constList);
            }
        } catch (err) {
            console.error('Error loading constatations:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour charger toutes les constatations (pour marquer les dates)
    const fetchAllConstatations = async () => {
        try {
            const token = await Storage.getItem('token');
            if (!token) return;

            const response = await axios.get(
                `${API_BASE_URL}/constatations?city=${city}&building=${building}&task=${task}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                const allConsts = response.data.constatations || [];
                setAllConstatations(allConsts);

                // Extraire les dates uniques
                const uniqueDates = [...new Set(
                    allConsts.map(c => {
                        const date = new Date(c.selectedDate);
                        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    })
                )];
                setDatesWithConstatations(uniqueDates);
            }
        } catch (err) {
            console.error('Error fetching all constatations:', err);
        }
    };

    const addConstatation = async () => {
        // Validation
        if (!form.photo) {
            Alert.alert('Erreur', 'Veuillez ajouter une photo');
            return;
        }
        if (!form.floor.trim() || !form.apartment.trim()) {
            Alert.alert('Erreur', 'Veuillez remplir l\'étage et l\'appartement');
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
                floor: form.floor,
                apartment: form.apartment,
                description: form.description,
                city,
                building,
                task,
                image: form.photo,
                selectedDate: selectedDate.toISOString(),
            };

            const response = await axios.post(`${API_BASE_URL}/constatations`, constatationData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                // Sauvegarder dans l'historique
                const updateHistory = async (key, value, suggestions, setSuggestions) => {
                    const newSuggestions = [...suggestions];
                    if (!newSuggestions.includes(value)) {
                        newSuggestions.push(value);
                        await AsyncStorage.setItem(key, JSON.stringify(newSuggestions));

                        // Trier les suggestions
                        setSuggestions(newSuggestions.sort((a, b) => {
                            const numA = parseInt(a) || 0;
                            const numB = parseInt(b) || 0;
                            return numA - numB;
                        }));
                    }
                };

                await updateHistory('constatation_floor_history', form.floor, floorSuggestions, setFloorSuggestions);
                await updateHistory('constatation_apartment_history', form.apartment, apartmentSuggestions, setApartmentSuggestions);

                // Réinitialiser le formulaire
                setForm({ photo: null, floor: '', apartment: '', description: '' });
                setShowForm(false);

                // Rafraîchir les constatations
                loadConstatations();
                fetchAllConstatations();

                Alert.alert('Succès', 'Constatation ajoutée avec succès');
            }
        } catch (err) {
            console.error('Error adding constatation:', err);
            Alert.alert('Erreur', 'Impossible d\'ajouter la constatation');
        } finally {
            setLoading(false);
        }
    };

    const deleteConstatation = (id) => {
        Alert.alert(
            'Confirmation',
            'Voulez-vous vraiment supprimer cette constatation ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const token = await Storage.getItem('token');
                            const response = await axios.delete(`${API_BASE_URL}/constatations/${id}`, {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            });

                            if (response.data.success) {
                                loadConstatations();
                                fetchAllConstatations();
                                Alert.alert('Succès', 'Constatation supprimée');
                            }
                        } catch (err) {
                            console.error('Error deleting constatation:', err);
                            Alert.alert('Erreur', 'Impossible de supprimer la constatation');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
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

                <KeyboardAwareScrollView
                    contentContainerStyle={styles.contentContainer}
                    enableOnAndroid={true}
                    enableAutomaticScroll={true}
                    extraScrollHeight={20}
                    keyboardShouldPersistTaps="handled"
                    enableResetScrollToCoords={false}
                >
                    {/* Calendrier */}
                    <View style={styles.calendarContainer}>
                        {displayCalendarScreen(selectedDate, setSelectedDate, datesWithConstatations)}
                    </View>

                    {/* Liste des constatations existantes */}
                    {constatations.length > 0 && (
                        <View style={styles.listContainer}>
                            <Text style={styles.sectionTitle}>Constatations du jour</Text>
                            {constatations.map((constat, idx) => (
                                <View key={idx} style={styles.constatCard}>
                                    <View style={styles.constatRow}>
                                        {/* Photo */}
                                        <Image source={{ uri: constat.image }} style={styles.constatImage} />

                                        {/* Texte à droite */}
                                        <View style={styles.constatTextContainer}>
                                            <Text style={styles.constatLabel}>Étage: {constat.floor}</Text>
                                            <Text style={styles.constatLabel}>Appart: {constat.apartment}</Text>
                                            {constat.description ? (
                                                <Text style={styles.constatDescription}>{constat.description}</Text>
                                            ) : null}
                                        </View>
                                    </View>

                                    {/* Bouton supprimer */}
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => deleteConstatation(constat._id)}
                                    >
                                        <Text style={styles.deleteButtonText}>Supprimer</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Bouton pour afficher le formulaire */}
                    {!showForm && (
                        <TouchableOpacity
                            style={styles.toggleCircle}
                            onPress={() => setShowForm(true)}
                        >
                            <Text style={styles.toggleCircleText}>＋</Text>
                        </TouchableOpacity>
                    )}

                    {/* Formulaire d'ajout */}
                    {showForm && (
                        <View style={styles.formCard}>
                            {/* Bouton fermer */}
                            <TouchableOpacity
                                style={styles.closeFormBtn}
                                onPress={() => setShowForm(false)}
                            >
                                <Text style={styles.closeFormText}>✕</Text>
                            </TouchableOpacity>

                            <Text style={styles.formTitle}>Nouvelle Constatation</Text>

                            {/* Photo */}
                            <View style={styles.photoSection}>
                                <Text style={styles.label}>Photo :</Text>
                                <TouchableOpacity
                                    style={styles.photoButton}
                                    onPress={openImageSourceModal}
                                >
                                    {form.photo ? (
                                        <Image source={{ uri: form.photo }} style={styles.photoPreview} />
                                    ) : (
                                        <Text style={styles.photoButtonText}>Ajouter une photo</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Étage */}
                            <View style={styles.formRow}>
                                <Text style={styles.label}>Étage :</Text>
                                <View style={{ flex: 1 }}>
                                    <TextInput
                                        style={styles.textInput}
                                        value={form.floor}
                                        onChangeText={v => updateForm('floor', v)}
                                        placeholder="Ex: 1"
                                        keyboardType="numeric"
                                        onFocus={() => setShowFloorSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowFloorSuggestions(false), 200)}
                                    />
                                    {showFloorSuggestions && floorSuggestions.length > 0 && (
                                        <View style={styles.suggestionsContainer}>
                                            <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                                                {floorSuggestions.map((suggestion, idx) => (
                                                    <TouchableOpacity
                                                        key={idx}
                                                        style={styles.suggestionItem}
                                                        onPress={() => {
                                                            updateForm('floor', suggestion);
                                                            setShowFloorSuggestions(false);
                                                        }}
                                                    >
                                                        <Text style={styles.suggestionText}>{suggestion}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Appartement */}
                            <View style={styles.formRow}>
                                <Text style={styles.label}>Appartement :</Text>
                                <View style={{ flex: 1 }}>
                                    <TextInput
                                        style={styles.textInput}
                                        value={form.apartment}
                                        onChangeText={v => updateForm('apartment', v)}
                                        placeholder="Ex: 101"
                                        keyboardType="numeric"
                                        onFocus={() => setShowApartmentSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowApartmentSuggestions(false), 200)}
                                    />
                                    {showApartmentSuggestions && apartmentSuggestions.length > 0 && (
                                        <View style={styles.suggestionsContainer}>
                                            <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                                                {apartmentSuggestions.map((suggestion, idx) => (
                                                    <TouchableOpacity
                                                        key={idx}
                                                        style={styles.suggestionItem}
                                                        onPress={() => {
                                                            updateForm('apartment', suggestion);
                                                            setShowApartmentSuggestions(false);
                                                        }}
                                                    >
                                                        <Text style={styles.suggestionText}>{suggestion}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Description */}
                            <View style={styles.descriptionRow}>
                                <Text style={styles.label}>Description :</Text>
                                <TextInput
                                    style={styles.textArea}
                                    value={form.description}
                                    onChangeText={v => updateForm('description', v)}
                                    placeholder="Description de la constatation (optionnel)"
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            {/* Bouton Ajouter */}
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={addConstatation}
                                disabled={loading}
                            >
                                <Text style={styles.submitButtonText}>
                                    {loading ? 'Ajout en cours...' : 'Ajouter la constatation'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </KeyboardAwareScrollView>

                {/* Modal pour choisir source image */}
                <Modal
                    visible={showImageSourceModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowImageSourceModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Choisir une source</Text>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={pickImageFromGallery}
                            >
                                <Text style={styles.modalButtonText}>Galerie</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={takePhoto}
                            >
                                <Text style={styles.modalButtonText}>Prendre une photo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancelButton]}
                                onPress={() => setShowImageSourceModal(false)}
                            >
                                <Text style={styles.modalButtonText}>Annuler</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    contentContainer: { padding: 16 },
    calendarContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 8,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    listContainer: {
        marginBottom: 16,
    },
    constatCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    constatRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    constatImage: {
        width: 120,
        height: 120,
        borderRadius: 8,
        backgroundColor: '#e0e0e0',
    },
    constatTextContainer: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'flex-start',
    },
    constatLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    constatDescription: {
        fontSize: 13,
        color: '#666',
        marginTop: 8,
        lineHeight: 18,
    },
    deleteButton: {
        backgroundColor: '#ff4444',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignSelf: 'flex-end',
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    toggleCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f26463',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    toggleCircleText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    closeFormBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    closeFormText: {
        fontSize: 20,
        color: '#666',
        fontWeight: 'bold',
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    photoSection: {
        marginBottom: 16,
    },
    photoButton: {
        height: 200,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    photoButtonText: {
        fontSize: 14,
        color: '#666',
    },
    photoPreview: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    formRow: {
        marginBottom: 12,
    },
    descriptionRow: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 6,
    },
    textInput: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        fontSize: 14,
    },
    textArea: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        fontSize: 14,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#f26463',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 42,
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
        overflow: 'hidden',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
    },
    modalButton: {
        width: '100%',
        backgroundColor: '#f26463',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    modalCancelButton: {
        backgroundColor: '#999',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
