import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Storage from '../utils/Storage';
import { API_BASE_URL } from '../config';
import { useUserRole } from '../Controleur/UserRoleContext';

import Header from './Header';
import ScreenWrapper from '../Controleur/ScreenWrapper';

export default function Profile({ navigation }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const { clearUserRole } = useUserRole();
    const [form, setForm] = useState({
        name: '',
        email: ''
    });

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const token = await Storage.getItem('token');
            if (!token) {
                navigation.replace('LoginPage');
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/user/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                setUser(response.data.user);
                setForm({
                    name: response.data.user.name || '',
                    email: response.data.user.email || ''
                });
            }
        } catch (err) {
            console.error('Error loading user data:', err);
            Alert.alert('Erreur', 'Impossible de charger les données utilisateur');
        } finally {
            setLoading(false);
        }
    };

    const updateForm = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const token = await Storage.getItem('token');

            const response = await axios.put(`${API_BASE_URL}/user/profile`, form, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                Alert.alert('Succès', 'Profil mis à jour avec succès');
                setEditMode(false);
                loadUserData();
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Voulez-vous vraiment vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Se déconnecter',
                    style: 'destructive',
                    onPress: async () => {
                        await Storage.removeItem('token');
                        await Storage.removeItem('user');
                        await clearUserRole();
                        navigation.replace('LoginPage');
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
                />

                <KeyboardAwareScrollView
                    contentContainerStyle={styles.contentContainer}
                    enableOnAndroid={true}
                    enableAutomaticScroll={true}
                    extraScrollHeight={20}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.profileCard}>
                        <Text style={styles.title}>Mon Profil</Text>

                        {!editMode ? (
                            <View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Nom :</Text>
                                    <Text style={styles.value}>{user?.name || 'N/A'}</Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Email :</Text>
                                    <Text style={styles.value}>{user?.email || 'N/A'}</Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Rôle :</Text>
                                    <Text style={[styles.value, styles.roleValue]}>{user?.role || 'user'}</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => setEditMode(true)}
                                >
                                    <Text style={styles.editButtonText}>Modifier le profil</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View>
                                <View style={styles.formRow}>
                                    <Text style={styles.label}>Nom :</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={form.name}
                                        onChangeText={v => updateForm('name', v)}
                                        placeholder="Nom"
                                    />
                                </View>

                                <View style={styles.formRow}>
                                    <Text style={styles.label}>Email :</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={form.email}
                                        onChangeText={v => updateForm('email', v)}
                                        placeholder="Email"
                                        keyboardType="email-address"
                                    />
                                </View>

                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={[styles.button, styles.cancelButton]}
                                        onPress={() => {
                                            setEditMode(false);
                                            setForm({
                                                name: user?.name || '',
                                                email: user?.email || ''
                                            });
                                        }}
                                    >
                                        <Text style={styles.buttonText}>Annuler</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.button, styles.saveButton]}
                                        onPress={handleSave}
                                        disabled={loading}
                                    >
                                        <Text style={styles.buttonText}>
                                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}
                        >
                            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAwareScrollView>
            </SafeAreaView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f9f9f9' 
    },
    contentContainer: { 
        padding: 16 
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
        marginBottom: 24,
        textAlign: 'center',
    },
    infoRow: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: '#333',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    roleValue: {
        fontWeight: '600',
        color: '#f26463',
        textTransform: 'capitalize',
    },
    formRow: {
        marginBottom: 16,
    },
    textInput: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    editButton: {
        backgroundColor: '#f26463',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    cancelButton: {
        backgroundColor: '#999',
    },
    saveButton: {
        backgroundColor: '#f26463',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#ff4444',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
