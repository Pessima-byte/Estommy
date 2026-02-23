import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, ScrollView, TouchableOpacity, RefreshControl, TextInput, Alert, Modal, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSales } from '../hooks/useSales';
import { salesAPI } from '../api/client';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import { Sale } from '../types';
import { exportToCSV } from '../utils/export';
import AddSaleScreen from './AddSaleScreen';
import SaleCard from '../components/SaleCard';

export default function SalesScreen() {
    const { sales, loading, refetch } = useSales();
    const { width } = useWindowDimensions();
    const [isAdding, setIsAdding] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSales = useMemo(() => sales.filter((s: Sale) =>
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customer?.name || 'Walk-in').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.items || '').toLowerCase().includes(searchQuery.toLowerCase())
    ), [sales, searchQuery]);

    const handleDelete = (id: string) => {
        Alert.alert(
            'Confirm Removal',
            'Delete this transaction from history? This action is immutable.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await salesAPI.delete(id);
                            refetch();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete transaction.');
                        }
                    }
                }
            ]
        );
    };

    const handleAudit = (sale: any) => {
        Alert.alert(
            'Transaction Audit',
            `Receipt: #${sale.id.slice(0, 8).toUpperCase()} \nAmount: Le ${sale.amount.toLocaleString()} \nCustomer: ${sale.customer?.name || 'Walk-in'} \nItems: ${sale.items || 'General Purchase'} \nDate: ${new Date(sale.date).toLocaleString()} `,
            [{ text: 'Close' }]
        );
    };

    const handleExportCSV = async () => {
        setExporting(true);
        try {
            await exportToCSV<Sale>(
                sales,
                [
                    { header: 'ID', key: 'id' },
                    { header: 'Date', key: (s) => s.date ? new Date(s.date).toISOString().split('T')[0] : 'N/A' },
                    { header: 'Customer', key: (s) => s.customer?.name || 'Walk-in' },
                    { header: 'Amount', key: 'amount' },
                    { header: 'Status', key: (s) => s.status || 'Unknown' },
                    { header: 'Items', key: (s) => s.items || 'General Purchase' }
                ],
                'ESTOMMY_Sales',
                'Export Sales History'
            );
        } catch (error) {
            Alert.alert('Export Failed', 'An error occurred while generating the CSV file.');
        } finally {
            setExporting(false);
        }
    };

    // Responsive Layout
    const isTablet = width >= 768;
    const isDesktop = width >= 768;
    const gap = isTablet ? Spacing.lg : Spacing.sm;
    const numCols = isDesktop ? 3 : 2; // 2 columns on mobile
    const sidebarWidth = isDesktop ? 240 : 0;
    const horizontalPadding = isTablet ? Spacing.xl : 8;
    const itemWidth = (width - sidebarWidth - (horizontalPadding * 2) - (gap * (numCols - 1))) / numCols;

    const totalRevenue = sales.reduce((sum: number, sale: Sale) => sum + (sale.amount || 0), 0);
    const netProfit = totalRevenue;

    const headerComponent = useMemo(() => (
        <View>
            <LinearGradient
                colors={['#1E1E26', '#12121A']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <View style={styles.ledgerLabelRow}>
                        <View style={styles.ledgerLine} />
                        <Text style={styles.ledgerLabel}>LEDGER</Text>
                    </View>

                    <View style={styles.metricsContainer}>
                        <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>NET REVENUE</Text>
                            <Text style={styles.metricValue}>Le {totalRevenue.toLocaleString()}</Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metricItem}>
                            <Text style={[styles.metricLabel, { color: '#10B981' }]}>NET PROFIT</Text>
                            <Text style={[styles.metricValue, { color: Colors.primary }]}>Le {netProfit.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.headerMain}>
                    <View style={styles.titleWrapper}>
                        <Text style={styles.headerTitle}>SALES HISTORY</Text>
                        <Text style={styles.headerSubtitle}>
                            Immutable transaction history and real-time revenue analytics.
                        </Text>
                    </View>

                    <View style={styles.headerBtnGroup}>
                        <TouchableOpacity
                            style={[styles.exportBtn, exporting && { opacity: 0.5 }]}
                            onPress={handleExportCSV}
                            disabled={exporting}
                        >
                            <Text style={styles.exportBtnText}>{exporting ? 'EXPORTING...' : 'EXPORT CSV'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.newEntryBtn}
                            onPress={() => setIsAdding(true)}
                        >
                            <Text style={styles.newEntryText}>NEW ENTRY</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.searchContainer}>
                <Search size={18} color="#475569" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search transactions..."
                    placeholderTextColor="#475569"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
        </View>
    ), [totalRevenue, netProfit, exporting, searchQuery]);

    if (isAdding) {
        return (
            <AddSaleScreen
                onClose={() => setIsAdding(false)}
                onSuccess={() => {
                    setIsAdding(false);
                    refetch();
                }}
            />
        );
    }

    const keyExtractor = useCallback((item: Sale) => item.id, []);

    const renderItem = useCallback(({ item }: { item: Sale }) => (
        <SaleCard
            item={item}
            width={itemWidth}
            onDelete={handleDelete}
            onAudit={handleAudit}
            isTablet={isTablet}
        />
    ), [itemWidth, handleDelete, handleAudit, isTablet]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
            <LinearGradient
                colors={['#060609', '#0F172A', '#060608']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                pointerEvents="none"
            />
            {/* Atmosphere Layer: Enhanced multi-source glow */}
            <View style={styles.atmosphereGlow} pointerEvents="none" />
            <View style={[styles.atmosphereGlow, { top: '40%', left: -100, opacity: 0.03, backgroundColor: '#00D9FF' }]} pointerEvents="none" />

            <FlatList
                data={filteredSales}
                keyExtractor={keyExtractor}
                numColumns={numCols}
                key={numCols}
                ListHeaderComponent={headerComponent}
                renderItem={renderItem}
                columnWrapperStyle={numCols > 1 ? { gap } : null}
                contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refetch}
                        tintColor={Colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No transactions found.</Text>
                    </View>
                }
                ListFooterComponent={<View style={{ height: 100 }} />}
                removeClippedSubviews={true}
                maxToRenderPerBatch={5}
                windowSize={10}
                initialNumToRender={8}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    atmosphereGlow: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: Colors.primary,
        opacity: 0.08,
        transform: [{ scale: 2.5 }],
    },
    scrollContent: {
        paddingTop: Spacing.md,
    },
    header: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    ledgerLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ledgerLine: {
        width: 30,
        height: 2,
        backgroundColor: Colors.primary,
    },
    ledgerLabel: {
        fontSize: 11,
        color: Colors.primary,
        fontWeight: '800',
        letterSpacing: 2,
    },
    metricsContainer: {
        flexDirection: 'row',
        gap: 12, // Tighter on mobile
        alignItems: 'center',
    },
    metricItem: {
        alignItems: 'flex-end',
    },
    metricDivider: {
        width: 1,
        height: 20, // Shorter
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    metricLabel: {
        fontSize: 7, // Smaller labels
        color: Colors.primary,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 14, // Smaller values
        fontWeight: '900',
        color: '#FFF',
    },
    headerMain: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
    },
    titleWrapper: {
        flex: 1,
        minWidth: 250,
    },
    headerTitle: {
        fontSize: 22, // scaled down
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#64748B',
        lineHeight: 16,
        maxWidth: 400,
    },
    headerBtnGroup: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    exportBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    exportBtnText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    newEntryBtn: {
        backgroundColor: '#FFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
    },
    newEntryText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    searchContainer: {
        height: 44, // shorter
        backgroundColor: '#111827',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    searchInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 14,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#64748B',
        fontSize: 14,
        fontStyle: 'italic',
    }
});
