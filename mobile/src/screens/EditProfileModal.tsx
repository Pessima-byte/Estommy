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

            if (imagePath && imagePath.includes('/uploads/')) {
                const parts = imagePath.split('/uploads/');
                imagePath = `/uploads/${parts[parts.length - 1]}`;
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
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.headerTitle}>EDIT IDENTITY</Text>
                                <View style={styles.headerLineRow}>
                                    <View style={styles.headerLine} />
                                    <Text style={styles.headerSubtitle}>CORE PROFILE DATA</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.avatarSection}>
                            <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage} disabled={uploading}>
                                {image ? (
                                    <Image source={{ uri: image }} style={styles.avatarImg} contentFit="cover" />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <User size={40} color="#C5A059" />
                                    </View>
                                )}
                                <View style={styles.cameraBadge}>
                                    {uploading ? (
                                        <ActivityIndicator size="small" color="#000" />
                                    ) : (
                                        <Camera size={14} color="#000" />
                                    )}
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.avatarHint}>TAP TO CHANGE AVATAR</Text>
                        </View>

                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>FULL NAME</Text>
                                <View style={styles.inputBox}>
                                    <User size={18} color="#C5A059" />
                                    <TextInput
                                        style={styles.input}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Enter your name"
                                        placeholderTextColor="#475569"
                                    />
                                </View>
                            </View>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>EMAIL ADDRESS</Text>
                                <View style={styles.inputBox}>
                                    <Mail size={18} color="#C5A059" />
                                    <TextInput
                                        style={styles.input}
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#475569"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>CONTACT PHONE</Text>
                                <View style={styles.inputBox}>
                                    <Phone size={18} color="#C5A059" />
                                    <TextInput
                                        style={styles.input}
                                        value={phone}
                                        onChangeText={setPhone}
                                        placeholder="Enter your phone"
                                        placeholderTextColor="#475569"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>NEW PASSWORD (LEAVE BLANK TO KEEP)</Text>
                                <View style={styles.inputBox}>
                                    <Lock size={18} color="#C5A059" />
                                    <TextInput
                                        style={styles.input}
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="••••••••"
                                        placeholderTextColor="#475569"
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveBtn, (updating || uploading) && styles.saveBtnDisabled]}
                                onPress={handleSave}
                                disabled={updating || uploading}
                            >
                                {updating ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <>
                                        <Save size={18} color="#000" />
                                        <Text style={styles.saveBtnText}>COMMIT CHANGES</Text>
                                    </>
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
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -1,
    },
    headerLineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    headerLine: {
        width: 20,
        height: 2,
        backgroundColor: '#C5A059',
    },
    headerSubtitle: {
        fontSize: 9,
        fontWeight: '800',
        color: '#C5A059',
        letterSpacing: 2,
    },
    closeBtn: {
        padding: 4,
    },
    scrollContent: {
        gap: 20,
    },
    fieldGroup: {
        gap: 8,
    },
    label: {
        fontSize: 9,
        fontWeight: '900',
        color: '#475569',
        letterSpacing: 1.5,
        paddingLeft: 4,
    },
    inputBox: {
        height: 56,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    saveBtn: {
        backgroundColor: '#FFF',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
    },
    saveBtnDisabled: {
        opacity: 0.7,
    },
    saveBtnText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        position: 'relative',
        borderWidth: 2,
        borderColor: '#C5A059',
        padding: 4,
    },
    avatarImg: {
        width: '100%',
        height: '100%',
        borderRadius: 46,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 46,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#C5A059',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#12121A',
    },
    avatarHint: {
        fontSize: 8,
        color: '#C5A059',
        fontWeight: '900',
        letterSpacing: 2,
        marginTop: 12,
    },
});
