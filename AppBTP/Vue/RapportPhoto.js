import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, TextInput, Modal, ScrollView } from 'react-native';
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
import { useUserRole } from '../Controleur/UserRoleContext';

<<<<<<< HEAD
export default function RapportPhoto({ route, navigation }) {
    const { city, building, task } = route.params;
    const { canAddItem } = useUserRole();
=======
// Fonction helper pour formater une date en YYYY-MM-DD (heure locale)
const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function RapportPhoto({ route, navigation }) {
    const { city, building, task } = route.params;
    const { canAddItem, canDelete } = useUserRole();
>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b

    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showFolderForm, setShowFolderForm] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [hasLibraryPermission, setHasLibraryPermission] = useState(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(null);
    const [scrollEnabled, setScrollEnabled] = useState(true);
    const [expandedFolders, setExpandedFolders] = useState({});
    const [folderPhotos, setFolderPhotos] = useState({});

    // Form pour créer un dossier
    const [form, setForm] = useState({
        intituleMission: '',
        chantierName: city || '',
        company: '',
        mission: '',
        startDate: new Date(),
        endDate: null,
    });

    // Form pour ajouter des photos
    const [photoForm, setPhotoForm] = useState({
        avant: null,
        apres: null,
    });

    // Suggestions d'autocomplétion
    const [intituleMissionSuggestions, setIntituleMissionSuggestions] = useState([]);
    const [chantierNameSuggestions, setChantierNameSuggestions] = useState([]);
    const [companySuggestions, setCompanySuggestions] = useState([]);
    const [showIntituleMissionSuggestions, setShowIntituleMissionSuggestions] = useState(false);
    const [showChantierNameSuggestions, setShowChantierNameSuggestions] = useState(false);
    const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);

    // Désactiver le scroll quand un formulaire s'ouvre
    useEffect(() => {
        if (showFolderForm || showPhotoModal) {
            setScrollEnabled(false);
        } else {
            setScrollEnabled(true);
        }
    }, [showFolderForm, showPhotoModal]);

    // Charger l'historique des valeurs saisies
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const intituleMissionHistory = await AsyncStorage.getItem('rapportPhoto_intituleMission_history');
                const chantierNameHistory = await AsyncStorage.getItem('rapportPhoto_chantierName_history');
                const companyHistory = await AsyncStorage.getItem('rapportPhoto_company_history');

                if (intituleMissionHistory) setIntituleMissionSuggestions(JSON.parse(intituleMissionHistory).sort());
                if (chantierNameHistory) setChantierNameSuggestions(JSON.parse(chantierNameHistory).sort());
                if (companyHistory) setCompanySuggestions(JSON.parse(companyHistory).sort());
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

    const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
    const updatePhotoForm = (field, value) => setPhotoForm(prev => ({ ...prev, [field]: value }));

    // Charger les dossiers depuis l'API
    const loadFolders = async () => {
        try {
            setLoading(true);
            const token = await Storage.getItem('token');
            if (!token) {
                Alert.alert('Erreur', 'Vous devez être connecté');
                return;
            }

<<<<<<< HEAD
            const response = await axios.get(`${API_BASE_URL}/folders?city=${city}&building=${building}&task=${task}`, {
=======
            const dateStr = formatLocalDate(selectedDate);
            console.log('📁 Loading folders for date:', dateStr);
            const response = await axios.get(`${API_BASE_URL}/folders?city=${city}&building=${building}&task=${task}&date=${dateStr}`, {
>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
<<<<<<< HEAD
=======
                console.log('📁 Folders received:', response.data.folders.length);
                if (response.data.folders.length > 0) {
                    console.log('📁 First folder createdDate:', response.data.folders[0].createdDate);
                }
>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b
                setFolders(response.data.folders);
                // Charger les photos pour chaque dossier
                response.data.folders.forEach(folder => loadFolderPhotos(folder._id));
            }
        } catch (err) {
            console.error('Error loading folders:', err);
            Alert.alert('Erreur', 'Impossible de charger les dossiers');
        } finally {
            setLoading(false);
        }
    };

    // Charger les photos d'un dossier
    const loadFolderPhotos = async (folderId) => {
        try {
            const token = await Storage.getItem('token');
            if (!token) return;

            const response = await axios.get(`${API_BASE_URL}/folders/${folderId}/photos`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setFolderPhotos(prev => ({
                    ...prev,
                    [folderId]: response.data.photos
                }));
            }
        } catch (err) {
            console.error('Error loading folder photos:', err);
        }
    };

    // Créer un nouveau dossier
    const createFolder = async () => {
        if (!form.intituleMission.trim() || !form.chantierName.trim() || !form.company.trim() || !form.mission.trim()) {
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

            const folderData = {
                intituleMission: form.intituleMission,
                chantierName: form.chantierName,
                company: form.company,
                city,
                building,
                task,
                mission: form.mission,
<<<<<<< HEAD
                startDate: form.startDate.toISOString(),
                endDate: form.endDate ? form.endDate.toISOString() : undefined,
=======
                startDate: formatLocalDate(form.startDate),
                endDate: form.endDate ? formatLocalDate(form.endDate) : undefined,
                createdDate: formatLocalDate(selectedDate), // Date du calendrier
>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b
            };

            const response = await axios.post(`${API_BASE_URL}/folders`, folderData, {
                headers: { Authorization: `Bearer ${token}` },
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

                await updateHistory('rapportPhoto_intituleMission_history', form.intituleMission, intituleMissionSuggestions, setIntituleMissionSuggestions);
                await updateHistory('rapportPhoto_chantierName_history', form.chantierName, chantierNameSuggestions, setChantierNameSuggestions);
                await updateHistory('rapportPhoto_company_history', form.company, companySuggestions, setCompanySuggestions);

                // Réinitialiser le formulaire
                setForm({
                    intituleMission: '',
                    chantierName: city || '',
                    company: '',
                    mission: '',
                    startDate: new Date(),
                    endDate: null,
                });
                setShowFolderForm(false);
                await loadFolders();

                Alert.alert('Succès', 'Dossier créé avec succès');
            }
        } catch (err) {
            console.error('Error creating folder:', err);
            Alert.alert('Erreur', 'Impossible de créer le dossier');
        } finally {
            setLoading(false);
        }
    };

    // Ajouter une paire de photos à un dossier
    const addPhotosToFolder = async () => {
        if (!photoForm.avant || !photoForm.apres) {
            Alert.alert('Erreur', 'Veuillez sélectionner les deux photos (avant et après)');
            return;
        }

        if (!selectedFolder) {
            Alert.alert('Erreur', 'Aucun dossier sélectionné');
            return;
        }

        try {
            setLoading(true);
            const token = await Storage.getItem('token');
            if (!token) {
                Alert.alert('Erreur', 'Vous devez être connecté');
                return;
            }

<<<<<<< HEAD
            // Convertir les URIs en base64
            const avantBase64 = await FileSystem.readAsStringAsync(photoForm.avant, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const apresBase64 = await FileSystem.readAsStringAsync(photoForm.apres, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const photoData = {
                imageAvant: `data:image/jpeg;base64,${avantBase64}`,
                imageApres: `data:image/jpeg;base64,${apresBase64}`,
=======
            const photoData = {
                imageAvant: photoForm.avant,
                imageApres: photoForm.apres,
>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b
            };

            const response = await axios.post(`${API_BASE_URL}/folders/${selectedFolder._id}/photos`, photoData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                // Réinitialiser le formulaire photo
                setPhotoForm({ avant: null, apres: null });
                setShowPhotoModal(false);
                await loadFolderPhotos(selectedFolder._id);

                Alert.alert('Succès', 'Photos ajoutées avec succès');
            }
        } catch (err) {
            console.error('Error adding photos:', err);
            Alert.alert('Erreur', 'Impossible d\'ajouter les photos');
        } finally {
            setLoading(false);
        }
    };

    // Prendre une photo avec la caméra
    const takePhoto = async (type) => {
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
                updatePhotoForm(type, result.assets[0].uri);
            }
        } catch (e) {
            console.warn("Erreur prise photo: ", e);
            Alert.alert("Erreur", "Impossible de prendre la photo");
        }
    };

    // Choisir une photo depuis la galerie
    const pickImageFromGallery = async (type) => {
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
                updatePhotoForm(type, result.assets[0].uri);
            }
        } catch (e) {
            console.warn("Erreur sélection image: ", e);
            Alert.alert("Erreur", "Impossible de sélectionner l'image");
        }
    };

    // Modal de choix de source d'image (caméra ou galerie)
    const openImageSourceModal = (type) => {
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

    // Supprimer un dossier
    const deleteFolder = async (folderId) => {
        Alert.alert(
            'Confirmer la suppression',
            'Voulez-vous vraiment supprimer ce dossier et toutes ses photos ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await Storage.getItem('token');
                            if (!token) return;

                            await axios.delete(`${API_BASE_URL}/folders/${folderId}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });

                            await loadFolders();
                            Alert.alert('Succès', 'Dossier supprimé');
                        } catch (err) {
                            console.error('Error deleting folder:', err);
                            Alert.alert('Erreur', 'Impossible de supprimer le dossier');
                        }
                    }
                }
            ]
        );
    };

    // Supprimer une photo
    const deletePhoto = async (photoId, folderId) => {
        Alert.alert(
            'Confirmer la suppression',
            'Voulez-vous vraiment supprimer cette paire de photos ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await Storage.getItem('token');
                            if (!token) return;

                            await axios.delete(`${API_BASE_URL}/photos/${photoId}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });

                            await loadFolderPhotos(folderId);
                            Alert.alert('Succès', 'Photos supprimées');
                        } catch (err) {
                            console.error('Error deleting photo:', err);
                            Alert.alert('Erreur', 'Impossible de supprimer les photos');
                        }
                    }
                }
            ]
        );
    };

    // Exporter un dossier en PDF
    const exportToPDF = async (folder) => {
        const photos = folderPhotos[folder._id] || [];

        if (photos.length === 0) {
            Alert.alert('Erreur', 'Ce dossier ne contient aucune photo à exporter');
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

            // Convertir toutes les photos en base64
            const photosWithBase64 = await Promise.all(
                photos.map(async (photo) => {
                    try {
                        const avantBase64 = await convertUriToBase64(photo.imageAvant);
                        const apresBase64 = await convertUriToBase64(photo.imageApres);
                        return { ...photo, avantBase64, apresBase64 };
                    } catch (error) {
                        console.error('Error converting images:', error);
                        return null;
                    }
                })
            );

            const validPhotos = photosWithBase64.filter(p => p !== null);

            if (validPhotos.length === 0) {
                Alert.alert('Erreur', 'Impossible de charger les images');
                return;
            }

            // Générer le HTML
            let htmlPages = '';
            let currentPageNumber = 1;
            let photosOnCurrentPage = 0;
            const maxPhotosFirstPage = 3;
            const maxPhotosOtherPages = 4;

            // Header du dossier (tableau d'informations)
            const folderHeader = `
                <div style="width: 420px; margin: 0 auto 25px auto; border: 2px solid #000; border-radius: 8px; padding: 0; overflow: hidden;">
                    <div style="padding: 10px 8px; border-bottom: 1px solid #000;">
                        <div style="font-size: 9pt; font-weight: bold;">
                            Promoteur: ${folder.company.toUpperCase()} - Ville: ${folder.city.toUpperCase()}
                        </div>
                    </div>
                    <div style="padding: 10px 8px; border-bottom: 1px solid #000;">
                        <div style="font-size: 9pt;">Mission: ${folder.mission}</div>
                    </div>
                    <div style="padding: 10px 8px;">
                        <div style="font-size: 9pt;">Intervention le : ${new Date(folder.startDate).toLocaleDateString('fr-FR')}</div>
                    </div>
                </div>
            `;

            // Photos du dossier
            for (let i = 0; i < validPhotos.length; i++) {
                const photo = validPhotos[i];
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
                if (photosOnCurrentPage === 0 && currentPageNumber === 1) {
                    // Page 1: Logo centré + titre + header
                    htmlPages = `
                    <div class="page">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <img src="${logoBase64}" style="width: 160px; height: 80px; object-fit: contain;" />
                        </div>
                        <div style="text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 20pt; font-weight: bold; margin-bottom: 20px;">
                            <span style="border-bottom: 2px solid #000; padding-bottom: 2px;">Rapport Photo - ${folder.chantierName}</span>
                        </div>
                        <div class="content">
                    ` + folderHeader;
                }

                // Paire de photos
                htmlPages += `
                    <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 20px; page-break-inside: avoid;">
                        <div style="text-align: center;">
                            <div style="font-weight: bold; font-size: 10pt; margin-bottom: 5px;">AVANT</div>
                            <img src="${photo.avantBase64}" style="width: 185px; height: 132px; object-fit: cover; border: 1px solid #999;" />
                        </div>
                        <div style="margin: 0 15px;">
                            <svg width="40" height="20" style="display: block;">
                                <line x1="0" y1="10" x2="32" y2="10" stroke="black" stroke-width="2"/>
                                <polygon points="40,10 32,6 32,14" fill="black"/>
                            </svg>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-weight: bold; font-size: 10pt; margin-bottom: 5px;">APRÈS</div>
                            <img src="${photo.apresBase64}" style="width: 185px; height: 132px; object-fit: cover; border: 1px solid #999;" />
                        </div>
                    </div>
                `;

                photosOnCurrentPage++;
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

            const fileName = `dossier-${folder.reportNumber}-${folder.intituleMission.replace(/\s+/g, '-')}.pdf`;

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

    // Charger les dossiers au montage et quand la date change
    useEffect(() => {
        loadFolders();
<<<<<<< HEAD
    }, [city, building, task]);
=======
    }, [city, building, task, selectedDate]);
>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b

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
                        {displayCalendarScreen(selectedDate, setSelectedDate, [])}
                    </View>

<<<<<<< HEAD
=======
                    {/* Titre de la section ou message si vide */}
                    {folders.length > 0 ? (
                        <Text style={styles.sectionTitle}>Rapport photo :</Text>
                    ) : (
                        <Text style={styles.emptyMessage}>Aucun rapport photo pour ce jour là</Text>
                    )}

>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b
                    {/* Liste des dossiers */}
                    {folders.map((folder) => {
                        const isExpanded = expandedFolders[folder._id] || false;
                        const photos = folderPhotos[folder._id] || [];
                        const displayedPhotos = isExpanded ? photos : photos.slice(0, 2);
                        const hasMore = photos.length > 2;

                        return (
                            <View key={folder._id} style={styles.folderCard}>
                                {/* Header du dossier */}
                                <View style={styles.folderHeader}>
                                    <View style={styles.folderTitleContainer}>
                                        <Text style={styles.folderNumber}>📁 Dossier #{folder.reportNumber}</Text>
                                        <Text style={styles.folderTitle}>{folder.intituleMission}</Text>
                                        <Text style={styles.folderSubtitle}>{folder.company}</Text>
                                    </View>
<<<<<<< HEAD
                                    <TouchableOpacity
                                        style={styles.deleteFolderBtn}
                                        onPress={() => deleteFolder(folder._id)}
                                    >
                                        <Text style={styles.deleteFolderText}>🗑️</Text>
                                    </TouchableOpacity>
=======
                                    {canDelete() && (
                                        <TouchableOpacity
                                            style={styles.deleteFolderBtn}
                                            onPress={() => deleteFolder(folder._id)}
                                        >
                                            <Text style={styles.deleteFolderText}>🗑️</Text>
                                        </TouchableOpacity>
                                    )}
>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b
                                </View>

                                {/* Photos du dossier */}
                                {displayedPhotos.map((photo, idx) => (
                                    <View key={photo._id} style={styles.photoCard}>
                                        <View style={styles.imageRow}>
                                            <View style={styles.imageWrapper}>
                                                <Text style={styles.imageLabel}>Avant</Text>
                                                <Image source={{ uri: photo.imageAvant }} style={styles.image} />
                                            </View>
                                            <View style={styles.imageWrapper}>
                                                <Text style={styles.imageLabel}>Après</Text>
                                                <Image source={{ uri: photo.imageApres }} style={styles.image} />
                                            </View>
                                        </View>
<<<<<<< HEAD
                                        <TouchableOpacity
                                            style={styles.deletePhotoBtn}
                                            onPress={() => deletePhoto(photo._id, folder._id)}
                                        >
                                            <Text style={styles.deletePhotoText}>Supprimer cette paire</Text>
                                        </TouchableOpacity>
=======
                                        {canDelete() && (
                                            <TouchableOpacity
                                                style={styles.deletePhotoBtn}
                                                onPress={() => deletePhoto(photo._id, folder._id)}
                                            >
                                                <Text style={styles.deletePhotoText}>Supprimer cette paire</Text>
                                            </TouchableOpacity>
                                        )}
>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b
                                    </View>
                                ))}

                                {/* Bouton voir plus/moins */}
                                {!isExpanded && hasMore && (
                                    <TouchableOpacity
                                        style={styles.seeMoreButton}
                                        onPress={() => setExpandedFolders(prev => ({ ...prev, [folder._id]: true }))}
                                    >
                                        <Text style={styles.seeMoreText}>Voir {photos.length - 2} de plus...</Text>
                                    </TouchableOpacity>
                                )}
                                {isExpanded && hasMore && (
                                    <TouchableOpacity
                                        style={styles.seeMoreButton}
                                        onPress={() => setExpandedFolders(prev => ({ ...prev, [folder._id]: false }))}
                                    >
                                        <Text style={styles.seeMoreText}>Voir moins</Text>
                                    </TouchableOpacity>
                                )}

                                {/* Bouton ajouter photos */}
                                <TouchableOpacity
                                    style={styles.addPhotosBtn}
                                    onPress={() => {
                                        setSelectedFolder(folder);
                                        setShowPhotoModal(true);
                                    }}
                                >
                                    <Text style={styles.addPhotosBtnText}>📸 Ajouter photos avant/après</Text>
                                </TouchableOpacity>

                                {/* Bouton exporter en PDF */}
                                {photos.length > 0 && (
                                    <TouchableOpacity
                                        style={styles.exportButton}
                                        onPress={() => exportToPDF(folder)}
                                        disabled={loading}
                                    >
                                        <Text style={styles.exportButtonText}>
                                            {loading ? 'Export en cours...' : '📄 Exporter en PDF'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}

                    {/* Bouton créer un nouveau dossier */}
                    {!showFolderForm && canAddItem('Rapport Photo') && (
                        <TouchableOpacity
                            style={styles.toggleCircle}
                            onPress={() => setShowFolderForm(true)}
                        >
                            <Text style={styles.toggleCircleText}>＋</Text>
                        </TouchableOpacity>
                    )}
                </KeyboardAwareScrollView>

                {/* Modal formulaire création dossier */}
                <Modal
                    visible={showFolderForm}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowFolderForm(false)}
                >
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            activeOpacity={1}
                            style={styles.overlayBackdrop}
                            onPress={() => setShowFolderForm(false)}
                        />

                        <View style={styles.formCardOverlay}>
                            <ScrollView
                                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                                keyboardShouldPersistTaps="always"
                                showsVerticalScrollIndicator={true}
                                nestedScrollEnabled={true}
                            >
                                <TouchableOpacity
                                    style={styles.closeFormBtn}
                                    onPress={() => setShowFolderForm(false)}
                                >
                                    <Text style={styles.closeFormText}>✕</Text>
                                </TouchableOpacity>

                                <Text style={styles.formTitle}>Créer un nouveau dossier</Text>

                                {/* Intitulé Mission */}
                                <Text style={styles.label}>Intitulé Mission :</Text>
                                <View style={{ position: 'relative' }}>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Ex: Électricité"
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
                                        >
                                            {intituleMissionSuggestions.map((suggestion, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    style={styles.suggestionItem}
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
                                        >
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
                                    )}
                                </View>

                                {/* Entreprise */}
                                <Text style={styles.label}>Entreprise :</Text>
                                <View style={{ position: 'relative' }}>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Ex: Entreprise A"
                                        placeholderTextColor="#999"
                                        value={form.company}
                                        onChangeText={v => updateForm('company', v)}
                                        onFocus={() => setShowCompanySuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 200)}
                                    />
                                    {showCompanySuggestions && companySuggestions.length > 0 && (
                                        <ScrollView
                                            style={styles.suggestionsContainer}
                                            nestedScrollEnabled={true}
                                            keyboardShouldPersistTaps="always"
                                        >
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
                                    )}
                                </View>

                                {/* Ville (lecture seule) */}
                                <Text style={styles.label}>Ville :</Text>
                                <Text style={styles.readOnlyText}>{city}</Text>

                                {/* Bâtiment (lecture seule) */}
                                <Text style={styles.label}>Bâtiment :</Text>
                                <Text style={styles.readOnlyText}>{building}</Text>

                                {/* Mission */}
                                <Text style={styles.label}>Mission :</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Ex: Installation"
                                    placeholderTextColor="#999"
                                    value={form.mission}
                                    onChangeText={v => updateForm('mission', v)}
                                />

                                {/* Date de début (pour l'instant on utilise la date actuelle) */}
                                <Text style={styles.label}>Date de début :</Text>
                                <Text style={styles.readOnlyText}>{form.startDate.toLocaleDateString('fr-FR')}</Text>

                                {/* Date de fin (optionnel) */}
                                <Text style={styles.label}>Date de fin (optionnel) :</Text>
                                <Text style={styles.readOnlyText}>{form.endDate ? form.endDate.toLocaleDateString('fr-FR') : 'Non définie'}</Text>

                                {/* Bouton Créer */}
                                <TouchableOpacity
                                    style={styles.validateButton}
                                    onPress={createFolder}
                                    disabled={loading}
                                >
                                    <Text style={styles.validateText}>{loading ? 'Création...' : 'Créer le dossier'}</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Modal ajout de photos */}
                <Modal
                    visible={showPhotoModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowPhotoModal(false)}
                >
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            activeOpacity={1}
                            style={styles.overlayBackdrop}
                            onPress={() => setShowPhotoModal(false)}
                        />

                        <View style={styles.photoModalCard}>
                            <TouchableOpacity
                                style={styles.closeFormBtn}
                                onPress={() => setShowPhotoModal(false)}
                            >
                                <Text style={styles.closeFormText}>✕</Text>
                            </TouchableOpacity>

                            <Text style={styles.formTitle}>Ajouter des photos</Text>
                            <Text style={styles.formSubtitle}>Dossier #{selectedFolder?.reportNumber}</Text>

                            {/* Photo Avant */}
                            <Text style={styles.label}>Photo Avant :</Text>
                            <TouchableOpacity
                                style={styles.photoButton}
                                onPress={() => openImageSourceModal('avant')}
                            >
                                <Text style={styles.photoButtonText}>
                                    {photoForm.avant ? '✓ Photo sélectionnée' : '📷 Choisir photo'}
                                </Text>
                            </TouchableOpacity>
                            {photoForm.avant && <Image source={{ uri: photoForm.avant }} style={styles.preview} />}

                            {/* Photo Après */}
                            <Text style={styles.label}>Photo Après :</Text>
                            <TouchableOpacity
                                style={styles.photoButton}
                                onPress={() => openImageSourceModal('apres')}
                            >
                                <Text style={styles.photoButtonText}>
                                    {photoForm.apres ? '✓ Photo sélectionnée' : '📷 Choisir photo'}
                                </Text>
                            </TouchableOpacity>
                            {photoForm.apres && <Image source={{ uri: photoForm.apres }} style={styles.preview} />}

                            {/* Bouton Ajouter */}
                            <TouchableOpacity
                                style={styles.validateButton}
                                onPress={addPhotosToFolder}
                                disabled={loading}
                            >
                                <Text style={styles.validateText}>{loading ? 'Ajout...' : 'Ajouter les photos'}</Text>
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
<<<<<<< HEAD
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 8,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
=======
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
        marginTop: 8,
    },
    emptyMessage: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginVertical: 32,
        fontStyle: 'italic',
>>>>>>> 4d5876b5dc0dbef0ca21bd0de8065553b9bca84b
    },

    // Styles pour les dossiers
    folderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#f26463',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    folderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 12,
    },
    folderTitleContainer: {
        flex: 1,
    },
    folderNumber: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    folderTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#414248',
        marginBottom: 4,
    },
    folderSubtitle: {
        fontSize: 14,
        color: '#f26463',
        fontWeight: '500',
    },
    deleteFolderBtn: {
        padding: 8,
    },
    deleteFolderText: {
        fontSize: 20,
    },

    // Styles pour les photos dans un dossier
    photoCard: {
        marginBottom: 12,
        padding: 8,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    imageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
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
    image: {
        width: '100%',
        height: 120,
        borderRadius: 8,
    },
    deletePhotoBtn: {
        backgroundColor: '#ff6b6b',
        padding: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    deletePhotoText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },

    addPhotosBtn: {
        backgroundColor: '#4caf50',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    addPhotosBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },

    exportButton: {
        backgroundColor: '#2196f3',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    exportButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
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
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    formCardOverlay: {
        width: '92%',
        backgroundColor: '#fff',
        borderRadius: 12,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
    },
    photoModalCard: {
        width: '92%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        maxHeight: '70%',
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
    formTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#414248',
        marginBottom: 8,
        textAlign: 'center',
    },
    formSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 12,
        color: '#333',
    },
    textInput: {
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 10,
        fontSize: 14,
    },
    readOnlyText: {
        marginTop: 4,
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 6,
        fontSize: 14,
        color: '#666',
    },
    photoButton: {
        backgroundColor: '#f26463',
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 8,
    },
    photoButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    preview: {
        marginTop: 8,
        width: '100%',
        height: 150,
        borderRadius: 8,
    },
    validateButton: {
        marginTop: 20,
        backgroundColor: '#4caf50',
        padding: 14,
        borderRadius: 6,
        alignItems: 'center',
    },
    validateText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },

    // Suggestions d'autocomplétion
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
        maxHeight: 150,
        zIndex: 10000,
        elevation: 8,
    },
    suggestionItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e8e8e8',
    },
    suggestionText: {
        fontSize: 14,
        color: '#333',
    },
});
