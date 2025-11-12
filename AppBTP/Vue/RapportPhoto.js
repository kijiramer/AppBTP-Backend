import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import Storage from '../utils/Storage';
import { API_BASE_URL } from '../config';

import Header from './Header';
import ScreenWrapper from '../Controleur/ScreenWrapper';
import { displayCalendarScreen } from './Components/Calendar';

export default function RapportPhoto({ route, navigation }) {
    const { city, building, task } = route.params;

    const [rapportsPhotos, setRapportsPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [form, setForm] = useState({ avant: null, apres: null, company: '', reportNumber: '', chantierName: '' });
    const [showForm, setShowForm] = useState(false);
    const [hasLibraryPermission, setHasLibraryPermission] = useState(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(null);
    const [showImageSourceModal, setShowImageSourceModal] = useState(false);
    const [currentImageType, setCurrentImageType] = useState(null);
    const [reportNumberSuggestions, setReportNumberSuggestions] = useState([]);
    const [chantierNameSuggestions, setChantierNameSuggestions] = useState([]);
    const [companySuggestions, setCompanySuggestions] = useState([]);
    const [showReportNumberSuggestions, setShowReportNumberSuggestions] = useState(false);
    const [showChantierNameSuggestions, setShowChantierNameSuggestions] = useState(false);
    const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);

    // Charger l'historique des valeurs saisies
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const reportNumberHistory = await AsyncStorage.getItem('rapportPhoto_reportNumber_history');
                const chantierNameHistory = await AsyncStorage.getItem('rapportPhoto_chantierName_history');
                const companyHistory = await AsyncStorage.getItem('rapportPhoto_company_history');

                if (reportNumberHistory) {
                    const reportNumbers = JSON.parse(reportNumberHistory);
                    setReportNumberSuggestions(reportNumbers.sort((a, b) => {
                        const numA = parseInt(a) || 0;
                        const numB = parseInt(b) || 0;
                        return numA - numB;
                    }));
                }
                if (chantierNameHistory) {
                    const chantierNames = JSON.parse(chantierNameHistory);
                    setChantierNameSuggestions(chantierNames.sort());
                }
                if (companyHistory) {
                    const companies = JSON.parse(companyHistory);
                    setCompanySuggestions(companies.sort());
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
            // Permission pour la galerie
            const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
            setHasLibraryPermission(libraryStatus.status === 'granted');

            // Permission pour la caméra
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

    const updateForm = (field, value) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const openImageSourceModal = (type) => {
        setCurrentImageType(type);
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
                setForm(prev => ({ ...prev, [currentImageType]: result.assets[0].uri }));
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
                setForm(prev => ({ ...prev, [currentImageType]: result.assets[0].uri }));
                setShowImageSourceModal(false);
            }
        } catch (e) {
            console.warn("Erreur prise photo: ", e);
            Alert.alert("Erreur", "Impossible de prendre la photo");
        }
    };

    // Fonction pour charger les rapportsPhotos depuis l'API
    const loadRapportsPhotos = async () => {
        try {
            setLoading(true);
            const token = await Storage.getItem('token');
            if (!token) {
                Alert.alert('Erreur', 'Vous devez être connecté');
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/rapportsPhotos?city=${city}&building=${building}&task=${task}&selectedDate=${selectedDate.toISOString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                setConstatations(response.data.rapportsPhotos.map(constatation => ({
                    id: constatation._id,
                    company: constatation.company,
                    avant: constatation.imageAvant,
                    apres: constatation.imageApres,
                    chantierName: constatation.chantierName,
                    reportNumber: constatation.reportNumber,
                })));
            }
        } catch (err) {
            console.error('Error loading rapportsPhotos:', err);
            Alert.alert('Erreur', 'Impossible de charger les rapportsPhotos');
        } finally {
            setLoading(false);
        }
    };

    const addRapportPhoto = async () => {
        if (!form.avant || !form.apres) {
            Alert.alert('Erreur', 'Veuillez sélectionner les deux photos (avant et après)');
            return;
        }

        if (!form.reportNumber || !form.chantierName.trim() || !form.company.trim()) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs (numéro de rapport, nom du chantier et entreprise)');
            return;
        }

        try {
            setLoading(true);
            const token = await Storage.getItem('token');
            if (!token) {
                Alert.alert('Erreur', 'Vous devez être connecté');
                return;
            }

            const rapportPhotoData = {
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

            const response = await axios.post(`${API_BASE_URL}/rapportsPhotos`, rapportPhotoData, {
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
                        if (key.includes('reportNumber')) {
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

                await updateHistory('rapportPhoto_reportNumber_history', form.reportNumber, reportNumberSuggestions, setReportNumberSuggestions);
                await updateHistory('rapportPhoto_chantierName_history', form.chantierName, chantierNameSuggestions, setChantierNameSuggestions);
                await updateHistory('rapportPhoto_company_history', form.company, companySuggestions, setCompanySuggestions);

                // Ajouter la nouvelle constatation à l'état local
                setConstatations(prev => [
                    {
                        company: form.company,
                        avant: form.avant,
                        apres: form.apres,
                    },
                    ...prev,
                ]);

                // Réinitialiser le formulaire - vider tous les champs
                setForm({ avant: null, apres: null, company: '', reportNumber: '', chantierName: '' });
                setShowForm(false);

                // Rafraîchir les dates avec rapportsPhotos pour mettre à jour les pastilles
                fetchAllRapportsPhotos();

                Alert.alert('Succès', 'Constatation ajoutée avec succès');
            }
        } catch (err) {
            console.error('Error adding constatation:', err);
            Alert.alert('Erreur', 'Impossible d\'ajouter la constatation');
        } finally {
            setLoading(false);
        }
    };

    const exportToPDF = async () => {
        if (rapportsPhotos.length === 0) {
            Alert.alert('Erreur', 'Aucune constatation à exporter');
            return;
        }

        try {
            setLoading(true);

            // Fonction helper pour convertir une URI en base64 (React Native compatible)
            const convertUriToBase64 = async (uri) => {
                try {
                    const base64 = await FileSystem.readAsStringAsync(uri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    return `data:image/jpeg;base64,${base64}`;
                } catch (error) {
                    console.error('Error converting URI to base64:', error);
                    throw error;
                }
            };

            // Récupérer le logo et le convertir en base64
            const { Asset } = require('expo-asset');
            const logoAsset = Asset.fromModule(require('../assets/logo.jpg'));
            await logoAsset.downloadAsync();
            const logoBase64 = await convertUriToBase64(logoAsset.localUri || logoAsset.uri);

            // Convertir toutes les images des rapportsPhotos en base64
            const rapportsPhotosWithBase64 = await Promise.all(
                rapportsPhotos.map(async (c) => {
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

            // Filtrer les rapportsPhotos nulles (erreur de conversion)
            const validConstatations = rapportsPhotosWithBase64.filter(c => c !== null);

            if (validConstatations.length === 0) {
                Alert.alert('Erreur', 'Impossible de charger les images');
                return;
            }

            // Récupérer les informations depuis les rapportsPhotos déjà chargées
            const chantierName = validConstatations[0]?.chantierName || building || city;
            const promoteur = validConstatations[0]?.company || 'N/A';

            console.log('Informations PDF:', { chantierName, promoteur, building, city });

            // Calculer le nombre de pages (3 paires par page)
            const totalPages = Math.ceil(validConstatations.length / 3);

            // Générer le HTML avec la mise en page verticale comme le PDF de référence
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            background: white;
            color: #000;
        }
        .page {
            page-break-after: always;
            padding: 20px;
        }
        .page:last-child {
            page-break-after: auto;
        }
        /* Logo centré en haut */
        .logo-container {
            text-align: center;
            margin-bottom: 15px;
        }
        .logo-container img {
            width: 160px;
            height: 80px;
            object-fit: contain;
        }
        /* Titre principal */
        .main-title {
            text-align: center;
            font-family: 'Times New Roman', Times, serif;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            text-decoration: underline;
        }
        /* Encadré d'informations */
        .info-box {
            width: 100%;
            margin: 0 auto 30px auto;
            border: 2px solid #000;
            border-radius: 10px;
            padding: 15px;
        }
        .info-line {
            font-size: 11px;
            margin-bottom: 5px;
        }
        .info-line:last-child {
            margin-bottom: 0;
        }
        .info-line.bold {
            font-weight: bold;
        }
        /* Section photos - disposition VERTICALE */
        .photos-section {
            margin-top: 20px;
        }
        /* Paire de photos AVANT/APRÈS (disposition horizontale dans chaque paire) */
        .photo-pair {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .photo-block {
            text-align: center;
        }
        .photo-title {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .photo-block img {
            width: 240px;
            height: 180px;
            object-fit: cover;
            border: 1px solid #999;
        }
        .arrow-separator {
            font-size: 40px;
            font-weight: bold;
            margin: 0 20px;
            color: #000;
        }
        /* Pied de page */
        .footer {
            text-align: center;
            font-size: 10px;
            color: #333;
            margin-top: 30px;
        }
    </style>
</head>
<body>
${Array.from({ length: totalPages }, (_, pageIndex) => {
    const startIndex = pageIndex * 3;
    const endIndex = Math.min(startIndex + 3, validConstatations.length);
    const pagePairs = validConstatations.slice(startIndex, endIndex);

    return `
    <div class="page">
        <!-- Logo centré -->
        <div class="logo-container">
            <img src="${logoBase64}" alt="Logo" />
        </div>

        <!-- Titre principal -->
        <div class="main-title">Rapport Photo d'Intervention - ${chantierName}</div>

        <!-- Encadré d'informations -->
        <div class="info-box">
            <div class="info-line bold">
                PROMOTEUR: ${promoteur.toUpperCase()} - VILLE: ${city.toUpperCase()}
            </div>
            <div class="info-line">
                Mission: ${task}
            </div>
            <div class="info-line">
                Intervention le: ${selectedDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
        </div>

        <!-- Section photos (3 paires par page maximum, disposition verticale) -->
        <div class="photos-section">
            ${pagePairs.map((c, index) => `
            <div class="photo-pair">
                <div class="photo-block">
                    <div class="photo-title">AVANT</div>
                    <img src="${c.avantBase64}" alt="Photo avant ${startIndex + index + 1}" />
                </div>
                <div class="arrow-separator">→</div>
                <div class="photo-block">
                    <div class="photo-title">APRÈS</div>
                    <img src="${c.apresBase64}" alt="Photo après ${startIndex + index + 1}" />
                </div>
            </div>
            `).join('')}
        </div>

        <!-- Pied de page -->
        <div class="footer">
            Page ${pageIndex + 1} / ${totalPages}
        </div>
    </div>
    `;
}).join('')}
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

    // Charger les rapportsPhotos au montage du composant et quand la date change
    useEffect(() => {
        loadRapportsPhotos();
    }, [city, building, task, selectedDate]);

    // Charger toutes les rapportsPhotos pour marquer les dates avec pastilles
    const [allConstatations, setAllConstatations] = useState([]);
    const [datesWithRapportsPhotos, setDatesWithConstatations] = useState([]);

    const fetchAllRapportsPhotos = async () => {
        try {
            const token = await Storage.getItem('token');
            if (!token) return;

            const response = await axios.get(`${API_BASE_URL}/rapportsPhotos?city=${city}&building=${building}&task=${task}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                const allConsts = response.data.rapportsPhotos || [];
                setAllConstatations(allConsts);

                // Extraire les dates uniques avec rapportsPhotos
                const uniqueDates = [...new Set(
                    allConsts.map(c => {
                        const date = new Date(c.selectedDate);
                        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    })
                )];
                setDatesWithConstatations(uniqueDates);
            }
        } catch (err) {
            console.error('Error loading all rapportsPhotos:', err);
        }
    };

    useEffect(() => {
        fetchAllRapportsPhotos();
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
                        {displayCalendarScreen(selectedDate, setSelectedDate, datesWithRapportsPhotos)}
                    </View>

                    {/* Bouton Export PDF */}
                    {rapportsPhotos.length > 0 && (
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

                    {/* Liste des rapportsPhotos */}
                    {rapportsPhotos.map((c, i) => (
                        <View key={c.id || i} style={styles.card}>
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
                        <View style={styles.formCard}>
                            {/* Bouton ✕ */}
                            <TouchableOpacity
                                style={styles.closeFormBtn}
                                onPress={() => setShowForm(false)}
                            >
                                <Text style={styles.closeFormText}>✕</Text>
                            </TouchableOpacity>

                            {/* Numéro de rapport */}
                            <Text style={styles.label}>Numéro de rapport :</Text>
                            <View style={{ position: 'relative' }}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Ex: 123"
                                    keyboardType="numeric"
                                    value={form.reportNumber}
                                    onChangeText={v => updateForm('reportNumber', v)}
                                    onFocus={() => setShowReportNumberSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowReportNumberSuggestions(false), 200)}
                                />
                                {showReportNumberSuggestions && reportNumberSuggestions.length > 0 && (
                                    <View style={styles.suggestionsContainer}>
                                        <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                                            {reportNumberSuggestions.map((suggestion, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    style={styles.suggestionItem}
                                                    onPress={() => {
                                                        updateForm('reportNumber', suggestion);
                                                        setShowReportNumberSuggestions(false);
                                                    }}
                                                >
                                                    <Text style={styles.suggestionText}>{suggestion}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            {/* Nom du chantier */}
                            <Text style={styles.label}>Nom du chantier :</Text>
                            <View style={{ position: 'relative' }}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Ex: Chantier XYZ"
                                    value={form.chantierName}
                                    onChangeText={v => updateForm('chantierName', v)}
                                    onFocus={() => setShowChantierNameSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowChantierNameSuggestions(false), 200)}
                                />
                                {showChantierNameSuggestions && chantierNameSuggestions.length > 0 && (
                                    <View style={styles.suggestionsContainer}>
                                        <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                                            {chantierNameSuggestions.map((suggestion, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    style={styles.suggestionItem}
                                                    onPress={() => {
                                                        updateForm('chantierName', suggestion);
                                                        setShowChantierNameSuggestions(false);
                                                    }}
                                                >
                                                    <Text style={styles.suggestionText}>{suggestion}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            {/* Entreprise */}
                            <Text style={styles.label}>Entreprise :</Text>
                            <View style={{ position: 'relative' }}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Ex: Entreprise A"
                                    value={form.company}
                                    onChangeText={v => updateForm('company', v)}
                                    onFocus={() => setShowCompanySuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 200)}
                                />
                                {showCompanySuggestions && companySuggestions.length > 0 && (
                                    <View style={styles.suggestionsContainer}>
                                        <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                                            {companySuggestions.map((suggestion, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    style={styles.suggestionItem}
                                                    onPress={() => {
                                                        updateForm('company', suggestion);
                                                        setShowCompanySuggestions(false);
                                                    }}
                                                >
                                                    <Text style={styles.suggestionText}>{suggestion}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            {/* Sélection Avant */}
                            <Text style={styles.label}>Photo Avant :</Text>
                            <TouchableOpacity
                                style={styles.photoButton}
                                onPress={() => openImageSourceModal('avant')}
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
                                onPress={() => openImageSourceModal('apres')}
                            >
                                <Text style={styles.photoButtonText}>
                                    {form.apres ? 'Changer photo' : 'Choisir photo'}
                                </Text>
                            </TouchableOpacity>
                            {form.apres && <Image source={{ uri: form.apres }} style={styles.preview} />}

                            {/* Bouton Ajouter */}
                            <TouchableOpacity
                                style={styles.validateButton}
                                onPress={addRapportPhoto}
                            >
                                <Text style={styles.validateText}>Valider</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </KeyboardAwareScrollView>

                {/* Modal de sélection de source d'image */}
                <Modal
                    visible={showImageSourceModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowImageSourceModal(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowImageSourceModal(false)}
                    >
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Choisir une photo</Text>

                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={takePhoto}
                            >
                                <Text style={styles.modalButtonIcon}>📷</Text>
                                <Text style={styles.modalButtonText}>Prendre une photo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={pickImageFromGallery}
                            >
                                <Text style={styles.modalButtonIcon}>🖼️</Text>
                                <Text style={styles.modalButtonText}>Choisir depuis la galerie</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancelButton]}
                                onPress={() => setShowImageSourceModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Annuler</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
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
        marginTop: 15,
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

    // Styles pour le modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        maxWidth: 400,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    modalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f26463',
        padding: 15,
        borderRadius: 8,
        marginBottom: 12,
        elevation: 2,
    },
    modalButtonIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    modalCancelButton: {
        backgroundColor: '#ddd',
        marginTop: 8,
        justifyContent: 'center',
    },
    modalCancelText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        flex: 1,
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
});
