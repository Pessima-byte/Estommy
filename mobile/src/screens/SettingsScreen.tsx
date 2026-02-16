import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal, Switch, useWindowDimensions, Alert, Linking, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { User, LogOut, Bell, Shield, Moon, ChevronRight, HardDrive, HelpCircle, Info, ExternalLink, X, Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import { authAPI, getBaseURL, setBaseURL } from '../api/client';
import { useToast } from '../hooks/useToast';
import { useProfile } from '../hooks/useProfile';
import EditProfileModal from './EditProfileModal';
import { BIOMETRICS_ENABLED_KEY } from '../components/SecurityWrapper';

interface SettingsScreenProps {
    onLogout: () => void;
}

export default function SettingsScreen({ onLogout }: SettingsScreenProps) {
    const { width } = useWindowDimensions();
    const { user, loading, refetch } = useProfile();
    const { showToast } = useToast();
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [biometrics, setBiometrics] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingNetwork, setIsEditingNetwork] = useState(false);
    const [tempBaseURL, setTempBaseURL] = useState('');

    React.useEffect(() => {
        const loadBiometrics = async () => {
            const isEnabled = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
            setBiometrics(isEnabled === 'true');
        };
        loadBiometrics();
    }, []);

    const handleToggleBiometrics = async (value: boolean) => {
        if (value) {
            // Check if device supports biometrics
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                showToast('Biometrics not available or not enrolled on this device.', 'error');
                return;
            }

            // Verify with biometrics before enabling
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to enable biometric access',
            });

            if (result.success) {
                await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'true');
                setBiometrics(true);
                showToast('Biometric access enabled.', 'success');
            }
        } else {
            await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'false');
            setBiometrics(false);
            showToast('Biometric access disabled.', 'info');
        }
    };

    const handleOpenNetwork = async () => {
        const current = await getBaseURL();
        setTempBaseURL(current);
        setIsEditingNetwork(true);
    };

    const handleSaveNetwork = async () => {
        if (!tempBaseURL.startsWith('http')) {
            showToast('Invalid URL format.', 'error');
            return;
        }
        await setBaseURL(tempBaseURL);
        showToast('Network settings updated.', 'success');
        setIsEditingNetwork(false);
    };

    const handleLogout = () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to terminate your current session?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authAPI.logout();
                            showToast('Session terminated successfully.', 'info');
                            onLogout();
                        } catch (error) {
                            showToast('Failed to logout. Please try again.', 'error');
                        }
                    }
                }
            ]
        );
    };

    const handleClearCache = () => {
        Alert.alert(
            'Clear Cache',
            'This will remove all locally stored temporary data and images. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                        showToast('System cache cleared successfully.', 'success');
                    }
                }
            ]
        );
    };

    const handleSupportCenter = () => {
        Linking.openURL('https://estommy.com/support').catch(() => {
            showToast('Could not open support link.', 'error');
        });
    };

    const handleEditProfile = () => {
        setIsEditingProfile(true);
    };

    const isIPad = width >= 768;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>APP SETTINGS</Text>
                    <View style={styles.headerLineRow}>
                        <View style={styles.headerLine} />
                        <Text style={styles.headerSubtitle}>ACCOUNT & PREFERENCES</Text>
                    </View>
                </View>

                {/* Profile Section */}
                <LinearGradient
                    colors={['#1E1E26', '#12121A']}
                    style={styles.profileCard}
                >
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={handleEditProfile}
                        activeOpacity={0.8}
                    >
                        {user?.image ? (
                            <Image
                                source={{ uri: user.image }}
                                style={styles.avatarPuff}
                                contentFit="cover"
                                transition={200}
                            />
                        ) : (
                            <LinearGradient
                                colors={user?.role === 'ADMIN' ? ['#C5A059', '#803EDB'] : ['#3B82F6', '#2DD4BF']}
                                style={styles.avatarGradient}
                            >
                                <User size={40} color="#000" />
                            </LinearGradient>
                        )}
                        <View style={[styles.roleBadge, user?.role !== 'ADMIN' && { backgroundColor: '#3B82F6' }]}>
                            <Shield size={10} color="#000" />
                            <Text style={styles.roleText}>{user?.role || 'USER'}</Text>
                        </View>
                        <View style={styles.avatarEditBadge}>
                            <Camera size={12} color="#000" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{user?.name || 'User Identity'}</Text>
                        <Text style={styles.profileEmail}>{user?.email || 'identity@estommy.com'}</Text>
                    </View>
                    <TouchableOpacity style={styles.editProfileBtn} onPress={handleEditProfile}>
                        <Text style={styles.editProfileText}>EDIT PROFILE</Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Settings Grid/List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SYSTEM PREFERENCES</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                <Bell size={20} color="#3B82F6" />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Push Notifications</Text>
                                <Text style={styles.settingDesc}>Receive real-time alerts</Text>
                            </View>
                        </View>
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: '#1E293B', true: Colors.primary }}
                            thumbColor="#FFF"
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                                <Moon size={20} color="#8B5CF6" />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Luxury Dark Mode</Text>
                                <Text style={styles.settingDesc}>Enhanced contrast theme</Text>
                            </View>
                        </View>
                        <Switch
                            value={darkMode}
                            onValueChange={setDarkMode}
                            trackColor={{ false: '#1E293B', true: Colors.primary }}
                            thumbColor="#FFF"
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Shield size={20} color="#10B981" />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Biometric Access</Text>
                                <Text style={styles.settingDesc}>Secure login method</Text>
                            </View>
                        </View>
                        <Switch
                            value={biometrics}
                            onValueChange={handleToggleBiometrics}
                            trackColor={{ false: '#1E293B', true: Colors.primary }}
                            thumbColor="#FFF"
                        />
                    </View>
                </View>

                {/* Infrastructure Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>INFRASTRUCTURE</Text>

                    <TouchableOpacity style={styles.linkItem} onPress={handleClearCache}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                <HardDrive size={20} color="#F59E0B" />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Cache Management</Text>
                                <Text style={styles.settingDesc}>Clear local data storage</Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color="#475569" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkItem} onPress={handleOpenNetwork}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <ExternalLink size={20} color="#10B981" />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Network Config</Text>
                                <Text style={styles.settingDesc}>Update backend connection IP</Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color="#475569" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkItem} onPress={handleSupportCenter}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(148, 163, 184, 0.1)' }]}>
                                <HelpCircle size={20} color="#94A3B8" />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Support Center</Text>
                                <Text style={styles.settingDesc}>Help and documentation</Text>
                            </View>
                        </View>
                        <ExternalLink size={20} color="#475569" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkItem}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(148, 163, 184, 0.1)' }]}>
                                <Info size={20} color="#94A3B8" />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>App Version</Text>
                                <Text style={styles.settingDesc}>v1.0.4-premium-stable</Text>
                            </View>
                        </View>
                        <Text style={styles.infoValue}>UP TO DATE</Text>
                    </TouchableOpacity>
                </View>

                {/* Danger Zone */}
                <View style={[styles.section, { marginBottom: 60 }]}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <LogOut size={20} color="#EF4444" />
                        <Text style={styles.logoutText}>TERMINATE SESSION</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {user && isEditingProfile && (
                <EditProfileModal
                    visible={isEditingProfile}
                    onClose={() => setIsEditingProfile(false)}
                />
            )}

            <Modal visible={isEditingNetwork} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>NETWORK CONFIG</Text>
                            <TouchableOpacity onPress={() => setIsEditingNetwork(false)}>
                                <X size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <View style={{ padding: 24 }}>
                            <Text style={styles.inputLabel}>BACKEND API URL</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={tempBaseURL}
                                onChangeText={setTempBaseURL}
                                placeholder="http://192.168.1.70:3030/api"
                                placeholderTextColor="#475569"
                                autoCapitalize="none"
                            />
                            <Text style={styles.modalHint}>
                                Restart the app after saving for all changes to take effect.
                            </Text>
                            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveNetwork}>
                                <Text style={styles.modalSaveText}>SAVE CONFIGURATION</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0C10',
    },
    scrollContent: {
        padding: Spacing.xl,
    },
    header: {
        marginBottom: 32,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -1,
        marginBottom: 8,
    },
    headerLineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerLine: {
        width: 30,
        height: 2,
        backgroundColor: Colors.primary,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 2,
    },
    profileCard: {
        padding: 32,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 24,
    },
    avatarGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPuff: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#1E1E26',
    },
    roleBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 2,
        borderColor: '#12121A',
    },
    roleText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#000',
    },
    avatarEditBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#FFF',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#1E1E26',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#64748B',
    },
    editProfileBtn: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    editProfileText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#475569',
        letterSpacing: 2,
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#111827',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#111827',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 2,
    },
    settingDesc: {
        fontSize: 12,
        color: '#64748B',
    },
    infoValue: {
        fontSize: 9,
        fontWeight: '900',
        color: '#10B981',
        letterSpacing: 1,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        paddingVertical: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 500,
        backgroundColor: '#1E1E26',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 2,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#475569',
        letterSpacing: 1,
        marginBottom: 12,
    },
    modalInput: {
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 16,
        color: '#FFF',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
        marginBottom: 16,
    },
    modalHint: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 18,
    },
    modalSaveBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    modalSaveText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
    },
});
