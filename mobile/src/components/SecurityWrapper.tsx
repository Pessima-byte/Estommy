import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, AppState, AppStateStatus, Platform, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Shield, Fingerprint, Lock } from 'lucide-react-native';
import { Colors } from '../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface SecurityWrapperProps {
    children: React.ReactNode;
    isAuthenticated: boolean;
}

export const BIOMETRICS_ENABLED_KEY = 'biometrics_enabled';

export default function SecurityWrapper({ children, isAuthenticated }: SecurityWrapperProps) {
    const [isLocked, setIsLocked] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    const checkBiometrics = useCallback(async () => {
        if (!isAuthenticated) {
            setIsLocked(false);
            setIsAuthenticating(false);
            return;
        }

        const isEnabled = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
        if (isEnabled === 'true') {
            setIsLocked(true);
            authenticate();
        } else {
            setIsLocked(false);
        }
    }, [isAuthenticated]);

    const authenticate = async () => {
        if (isAuthenticating) return;

        // Safety check for native module presence
        if (!LocalAuthentication.hasHardwareAsync) {
            console.error('[Security] ExpoLocalAuthentication native module not found.');
            setIsLocked(false);
            return;
        }

        setIsAuthenticating(true);
        try {
            console.log('[Security] Starting authentication...');
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (hasHardware && isEnrolled) {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Authenticate to access Estommy',
                    fallbackLabel: 'Use Passcode',
                    disableDeviceFallback: false,
                    cancelLabel: 'Cancel'
                });

                console.log('[Security] Auth Result:', result);

                if (result.success) {
                    setIsLocked(false);
                } else {
                    // Handle specific failure cases or just alert
                    if (result.error !== 'user_cancel') {
                        Alert.alert('Authentication Failed', 'Please try again.');
                    }
                }
            } else {
                console.log('[Security] Hardware not supported or not enrolled. Unlocking.');
                setIsLocked(false);
            }
        } catch (error) {
            console.error('[Security] Auth Error:', error);
            Alert.alert('Security Error', 'An error occurred during authentication.');
        } finally {
            setIsAuthenticating(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            checkBiometrics();
        } else {
            setIsLocked(false);
        }
    }, [isAuthenticated, checkBiometrics]);

    const appState = React.useRef(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            // Only lock if we are coming from the background, not just inactive (which happens during FaceID prompt)
            if (
                appState.current.match(/background/) &&
                nextAppState === 'active' &&
                isAuthenticated
            ) {
                checkBiometrics();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [isAuthenticated, checkBiometrics]);

    if (isLocked) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#0F172A', '#020617', '#000000']}
                    style={StyleSheet.absoluteFill}
                />

                <View style={[styles.orb, { top: -100, left: -100, backgroundColor: '#3B82F6', opacity: 0.15 }]} />
                <View style={[styles.orb, { bottom: -100, right: -100, backgroundColor: '#8B5CF6', opacity: 0.15 }]} />

                <BlurView intensity={40} tint="dark" style={styles.lockCard}>
                    <View style={styles.iconContainer}>
                        <Lock size={48} color={Colors.primary} strokeWidth={1.5} />
                    </View>

                    <Text style={styles.lockTitle}>APP LOCKED</Text>
                    <Text style={styles.lockDesc}>
                        Authentication is required to access your dashboard and sensitive data.
                    </Text>

                    <TouchableOpacity
                        style={styles.authBtn}
                        onPress={authenticate}
                        disabled={isAuthenticating}
                    >
                        {isAuthenticating ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <Fingerprint size={20} color="#000" strokeWidth={2.5} />
                                <Text style={styles.authBtnText}>UNLOCK WITH BIOMETRICS</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </BlurView>
            </View>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    lockCard: {
        width: '85%',
        maxWidth: 400,
        padding: 40,
        borderRadius: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    lockTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 12,
        letterSpacing: 2,
    },
    lockDesc: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    authBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 18,
        borderRadius: 16,
        width: '100%',
        justifyContent: 'center',
    },
    authBtnText: {
        color: '#000',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1,
    }
});
