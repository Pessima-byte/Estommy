import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView, useWindowDimensions } from 'react-native';
import { X, Check, ArrowRight, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { creditsAPI, filesAPI, getImageUrl } from '../api/client';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettleDebtorModal({ debtor, credits, visible, onClose, onSuccess }: { debtor: any, credits: any[], visible: boolean, onClose: () => void, onSuccess: () => void }) {
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

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

            const latestCredit = [...credits].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            let amountRemaining = val;
            let latestCreditUpdatedInLoop = false;

            if (val > 0) {
                for (const credit of unsettledCredits) {
                    if (amountRemaining <= 0) break;

                    const creditOutstanding = credit.amount - (credit.amountPaid || 0);
                    const paymentForThisCredit = Math.min(creditOutstanding, amountRemaining);

                    amountRemaining -= paymentForThisCredit;

                    const newTotalPaid = (credit.amountPaid || 0) + paymentForThisCredit;
                    const isFullPayment = newTotalPaid >= credit.amount;
                    const status = isFullPayment ? 'Cleared' : credit.status;

                    if (latestCredit && credit.id === latestCredit.id) {
                        latestCreditUpdatedInLoop = true;
                    }

                    await creditsAPI.update(credit.id, {
                        amountPaid: newTotalPaid,
                        status: status,
                        notes: notes ? (credit.notes ? credit.notes + '\n' + notes : notes) : credit.notes,
                        image: uploadedImageUrl || credit.image
                    });
                }
            }

            if (!latestCreditUpdatedInLoop && latestCredit && (notes || uploadedImageUrl)) {
                await creditsAPI.update(latestCredit.id, {
                    amountPaid: latestCredit.amountPaid,
                    status: latestCredit.status,
                    notes: notes ? (latestCredit.notes ? latestCredit.notes + '\n' + notes : notes) : latestCredit.notes,
                    image: uploadedImageUrl || latestCredit.image
                });
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
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
                <View style={styles.backdrop} />
                <View style={[styles.modalContent, isTablet && { width: 880, height: 700, borderRadius: 32 }]}>
                    <LinearGradient
                        colors={['#060609', '#0F172A', '#060608']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.scrollContent, isTablet && { padding: 32, paddingTop: 24 }]}
                        scrollEnabled={!isTablet}
                    >
                        {/* Atmosphere Layer */}
                        <View style={styles.atmosphereGlow} pointerEvents="none" />
                        <View style={[styles.atmosphereGlow, { top: '40%', left: -100, opacity: 0.03, backgroundColor: '#00D9FF' }]} pointerEvents="none" />

                        <View style={[styles.header, isTablet && { marginBottom: 12 }]}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text
                                    style={[styles.headerTitle, isTablet && { fontSize: 22 }]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.8}
                                >
                                    SETTLE PAYMENT
                                </Text>
                                <View style={styles.headerSubtitleRow}>
                                    <View style={[styles.subtitleLine, isTablet && { width: 40, height: 2 }]} />
                                    <Text style={[styles.headerSubtitle, isTablet && { fontSize: 11 }]}>TX REF: MULTIPLE PENDING</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={[styles.closeBtn, isTablet && { width: 36, height: 36, borderRadius: 10 }]} onPress={onClose}>
                                <X size={isTablet ? 18 : 16} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.mainBody, isTablet && { gap: 16, marginTop: 8 }]}>
                            <Text style={[styles.customerName, isTablet && { fontSize: 28, marginBottom: 0 }]}>{debtor.name || 'IDENTIFIED CUSTOMER'}</Text>

                            <View style={[styles.amountCard, isTablet && { padding: 16, borderRadius: 20 }]}>
                                <View style={styles.amountTop}>
                                    <View style={[styles.amountLabelRow, isTablet && { gap: 8 }]}>
                                        <Text style={[styles.amountLabel, isTablet && { fontSize: 9 }]}>TOTAL_OUTSTANDING</Text>
                                        <View style={[styles.currencyBadge, isTablet && { paddingHorizontal: 5, paddingVertical: 1 }]}>
                                            <Text style={[styles.currencyText, isTablet && { fontSize: 10 }]}>LE</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.dot, isTablet && { width: 4, height: 4 }]} />
                                </View>
                                <Text style={[styles.outstandingValue, isTablet && { fontSize: 34 }]}>{outstanding.toLocaleString()}</Text>
                            </View>

                            <View style={[styles.fieldGroup, isTablet && { gap: 6 }]}>
                                <Text style={[styles.fieldLabel, isTablet && { fontSize: 10 }]}>ENTER_PAYMENT_AMOUNT</Text>
                                <View style={[styles.inputBox, isTablet && { height: 48, borderRadius: 10 }]}>
                                    <View style={[styles.inputPrefix, isTablet && { paddingHorizontal: 8, paddingVertical: 3 }]}>
                                        <Text style={[styles.prefixText, isTablet && { fontSize: 11 }]}>LE</Text>
                                    </View>
                                    <TextInput
                                        style={[styles.hugeAmountInput, isTablet && { fontSize: 34, height: 46 }]}
                                        value={amount}
                                        onChangeText={setAmount}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor="rgba(255,255,255,0.05)"
                                    />
                                </View>
                            </View>

                            <View style={[styles.presets, isTablet && { gap: 10 }]}>
                                <TouchableOpacity style={[styles.presetBtn, isTablet && { height: 38, borderRadius: 10 }]} onPress={() => setAmount(outstanding.toString())}>
                                    <Text style={[styles.presetText, isTablet && { fontSize: 10 }]}>FULL AMOUNT</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.presetBtn, isTablet && { height: 38, borderRadius: 10 }]} onPress={() => setAmount((outstanding / 2).toString())}>
                                    <Text style={[styles.presetText, isTablet && { fontSize: 10 }]}>50%</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.fieldGroup, isTablet && { gap: 6 }]}>
                                <Text style={[styles.fieldLabel, isTablet && { fontSize: 10 }]}>MISSION_LOG_DATA</Text>
                                <TextInput
                                    style={[styles.inputBox, styles.textArea, styles.inputText, isTablet && { height: 80, borderRadius: 12, fontSize: 14 }]}
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder="Add context or update record details..."
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>

                            <View style={[styles.fieldGroup, isTablet && { gap: 6 }]}>
                                <Text style={[styles.fieldLabel, isTablet && { fontSize: 10 }]}>ATTACHMENT / PHOTO</Text>
                                <TouchableOpacity
                                    style={[styles.attachmentBtn, !!imageUri && styles.attachmentBtnActive, isTablet && { height: 56, borderRadius: 12 }]}
                                    onPress={pickImage}
                                >
                                    <LinearGradient
                                        colors={imageUri ? ['rgba(197, 160, 89, 0.15)', 'rgba(197, 160, 89, 0.05)'] : ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 0, y: 1 }}
                                    />
                                    {imageUri ? (
                                        <View style={styles.attachmentPreview}>
                                            <ImageIcon size={isTablet ? 22 : 18} color="#C5A059" />
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.attachmentName, isTablet && { fontSize: 11 }]} numberOfLines={1}>
                                                    {imageUri.split('/').pop()?.toUpperCase() || 'STAGED_RECORD.IMG'}
                                                </Text>
                                                <Text style={[styles.statusText, isTablet && { fontSize: 8 }]}>STATUS: VERIFIED_ATTACHMENT</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeBtn}>
                                                <X size={14} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={styles.scannerContent}>
                                            <Camera size={isTablet ? 22 : 18} color="#C5A059" style={{ opacity: 0.6 }} />
                                            <Text style={[styles.attachmentText, isTablet && { fontSize: 10 }]}>INITIALIZE SCANNER</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.buttonRow, isTablet && { gap: 12, marginTop: 12 }]}>
                                <TouchableOpacity style={[styles.abortBtn, isTablet && { height: 48, borderRadius: 12 }]} onPress={onClose}>
                                    <Text style={[styles.abortText, isTablet && { fontSize: 11 }]}>CANCEL</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.saveBtn, loading && styles.saveBtnDisabled, isTablet && { height: 48, borderRadius: 12 }]}
                                    onPress={handleSettle}
                                    disabled={loading || (!amount && !notes && !imageUri)}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#000" />
                                    ) : (
                                        <>
                                            <Text style={[styles.saveBtnText, isTablet && { fontSize: 14 }]}>{amount ? 'CONFIRM PAYMENT' : 'UPDATE RECORD'}</Text>
                                            <ArrowRight size={isTablet ? 18 : 16} color="#000" strokeWidth={3} />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(6, 6, 9, 0.4)',
    },
    modalContent: {
        width: '90%',
        maxHeight: '98%',
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
    scrollContent: {
        padding: 16,
        paddingTop: 30,
        paddingBottom: 40,
        flexGrow: 1,
    },
    atmosphereGlow: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#C5A059',
        opacity: 0.1,
        transform: [{ scale: 2.5 }],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 6,
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
        gap: 6,
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
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    mainBody: {
        gap: 12,
        marginTop: 10,
    },
    customerName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        fontStyle: 'italic',
        letterSpacing: -0.5,
        textTransform: 'uppercase',
    },
    amountCard: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.15)',
        overflow: 'hidden',
    },
    amountTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    amountLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    amountLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#C5A059',
        letterSpacing: 2,
    },
    currencyBadge: {
        backgroundColor: '#C5A059',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
    },
    currencyText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#000',
        fontStyle: 'italic',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#C5A059',
    },
    outstandingValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#C5A059',
        fontStyle: 'italic',
        textAlign: 'right',
    },
    fieldGroup: {
        gap: 4,
    },
    fieldLabel: {
        fontSize: 7,
        fontWeight: '900',
        color: '#C5A059',
        letterSpacing: 1.5,
        fontStyle: 'italic',
    },
    inputBox: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 34,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textArea: {
        height: 54,
        paddingVertical: 8,
        alignItems: 'flex-start',
    },
    inputText: {
        fontSize: 12,
        fontWeight: '800',
        fontStyle: 'italic',
        color: '#FFF',
    },
    inputPrefix: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    prefixText: {
        fontSize: 9,
        color: '#FFF',
        fontWeight: '900',
        fontStyle: 'italic',
    },
    hugeAmountInput: {
        flex: 1,
        fontSize: 22,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#FFF',
        textAlign: 'right',
        height: 32,
        padding: 0,
    },
    presets: {
        flexDirection: 'row',
        gap: 8,
    },
    presetBtn: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.02)',
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    presetText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
    },
    attachmentBtn: {
        height: 40,
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
        gap: 10,
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
    attachmentName: {
        color: '#FFF',
        fontSize: 9,
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
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    abortBtn: {
        flex: 1,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    abortText: {
        fontSize: 8,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1,
        fontStyle: 'italic',
    },
    saveBtn: {
        flex: 3,
        height: 38,
        backgroundColor: '#FFF',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 8,
    },
    saveBtnDisabled: {
        opacity: 0.5,
    },
    saveBtnText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 1,
        fontStyle: 'italic',
    },
});

