import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { LucideIcon, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing } from '../constants/Theme';

interface QuickActionCardProps {
    title: string;
    icon: LucideIcon;
    onPress?: () => void;
    width?: any;
    color?: string;
}

const QuickActionCard = ({ title, icon: Icon, onPress, width, color = Colors.primary }: QuickActionCardProps) => {
    const { width: windowWidth } = useWindowDimensions();
    const isTablet = windowWidth >= 768;

    return (
        <TouchableOpacity
            style={[styles.actionCard, { width }, isTablet && { height: 110, borderRadius: 16 }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                style={[styles.container, isTablet && { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={[styles.iconBox, isTablet && { width: 44, height: 44, borderRadius: 12, marginBottom: 8 }]}>
                    <View style={[styles.glowRing, { borderColor: color, opacity: 0.1 }]} />
                    <Icon size={isTablet ? 20 : 16} color={color} strokeWidth={2.5} />
                </View>

                <View style={[styles.content, isTablet && { marginLeft: 0, alignItems: 'center' }]}>
                    <Text style={[styles.actionLabel, isTablet && { fontSize: 7, letterSpacing: 2, marginBottom: 4 }]}>PROTOCOL_INT</Text>
                    <Text style={[styles.title, isTablet && { fontSize: 13, textAlign: 'center' }]} numberOfLines={2} adjustsFontSizeToFit>{title.toUpperCase()}</Text>
                </View>

                {!isTablet && (
                    <View style={styles.chevron}>
                        <ChevronRight size={14} color={color} strokeWidth={3} />
                    </View>
                )}

                {/* Technical Detail */}
                <View style={[styles.sideMarker, { backgroundColor: color }, isTablet && { left: '25%', top: 0, width: '50%', height: 2, borderTopRightRadius: 0, borderBottomRightRadius: 2, borderBottomLeftRadius: 2 }]} />
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    actionCard: {
        height: 72,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#0F0F17',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    glowRing: {
        position: 'absolute',
        width: '120%',
        height: '120%',
        borderRadius: 15,
        borderWidth: 1,
    },
    content: {
        flex: 1,
        marginLeft: 8,
        justifyContent: 'center',
    },
    actionLabel: {
        fontSize: 6,
        fontWeight: '900',
        color: Colors.textMuted,
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    title: {
        fontSize: 11,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    chevron: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sideMarker: {
        position: 'absolute',
        left: 0,
        top: '25%',
        height: '50%',
        width: 2,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
    },
});

export default QuickActionCard;
