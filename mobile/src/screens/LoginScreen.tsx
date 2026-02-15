import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, useWindowDimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { Colors } from '../constants/Theme';
import { authAPI } from '../api/client';
import * as SecureStore from 'expo-secure-store';
import { useToast } from '../hooks/useToast';

const LOGO_IMAGE = require('../../assets/images/logo.jpg');

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { width, height } = useWindowDimensions();
    const isIPad = width >= 768;

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
        // React Native doesn't support CSS filter. Using simple low opacity or could use an image.
        // For a glow effect, we can try shadow (iOS only mostly for this size)
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
        padding: 24,
    },
    cardContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 32,
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
        padding: 40,
        backgroundColor: Platform.OS === 'android' ? 'rgba(15, 23, 42, 0.95)' : undefined,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    sidebarLogoWrapper: {
        width: 240, // Match sidebar width
        padding: 15,
        marginBottom: 10,
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
        fontSize: 28,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    subText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '500',
    },
    formSection: {
        gap: 24,
    },
    inputWrapper: {
        gap: 8,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#CBD5E1',
        letterSpacing: 1,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        backgroundColor: 'rgba(2, 6, 23, 0.5)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
        height: '100%',
    },
    eyeIcon: {
        padding: 8,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    forgotPasswordText: {
        color: '#60A5FA',
        fontSize: 13,
        fontWeight: '600',
    },
    signInButton: {
        height: 56,
        backgroundColor: '#3B82F6', // Brand Blue
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    signInButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
        gap: 6,
    },
    footerText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '500',
    },
    footerLink: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
