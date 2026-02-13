import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Download, Plus } from 'lucide-react-native';
import { Colors } from '../../constants/Theme';
import { Product } from '../../types';

interface InventoryHeroProps {
    totalAssets: number;
    stockedValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    onExportCSV: () => void;
    onAddProduct: () => void;
    exporting: boolean;
}

export default function InventoryHero({
    totalAssets,
    stockedValue,
    lowStockCount,
    outOfStockCount,
    onExportCSV,
    onAddProduct,
    exporting
}: InventoryHeroProps) {
    return (
        <View style={styles.heroSection}>
            <LinearGradient
                colors={['#1F1F2B', '#111118']}
                style={styles.heroCard}
            >
                <View style={styles.heroHeaderRow}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.brandSubtitleRow}>
                            <View style={styles.brandLine} />
                            <Text style={styles.brandSubtitle}>INVENTORY</Text>
                        </View>
                        <Text style={styles.heroTitle}>REGISTRY & STOCK</Text>
                    </View>
                    <View style={styles.heroActionsRow}>
                        <TouchableOpacity style={styles.iconBtn} onPress={onExportCSV} disabled={exporting}>
                            {exporting ? <ActivityIndicator size="small" color="#94A3B8" /> : <Download size={20} color="#94A3B8" />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addBtn} onPress={onAddProduct}>
                            <Plus size={20} color="#000" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.intelligenceGrid}>
                    <View style={styles.intelCard}>
                        <Text style={styles.intelLabel}>TOTAL ASSETS</Text>
                        <Text style={styles.intelValue}>{totalAssets}</Text>
                    </View>
                    <View style={styles.intelCard}>
                        <Text style={[styles.intelLabel, { color: '#10B981' }]}>STOCKED VALUE</Text>
                        <View style={styles.intelValueRow}>
                            <Text style={styles.intelCurrency}>LE</Text>
                            <Text style={styles.intelValue}>
                                {stockedValue.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.intelCardCompact}>
                        <View style={[styles.statusIndicator, { backgroundColor: '#F59E0B' }]} />
                        <View>
                            <Text style={styles.intelLabelSmall}>LOW STOCK</Text>
                            <Text style={styles.intelValueSmall}>{lowStockCount}</Text>
                        </View>
                    </View>
                    <View style={styles.intelCardCompact}>
                        <View style={[styles.statusIndicator, { backgroundColor: '#EF4444' }]} />
                        <View>
                            <Text style={styles.intelLabelSmall}>OUT OF STOCK</Text>
                            <Text style={styles.intelValueSmall}>{outOfStockCount}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    heroSection: {
        marginBottom: 24,
    },
    heroCard: {
        padding: 24,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    heroHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    brandSubtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    brandLine: {
        width: 16,
        height: 2,
        backgroundColor: Colors.primary,
    },
    brandSubtitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 2.5,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#F8FAFC',
        letterSpacing: -0.5,
    },
    heroActionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    intelligenceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    intelCard: {
        flex: 1,
        minWidth: 140,
        padding: 18,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    intelCardCompact: {
        flex: 1,
        minWidth: 140,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        gap: 12,
    },
    intelLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1.2,
        marginBottom: 8,
    },
    intelLabelSmall: {
        fontSize: 8,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
        marginBottom: 2,
    },
    intelValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#F8FAFC',
    },
    intelValueSmall: {
        fontSize: 16,
        fontWeight: '900',
        color: '#F8FAFC',
    },
    intelValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    intelCurrency: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#10B981',
        opacity: 0.7,
    },
    statusIndicator: {
        width: 4,
        height: 24,
        borderRadius: 2,
    },
});
