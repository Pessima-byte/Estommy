import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { X, User, Camera, ArrowRight, ChevronDown, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { customersAPI, filesAPI, getImageUrl } from '../api/client';
import { useToast } from '../hooks/useToast';
import { Colors } from '../constants/Theme';
import { Customer } from '../types';
import SelectionModal from '../components/SelectionModal';

interface AddCustomerScreenProps {
    onClose: () => void;
    onSuccess: () => void;
    initialCustomer?: Customer | null;
}

import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AddCustomerScreen({ onClose, onSuccess, initialCustomer }: AddCustomerScreenProps) {
    const { showToast } = useToast();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    const [name, setName] = useState(initialCustomer?.name || '');
    const [email, setEmail] = useState(initialCustomer?.email || '');
    const [phoneCode, setPhoneCode] = useState('+232');
    const [phoneNumber, setPhoneNumber] = useState(initialCustomer?.phone?.split(' ')[1] || '');
    const [gender, setGender] = useState(initialCustomer?.gender || 'Male');
    const [location, setLocation] = useState(initialCustomer?.address || '');
    const [image, setImage] = useState(initialCustomer?.avatar ? getImageUrl(initialCustomer.avatar) : '');
    const [attachment, setAttachment] = useState(initialCustomer?.attachment ? getImageUrl(initialCustomer.attachment) : '');
    const [attachmentFile, setAttachmentFile] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [genderModalVisible, setGenderModalVisible] = useState(false);

    // Validation States
    const [isPhoneAvailable, setIsPhoneAvailable] = useState(true);
    const [isPhoneChecking, setIsPhoneChecking] = useState(false);
    const [isEmailAvailable, setIsEmailAvailable] = useState(true);
    const [isEmailChecking, setIsEmailChecking] = useState(false);

    const [emailError, setEmailError] = useState('');

    useEffect(() => {
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError('Invalid format');
            setIsEmailAvailable(true);
        } else {
            setEmailError('');

            // Availability Check for Email
            if (email) {
                const timeoutId = setTimeout(async () => {
                    setIsEmailChecking(true);
                    try {
                        const { available } = await customersAPI.checkAvailability('email', email, initialCustomer?.id);
                        setIsEmailAvailable(available);

                    } catch (error) {
                        // Offline fallback: Assume available so user isn't blocked
                        setIsEmailAvailable(true);
                    } finally {
                        setIsEmailChecking(false);
                    }
                }, 500);
                return () => clearTimeout(timeoutId);
            } else {
                setIsEmailAvailable(true);
            }
        }
    }, [email, initialCustomer?.id]);

    useEffect(() => {
        // Availability Check for Phone
        const fullPhone = phoneNumber ? `${phoneCode}${phoneNumber}` : '';
        if (fullPhone) {
            const timeoutId = setTimeout(async () => {
                setIsPhoneChecking(true);
                try {
                    const { available } = await customersAPI.checkAvailability('phone', fullPhone, initialCustomer?.id);
                    setIsPhoneAvailable(available);
                } catch (error) {
                    // Offline fallback: Assume available
                    setIsPhoneAvailable(true);
                } finally {
                    setIsPhoneChecking(false);
                }
            }, 500);
            return () => clearTimeout(timeoutId);
        } else {
            setIsPhoneAvailable(true);
        }
    }, [phoneNumber, phoneCode, initialCustomer?.id]);

    const isEditing = !!initialCustomer;
    const queryClient = useQueryClient();

    // ─── MUTATION LIFT FOR OFFLINE SUPPORT ───────────────────────────────────────
    const mutation = useMutation({
        mutationFn: async (payload: any) => {
            const { _isEditing, _customerId, ...data } = payload;

            // 1. Upload Avatar if needed
            let imageUrl: string | null | undefined = image;

            if (image && (image.startsWith('file:') || image.startsWith('content:'))) {
                try {
                    const uploadRes = await filesAPI.upload(image);
                    imageUrl = uploadRes.url;
                } catch (uploadError) {
                    console.error('Avatar upload failed', uploadError);
                    showToast('Image upload failed. Saving with old image.', 'error');
                    // On failure during edit, revert to original to avoid data loss
                    imageUrl = _isEditing ? initialCustomer?.avatar : null;
                }
            } else if (_isEditing && image && image.startsWith('http')) {
                imageUrl = image;
            } else if (!image) {
                imageUrl = null;
            }

            // 2. Upload Attachment if needed
            let attachmentUrl = initialCustomer?.attachment || null;
            if (attachmentFile && (attachmentFile.startsWith('file:') || attachmentFile.startsWith('content:'))) {
                try {
                    const uploadRes = await filesAPI.upload(attachmentFile);
                    attachmentUrl = uploadRes.url;
                } catch (uploadError) {
                    console.error('Attachment upload failed', uploadError);
                }
            }

            const finalPayload = {
                ...data,
                avatar: imageUrl,
                attachment: attachmentUrl
            };

            // Remove debug logs after fix
            // console.log('[Mutation] Final Payload created. Avatar:', imageUrl);

            if (_isEditing && _customerId) {
                return customersAPI.update(_customerId, finalPayload);
            } else {
                return customersAPI.create(finalPayload);
            }
        },
        onMutate: async (newInfo: any) => {
            const { _isEditing, _customerId, ...newCustomer } = newInfo;
            await queryClient.cancelQueries({ queryKey: ['customers'] });
            const previousCustomers = queryClient.getQueryData(['customers']);

            queryClient.setQueryData(['customers'], (old: any[] = []) => {
                const optimisticCust = {
                    id: _isEditing ? _customerId : `temp-${Date.now()}`,
                    ...newCustomer,
                    avatar: image, // Use local URI for optimistic display
                    attachment: attachment,
                    walletBalance: initialCustomer?.walletBalance || 0,
                    totalSpent: initialCustomer?.totalSpent || 0,
                    status: initialCustomer?.status || 'Active', // capitalization fix
                    createdAt: initialCustomer?.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                if (_isEditing) {
                    return old.map(c => c.id === _customerId ? optimisticCust : c);
                }
                return [optimisticCust, ...old];
            });

            return { previousCategories: previousCustomers };
        },
        onError: (err: any, newTodo: any, context: any) => {
            console.error('Mutation Failed:', err);
            if (context?.previousCategories) {
                queryClient.setQueryData(['customers'], context.previousCategories);
            }
            showToast('Sync failed. Please check inputs.', 'error');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
        onSuccess: (_data, variables: any) => {
            const isEdit = variables._isEditing;
            showToast(isEdit ? 'Changes saved' : 'Customer added', 'success');
            onSuccess(); // Close modal here only after success
        }
    });

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.3, // Reduce quality to prevent timeouts
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const pickAttachment = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true, // Allow simple crop if needed, or false
            quality: 0.3, // significantly compress
        });

        if (!result.canceled) {
            setAttachment(result.assets[0].uri);
            setAttachmentFile(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!name) {
            showToast('Please provide at least a name.', 'error');
            return;
        }

        const payload = {
            name,
            email: email || null,
            phone: phoneNumber ? `${phoneCode} ${phoneNumber}` : null,
            gender,
            address: location || null,
            // Add Context for Mutation to solve Race Condition
            _isEditing: !!initialCustomer,
            _customerId: initialCustomer?.id
        };

        mutation.mutate(payload);

        // Removed optimistic onSuccess call to prevent race condition
    };

    return (
        <View style={styles.overlay}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ width: '100%', alignItems: 'center' }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            >
                <LinearGradient
                    colors={['#18181F', '#0F1115']}
                    style={[styles.container, isTablet ? styles.containerTablet : {}]}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Header Section */}
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.headerTitle}>{isEditing ? 'EDIT CLIENT' : 'ADD CLIENT'}</Text>
                                <View style={styles.headerSubtitleRow}>
                                    <View style={styles.subtitleLine} />
                                    <Text style={styles.headerSubtitle}>{isEditing ? 'UPDATE CLIENT INFO' : 'ADD NEW CLIENT'}</Text>
                                </View>
                            </View>
                            <View style={styles.authTag}>
                                <Text style={styles.authLabel}>CLIENT ID</Text>
                                <Text style={styles.authValue}>{initialCustomer?.id.slice(0, 8).toUpperCase() || 'NEW'}</Text>
                            </View>
                        </View>

                        <View style={[styles.mainContent, isTablet && styles.mainContentTablet]}>
                            {/* Left Column: Photo */}
                            <View style={[styles.imageSection, isTablet && styles.imageSectionTablet]}>
                                <View style={styles.imagePlaceholder}>
                                    {image ? (
                                        <Image source={{ uri: image }} style={{ width: 180, height: 180, borderRadius: 32 }} />
                                    ) : (
                                        <View style={{ alignItems: 'center' }}>
                                            <User size={48} color="rgba(255,255,255,0.1)" strokeWidth={1} />
                                            <Text style={styles.imagePlaceholderText}>PHOTO</Text>
                                        </View>
                                    )}

                                    <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
                                        <Camera size={20} color="#000" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.imageHint}>
                                    Recommended: Square photo.
                                </Text>
                            </View>

                            {/* Right Column: Fields */}
                            <View style={styles.formSection}>
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>FULL NAME</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Client Name"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            value={name}
                                            onChangeText={setName}
                                        />
                                    </View>
                                </View>

                                <View style={styles.row}>
                                    <View style={[styles.fieldContainer, { flex: 1.5 }]}>
                                        <Text style={styles.label}>
                                            PHONE NUMBER
                                            {isPhoneChecking && <Text style={styles.checkingText}> (CHECKING...)</Text>}
                                            {!isPhoneAvailable && <Text style={styles.errorText}> (ALREADY IN USE)</Text>}
                                        </Text>
                                        <View style={[styles.phoneInputWrapper, !isPhoneAvailable && styles.inputWrapperError]}>
                                            <Text style={styles.phonePrefix}>{phoneCode}</Text>
                                            <TextInput
                                                style={[styles.input, { marginLeft: 8 }]}
                                                placeholder="75553022"
                                                placeholderTextColor="rgba(255,255,255,0.2)"
                                                keyboardType="phone-pad"
                                                value={phoneNumber}
                                                onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, '').slice(0, 8))}
                                                maxLength={8}
                                            />
                                        </View>
                                    </View>

                                    <View style={[styles.fieldContainer, { flex: 1 }]}>
                                        <Text style={styles.label}>GENDER</Text>
                                        <TouchableOpacity
                                            style={styles.inputWrapper}
                                            onPress={() => setGenderModalVisible(true)}
                                        >
                                            <Text style={styles.input}>{gender}</Text>
                                            <ChevronDown size={20} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', right: 16 }} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>
                                        EMAIL
                                        {isEmailChecking && <Text style={styles.checkingText}> (CHECKING...)</Text>}
                                        {!isEmailAvailable && <Text style={styles.errorText}> (ALREADY IN USE)</Text>}
                                        {emailError ? <Text style={styles.errorText}> ({emailError.toUpperCase()})</Text> : null}
                                    </Text>
                                    <View style={[styles.inputWrapper, (!isEmailAvailable || emailError) ? styles.inputWrapperError : null]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="client@email.com"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            value={email}
                                            onChangeText={setEmail}
                                        />
                                    </View>
                                </View>

                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>ADDRESS</Text>
                                    <View style={[styles.inputWrapper, { height: 'auto', minHeight: 64, paddingVertical: 10 }]}>
                                        <TextInput
                                            style={[styles.input, { height: 44, textAlignVertical: 'top' }]}
                                            placeholder="Client's location..."
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            multiline
                                            value={location}
                                            onChangeText={setLocation}
                                        />
                                    </View>
                                </View>

                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>ADDITIONAL ATTACHMENT / ID SCAN</Text>
                                    <TouchableOpacity
                                        style={[styles.attachmentBtn, (attachment !== '') && styles.attachmentBtnActive]}
                                        onPress={pickAttachment}
                                    >
                                        {attachment ? (
                                            <View style={styles.attachmentPreview}>
                                                <Image source={{ uri: attachment }} style={styles.attachmentImg} />
                                                <Text style={styles.attachmentName} numberOfLines={1}>Identity Document Attached</Text>
                                                <X size={16} color="#FFF" onPress={() => { setAttachment(''); setAttachmentFile(null); }} />
                                            </View>
                                        ) : (
                                            <>
                                                <Camera size={20} color="rgba(255,255,255,0.4)" style={{ marginRight: 12 }} />
                                                <Text style={styles.attachmentText}>UPLOAD VERIFICATION DOCUMENT</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.abortBtn} onPress={onClose}>
                                <Text style={styles.abortText}>CANCEL</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.provisionBtn,
                                    (mutation.isPending || !isPhoneAvailable || isPhoneChecking || !isEmailAvailable || isEmailChecking || !!emailError) && styles.btnDisabled
                                ]}
                                onPress={handleSubmit}
                                disabled={mutation.isPending || !isPhoneAvailable || isPhoneChecking || !isEmailAvailable || isEmailChecking || !!emailError}
                            >
                                {mutation.isPending ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <>
                                        <Text style={styles.provisionText}>{isEditing ? 'SAVE CHANGES' : 'SAVE CLIENT'}</Text>
                                        <ArrowRight size={20} color="#000" strokeWidth={2.5} />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </LinearGradient>
            </KeyboardAvoidingView>

            <SelectionModal
                visible={genderModalVisible}
                onClose={() => setGenderModalVisible(false)}
                title="Select Gender"
                data={['Male', 'Female']}
                onSelect={(item) => { setGender(item); setGenderModalVisible(false); }}
                searchQuery=""
                onSearchChange={() => { }}
                renderItem={(item) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '600' }}>{item}</Text>
                        {gender === item && <Check size={16} color={Colors.primary} />}
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        backgroundColor: '#0F1115',
    },
    containerTablet: {
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
        overflow: 'hidden',
        maxHeight: 650,
        maxWidth: 900,
        alignSelf: 'center',
    },
    scrollContent: {
        padding: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#F8FAFC',
        letterSpacing: -1,
        marginBottom: 8,
    },
    headerSubtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    subtitleLine: {
        width: 24,
        height: 2,
        backgroundColor: Colors.primary,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 3,
    },
    authTag: {
        alignItems: 'flex-end',
    },
    authLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 2,
        marginBottom: 4,
    },
    authValue: {
        fontSize: 12,
        fontWeight: '900',
        color: Colors.primary,
        fontStyle: 'italic',
    },
    mainContent: {
        flexDirection: 'column',
        gap: 32,
    },
    mainContentTablet: {
        flexDirection: 'row',
        gap: 60,
    },
    imageSection: {
        alignItems: 'center',
    },
    imageSectionTablet: {
        width: 200,
    },
    imagePlaceholder: {
        width: 180,
        height: 180,
        backgroundColor: '#1E1E26',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    imagePlaceholderText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.3)',
        fontWeight: '700',
        marginTop: 12,
        fontStyle: 'italic',
    },
    cameraBtn: {
        position: 'absolute',
        bottom: -10,
        right: -10,
        backgroundColor: '#FFF',
        width: 44,
        height: 44,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageHint: {
        textAlign: 'center',
        fontSize: 8,
        color: '#64748B',
        fontWeight: '800',
        lineHeight: 16,
        letterSpacing: 2,
    },
    formSection: {
        flex: 1,
        gap: 20,
    },
    fieldContainer: {
        gap: 8,
    },
    label: {
        fontSize: 9,
        color: Colors.primary,
        fontWeight: '800',
        letterSpacing: 2,
    },
    inputWrapper: {
        height: 56,
        backgroundColor: '#1A1A22',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    phoneInputWrapper: {
        height: 56,
        backgroundColor: '#1A1A22',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    phonePrefix: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    input: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '600',
        fontStyle: 'italic',
    },
    row: {
        flexDirection: 'row',
        gap: 20,
    },
    footer: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 20,
    },
    abortBtn: {
        flex: 1,
        paddingVertical: 18,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
    },
    abortText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '800',
        letterSpacing: 3,
        fontStyle: 'italic',
    },
    provisionBtn: {
        flex: 2,
        backgroundColor: '#FFF',
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    btnDisabled: {
        opacity: 0.5,
        backgroundColor: '#94A3B8',
    },
    inputWrapperError: {
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 8,
        fontWeight: '900',
    },
    checkingText: {
        color: Colors.primary,
        fontSize: 8,
        fontWeight: '900',
    },
    provisionText: {
        fontSize: 13,
        color: '#000',
        fontWeight: '900',
        letterSpacing: 3,
        fontStyle: 'italic',
    },
    attachmentBtn: {
        height: 60,
        backgroundColor: '#1A1A22',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderStyle: 'dashed',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    attachmentBtnActive: {
        borderColor: Colors.primary,
        backgroundColor: 'rgba(197, 160, 89, 0.05)',
        borderStyle: 'solid',
    },
    attachmentText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '900',
        letterSpacing: 2,
    },
    attachmentPreview: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    attachmentImg: {
        width: 40,
        height: 40,
        borderRadius: 8,
    },
    attachmentName: {
        flex: 1,
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
        fontStyle: 'italic',
    },
});
