import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { X, User, Camera, ArrowRight, ChevronDown, Check, ChevronLeft } from 'lucide-react-native';
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
                <View style={[styles.modalContent, isTablet && { width: 820, height: 660 }]}>
                    <LinearGradient
                        colors={['#060609', '#0F172A', '#060608']}
                        style={styles.container}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    {/* Atmosphere Layer */}
                    <View style={styles.atmosphereGlow} pointerEvents="none" />
                    <View style={[styles.atmosphereGlow, { top: '40%', left: -100, opacity: 0.03, backgroundColor: '#00D9FF' }]} pointerEvents="none" />
                    <ScrollView
                        contentContainerStyle={[styles.scrollContent, isTablet && { padding: 32 }]}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={true}
                    >
                        {/* Header Section */}
                        <View style={[styles.header, isTablet && { marginBottom: 28, alignItems: 'center' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                {isTablet && (
                                    <TouchableOpacity
                                        onPress={onClose}
                                        style={{
                                            marginRight: 20,
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            padding: 10,
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <ChevronLeft size={24} color={Colors.primary} />
                                    </TouchableOpacity>
                                )}
                                <View>
                                    <Text style={[styles.headerTitle, isTablet && { fontSize: 24 }]}>{isEditing ? 'EDIT CLIENT' : 'ADD CLIENT'}</Text>
                                    <View style={styles.headerSubtitleRow}>
                                        <View style={[styles.subtitleLine, isTablet && { width: 40, height: 3 }]} />
                                        <Text style={[styles.headerSubtitle, isTablet && { fontSize: 12 }]}>{isEditing ? 'UPDATE CLIENT INFO' : 'ADD NEW CLIENT'}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.authTag}>
                                <Text style={[styles.authLabel, isTablet && { fontSize: 10 }]}>CLIENT ID</Text>
                                <Text style={[styles.authValue, isTablet && { fontSize: 14 }]}>{initialCustomer?.id.slice(0, 8).toUpperCase() || 'NEW'}</Text>
                            </View>
                        </View>

                        <View style={styles.mainContent}>
                            {/* Row 1: Photo and Name */}
                            <View style={styles.topSection}>
                                <View style={styles.imageSection}>
                                    <View style={[styles.imagePlaceholder, isTablet && { width: 100, height: 100, borderRadius: 28 }]}>
                                        {image ? (
                                            <Image source={{ uri: image }} style={[isTablet ? { width: 92, height: 92, borderRadius: 24 } : { width: 70, height: 70, borderRadius: 20 }]} />
                                        ) : (
                                            <View style={{ alignItems: 'center' }}>
                                                <User size={isTablet ? 32 : 20} color="rgba(255,255,255,0.1)" strokeWidth={1} />
                                                <Text style={[styles.imagePlaceholderText, isTablet && { fontSize: 10 }]}>PHOTO</Text>
                                            </View>
                                        )}

                                        <TouchableOpacity style={[styles.cameraBtn, isTablet && { width: 36, height: 36, borderRadius: 12, bottom: -4, right: -4 }]} onPress={pickImage}>
                                            <Camera size={isTablet ? 20 : 16} color="#000" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={[styles.fieldContainer, { flex: 1, marginLeft: isTablet ? 24 : 10 }]}>
                                    <Text style={[styles.label, isTablet && { fontSize: 11 }]}>FULL NAME</Text>
                                    <View style={[styles.inputWrapper, isTablet && { height: 52, borderRadius: 12 }]}>
                                        <TextInput
                                            style={[styles.input, isTablet && { fontSize: 15 }]}
                                            placeholder="Client Name"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            value={name}
                                            onChangeText={setName}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Rest of the fields */}
                            <View style={styles.formSection}>

                                <View style={[styles.row, isTablet && { gap: 24 }]}>
                                    <View style={[styles.fieldContainer, { flex: 1.5 }]}>
                                        <Text style={[styles.label, isTablet && { fontSize: 11 }]}>
                                            PHONE NUMBER
                                            {isPhoneChecking && <Text style={[styles.checkingText, isTablet && { fontSize: 9 }]}> (CHECKING...)</Text>}
                                            {!isPhoneAvailable && <Text style={[styles.errorText, isTablet && { fontSize: 9 }]}> (ALREADY IN USE)</Text>}
                                        </Text>
                                        <View style={[styles.phoneInputWrapper, !isPhoneAvailable && styles.inputWrapperError, isTablet && { height: 52, borderRadius: 12 }]}>
                                            <Text style={[styles.phonePrefix, isTablet && { fontSize: 16 }]}>{phoneCode}</Text>
                                            <TextInput
                                                style={[styles.input, { marginLeft: 8 }, isTablet && { fontSize: 15 }]}
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
                                        <Text style={[styles.label, isTablet && { fontSize: 11 }]}>GENDER</Text>
                                        <TouchableOpacity
                                            style={[styles.inputWrapper, isTablet && { height: 52, borderRadius: 12 }]}
                                            onPress={() => setGenderModalVisible(true)}
                                        >
                                            <Text style={[styles.input, isTablet && { fontSize: 15 }]}>{gender}</Text>
                                            <ChevronDown size={isTablet ? 24 : 20} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', right: 16 }} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.fieldContainer}>
                                    <Text style={[styles.label, isTablet && { fontSize: 11 }]}>
                                        EMAIL
                                        {isEmailChecking && <Text style={[styles.checkingText, isTablet && { fontSize: 9 }]}> (CHECKING...)</Text>}
                                        {!isEmailAvailable && <Text style={[styles.errorText, isTablet && { fontSize: 9 }]}> (ALREADY IN USE)</Text>}
                                        {emailError ? <Text style={[styles.errorText, isTablet && { fontSize: 9 }]}> ({emailError.toUpperCase()})</Text> : null}
                                    </Text>
                                    <View style={[styles.inputWrapper, (!isEmailAvailable || emailError) ? styles.inputWrapperError : null, isTablet && { height: 52, borderRadius: 12 }]}>
                                        <TextInput
                                            style={[styles.input, isTablet && { fontSize: 15 }]}
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
                                    <Text style={[styles.label, isTablet && { fontSize: 11 }]}>ADDRESS</Text>
                                    <View style={[styles.inputWrapper, { height: 'auto', minHeight: isTablet ? 82 : 64, paddingVertical: 10 }, isTablet && { borderRadius: 12 }]}>
                                        <TextInput
                                            style={[styles.input, { height: isTablet ? 60 : 44, textAlignVertical: 'top' }, isTablet && { fontSize: 15 }]}
                                            placeholder="Client's location..."
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            multiline
                                            value={location}
                                            onChangeText={setLocation}
                                        />
                                    </View>
                                </View>

                                <View style={styles.fieldContainer}>
                                    <Text style={[styles.label, isTablet && { fontSize: 11 }]}>ADDITIONAL ATTACHMENT / ID SCAN</Text>
                                    <TouchableOpacity
                                        style={[styles.attachmentBtn, (attachment !== '') && styles.attachmentBtnActive, isTablet && { height: 64, borderRadius: 14 }]}
                                        onPress={pickAttachment}
                                    >
                                        <LinearGradient
                                            colors={attachment ? ['rgba(197, 160, 89, 0.15)', 'rgba(197, 160, 89, 0.05)'] : ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                                            style={StyleSheet.absoluteFill}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 0, y: 1 }}
                                        />
                                        {attachment ? (
                                            <View style={styles.attachmentPreview}>
                                                <Image source={{ uri: attachment }} style={[styles.attachmentImg, isTablet && { width: 44, height: 44 }]} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.attachmentName, isTablet && { fontSize: 12 }]} numberOfLines={1}>DOC_IDENT_VERIFIED.EXP</Text>
                                                    <Text style={[styles.statusText, isTablet && { fontSize: 9 }]}>STATUS: READY_FOR_UPLOAD</Text>
                                                </View>
                                                <TouchableOpacity onPress={() => { setAttachment(''); setAttachmentFile(null); }} style={styles.removeBtn}>
                                                    <X size={14} color="#FFF" />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <View style={styles.scannerContent}>
                                                <Camera size={isTablet ? 24 : 18} color="#C5A059" style={{ opacity: 0.6 }} />
                                                <Text style={[styles.attachmentText, isTablet && { fontSize: 11 }]}>INITIALIZE ID SCANNER</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.footer, isTablet && { marginTop: 12, gap: 16 }]}>
                            <TouchableOpacity style={[styles.abortBtn, isTablet && { height: 48, borderRadius: 10 }]} onPress={onClose}>
                                <Text style={[styles.abortText, isTablet && { fontSize: 12 }]}>CANCEL</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.provisionBtn,
                                    (mutation.isPending || !isPhoneAvailable || isPhoneChecking || !isEmailAvailable || isEmailChecking || !!emailError) && styles.btnDisabled,
                                    isTablet && { height: 54, borderRadius: 12 }
                                ]}
                                onPress={handleSubmit}
                                disabled={mutation.isPending || !isPhoneAvailable || isPhoneChecking || !isEmailAvailable || isEmailChecking || !!emailError}
                            >
                                {mutation.isPending ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <>
                                        <Text style={[styles.provisionText, isTablet && { fontSize: 14 }]}>{isEditing ? 'SAVE CHANGES' : 'SAVE CLIENT'}</Text>
                                        <ArrowRight size={isTablet ? 22 : 20} color="#000" strokeWidth={2.5} />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
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
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '96%',
        backgroundColor: '#0F1115',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    container: {
        ...StyleSheet.absoluteFillObject,
    },
    atmosphereGlow: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: Colors.primary,
        opacity: 0.1,
        transform: [{ scale: 2.5 }],
    },
    scrollContent: {
        padding: 16,
        paddingTop: 24,
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#F8FAFC',
        letterSpacing: -0.5,
        marginBottom: 2,
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
        fontSize: 8,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 2,
    },
    authTag: {
        alignItems: 'flex-end',
    },
    authLabel: {
        fontSize: 6,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 1,
        marginBottom: 1,
    },
    authValue: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.primary,
        fontStyle: 'italic',
    },
    mainContent: {
        flexDirection: 'column',
        gap: 12,
    },
    topSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageSection: {
        alignItems: 'center',
    },
    imageSectionTablet: {
        width: 200,
    },
    imagePlaceholder: {
        width: 70,
        height: 70,
        backgroundColor: '#1E1E26',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    imagePlaceholderText: {
        fontSize: 8,
        color: 'rgba(255,255,255,0.3)',
        fontWeight: '700',
        marginTop: 4,
        fontStyle: 'italic',
    },
    cameraBtn: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: '#FFF',
        width: 28,
        height: 28,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formSection: {
        flex: 1,
        gap: 8,
    },
    fieldContainer: {
        gap: 3,
    },
    label: {
        fontSize: 7,
        color: Colors.primary,
        fontWeight: '800',
        letterSpacing: 1,
    },
    inputWrapper: {
        height: 40,
        backgroundColor: '#1A1A22',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    phoneInputWrapper: {
        height: 40,
        backgroundColor: '#1A1A22',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    phonePrefix: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    input: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 12,
        fontWeight: '600',
        fontStyle: 'italic',
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    footer: {
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        paddingBottom: 20,
    },
    abortBtn: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
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
        height: 44,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
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
        fontSize: 12,
        color: '#000',
        fontWeight: '900',
        letterSpacing: 2,
        fontStyle: 'italic',
    },
    attachmentBtn: {
        height: 48,
        backgroundColor: 'transparent',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.15)',
        overflow: 'hidden',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    attachmentBtnActive: {
        borderColor: '#C5A059',
        borderWidth: 1.5,
    },
    scannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    attachmentText: {
        fontSize: 9,
        color: '#C5A059',
        fontWeight: '900',
        letterSpacing: 2,
        opacity: 0.8,
    },
    attachmentPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    attachmentImg: {
        width: 32,
        height: 32,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    attachmentName: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 0.5,
    },
    statusText: {
        fontSize: 7,
        color: '#C5A059',
        fontWeight: '800',
        opacity: 0.6,
        marginTop: 1,
    },
    removeBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
