import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Download, Plus, TrendingUp, PackageSearch } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/Theme';

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
            <View style={styles.heroCard}>
                <View style={styles.heroHeaderRow}>
                    <View style={styles.idStation}>
                        <View style={styles.technicalLogo}>
                            <PackageSearch color={Colors.primary} size={18} strokeWidth={3} />
                        </View>
                        <View style={styles.visualTelemetry}>
                            <View style={styles.telemetryTop}>
                                {[0.3, 0.6, 1, 0.4, 0.8, 0.5, 0.9].map((op, i) => (
                                    <View key={i} style={[styles.telBar, { height: 3 + i, opacity: op }]} />
                                ))}
                            </View>
                            <View style={styles.brandContainer}>
                                <Text style={styles.brandTitle}>INVENTORY REGISTRY</Text>
                                <View style={styles.statusRow}>
                                    <View style={styles.activeDot} />
                                    <Text style={styles.statusLabel}>MASTER_DATA_ACCESS</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.heroActionsRow}>
                        <TouchableOpacity style={styles.iconBtn} onPress={onExportCSV} disabled={exporting}>
                            {exporting ? <ActivityIndicator size="small" color={Colors.textMuted} /> : <Download size={14} color={Colors.textMuted} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addBtn} onPress={onAddProduct}>
                            <Plus size={16} color="#000" strokeWidth={3} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.intelligenceGrid}>
                    <View style={styles.intelCard}>
                        <Text style={styles.intelLabel}>TOTAL_ASSETS</Text>
                        <View style={styles.valueRow}>
                            <View style={[styles.glowBar, { backgroundColor: Colors.primary }]} />
                            <Text style={styles.intelValue}>{totalAssets}</Text>
                        </View>
                    </View>
                    <View style={styles.intelCard}>
                        <Text style={styles.intelLabel}>STOCKED_VAL</Text>
                        <View style={styles.valueRow}>
                            <View style={[styles.glowBar, { backgroundColor: Colors.success }]} />
                            <Text style={styles.intelValue}>{stockedValue.toLocaleString()}</Text>
                        </View>
                    </View>

                    <View style={styles.compactRow}>
                        <View style={styles.intelCardCompact}>
                            <View style={[styles.miniDot, { backgroundColor: Colors.warning }]} />
                            <Text style={styles.intelLabelSmall}>LOW_STOCK: {lowStockCount}</Text>
                        </View>
                        <View style={styles.intelCardCompact}>
                            <View style={[styles.miniDot, { backgroundColor: Colors.error }]} />
                            <Text style={styles.intelLabelSmall}>OUT_STOCK: {outOfStockCount}</Text>
                        </View>
                    </View>
                </View>

                {/* HUD Corner Accents */}
                <View style={[styles.corner, { top: 12, left: 12, borderTopWidth: 1, borderLeftWidth: 1 }]} />
                <View style={[styles.corner, { bottom: 12, right: 12, borderBottomWidth: 1, borderRightWidth: 1 }]} />
                <View style={[styles.corner, { top: 12, right: 12, borderTopWidth: 1, borderRightWidth: 1, opacity: 0.1 }]} />
                <View style={[styles.corner, { bottom: 12, left: 12, borderBottomWidth: 1, borderLeftWidth: 1, opacity: 0.1 }]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    heroSection: {
        marginBottom: Spacing.md,
    },
    heroCard: {
        padding: 16,
        paddingTop: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(15,15,23,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    idStation: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    technicalLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.02)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    visualTelemetry: { flex: 1 },
    telemetryTop: { flexDirection: 'row', gap: 2, alignItems: 'flex-end', marginBottom: 4 },
    telBar: { width: 3, borderRadius: 1, backgroundColor: Colors.primary },
    brandContainer: { marginTop: 0 },
    brandTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.success, shadowColor: Colors.success, shadowRadius: 4, shadowOpacity: 0.5 },
    statusLabel: { color: Colors.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },

    heroHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    heroActionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    intelligenceGrid: {
        gap: 10,
    },
    intelCard: {
        flex: 1,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    intelCardCompact: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.01)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.02)',
        gap: 8,
    },
    compactRow: {
        flexDirection: 'row',
        gap: 10,
    },
    intelLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.textMuted,
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    intelLabelSmall: {
        fontSize: 9,
        fontWeight: '900',
        color: Colors.textMuted,
        letterSpacing: 1,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    glowBar: {
        width: 2,
        height: 12,
        borderRadius: 1,
        opacity: 0.8,
    },
    intelValue: {
        fontSize: 22, // Stand out more
        fontWeight: '900',
        color: '#F8FAFC',
    },
    miniDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    corner: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderColor: Colors.primary,
        opacity: 0.3,
    },
});
