import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

interface StatCardProps {
    label: string;
    value: string;
    icon: LucideIcon;
    color: string;
    flex?: boolean;
    width?: number;
    onPress?: () => void;
}

const StatCard = ({ label, value, icon: Icon, color, flex, width, onPress }: StatCardProps) => (
    <TouchableOpacity
        style={[styles.statCard, flex ? { flex: 1 } : { width }]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
    >
        <View style={styles.statCardInner}>
            <View style={styles.statTop}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                    <Icon size={18} color={color} />
                </View>
                <View style={styles.growthBadge}>
                    <Text style={styles.growthValue}>+4.2% ↑</Text>
                </View>
            </View>

            <View style={styles.statBottom}>
                <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
                <View style={styles.valueRow}>
                    {label === 'DEBTORS' && <Text style={styles.currencySymbol}>Le</Text>}
                    <Text style={styles.statValue} adjustsFontSizeToFit minimumFontScale={0.5} numberOfLines={1}>{value}</Text>
                </View>
            </View>
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    statCard: {
        height: 160,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.04)',
        padding: 20,
    },
    statCardInner: {
        flex: 1,
        justifyContent: 'space-between',
    },
    statTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    growthBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    growthValue: {
        fontSize: 10,
        color: '#10B981',
        fontWeight: '800',
    },
    statBottom: {
        gap: 6,
    },
    statLabel: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    currencySymbol: {
        fontSize: 14,
        color: '#C5A059',
        fontWeight: '800',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#F8FAFC',
        letterSpacing: -0.5,
    },
});

export default StatCard;
