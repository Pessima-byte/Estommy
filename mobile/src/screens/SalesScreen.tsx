import React, { useState, useMemo } from 'react';
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

    const filteredSales = sales.filter((s: Sale) =>
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customer?.name || 'Walk-in').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.items || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

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
    const isDesktop = width >= 1024;
    const gap = Spacing.lg;
    const numCols = isDesktop ? 3 : (isTablet ? 2 : 1);
    const itemWidth = (width - (Spacing.xl * 2) - (gap * (numCols - 1))) / numCols;

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

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={filteredSales}
                keyExtractor={(item) => item.id}
                numColumns={numCols}
                key={numCols}
                ListHeaderComponent={headerComponent}
                renderItem={({ item }) => (
                    <SaleCard
                        item={item}
                        width={itemWidth}
                        onDelete={handleDelete}
                        onAudit={handleAudit}
                    />
                )}
                columnWrapperStyle={numCols > 1 ? { gap } : null}
                contentContainerStyle={styles.scrollContent}
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
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0C10',
    },
    scrollContent: {
        padding: Spacing.xl,
    },
    header: {
        borderRadius: 40,
        padding: 32,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
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
        gap: 24,
        alignItems: 'center',
    },
    metricItem: {
        alignItems: 'flex-end',
    },
    metricDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    metricLabel: {
        fontSize: 9,
        color: Colors.primary,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 20,
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
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -1,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
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
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    searchContainer: {
        height: 52,
        backgroundColor: '#111827',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
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
