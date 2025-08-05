import React, { useState, useCallback, useEffect } from 'react';
import {
    StyleSheet,
    Alert,
    Keyboard,
    TouchableOpacity,
    View,
    Text,
    SafeAreaView,
    ActivityIndicator,
    Image,
    TextInput,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import useNavigationCustom from '../Controleur/useNavigationCustom';

export default function LoginPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const {goBack, navigateTo} = useNavigationCustom();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    /* function handleSubmit() {
        const userData={
            email:email,
            password:password,
        };
        axios.post('http://192.168.1.89:5001/login', userData)
        .then(res => console.log(res.data));
    } */

    
    const {
        handleSubmit,
        control,
        formState: { errors },
        reset,
    } = useForm({
        mode: 'onBlur',
        defaultValues: {
            email: '',
            password: '',
        },
    });

  

    //GET
    const loadUser = useCallback(async token => {
        try {
            setLoading(true);
            console.log("Sending token:", token);
            const response = await axios.get('http://192.168.1.89:5001/user', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
    
            const { data } = response;
            if (data.status === "error") {
                throw new Error(data.data);
            }
    
            if (!data.user) {
                throw new Error('Utilisateur introuvable');
            }
    
            setUser(data.user);
        } catch (err) {
            console.log("Error loading user:", err);
            const message = err.response?.data?.data ?? err.message ?? 'Il y a un soucis';
            Alert.alert('Oops !', message);
        } finally {
            setLoading(false);
        }
    }, []);
    
    
    //GETToken
    useEffect(() => {
        // Try loading the user if token exists in local storage.
        const loadExistingUser = async () => {
            const token = await AsyncStorage.getItem('token');

            if (!token) {
                return;
            }

            await loadUser(token);
        };
        loadExistingUser();
    }, [loadUser]);

    // POST
    const onSubmit = async data => {
        setLoading(true);
        Keyboard.dismiss();
    
        try {
            const response = await axios.post('http://192.168.1.89:5001/login', data);
            console.log("API response:", response.data);
    
            if (response.data.status === "error") {
                throw new Error(response.data.data);
            }
    
            if (!response.data || !response.data.token) {
                throw new Error('Token non fourni par le serveur');
            }
    
            const { token } = response.data;
    
            // Sauvegarder le jeton JWT dans le stockage local
            await AsyncStorage.setItem('token', token);
            console.log("Token saved:", token);
    
            await loadUser(token);
    
            reset();
        } catch (err) {
            console.log("Login error:", err);
            const message = err.response?.data?.message ?? err.message ?? 'Il y a un soucis !';
            Alert.alert('Oops !', message);
        } finally {
            setLoading(false);
        }
    };
    
    
    

    if (user) {
        return (
            <View style={styles.loggedIn}>
                <Text style={styles.loggedInTitle}>Bienvenue, {user.name}!</Text>

                <TouchableOpacity
                    onPress={async () => {
                        await AsyncStorage.removeItem('token');
                        setUser(null);
                    }}>
                    <Text style={styles.loggedInLink}>Deconnexion</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <>
            {loading && (
                <View style={styles.activityOverflow}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}

            <SafeAreaView style={{ flex: 1, backgroundColor: '#e8ecf4' }}>
                <View style={styles.container}>
                    <KeyboardAwareScrollView>
                        <View style={styles.header}>
                            <Image
                                alt="App Logo"
                                resizeMode="contain"
                                style={styles.headerImg}
                                source={{
                                    uri: 'https://assets.withfra.me/SignIn.2.png',
                                }} />

                            <Text style={styles.title}>
                                Connexion à <Text style={{ color: '#F85F6A' }}>Mon App</Text>
                            </Text>

                            <Text style={styles.subtitle}>
                                Accédez au compte pro
                            </Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.input}>
                                <Text style={styles.inputLabel}>Adresse E-mail</Text>

                                <>
                                    <Controller
                                        control={control}
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TextInput
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                clearButtonMode="while-editing"
                                                keyboardType="email-address"
                                                placeholder="exemple@email.com"
                                                placeholderTextColor="#6b7280"
                                                style={styles.inputControl}
                                                onBlur={onBlur}
                                                onChangeText={email => onChange(email)}
                                                value={value} />
                                        )}
                                        name="email"
                                        rules={{
                                            required: {
                                                value: true,
                                                message: 'Adresse E-mail requis.',
                                            },

                                            pattern: {
                                                value: /\S+@\S+\.\S+/,
                                                message: 'Entrez une adresse E-mail.',
                                            },
                                        }}
                                    />
                                    {errors.email && (
                                        <Text style={styles.inputError}>
                                            {errors.email.message}
                                        </Text>
                                    )}
                                </>
                            </View>

                            <View style={styles.input}>
                                <Text style={styles.inputLabel}>Mot de passe</Text>
                                <>
                                    <Controller
                                        control={control}
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TextInput
                                                autoCorrect={false}
                                                clearButtonMode="while-editing"
                                                placeholder="********"
                                                placeholderTextColor="#6b7280"
                                                style={styles.inputControl}
                                                secureTextEntry={true}
                                                onBlur={onBlur}
                                                onChangeText={password => onChange(password)}
                                                value={value} />
                                        )}
                                        name="password"
                                        rules={{
                                            required: {
                                                value: true,
                                                message: 'Mot de passe requis.',
                                            },
                                        }}
                                    />
                                    {errors.password && (
                                        <Text style={styles.inputError}>
                                            {errors.password.message}
                                        </Text>
                                    )}
                                </>
                            </View>

                            <View style={styles.formAction}>
                                <TouchableOpacity onPress={handleSubmit(onSubmit)}>
                                    <View style={styles.btn}>
                                        <Text style={styles.btnText}>Connexion</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.formLink}>Mot de passe oublié ?</Text>
                        </View>
                    </KeyboardAwareScrollView>

                    <TouchableOpacity
                        onPress={() => navigateTo('SignUp')}
                        style={{ marginTop: 'auto' }}>
                        <Text style={styles.formFooter}>
                            Pas de compte ?{' '}
                            <Text style={{ textDecorationLine: 'underline' }}>Cliquez ici</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    activityOverflow: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 60,
    },
    container: {
        paddingVertical: 24,
        paddingHorizontal: 0,
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
    },
    title: {
        fontSize: 31,
        fontWeight: '700',
        color: '#1D2A32',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#929292',
    },
    loggedIn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loggedInTitle: {
        fontSize: 17,
        fontWeight: '500',
        color: '#1d1d1d',
        marginBottom: 6,
    },
    loggedInLink: {
        fontSize: 15,
        color: '#007aff',
        textDecorationLine: 'underline',
    },
    /** Header */
    header: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 36,
    },
    headerImg: {
        width: 80,
        height: 80,
        alignSelf: 'center',
        marginBottom: 36,
    },
    /** Form */
    form: {
        marginBottom: 24,
        paddingHorizontal: 24,
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
    },
    formAction: {
        marginTop: 4,
        marginBottom: 16,
    },
    formLink: {
        fontSize: 16,
        fontWeight: '600',
        color: '#989EB1',
        textAlign: 'center',
    },
    formFooter: {
        fontSize: 15,
        fontWeight: '600',
        color: '#222',
        textAlign: 'center',
        letterSpacing: 0.15,
    },
    /** Input */
    input: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 17,
        fontWeight: '600',
        color: '#222',
        marginBottom: 8,
    },
    inputControl: {
        height: 50,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        borderRadius: 12,
        fontSize: 15,
        fontWeight: '500',
        color: '#222',
        borderWidth: 1,
        borderColor: '#C9D3DB',
        borderStyle: 'solid',
    },
    inputError: {
        marginTop: 4,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
        color: 'red',
    },
    /** Button */
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderWidth: 1,
        backgroundColor: '#F85F6A',
        borderColor: '#F85F6A',
    },
    btnText: {
        fontSize: 18,
        lineHeight: 26,
        fontWeight: '600',
        color: '#ffffff',
    },
});