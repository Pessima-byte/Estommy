import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing } from '../constants/Theme';

interface StatCardProps {
    label: string;
    value: string;
    icon: LucideIcon;
    color: string;
    flex?: boolean;
    width?: any;
    onPress?: () => void;
}

const StatCard = ({ label, value, icon: Icon, color, flex, width, onPress }: StatCardProps) => {
    const { width: windowWidth } = useWindowDimensions();
    const isTablet = windowWidth >= 768;

    return (
        <TouchableOpacity
            style={[
                styles.statCard,
                flex ? { flex: 1 } : { width },
                isTablet && { height: 120, borderRadius: 16 }
            ]}
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                style={[styles.glassBackground, isTablet && { padding: 16 }]}
            >
                <View style={styles.topRow}>
                    <View style={[styles.iconContainer, { borderColor: color + '30' }, isTablet && { width: 36, height: 36, borderRadius: 10 }]}>
                        <Icon size={isTablet ? 18 : 14} color={color} strokeWidth={2.5} />
                    </View>
                    <View style={styles.growthContainer}>
                        <Text style={[styles.growthText, { color }, isTablet && { fontSize: 9 }]}>+4.2%</Text>
                    </View>
                </View>

                <View style={[styles.statMain, isTablet && { marginTop: 8 }]}>
                    <Text style={[styles.hudLabel, isTablet && { fontSize: 9, marginBottom: 4 }]} numberOfLines={1}>{label}</Text>
                    <View style={styles.valueRow}>
                        {label === 'DEBTORS' && (
                            <Text style={[
                                styles.currency,
                                { color },
                                isTablet && { fontSize: 13 },
                                !isTablet && { fontSize: 10 }
                            ]}>LE</Text>
                        )}
                        <Text
                            style={[
                                styles.hudValue,
                                {
                                    fontSize: isTablet
                                        ? (value.length > 9 ? 16 : 20)
                                        : (value.length > 9 ? 13 : 15),
                                }
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {value}
                        </Text>
                    </View>
                </View>

                {/* Corner HUD markers */}
                <View style={[styles.cornerMarker, { top: 0, left: 0, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: color + '80' }]} />
                <View style={[styles.cornerMarker, { bottom: 0, right: 0, borderBottomWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]} />
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    statCard: {
        height: 95,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#0F0F17',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    glassBackground: {
        flex: 1,
        padding: 10,
        justifyContent: 'space-between',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.02)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    growthContainer: {
        marginTop: 2,
    },
    growthText: {
        fontSize: 7,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    statMain: {
        marginTop: 4,
    },
    hudLabel: {
        fontSize: 7,
        fontWeight: '800',
        color: Colors.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 1,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    currency: {
        fontSize: 11,
        fontWeight: '900',
        marginRight: 1,
    },
    hudValue: {
        fontSize: 17,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    cornerMarker: {
        position: 'absolute',
        width: 8,
        height: 8,
    }
});

export default StatCard;
