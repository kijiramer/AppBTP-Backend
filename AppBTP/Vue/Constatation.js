import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Image, Dimensions, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import axios from 'axios';
import Storage from '../utils/Storage';
import { API_BASE_URL } from '../config';

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
    const [form, setForm] = useState({ avant: null, apres: null, company: 'Entreprise A', reportNumber: '', chantierName: '' });
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
                mediaTypes: ['images'],
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

            const response = await axios.get(`${API_BASE_URL}/constatations?city=${city}&building=${building}&task=${task}&selectedDate=${selectedDate.toISOString()}`, {
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

        if (!form.reportNumber || !form.chantierName) {
            Alert.alert('Erreur', 'Veuillez remplir le numéro de rapport et le nom du chantier');
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
                reportNumber: parseInt(form.reportNumber, 10),
                chantierName: form.chantierName,
                city,
                building,
                task,
                company: form.company,
                imageAvant: form.avant,
                imageApres: form.apres,
                selectedDate: selectedDate.toISOString(),
            };

            const response = await axios.post(`${API_BASE_URL}/constatations`, constatationData, {
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
                setForm({ avant: null, apres: null, company: form.company, reportNumber: '', chantierName: '' });
                setShowForm(false);

                // Rafraîchir les dates avec constatations pour mettre à jour les pastilles
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

    const handleFormLayout = (e) => {
        const { y, height } = e.nativeEvent.layout;
        const offset = y - (windowHeight / 2 - height / 2);
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: offset > 0 ? offset : 0, animated: true });
        }
    };

    const exportToPDF = async () => {
        if (constatations.length === 0) {
            Alert.alert('Erreur', 'Aucune constatation à exporter');
            return;
        }

        try {
            setLoading(true);

            // Fonction helper pour convertir une URI en base64
            const convertUriToBase64 = async (uri) => {
                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.onload = function() {
                        const reader = new FileReader();
                        reader.onloadend = function() {
                            resolve(reader.result);
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(xhr.response);
                    };
                    xhr.onerror = reject;
                    xhr.open('GET', uri);
                    xhr.responseType = 'blob';
                    xhr.send();
                });
            };

            // Récupérer le logo et le convertir en base64
            const { Asset } = require('expo-asset');
            const logoAsset = Asset.fromModule(require('../assets/logo.jpg'));
            await logoAsset.downloadAsync();
            const logoBase64 = await convertUriToBase64(logoAsset.localUri || logoAsset.uri);

            // Convertir toutes les images des constatations en base64
            const constatationsWithBase64 = await Promise.all(
                constatations.map(async (c) => {
                    try {
                        const avantBase64 = await convertUriToBase64(c.avant);
                        const apresBase64 = await convertUriToBase64(c.apres);
                        return {
                            ...c,
                            avantBase64,
                            apresBase64
                        };
                    } catch (error) {
                        console.error('Erreur conversion image:', error);
                        return null;
                    }
                })
            );

            // Filtrer les constatations nulles (erreur de conversion)
            const validConstatations = constatationsWithBase64.filter(c => c !== null);

            if (validConstatations.length === 0) {
                Alert.alert('Erreur', 'Impossible de charger les images');
                return;
            }

            // Obtenir les informations du premier constatation pour le promoteur
            const firstConstatation = validConstatations[0];
            const promoteur = firstConstatation.company || 'N/A';

            // Générer le HTML strictement identique au format RapportPhoto.jsx de la WebApp
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Helvetica, Arial, sans-serif;
            padding: 20px;
            background: white;
            color: #000;
        }
        /* Logo centré en haut */
        .logo-container {
            text-align: center;
            margin-bottom: 20px;
        }
        .logo-container img {
            width: 180px;
            height: 90px;
            object-fit: contain;
        }
        /* Titre principal (Police Times, centré, souligné) */
        .main-title {
            text-align: center;
            font-family: 'Times New Roman', Times, serif;
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .title-underline {
            width: 100%;
            height: 2px;
            background: #000;
            margin: 0 auto 30px auto;
        }
        /* Tableau d'informations avec bordure arrondie */
        .info-box {
            width: 100%;
            max-width: 480px;
            margin: 0 auto 40px auto;
            border: 1.5px solid #000;
            border-radius: 8px;
            overflow: hidden;
        }
        .info-line {
            padding: 10px 12px;
            font-size: 10.5px;
            border-bottom: 1.5px solid #000;
        }
        .info-line:last-child {
            border-bottom: none;
        }
        .info-line.bold {
            font-weight: bold;
        }
        /* Container des photos */
        .photos-section {
            margin-top: 30px;
        }
        /* Paire de photos (Avant → Après) */
        .photo-row {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 50px;
            page-break-inside: avoid;
        }
        .photo-block {
            text-align: center;
        }
        .photo-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .photo-block img {
            width: 210px;
            height: 150px;
            object-fit: cover;
            border: 1px solid #ccc;
        }
        .arrow-separator {
            font-size: 36px;
            font-weight: bold;
            margin: 0 25px;
            color: #000;
        }
        /* Pied de page */
        .footer {
            text-align: center;
            font-size: 10px;
            color: #666;
            margin-top: 50px;
        }
    </style>
</head>
<body>
    <!-- Logo centré -->
    <div class="logo-container">
        <img src="${logoBase64}" alt="Logo" />
    </div>

    <!-- Titre principal avec soulignement -->
    <div class="main-title">Rapport Photo d'Intervention - ${city}</div>
    <div class="title-underline"></div>

    <!-- Tableau d'informations -->
    <div class="info-box">
        <div class="info-line bold">
            PROMOTEUR: ${promoteur.toUpperCase()} - VILLE: ${city.toUpperCase()}
        </div>
        <div class="info-line">
            Mission: ${task}
        </div>
        <div class="info-line">
            Intervention le: ${selectedDate.toLocaleDateString('fr-FR')}
        </div>
    </div>

    <!-- Section photos -->
    <div class="photos-section">
        ${validConstatations.map((c, index) => `
        <div class="photo-row">
            <div class="photo-block">
                <div class="photo-title">Avant</div>
                <img src="${c.avantBase64}" alt="Photo avant ${index + 1}" />
            </div>
            <div class="arrow-separator">→</div>
            <div class="photo-block">
                <div class="photo-title">Après</div>
                <img src="${c.apresBase64}" alt="Photo après ${index + 1}" />
            </div>
        </div>
        `).join('')}
    </div>

    <!-- Pied de page -->
    <div class="footer">
        Page 1 / 1
    </div>
</body>
</html>
            `;

            // Créer le PDF
            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                width: 595, // A4 width in points
                height: 842 // A4 height in points
            });

            // Nom du fichier
            const fileName = `rapport-intervention-${city}-${selectedDate.toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;

            // Partager le PDF
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: fileName,
                    UTI: 'com.adobe.pdf'
                });
                Alert.alert('Succès', 'PDF exporté avec succès');
            } else {
                Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil');
            }
        } catch (err) {
            console.error('Error exporting PDF:', err);
            Alert.alert('Erreur', `Impossible d'exporter le PDF: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!showForm) setShowCompanyPicker(false);
    }, [showForm]);

    // Charger les constatations au montage du composant et quand la date change
    useEffect(() => {
        loadConstatations();
    }, [city, building, task, selectedDate]);

    // Charger toutes les constatations pour marquer les dates avec pastilles
    const [allConstatations, setAllConstatations] = useState([]);
    const [datesWithConstatations, setDatesWithConstatations] = useState([]);

    const fetchAllConstatations = async () => {
        try {
            const token = await Storage.getItem('token');
            if (!token) return;

            const response = await axios.get(`${API_BASE_URL}/constatations?city=${city}&building=${building}&task=${task}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                const allConsts = response.data.constatations || [];
                setAllConstatations(allConsts);

                // Extraire les dates uniques avec constatations
                const uniqueDates = [...new Set(
                    allConsts.map(c => {
                        const date = new Date(c.selectedDate);
                        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    })
                )];
                setDatesWithConstatations(uniqueDates);
            }
        } catch (err) {
            console.error('Error loading all constatations:', err);
        }
    };

    useEffect(() => {
        fetchAllConstatations();
    }, [city, building, task]);

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
                        {displayCalendarScreen(selectedDate, setSelectedDate, datesWithConstatations)}
                    </View>

                    {/* Bouton Export PDF */}
                    {constatations.length > 0 && (
                        <TouchableOpacity
                            style={styles.exportButton}
                            onPress={exportToPDF}
                            disabled={loading}
                        >
                            <Text style={styles.exportButtonText}>
                                {loading ? 'Export en cours...' : '📄 Exporter en PDF'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Liste des constatations */}
                    {constatations.map((c, i) => (
                        <View key={i} style={styles.card}>
                            {/* Badge Entreprise */}
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{c.company}</Text>
                            </View>

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

                            {/* Numéro de rapport */}
                            <Text style={styles.label}>Numéro de rapport :</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Ex: 123"
                                keyboardType="numeric"
                                value={form.reportNumber}
                                onChangeText={v => updateForm('reportNumber', v)}
                            />

                            {/* Nom du chantier */}
                            <Text style={styles.label}>Nom du chantier :</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Ex: Chantier XYZ"
                                value={form.chantierName}
                                onChangeText={v => updateForm('chantierName', v)}
                            />

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

    exportButton: {
        backgroundColor: '#4caf50',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    exportButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },

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
    textInput: {
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 8,
        fontSize: 14,
    },
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
