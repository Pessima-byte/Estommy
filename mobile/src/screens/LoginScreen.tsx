import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator, useWindowDimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Github, Chrome, Facebook } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import { authAPI } from '../api/client';
import * as SecureStore from 'expo-secure-store';
import { useToast } from '../hooks/useToast';

const LOGO_IMAGE = require('../../assets/images/logo.jpg');

const GridBackground = () => {
    return (
        <View style={StyleSheet.absoluteFill}>
            <LinearGradient
                colors={['#0A0A0A', '#020202']}
                style={StyleSheet.absoluteFill}
            />
            {/* Fine Grid Simulation */}
            <View style={styles.gridOverlay}>
                {[...Array(20)].map((_, i) => (
                    <View key={`v-${i}`} style={[styles.gridLineV, { left: `${i * 10}%` }]} />
                ))}
                {[...Array(20)].map((_, i) => (
                    <View key={`h-${i}`} style={[styles.gridLineH, { top: `${i * 10}%` }]} />
                ))}
            </View>
            <View style={styles.radialOverlay} />
        </View>
    );
};

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { width } = useWindowDimensions();
    const isIPadLandscape = width >= 1024;

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
                showToast('Authorization Successful', 'success');
                onLogin();
            } else {
                showToast('Authentication Failed', 'error');
            }
        } catch (error: any) {
            console.error('[Login] Error details:', error);
            showToast(error.response?.data?.error || 'Access Denied', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <GridBackground />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* 1. Pill Logo Header */}
                        <LinearGradient
                            colors={['#FFFFFF', '#F1F5F9', '#CBD5E1']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.logoPill}
                        >
                            <Image
                                source={LOGO_IMAGE}
                                style={styles.fullLogoImage}
                                resizeMode="contain"
                            />
                        </LinearGradient>

                        {/* 2. Page Title */}
                        <View style={styles.titleWrapper}>
                            <Text style={styles.mainHeading}>SIGN IN</Text>
                            <View style={styles.subHeadingRow}>
                                <View style={styles.goldLine} />
                                <Text style={styles.subHeadingText}>INVENTORY MANAGEMENT</Text>
                            </View>
                        </View>

                        {/* 3. Primary Card */}
                        <View style={[styles.authCard, isIPadLandscape && styles.authCardIPad]}>
                            <View style={styles.cardHeader}>
                                <View style={styles.goldDot} />
                                <Text style={styles.secureLoginText}>SECURE LOGIN</Text>
                            </View>

                            <View style={styles.formContent}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                                    <View style={styles.inputField}>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="name@domain.com"
                                            placeholderTextColor="#334155"
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            keyboardType="email-address"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>PASSWORD</Text>
                                    <View style={styles.passwordFieldRow}>
                                        <TextInput
                                            style={styles.textInputMain}
                                            placeholder="••••••••"
                                            placeholderTextColor="#334155"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            autoCorrect={false}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff size={18} color="#475569" /> : <Eye size={18} color="#475569" />}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.submitButton}
                                    onPress={handleLogin}
                                    disabled={loading}
                                    activeOpacity={0.9}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#000" />
                                    ) : (
                                        <>
                                            <Text style={styles.submitButtonText}>SIGN IN</Text>
                                            <ArrowRight size={20} color="#000" strokeWidth={3} />
                                        </>
                                    )}
                                </TouchableOpacity>

                                {/* 4. Social Integration */}
                                <View style={styles.dividerRow}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>OR SIGN IN WITH</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                <View style={styles.socialButtonsGroup}>
                                    <TouchableOpacity style={styles.socialButton}>
                                        <Chrome size={22} color="#CBD5E1" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.socialButton}>
                                        <Github size={22} color="#CBD5E1" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.socialButton}>
                                        <Facebook size={22} color="#CBD5E1" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.1,
    },
    gridLineV: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 0.5,
        backgroundColor: '#FFF',
    },
    gridLineH: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 0.5,
        backgroundColor: '#FFF',
    },
    radialOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    // Pill Logo
    logoPill: {
        width: 320,
        height: 94,
        borderRadius: 47,
        borderWidth: 1.5,
        borderColor: '#000',
        marginBottom: 48,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: '#E2E8F0',
    },
    fullLogoImage: {
        width: '135%',
        height: '135%',
    },
    // Headings
    titleWrapper: {
        alignItems: 'center',
        marginBottom: 48,
    },
    mainHeading: {
        fontSize: 52,
        fontWeight: '900',
        color: '#FFF',
        fontStyle: 'italic',
        letterSpacing: 4,
        marginBottom: 4,
    },
    subHeadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    goldLine: {
        width: 36,
        height: 2,
        backgroundColor: Colors.primary,
    },
    subHeadingText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
    // Authentication Card
    authCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: 'rgba(12, 12, 12, 0.9)',
        borderRadius: 48,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
    },
    authCardIPad: {
        maxWidth: 500,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
        marginBottom: 24,
    },
    goldDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    secureLoginText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#475569',
        letterSpacing: 1,
    },
    formContent: {
        gap: 28,
    },
    inputGroup: {
        gap: 12,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginLeft: 4,
    },
    inputField: {
        height: 64,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderBottomWidth: 1.5,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    textInput: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    passwordFieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 64,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderBottomWidth: 1.5,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 20,
    },
    textInputMain: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Action Button
    submitButton: {
        height: 72,
        backgroundColor: '#FFF',
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginTop: 12,
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    submitButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 3,
        fontStyle: 'italic',
    },
    // Social Authentication
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        marginTop: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    dividerText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#334155',
        letterSpacing: 2,
    },
    socialButtonsGroup: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    socialButton: {
        width: 68,
        height: 68,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
