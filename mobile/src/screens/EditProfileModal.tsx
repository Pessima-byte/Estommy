import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Save, User, Mail, Phone, Lock, Camera, Image as ImageIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../hooks/useToast';
import { Colors } from '../constants/Theme';
import { authAPI, filesAPI, getImageUrl } from '../api/client';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
    const { user, updateProfile, updating } = useProfile();
    const { showToast } = useToast();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [password, setPassword] = useState('');
    const [image, setImage] = useState(user?.image || null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            const selectedImage = result.assets[0];
            setImage(selectedImage.uri);
            await handleUpload(selectedImage);
        }
    };

    const handleUpload = async (asset: ImagePicker.ImagePickerAsset) => {
        try {
            setUploading(true);
            const uploadRes = await filesAPI.upload(asset.uri);

            if (uploadRes.url) {
                // Set as full URL for preview
                const fullUrl = getImageUrl(uploadRes.url);
                setImage(fullUrl || null);
                showToast('Image uploaded successfully', 'success');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            showToast('Failed to upload image.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            showToast('Name is required.', 'error');
            return;
        }

        try {
            // Ensure we don't save a local 'file://' URI to the DB
            let imagePath = image;
            if (imagePath && imagePath.startsWith('file://')) {
                showToast('Image still uploading. Please wait.', 'info');
                return;
            }

            await updateProfile({
                name,
                email,
                phone,
                image: imagePath,
                ...(password.trim() ? { password } : {})
            });
            showToast('Profile updated successfully.', 'success');
            onClose();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to update profile.', 'error');
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <LinearGradient
                        colors={['#1E1E26', '#12121A']}
                        style={styles.container}
                    >
                        {/* Atmosphere Layer */}
                        <View style={styles.atmosphereGlow} pointerEvents="none" />

                        <View style={styles.header}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.headerTitle} numberOfLines={1}>EDIT IDENTITY</Text>
                                <View style={styles.headerSubtitleRow}>
                                    <View style={styles.subtitleLine} />
                                    <Text style={styles.headerSubtitle}>CORE PROFILE DATA</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={20} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.avatarSection}>
                            <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage} disabled={uploading} activeOpacity={0.8}>
                                <View style={styles.technicalRing} />
                                {image ? (
                                    <Image source={{ uri: image }} style={styles.avatarImg} contentFit="cover" />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <User size={32} color="#C5A059" />
                                    </View>
                                )}
                                <View style={styles.cameraBadge}>
                                    {uploading ? (
                                        <ActivityIndicator size="small" color="#000" />
                                    ) : (
                                        <Camera size={12} color="#000" strokeWidth={2.5} />
                                    )}
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.avatarHint}>PRIMARY_IDENT_CAPTURE</Text>
                        </View>

                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>FULL NAME</Text>
                                <View style={styles.inputBox}>
                                    <User size={16} color="#C5A059" opacity={0.5} />
                                    <TextInput
                                        style={styles.input}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Full system identity"
                                        placeholderTextColor="rgba(255,255,255,0.1)"
                                    />
                                </View>
                            </View>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                                <View style={styles.inputBox}>
                                    <Mail size={16} color="#C5A059" opacity={0.5} />
                                    <TextInput
                                        style={styles.input}
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="Electronic mail coordinates"
                                        placeholderTextColor="rgba(255,255,255,0.1)"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>CONTACT PHONE</Text>
                                <View style={styles.inputBox}>
                                    <Phone size={16} color="#C5A059" opacity={0.5} />
                                    <TextInput
                                        style={styles.input}
                                        value={phone}
                                        onChangeText={setPhone}
                                        placeholder="Voice comms link"
                                        placeholderTextColor="rgba(255,255,255,0.1)"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>NEW PASSWORD (PROTECTION_CODE)</Text>
                                <View style={styles.inputBox}>
                                    <Lock size={16} color="#C5A059" opacity={0.5} />
                                    <TextInput
                                        style={styles.input}
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="••••••••"
                                        placeholderTextColor="rgba(255,255,255,0.1)"
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveBtn, (updating || uploading) && styles.saveBtnDisabled]}
                                onPress={handleSave}
                                disabled={updating || uploading}
                                activeOpacity={0.8}
                            >
                                {updating ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <View style={styles.btnContent}>
                                        <Text style={styles.saveBtnText}>COMMIT_IDENTITY</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </LinearGradient>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    keyboardView: {
        width: '100%',
        maxWidth: 500,
    },
    container: {
        width: '100%',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    atmosphereGlow: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#C5A059',
        opacity: 0.08,
        transform: [{ scale: 2.5 }],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 13,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#FFF',
        letterSpacing: 0,
        marginBottom: 2,
    },
    headerSubtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    subtitleLine: {
        width: 20,
        height: 2,
        backgroundColor: '#C5A059',
    },
    headerSubtitle: {
        fontSize: 8,
        fontWeight: '800',
        color: '#C5A059',
        letterSpacing: 1.5,
    },
    closeBtn: {
        padding: 4,
    },
    scrollContent: {
        gap: 16,
    },
    fieldGroup: {
        gap: 8,
    },
    fieldLabel: {
        fontSize: 7,
        fontWeight: '900',
        color: '#C5A059',
        letterSpacing: 1.5,
        fontStyle: 'italic',
    },
    inputBox: {
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800',
        fontStyle: 'italic',
    },
    saveBtn: {
        backgroundColor: '#FFF',
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    saveBtnDisabled: {
        opacity: 0.5,
    },
    saveBtnText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
        fontStyle: 'italic',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    technicalRing: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: 44,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
        borderStyle: 'dashed',
    },
    avatarImg: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.3)',
    },
    avatarPlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.1)',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#C5A059',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#12121A',
        elevation: 4,
    },
    avatarHint: {
        fontSize: 7,
        color: 'rgba(197, 160, 89, 0.4)',
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 2,
        marginTop: 12,
    },
});
