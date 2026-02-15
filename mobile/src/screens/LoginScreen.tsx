import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, useWindowDimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Github, Chrome, Facebook } from 'lucide-react-native';
import { Colors } from '../constants/Theme';
import { authAPI } from '../api/client';
import * as SecureStore from 'expo-secure-store';
import { useToast } from '../hooks/useToast';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri, useAuthRequest, ResponseType } from 'expo-auth-session';

const LOGO_IMAGE = require('../../assets/images/logo.jpg');

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { width } = useWindowDimensions();
    const isIPad = width >= 768;

    // Google Auth Request Configuration
    // We let Google.useAuthRequest handle the redirectUri automatically
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        scopes: ['profile', 'email'],
        responseType: ResponseType.IdToken,
    });

    React.useEffect(() => {
        if (request?.redirectUri) {
            console.log('[Google Auth] Active Redirect URI:', request.redirectUri);
        }
    }, [request]);


    React.useEffect(() => {
        if (response?.type === 'success') {
            const { authentication, params } = response;
            // The token location depends on the flow. Check params first for implicit flow.
            const token = params?.id_token || authentication?.idToken || authentication?.accessToken || '';
            handleSocialAuth('google', token);
        } else if (response?.type === 'error') {
            showToast('Google Sign-In failed', 'error');
            console.error('[Google Auth] Response Error:', response.error);
        }
    }, [response]);

    const handleSocialAuth = async (provider: string, token: string) => {
        if (!token) {
            showToast('No auth token received', 'error');
            return;
        }
        setLoading(true);
        try {
            // New Endpoint handling
            const data = await authAPI.socialLogin({ provider, token });
            if (data.token) {
                await SecureStore.setItemAsync('auth_token', data.token);
                showToast(`Welcome ${data.user.name || 'User'}!`, 'success');
                onLogin();
            } else {
                showToast(`${provider} login failed`, 'error');
            }
        } catch (error: any) {
            console.error(`[${provider}] Error:`, error);
            const msg = error.response?.data?.error || error.message || 'Social login failed';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

        if (!webClientId || webClientId.includes('your_web_client_id')) {
            showToast('Google Sign-In not configured. Check .env', 'error');
            return;
        }

        if (!request) {
            showToast('Google Sign-In initializing...', 'info');
            return;
        }
        promptAsync();
        // Use promptAsync with explicit options if needed
    };

    const handleGithubLogin = async () => {
        showToast('GitHub Login: Configure Client ID in LoginScreen.tsx', 'info');
        // Example Implementation:
        // const result = await WebBrowser.openAuthSessionAsync('https://github.com/login/oauth/authorize?client_id=YOUR_ID', 'estommy://');
    };

    const handleFacebookLogin = async () => {
        showToast('Facebook Login: Configure Client ID in LoginScreen.tsx', 'info');
        // Example Implementation
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showToast('Enter your credentials', 'info');
            return;
        }

        setLoading(true);
        try {
            const data = await authAPI.login({ email, password });
            if (data.token) {
                await SecureStore.setItemAsync('auth_token', data.token);
                showToast('Welcome back!', 'success');
                onLogin();
            } else {
                showToast('Authentication Failed', 'error');
            }
        } catch (error: any) {
            console.error('[Login] Error:', error);
            showToast(error.response?.data?.error || 'Invalid credentials', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#0F172A', '#020617', '#000000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Orbs */}
            <View style={[styles.orb, { top: -100, left: -100, backgroundColor: '#3B82F6', opacity: 0.15 }]} />
            <View style={[styles.orb, { bottom: -100, right: -100, backgroundColor: '#8B5CF6', opacity: 0.15 }]} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={[styles.cardContainer, isIPad && styles.cardContainerLarge]}>
                        <BlurView intensity={Platform.OS === 'ios' ? 40 : 100} tint="dark" style={styles.glassCard}>

                            {/* Logo Section */}
                            <View style={styles.headerSection}>
                                <View style={styles.sidebarLogoWrapper}>
                                    <View style={styles.logoPill}>
                                        <Image
                                            source={LOGO_IMAGE}
                                            style={styles.sidebarLogo}
                                            contentFit="cover"
                                        />
                                    </View>
                                </View>
                                <Text style={styles.welcomeText}>Welcome Back</Text>
                                <Text style={styles.subText}>Sign in to continue to ESTOMMY</Text>
                            </View>

                            {/* Form Section */}
                            <View style={styles.formSection}>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.label}>EMAIL ADDRESS</Text>
                                    <View style={styles.inputContainer}>
                                        <Mail size={20} color="#94A3B8" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="name@company.com"
                                            placeholderTextColor="#475569"
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            keyboardType="email-address"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.label}>PASSWORD</Text>
                                    <View style={styles.inputContainer}>
                                        <Lock size={20} color="#94A3B8" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter your password"
                                            placeholderTextColor="#475569"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            autoCorrect={false}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                            {showPassword ? <EyeOff size={20} color="#64748B" /> : <Eye size={20} color="#64748B" />}
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity style={styles.forgotPassword}>
                                        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={styles.signInButton}
                                    onPress={handleLogin}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <View style={styles.btnContent}>
                                            <Text style={styles.signInButtonText}>Sign In</Text>
                                            <ArrowRight size={20} color="#FFF" strokeWidth={2.5} />
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <View style={styles.dividerRow}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                {/* Social Login Buttons */}
                                <View style={styles.socialButtonsGroup}>
                                    <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
                                        <Image
                                            source={{ uri: "https://img.icons8.com/color/48/google-logo.png" }}
                                            style={{ width: 24, height: 24 }}
                                            contentFit="contain"
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.socialButton} onPress={handleGithubLogin}>
                                        <Github size={20} color="#CBD5E1" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.socialButton} onPress={handleFacebookLogin}>
                                        <Facebook size={20} color="#CBD5E1" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Footer */}
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Don't have an account? </Text>
                                <TouchableOpacity>
                                    <Text style={styles.footerLink}>Contact Admin</Text>
                                </TouchableOpacity>
                            </View>

                        </BlurView>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    orb: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        opacity: 0.3,
        backgroundColor: '#3B82F6',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 100,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    cardContainer: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
    },
    cardContainerLarge: {
        maxWidth: 480,
    },
    glassCard: {
        padding: 24,
        paddingTop: 32,
        backgroundColor: Platform.OS === 'android' ? 'rgba(15, 23, 42, 0.95)' : undefined,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    sidebarLogoWrapper: {
        width: 200,
        padding: 0,
        marginBottom: 16,
    },
    logoPill: {
        width: '100%',
        aspectRatio: 2.4,
        borderRadius: 60,
        overflow: 'hidden',
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    sidebarLogo: {
        width: '100%',
        height: '100%',
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    subText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
    },
    formSection: {
        gap: 16,
    },
    inputWrapper: {
        gap: 6,
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: '#CBD5E1',
        letterSpacing: 1,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        backgroundColor: 'rgba(2, 6, 23, 0.5)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
        height: '100%',
    },
    eyeIcon: {
        padding: 8,
    },
    // Social Authentication Styles
    socialButtonsGroup: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 0,
    },
    socialButton: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 0,
        marginTop: 8,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    dividerText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 1,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    forgotPasswordText: {
        color: '#60A5FA',
        fontSize: 12,
        fontWeight: '600',
    },
    signInButton: {
        height: 50,
        backgroundColor: '#3B82F6',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    signInButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
        gap: 6,
    },
    footerText: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '500',
    },
    footerLink: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    },
});
