import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

interface QuickActionCardProps {
    title: string;
    flex?: boolean;
    width?: number;
    onPress?: () => void;
}

const QuickActionCard = ({ title, flex, width, onPress }: QuickActionCardProps) => (
    <TouchableOpacity style={[styles.actionCard, flex ? { flex: 1 } : { width }]} onPress={onPress}>
        <Text style={styles.priorityLabel}>QUICK ACTION</Text>
        <Text style={styles.actionTitle} adjustsFontSizeToFit minimumFontScale={0.5} numberOfLines={1}>{title}</Text>
        <View style={styles.executeRow}>
            <Text style={styles.executeText}>SELECT</Text>
            <ArrowRight size={12} color="#64748B" />
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    actionCard: {
        backgroundColor: '#1E1E26',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    priorityLabel: {
        fontSize: 9,
        color: '#475569',
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 8,
    },
    actionTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#F8FAFC',
        marginBottom: 20,
    },
    executeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    executeText: {
        fontSize: 10,
        color: '#C5A059',
        fontWeight: '800',
        letterSpacing: 1,
    },
});

export default QuickActionCard;
