import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { X, Check, ArrowRight, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { creditsAPI, filesAPI, getImageUrl } from '../api/client';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettleDebtorModal({ debtor, credits, visible, onClose, onSuccess }: { debtor: any, credits: any[], visible: boolean, onClose: () => void, onSuccess: () => void }) {
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!debtor) return null;

    // Only consider unsettled credits
    const unsettledCredits = credits
        .filter(c => (c.amount - (c.amountPaid || 0)) > 0)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const outstanding = unsettledCredits.reduce((sum, c) => sum + (c.amount - (c.amountPaid || 0)), 0);

    const handleSettle = async () => {
        const val = amount ? parseFloat(amount) : 0;

        if (amount && (isNaN(val) || val < 0)) {
            Alert.alert('Invalid Entry', 'Please enter a valid amount');
            return;
        }

        if (val > outstanding) {
            Alert.alert('Limit Exceeded', `Amount exceeds outstanding balance of Le ${outstanding.toLocaleString()}`);
            return;
        }

        if (val === 0 && !notes && !imageUri) {
            Alert.alert('No Changes', 'Please enter a payment amount or edit the record.');
            return;
        }

        setLoading(true);
        try {
            let uploadedImageUrl = null;
            if (imageUri) {
                const uploadRes = await filesAPI.upload(imageUri);
                uploadedImageUrl = uploadRes.url;
            }

            let amountRemaining = val;

            if (val === 0 && unsettledCredits.length > 0) {
                await creditsAPI.update(unsettledCredits[0].id, {
                    amountPaid: unsettledCredits[0].amountPaid,
                    status: unsettledCredits[0].status,
                    notes: notes || unsettledCredits[0].notes,
                    image: uploadedImageUrl || unsettledCredits[0].image
                });
            } else {
                for (const credit of unsettledCredits) {
                    if (amountRemaining <= 0) break;

                    const creditOutstanding = credit.amount - (credit.amountPaid || 0);
                    const paymentForThisCredit = Math.min(creditOutstanding, amountRemaining);

                    amountRemaining -= paymentForThisCredit;

                    const newTotalPaid = (credit.amountPaid || 0) + paymentForThisCredit;
                    const isFullPayment = newTotalPaid >= credit.amount;
                    const status = isFullPayment ? 'Cleared' : credit.status;

                    await creditsAPI.update(credit.id, {
                        amountPaid: newTotalPaid,
                        status: status,
                        notes: notes ? (credit.notes ? credit.notes + '\n' + notes : notes) : credit.notes,
                        image: uploadedImageUrl || credit.image
                    });
                }
            }

            onSuccess();
        } catch (error: any) {
            console.error(error);
            Alert.alert('Nexus Error', 'Database synchronization failed.');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Registry access is required to attach photos.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
                <View style={styles.backdrop} />
                <LinearGradient
                    colors={['#1A1A22', '#0F0F13']}
                    style={styles.modalContainer}
                >
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>SETTLE PAYMENT</Text>
                                <View style={styles.subtitleRow}>
                                    <View style={styles.subtitleLine} />
                                    <Text style={styles.creditRef}>TX REF: MULTIPLE PENDING</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                <X size={20} color="rgba(255,255,255,0.3)" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.content}>
                            <Text style={styles.customerName}>{debtor.name || 'IDENTIFIED CUSTOMER'}</Text>

                            <View style={styles.outstandingCard}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardLabel}>OUTSTANDING BALANCE</Text>
                                    <View style={styles.dot} />
                                </View>
                                <View style={styles.valueRow}>
                                    <Text style={styles.currencyPrefix}>Le</Text>
                                    <Text style={styles.outstandingValue}>{outstanding.toLocaleString()}</Text>
                                </View>
                            </View>

                            <View style={styles.inputSection}>
                                <Text style={styles.inputLabel}>ENTER PAYMENT AMOUNT</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.inputPrefix}>
                                        <Text style={styles.prefixText}>Le</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={amount}
                                        onChangeText={setAmount}
                                        keyboardType="numeric"
                                        placeholder="0.00"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                    />
                                </View>
                            </View>

                            <View style={styles.presets}>
                                <TouchableOpacity style={styles.presetBtn} onPress={() => setAmount(outstanding.toString())}>
                                    <Text style={styles.presetText}>FULL AMOUNT</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.presetBtn} onPress={() => setAmount((outstanding / 2).toString())}>
                                    <Text style={styles.presetText}>50%</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputSection}>
                                <Text style={styles.inputLabel}>ADDITIONAL NOTES</Text>
                                <View style={[styles.inputWrapper, styles.notesWrapper]}>
                                    <TextInput
                                        style={[styles.input, styles.notesInput]}
                                        value={notes}
                                        onChangeText={setNotes}
                                        placeholder="Add context or update record details..."
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputSection}>
                                <Text style={styles.inputLabel}>ATTACHED DOCUMENTS</Text>
                                <TouchableOpacity
                                    style={[styles.inputWrapper, styles.imageBtn, !!imageUri && styles.imageBtnActive]}
                                    onPress={pickImage}
                                >
                                    <View style={styles.btnContent}>
                                        <Camera size={20} color={imageUri ? '#FFF' : '#C5A059'} />
                                        <Text style={[styles.btnText, !!imageUri && styles.btnTextActive]}>
                                            {imageUri ? 'NEW PHOTO STAGED' : 'ADD SUPPORTING PHOTO'}
                                        </Text>
                                    </View>
                                    {!!imageUri && (
                                        <View style={styles.statusBadge}>
                                            <ImageIcon size={12} color="#FFF" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.payBtn, loading && styles.btnDisabled]}
                                onPress={handleSettle}
                                disabled={loading || (!amount && !notes && !imageUri)}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <>
                                        <Text style={styles.payBtnText}>{amount ? 'CONFIRM PAYMENT' : 'UPDATE RECORD'}</Text>
                                        <View style={styles.btnLine} />
                                        <Check size={20} color="#000" strokeWidth={3} />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </LinearGradient>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    modalContainer: {
        width: '100%',
        maxWidth: 450,
        borderRadius: 32,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    title: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 2,
        fontStyle: 'italic',
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    subtitleLine: {
        width: 16,
        height: 1.5,
        backgroundColor: '#C5A059',
    },
    creditRef: {
        fontSize: 9,
        fontWeight: '800',
        color: '#C5A059',
        letterSpacing: 1,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    content: {
        gap: 24,
    },
    customerName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFF',
        fontStyle: 'italic',
        letterSpacing: -1,
    },
    outstandingCard: {
        backgroundColor: 'rgba(197, 160, 89, 0.05)',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.15)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cardLabel: {
        fontSize: 9,
        color: '#C5A059',
        fontWeight: '900',
        letterSpacing: 2,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#C5A059',
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    currencyPrefix: {
        fontSize: 14,
        fontWeight: '900',
        color: '#C5A059',
        fontStyle: 'italic',
    },
    outstandingValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#C5A059',
        fontStyle: 'italic',
    },
    inputSection: {
        gap: 12,
    },
    inputLabel: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.3)',
        fontWeight: '800',
        letterSpacing: 2,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        height: 64,
        borderRadius: 18,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        gap: 12,
    },
    inputPrefix: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    prefixText: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: '900',
        fontStyle: 'italic',
    },
    input: {
        flex: 1,
        fontSize: 24,
        color: '#FFF',
        fontWeight: '900',
        fontStyle: 'italic',
    },
    presets: {
        flexDirection: 'row',
        gap: 12,
    },
    presetBtn: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    presetText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    payBtn: {
        backgroundColor: '#FFF',
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        marginTop: 8,
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    btnDisabled: {
        opacity: 0.5,
    },
    payBtnText: {
        color: '#000',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 3,
        fontStyle: 'italic',
    },
    notesWrapper: {
        height: 100,
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    notesInput: {
        fontSize: 14,
        textAlignVertical: 'top',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    btnLine: {
        width: 24,
        height: 2,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    scrollContent: {
        flexGrow: 1,
    },
    imageBtn: {
        justifyContent: 'center',
    },
    imageBtnActive: {
        backgroundColor: '#C5A059',
        borderColor: '#C5A059',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    btnText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#C5A059',
        letterSpacing: 2,
    },
    btnTextActive: {
        color: '#FFF',
    },
    statusBadge: {
        position: 'absolute',
        right: 16,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    }
});

