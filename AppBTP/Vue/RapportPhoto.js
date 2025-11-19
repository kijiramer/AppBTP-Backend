import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions, Alert, TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
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
    const [form, setForm] = useState({ avant: null, apres: null, batiment: building || '', intituleMission: '', chantierName: city || '', entreprise: '' });
    const [showForm, setShowForm] = useState(false);
    const [hasLibraryPermission, setHasLibraryPermission] = useState(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(null);
    const [showImageSourceModal, setShowImageSourceModal] = useState(false);
    const [currentImageType, setCurrentImageType] = useState(null);
    const [batimentSuggestions, setBatimentSuggestions] = useState([]);
    const [intituleMissionSuggestions, setIntituleMissionSuggestions] = useState([]);
    const [chantierNameSuggestions, setChantierNameSuggestions] = useState([]);
    const [entrepriseSuggestions, setEntrepriseSuggestions] = useState([]);
    const [showBatimentSuggestions, setShowBatimentSuggestions] = useState(false);
    const [showIntituleMissionSuggestions, setShowIntituleMissionSuggestions] = useState(false);
    const [showChantierNameSuggestions, setShowChantierNameSuggestions] = useState(false);
    const [showEntrepriseSuggestions, setShowEntrepriseSuggestions] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState({});
    const [scrollEnabled, setScrollEnabled] = useState(true);

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
                const batimentHistory = await AsyncStorage.getItem('rapportPhoto_batiment_history');
                const intituleMissionHistory = await AsyncStorage.getItem('rapportPhoto_intituleMission_history');
                const chantierNameHistory = await AsyncStorage.getItem('rapportPhoto_chantierName_history');
                const entrepriseHistory = await AsyncStorage.getItem('rapportPhoto_entreprise_history');

                if (batimentHistory) {
                    const batiments = JSON.parse(batimentHistory);
                    setBatimentSuggestions(batiments.sort());
                }
                if (intituleMissionHistory) {
                    const missions = JSON.parse(intituleMissionHistory);
                    setIntituleMissionSuggestions(missions.sort());
                }
                if (chantierNameHistory) {
                    const chantierNames = JSON.parse(chantierNameHistory);
                    setChantierNameSuggestions(chantierNames.sort());
                }
                if (entrepriseHistory) {
                    const entreprises = JSON.parse(entrepriseHistory);
                    setEntrepriseSuggestions(entreprises.sort());
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
        Alert.alert(
            'Choisir une photo',
            'Sélectionnez la source de votre photo',
            [
                {
                    text: 'Prendre une photo',
                    onPress: () => takePhoto(type)
                },
                {
                    text: 'Choisir depuis la galerie',
                    onPress: () => pickImageFromGallery(type)
                },
                {
                    text: 'Annuler',
                    style: 'cancel'
                }
            ]
        );
    };

    const pickImageFromGallery = async (type) => {
        const imageType = type || currentImageType;
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
                setForm(prev => ({ ...prev, [imageType]: result.assets[0].uri }));
            }
        } catch (e) {
            console.warn("Erreur sélection image: ", e);
            Alert.alert("Erreur", "Impossible de sélectionner l'image");
        }
    };

    const takePhoto = async (type) => {
        const imageType = type || currentImageType;
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
                setForm(prev => ({ ...prev, [imageType]: result.assets[0].uri }));
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
                setRapportsPhotos(response.data.rapportsPhotos.map(constatation => ({
                    id: constatation._id,
                    batiment: constatation.batiment,
                    intituleMission: constatation.intituleMission,
                    chantierName: constatation.chantierName,
                    entreprise: constatation.entreprise,
                    avant: constatation.imageAvant,
                    apres: constatation.imageApres,
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

        if (!form.batiment.trim() || !form.intituleMission.trim() || !form.chantierName.trim() || !form.entreprise.trim()) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
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
                batiment: form.batiment,
                intituleMission: form.intituleMission,
                chantierName: form.chantierName,
                entreprise: form.entreprise,
                city,
                building,
                task,
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
                        setSuggestions(newSuggestions.sort());
                    }
                };

                await updateHistory('rapportPhoto_batiment_history', form.batiment, batimentSuggestions, setBatimentSuggestions);
                await updateHistory('rapportPhoto_intituleMission_history', form.intituleMission, intituleMissionSuggestions, setIntituleMissionSuggestions);
                await updateHistory('rapportPhoto_chantierName_history', form.chantierName, chantierNameSuggestions, setChantierNameSuggestions);
                await updateHistory('rapportPhoto_entreprise_history', form.entreprise, entrepriseSuggestions, setEntrepriseSuggestions);

                // Rafraîchir la liste complète
                await loadRapportsPhotos();
                await fetchAllRapportsPhotos();

                // Réinitialiser le formulaire - vider tous les champs sauf chantierName (qui reste la ville)
                setForm({ avant: null, apres: null, batiment: '', intituleMission: '', chantierName: city || '', entreprise: '' });
                setShowForm(false);

                Alert.alert('Succès', 'Rapport photo ajouté avec succès');
            }
        } catch (err) {
            console.error('Error adding rapport photo:', err);
            Alert.alert('Erreur', 'Impossible d\'ajouter le rapport photo');
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
    
            // Fonction helper pour convertir une URI en base64
            const convertUriToBase64 = async (uri) => {
                try {
                    const base64 = await FileSystem.readAsStringAsync(uri, {
                        encoding: 'base64',
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
    
            // Exporter tous les rapports photos disponibles (tous les dossiers)
            const selectedRapports = rapportsPhotos;
    
            // Convertir toutes les images en base64
            const rapportsWithBase64 = await Promise.all(
                selectedRapports.map(async (c) => {
                    try {
                        const avantBase64 = await convertUriToBase64(c.avant);
                        const apresBase64 = await convertUriToBase64(c.apres);
                        return { ...c, avantBase64, apresBase64 };
                    } catch (error) {
                        console.error('Error converting images:', error);
                        return null;
                    }
                })
            );
    
            const validRapports = rapportsWithBase64.filter(c => c !== null);
    
            if (validRapports.length === 0) {
                Alert.alert('Erreur', 'Impossible de charger les images');
                return;
            }
    
            // Grouper par chantier (city, building, entreprise, date)
            const groupedByChantier = {};
            validRapports.forEach((rapport) => {
                // Utiliser entreprise ou company (rétrocompatibilité)
                const entrepriseValue = rapport.entreprise || rapport.company || 'N/A';
                const key = `${rapport.city}|${rapport.building}|${entrepriseValue}|${new Date(rapport.selectedDate).toLocaleDateString()}`;
                if (!groupedByChantier[key]) {
                    groupedByChantier[key] = {
                        info: {
                            intituleMission: rapport.intituleMission || 'Mission non spécifiée',
                            chantierName: rapport.chantierName || rapport.city || 'N/A',
                            city: rapport.city || 'N/A',
                            building: rapport.building || 'N/A',
                            entreprise: entrepriseValue,
                            selectedDate: rapport.selectedDate
                        },
                        photos: []
                    };
                }
                groupedByChantier[key].photos.push(rapport);
            });
    
            // Générer le HTML comme la webapp
            let htmlPages = '';
            let currentPageNumber = 1;
            let photosOnCurrentPage = 0;
            const maxPhotosFirstPage = 3;
            const maxPhotosOtherPages = 4;
    
            // Pour chaque groupe de chantier
            const groups = Object.values(groupedByChantier);
            for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
                const group = groups[groupIndex];
    
                // Header du groupe (tableau d'informations)
                const groupHeader = `
                    <div style="width: 420px; margin: 0 auto 25px auto; border: 2px solid #000; border-radius: 8px; padding: 0; overflow: hidden;">
                        <div style="padding: 10px 8px; border-bottom: 1px solid #000;">
                            <div style="font-size: 9pt; font-weight: bold;">
                                PROMOTEUR: ${(group.info.entreprise || 'N/A').toUpperCase()} - VILLE: ${(group.info.city || 'N/A').toUpperCase()}
                            </div>
                        </div>
                        <div style="padding: 10px 8px; border-bottom: 1px solid #000;">
                            <div style="font-size: 9pt;">Mission: ${group.info.intituleMission || 'Mission non spécifiée'}</div>
                        </div>
                        <div style="padding: 10px 8px;">
                            <div style="font-size: 9pt;">Intervention le: ${selectedDate.toLocaleDateString('fr-FR')}</div>
                        </div>
                    </div>
                `;
    
                // Photos du groupe
                for (let i = 0; i < group.photos.length; i++) {
                    const rapport = group.photos[i];
                    const maxPhotosOnPage = currentPageNumber === 1 ? maxPhotosFirstPage : maxPhotosOtherPages;
    
                    // Nouvelle page si nécessaire
                    if (photosOnCurrentPage >= maxPhotosOnPage) {
                        htmlPages += '</div></div>'; // Fermer page précédente
                        currentPageNumber++;
                        photosOnCurrentPage = 0;
    
                        // Nouvelle page avec logo en haut à gauche (plus petit)
                        htmlPages += `
                        <div class="page">
                            <div style="margin-bottom: 20px;">
                                <img src="${logoBase64}" style="width: 80px; height: 40px; object-fit: contain;" />
                            </div>
                            <div class="content">
                        `;
                    }
    
                    // Si première photo de la page, ajouter le header uniquement sur la page 1
                    if (photosOnCurrentPage === 0 && currentPageNumber === 1 && groupIndex === 0) {
                        // Page 1: Logo centré + titre + header
                        htmlPages = `
                        <div class="page">
                            <div style="text-align: center; margin-bottom: 15px;">
                                <img src="${logoBase64}" style="width: 160px; height: 80px; object-fit: contain;" />
                            </div>
                            <div style="text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 20pt; font-weight: bold; margin-bottom: 20px;">
                                <span style="border-bottom: 2px solid #000; padding-bottom: 2px;">Rapport Photo d'Intervention - ${city}</span>
                            </div>
                            <div class="content">
                        ` + groupHeader;
                    }
    
                    // Paire de photos
                    htmlPages += `
                        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 20px; page-break-inside: avoid;">
                            <div style="text-align: center;">
                                <div style="font-weight: bold; font-size: 10pt; margin-bottom: 5px;">AVANT</div>
                                <img src="${rapport.avantBase64}" style="width: 185px; height: 132px; object-fit: cover; border: 1px solid #999;" />
                            </div>
                            <div style="margin: 0 15px;">
                                <svg width="40" height="20" style="display: block;">
                                    <line x1="0" y1="10" x2="32" y2="10" stroke="black" stroke-width="2"/>
                                    <polygon points="40,10 32,6 32,14" fill="black"/>
                                </svg>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-weight: bold; font-size: 10pt; margin-bottom: 5px;">APRÈS</div>
                                <img src="${rapport.apresBase64}" style="width: 185px; height: 132px; object-fit: cover; border: 1px solid #999;" />
                            </div>
                        </div>
                    `;
    
                    photosOnCurrentPage++;
                }
            }
    
            // Fermer la dernière page
            htmlPages += '</div></div>';
    
            // Compter le nombre total de pages
            const totalPages = currentPageNumber;
    
            // HTML complet
            const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @page { size: A4; margin: 15mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Helvetica, Arial, sans-serif; background: white; color: #000; }
            .page { page-break-after: always; padding: 10px 20px; position: relative; min-height: 800px; }
            .page:last-child { page-break-after: auto; }
            .content { margin-bottom: 40px; }
            .footer { position: absolute; bottom: 10px; left: 0; right: 0; text-align: center; font-size: 10pt; }
        </style>
    </head>
    <body>
    ${htmlPages}
    <script>
        const pages = document.querySelectorAll('.page');
        pages.forEach((page, index) => {
            const footer = document.createElement('div');
            footer.className = 'footer';
            footer.textContent = 'Page ' + (index + 1) + ' / ' + ${totalPages};
            page.appendChild(footer);
        });
    </script>
    </body>
    </html>
            `;
    
            // Créer le PDF
            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                width: 595,
                height: 842
            });
    
            const fileName = `rapport-intervention-${city}-${selectedDate.toISOString().split('T')[0]}.pdf`.replace(/\s+/g, '-');
    
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
                    enableAutomaticScroll={false}
                    extraScrollHeight={20}
                    keyboardShouldPersistTaps="handled"
                    enableResetScrollToCoords={false}
                    scrollEnabled={scrollEnabled}
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

                    {/* Liste des rapportsPhotos groupés par mission */}
                    {(() => {
                        // Grouper les rapports par intituleMission
                        const groupedByMission = rapportsPhotos.reduce((acc, rapport) => {
                            const mission = rapport.intituleMission || 'Sans mission';
                            if (!acc[mission]) {
                                acc[mission] = [];
                            }
                            acc[mission].push(rapport);
                            return acc;
                        }, {});

                        return Object.entries(groupedByMission).map(([mission, rapports]) => {
                            const isExpanded = expandedFolders[mission] || false;
                            const displayedRapports = isExpanded ? rapports : rapports.slice(0, 2);
                            const hasMore = rapports.length > 2;

                            return (
                                <View key={mission} style={styles.folderContainer}>
                                    {/* Header du dossier */}
                                    <TouchableOpacity
                                        onPress={() => setExpandedFolders(prev => ({
                                            ...prev,
                                            [mission]: !prev[mission]
                                        }))}
                                    >
                                        <Text style={styles.folderTitle}>
                                            📁 {mission} ({rapports.length}) {hasMore ? (isExpanded ? '▲' : '▼') : ''}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Photos du dossier */}
                                    {displayedRapports.map((c, i) => (
                                        <View key={c.id || i} style={styles.card}>
                                            {/* Badge avec infos */}
                                            <View style={styles.badgeRow}>
                                                <View style={styles.badge}>
                                                    <Text style={styles.badgeText}>{c.entreprise || c.company || 'N/A'}</Text>
                                                </View>
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

                                    {/* Message "voir plus" si nécessaire */}
                                    {!isExpanded && hasMore && (
                                        <TouchableOpacity
                                            style={styles.seeMoreButton}
                                            onPress={() => setExpandedFolders(prev => ({
                                                ...prev,
                                                [mission]: true
                                            }))}
                                        >
                                            <Text style={styles.seeMoreText}>
                                                Voir {rapports.length - 2} de plus...
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        });
                    })()}

                    {/* Bouton "＋" */}
                    {!showForm && (
                        <TouchableOpacity
                            style={styles.toggleCircle}
                            onPress={() => setShowForm(true)}
                        >
                            <Text style={styles.toggleCircleText}>＋</Text>
                        </TouchableOpacity>
                    )}
                </KeyboardAwareScrollView>

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
                                contentContainerStyle={{ padding: 16, paddingBottom: 250 }}
                                keyboardShouldPersistTaps="always"
                                showsVerticalScrollIndicator={true}
                                nestedScrollEnabled={true}
                                bounces={true}
                            >
                            {/* Bouton ✕ */}
                            <TouchableOpacity
                                style={styles.closeFormBtn}
                                onPress={() => setShowForm(false)}
                            >
                                <Text style={styles.closeFormText}>✕</Text>
                            </TouchableOpacity>

                            {/* Batiment */}
                            <Text style={styles.label}>Bâtiment :</Text>
                            <View style={{ position: 'relative' }}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Ex: Bâtiment A"
                                    placeholderTextColor="#999"
                                    value={form.batiment}
                                    onChangeText={v => updateForm('batiment', v)}
                                    onFocus={() => setShowBatimentSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowBatimentSuggestions(false), 200)}
                                />
                                {showBatimentSuggestions && batimentSuggestions.length > 0 && (
                                    <ScrollView
                                        style={styles.suggestionsContainer}
                                        nestedScrollEnabled={true}
                                        keyboardShouldPersistTaps="always"
                                        showsVerticalScrollIndicator={true}
                                    >
                                        {batimentSuggestions.map((suggestion, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                style={styles.suggestionItem}
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    updateForm('batiment', suggestion);
                                                    setShowBatimentSuggestions(false);
                                                }}
                                            >
                                                <Text style={styles.suggestionText}>{suggestion}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>

                            {/* Intitulé Mission */}
                            <Text style={styles.label}>Intitulé Mission :</Text>
                            <View style={{ position: 'relative' }}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Ex: Electricité"
                                    placeholderTextColor="#999"
                                    value={form.intituleMission}
                                    onChangeText={v => updateForm('intituleMission', v)}
                                    onFocus={() => setShowIntituleMissionSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowIntituleMissionSuggestions(false), 200)}
                                />
                                {showIntituleMissionSuggestions && intituleMissionSuggestions.length > 0 && (
                                    <ScrollView
                                        style={styles.suggestionsContainer}
                                        nestedScrollEnabled={true}
                                        keyboardShouldPersistTaps="always"
                                        showsVerticalScrollIndicator={true}
                                    >
                                        {intituleMissionSuggestions.map((suggestion, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                style={styles.suggestionItem}
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    updateForm('intituleMission', suggestion);
                                                    setShowIntituleMissionSuggestions(false);
                                                }}
                                            >
                                                <Text style={styles.suggestionText}>{suggestion}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>

                            {/* Nom du chantier */}
                            <Text style={styles.label}>Nom du chantier :</Text>
                            <View style={{ position: 'relative' }}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Ex: Chantier XYZ"
                                    placeholderTextColor="#999"
                                    value={form.chantierName}
                                    onChangeText={v => updateForm('chantierName', v)}
                                    onFocus={() => setShowChantierNameSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowChantierNameSuggestions(false), 200)}
                                />
                                {showChantierNameSuggestions && chantierNameSuggestions.length > 0 && (
                                    <ScrollView
                                        style={styles.suggestionsContainer}
                                        nestedScrollEnabled={true}
                                        keyboardShouldPersistTaps="always"
                                        showsVerticalScrollIndicator={true}
                                    >
                                        {chantierNameSuggestions.map((suggestion, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                style={styles.suggestionItem}
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    updateForm('chantierName', suggestion);
                                                    setShowChantierNameSuggestions(false);
                                                }}
                                            >
                                                <Text style={styles.suggestionText}>{suggestion}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>

                            {/* Entreprise */}
                            <Text style={styles.label}>Entreprise :</Text>
                            <View style={{ position: 'relative' }}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Ex: Entreprise A"
                                    placeholderTextColor="#999"
                                    value={form.entreprise}
                                    onChangeText={v => updateForm('entreprise', v)}
                                    onFocus={() => setShowEntrepriseSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowEntrepriseSuggestions(false), 200)}
                                />
                                {showEntrepriseSuggestions && entrepriseSuggestions.length > 0 && (
                                    <ScrollView
                                        style={styles.suggestionsContainer}
                                        nestedScrollEnabled={true}
                                        keyboardShouldPersistTaps="always"
                                        showsVerticalScrollIndicator={true}
                                    >
                                        {entrepriseSuggestions.map((suggestion, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                style={styles.suggestionItem}
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    updateForm('entreprise', suggestion);
                                                    setShowEntrepriseSuggestions(false);
                                                }}
                                            >
                                                <Text style={styles.suggestionText}>{suggestion}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
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
                        </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

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
        maxHeight: '75%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
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

    // Styles pour les dossiers
    folderContainer: {
        marginBottom: 20,
    },
    folderTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#414248',
        marginTop: 16,
        marginBottom: 12,
        marginLeft: 4,
    },
    badgeRow: {
        flexDirection: 'row',
        position: 'absolute',
        top: -10,
        left: 16,
        zIndex: 10,
        gap: 8,
    },
    seeMoreButton: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 8,
    },
    seeMoreText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
});
