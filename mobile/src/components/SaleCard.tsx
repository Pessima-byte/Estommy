import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Trash2, DollarSign, User } from 'lucide-react-native';
import { Colors, Spacing } from '../constants/Theme';

interface SaleCardProps {
    item: any;
    width: number;
    onDelete: (id: string) => void;
    onAudit: (sale: any) => void;
    isTablet?: boolean;
}

const SaleCard = ({ item, width, onDelete, onAudit, isTablet }: SaleCardProps) => {
    const receiptId = item.id ? `#${item.id.slice(0, 8).toUpperCase()}` : '#LMONEDAP';
    const amount = item.amount || 0;
    const items = item.items || 'GENERAL PURCHASE';
    const customerName = item.customer?.name || 'WALK-IN CUSTOMER';
    const status = item.status || 'COMPLETED';
    const date = item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    return (
        <View style={[styles.card, { width }]}>
            <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                    <DollarSign size={20} color="#10B981" />
                </View>
                <View style={styles.receiptInfo}>
                    <Text style={styles.receiptLabel}>RECEIPT ID</Text>
                    <Text style={styles.receiptId}>{receiptId}</Text>
                </View>
            </View>

            <View style={styles.amountContainer}>
                <Text style={[styles.currencySymbol, !isTablet && { fontSize: 12 }]}>Le</Text>
                <Text
                    style={[styles.amountValue, !isTablet && { fontSize: 20, lineHeight: 24 }]}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                >
                    {amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
            </View>

            <View style={styles.itemRow}>
                <View style={styles.itemBadge}>
                    <Text style={styles.itemBadgeText}>{items.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.customerBox}>
                <View>
                    <Text style={styles.customerLabel}>CUSTOMER</Text>
                    <Text style={[styles.customerName, !isTablet && { fontSize: 11 }]} numberOfLines={1}>
                        {customerName.toUpperCase()}
                    </Text>
                </View>
                <View style={styles.customerIcon}>
                    <User size={16} color="#64748B" />
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View>
                    <Text style={styles.footerLabel}>TIMESTAMP</Text>
                    <Text style={styles.footerValue}>{date.toUpperCase()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.footerLabel}>STATUS</Text>
                    <View style={styles.statusRow}>
                        <View style={styles.statusDot} />
                        <Text style={[styles.statusText, { color: '#10B981' }]}>{status}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.auditBtn} onPress={() => onAudit(item)}>
                    <Text style={styles.auditBtnText}>{isTablet ? 'VIEW AUDIT LOG' : 'AUDIT'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => onDelete(item.id)}
                >
                    <Trash2 size={isTablet ? 20 : 16} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#16161D',
        borderRadius: 24,
        padding: 16,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#0F1115',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    receiptInfo: {
        alignItems: 'flex-end',
    },
    receiptLabel: {
        fontSize: 9,
        color: Colors.primary,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 4,
    },
    receiptId: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    currencySymbol: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.primary,
        marginRight: 6,
        marginTop: 4,
    },
    amountValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -0.5,
        lineHeight: 28,
        flex: 1,
    },
    itemRow: {
        flexDirection: 'row',
        marginBottom: 28,
    },
    itemBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    itemBadgeText: {
        fontSize: 9,
        color: '#94A3B8',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    customerBox: {
        backgroundColor: '#1A1A22',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    customerLabel: {
        fontSize: 8,
        color: Colors.primary,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 4,
    },
    customerName: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFF',
    },
    customerIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    footerLabel: {
        fontSize: 8,
        color: '#64748B',
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 6,
    },
    footerValue: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    auditBtn: {
        flex: 1,
        height: 40,
        backgroundColor: '#FFF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    auditBtnText: {
        fontSize: 10,
        color: '#000',
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    deleteBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
});

export default React.memo(SaleCard);
