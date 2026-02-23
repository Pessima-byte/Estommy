import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { Clock } from 'lucide-react-native';

const CreditLedgerItem = React.memo(({ item, onSettle, index = 0 }: { item: any, onSettle: (credit: any) => void, index?: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    const isPaid = item.status === 'Paid';
    const amountDue = item.liability || (item.amount - (item.amountPaid || 0));

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 40,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                delay: index * 40,
                damping: 15,
                stiffness: 120,
                useNativeDriver: true,
            })
        ]).start();
    }, [index]);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            <TouchableOpacity
                style={styles.ledgerItem}
                onPress={() => onSettle(item)}
                activeOpacity={0.7}
            >
                <View style={styles.ledgerLeft}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{(item.customerName?.[0] || 'U').toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.ledgerCustomerName} numberOfLines={1}>{item.customerName || 'N/A'}</Text>
                        {item.notes ? (
                            <Text style={styles.ledgerNotes} numberOfLines={1}>{item.notes}</Text>
                        ) : (
                            <View style={styles.timestampRow}>
                                <Clock size={8} color="#64748B" />
                                <Text style={styles.ledgerTimestamp}>RECENT_TRX_LOGGED</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.ledgerRight}>
                    <View style={styles.ledgerAmountContainer}>
                        <Text style={styles.ledgerAmountLabel}>LIABILITY_VALUE</Text>
                        <View style={styles.ledgerAmountRow}>
                            <Text style={styles.ledgerCurrency}>LE</Text>
                            <Text style={styles.ledgerAmountValue}>{amountDue.toLocaleString()}</Text>
                        </View>
                    </View>
                    <View style={[styles.ledgerStatusBadge, {
                        backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                        borderColor: isPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)'
                    }]}>
                        <Text style={[styles.ledgerStatusText, { color: isPaid ? '#10B981' : 'rgba(255,255,255,0.4)' }]}>
                            {isPaid ? 'PAID' : 'PENDING'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    ledgerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    ledgerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(197, 160, 89, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.3)',
    },
    avatarText: {
        color: '#C5A059',
        fontSize: 14,
        fontWeight: '900',
    },
    ledgerCustomerName: {
        fontSize: 13,
        fontWeight: '800',
        color: '#F8FAFC',
        marginBottom: 2,
    },
    ledgerNotes: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
    },
    timestampRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ledgerTimestamp: {
        fontSize: 8,
        color: '#64748B',
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    ledgerRight: {
        alignItems: 'flex-end',
        gap: 6,
    },
    ledgerAmountContainer: {
        alignItems: 'flex-end',
    },
    ledgerAmountLabel: {
        fontSize: 7,
        color: '#64748B',
        fontWeight: '900',
        letterSpacing: 0.5,
        marginBottom: 1,
    },
    ledgerAmountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ledgerCurrency: {
        fontSize: 8,
        color: '#C5A059',
        fontWeight: '900',
    },
    ledgerAmountValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#F8FAFC',
    },
    ledgerStatusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
    },
    ledgerStatusText: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});

export default CreditLedgerItem;
