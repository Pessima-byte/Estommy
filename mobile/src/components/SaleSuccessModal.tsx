import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { X, ShoppingCart } from 'lucide-react-native';
import { Colors } from '../constants/Theme';

interface SaleSuccessModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    receiptId: string;
    total: number;
    onShare: () => void;
}

export default function SaleSuccessModal({ visible, onClose, onSuccess, receiptId, total, onShare }: SaleSuccessModalProps) {
    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContentSmall}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>SALE SAVED</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.successContent}>
                        <ShoppingCart size={40} color={Colors.primary} />
                        <Text style={styles.successHeadline}>Transaction Complete</Text>
                        <View style={styles.receiptSummary}>
                            <Text style={styles.receiptSummaryText}>Receipt: {receiptId}</Text>
                            <Text style={styles.receiptSummaryText}>Total: Le {total?.toLocaleString() ?? 0}</Text>
                        </View>
                        <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
                            <Text style={styles.shareBtnText}>SHARE RECEIPT</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dismissBtn} onPress={onSuccess}>
                            <Text style={styles.dismissBtnText}>DONE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContentSmall: {
        width: '85%',
        maxWidth: 400,
        backgroundColor: '#16161D',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
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
        color: '#FFF',
        letterSpacing: 2,
    },
    successContent: {
        padding: 32,
        alignItems: 'center',
        gap: 20,
    },
    successHeadline: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    receiptSummary: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 24,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    receiptSummaryText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '600',
    },
    shareBtn: {
        width: '100%',
        height: 56,
        backgroundColor: Colors.primary,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareBtnText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 1,
    },
    dismissBtn: {
        width: '100%',
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dismissBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 1,
    },
});
