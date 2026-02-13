import React, { useState } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, ScrollView, TouchableOpacity, RefreshControl, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Search, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { exportToCSV } from '../utils/export';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSales } from '../hooks/useSales';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import { salesAPI } from '../api/client';
import { Sale } from '../types';

const ProfitCard = ({ item, width }: { item: Sale, width: number }) => {
    // Mock cost/profit data since API might not return it directly yet
    const revenue = item.amount;
    // Use the snapshot if available, fallback to product current cost (less accurate but okay as fallback), fallback to 0
    const cogs = item.costPriceSnapshot ?? item.product?.costPrice ?? 0;
    const profit = revenue - cogs;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const date = item.date ? new Date(item.date).toLocaleDateString('en-GB') : 'Unknown';

    return (
        <View style={[styles.card, { width }]}>
            {/* Header: Transaction ID */}
            <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                    <TrendingUp size={20} color="#10B981" />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerLabel}>TRANSACTION PROFIT</Text>
                    <Text style={styles.headerValue}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                </View>
            </View>

            {/* Profit Amount - Hero */}
            <View style={styles.profitSection}>
                <Text style={styles.profitLabel}>NET PROFIT</Text>
                <View style={styles.profitAmountRow}>
                    <Text style={styles.plusSign}>+</Text>
                    <Text style={styles.currencySymbol}>Le</Text>
                    <Text style={styles.profitValue}>{profit.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                </View>
            </View>

            {/* Breakdown: Revenue vs Cost */}
            <View style={styles.breakdownContainer}>
                <View style={styles.breakdownRow}>
                    <View style={styles.breakdownItem}>
                        <ArrowUpRight size={12} color="#10B981" />
                        <Text style={styles.breakdownLabel}>REVENUE</Text>
                    </View>
                    <Text style={styles.breakdownValue}>Le {revenue.toLocaleString()}</Text>
                </View>
                <View style={[styles.breakdownRow, { marginTop: 8 }]}>
                    <View style={styles.breakdownItem}>
                        <ArrowDownRight size={12} color="#EF4444" />
                        <Text style={styles.breakdownLabel}>COST (COGS)</Text>
                    </View>
                    <Text style={styles.breakdownValue}>Le {cogs.toLocaleString()}</Text>
                </View>
            </View>

            {/* Footer: Margin & Date */}
            <View style={styles.cardFooter}>
                <View style={styles.marginBadge}>
                    <Text style={styles.marginText}>{margin.toFixed(1)}% MARGIN</Text>
                </View>
                <View style={styles.dateRow}>
                    <Calendar size={10} color="#64748B" />
                    <Text style={styles.dateText}>{date}</Text>
                </View>
            </View>
        </View>
    );
};

export default function ProfitsScreen() {
    const { sales, loading, refetch } = useSales();
    const { width } = useWindowDimensions();
    const [searchQuery, setSearchQuery] = useState('');
    const [exporting, setExporting] = useState(false);

    const filteredSales = sales.filter((s: Sale) =>
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.product?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Responsive Layout
    const isTablet = width >= 768;
    const isDesktop = width >= 1024;
    const gap = Spacing.lg;
    const totalPadding = Spacing.xl * 2;
    const sidebarWidth = isDesktop ? 240 : 0;
    const availableWidth = width - sidebarWidth - totalPadding;

    // 3 columns desktop, 2 tablet, 1 phone
    const numCols = isDesktop ? 3 : (isTablet ? 2 : 1);
    const itemWidth = (availableWidth - (gap * (numCols - 1))) / numCols;

    // Aggregate Metrics
    const totalRevenue = sales.reduce((sum: number, s: Sale) => sum + s.amount, 0);
    const totalCost = sales.reduce((sum: number, s: Sale) => sum + (s.costPriceSnapshot ?? s.product?.costPrice ?? 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const handleExportCSV = async () => {
        setExporting(true);
        try {
            await exportToCSV<Sale>(
                sales,
                [
                    { header: 'ID', key: 'id' },
                    { header: 'Date', key: (s) => s.date ? new Date(s.date).toISOString().split('T')[0] : 'N/A' },
                    { header: 'Revenue', key: 'amount' },
                    { header: 'Cost (COGS)', key: (s) => s.costPriceSnapshot ?? s.product?.costPrice ?? 0 },
                    {
                        header: 'Profit',
                        key: (s) => {
                            const rev = s.amount || 0;
                            const cost = s.costPriceSnapshot ?? s.product?.costPrice ?? 0;
                            return rev - cost;
                        }
                    },
                    {
                        header: 'Margin %',
                        key: (s) => {
                            const rev = s.amount || 0;
                            const cost = s.costPriceSnapshot ?? s.product?.costPrice ?? 0;
                            const profit = rev - cost;
                            return rev > 0 ? ((profit / rev) * 100).toFixed(2) : '0';
                        }
                    }
                ],
                'ESTOMMY_Profit_Report',
                'Export Profit Report'
            );
        } catch (error) {
            console.error('Profits Export Error:', error);
            Alert.alert('Export Failed', 'An error occurred while generating the CSV file.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refetch}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            >

                {/* Hero Header */}
                <LinearGradient
                    colors={['#1E1E26', '#12121A']}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <View style={styles.brandRow}>
                            <View style={styles.brandLine} />
                            <Text style={styles.brandLabel}>ANALYTICS</Text>
                        </View>

                        <View style={styles.metricsContainer}>
                            <View style={styles.metricItem}>
                                <Text style={styles.metricLabel}>NET INCOME</Text>
                                <Text style={styles.metricValue}>Le {totalProfit.toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.headerMain}>
                        <View style={styles.titleWrapper}>
                            <Text style={styles.headerTitle}>PROFIT MONITOR</Text>
                            <Text style={styles.headerSubtitle}>
                                Real-time profit and loss tracking with margin analysis.
                            </Text>
                        </View>

                        <View style={styles.kpiContainer}>
                            <View style={styles.kpiBox}>
                                <View>
                                    <Text style={styles.kpiLabel}>AVG MARGIN</Text>
                                    <Text style={styles.kpiValue}>{avgMargin.toFixed(1)}%</Text>
                                </View>
                                <View style={styles.kpiDivider} />
                                <View>
                                    <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
                                    <Text style={styles.kpiValue}>Le {(totalRevenue / 1000).toFixed(1)}k</Text>
                                </View>
                            </View>

                            <View style={[styles.kpiBox, { marginTop: 12 }]}>
                                <View>
                                    <Text style={styles.kpiLabel}>TOTAL COST (COGS)</Text>
                                    <Text style={[styles.kpiValue, { color: '#EF4444' }]}>Le {(totalCost / 1000).toFixed(1)}k</Text>
                                </View>
                                <View style={styles.kpiDivider} />
                                <View>
                                    <Text style={styles.kpiLabel}>EFFICIENCY</Text>
                                    <Text style={[styles.kpiValue, { color: '#10B981' }]}>HIGH</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                {/* Filters */}
                <View style={styles.filtersRow}>
                    <View style={styles.searchBox}>
                        <Search size={18} color="#475569" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Filter transaction records..."
                            placeholderTextColor="#475569"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.exportBtn, exporting && { opacity: 0.5 }]}
                        onPress={handleExportCSV}
                        disabled={exporting}
                    >
                        {exporting ? (
                            <ActivityIndicator size="small" color="#F8FAFC" />
                        ) : (
                            <Text style={styles.exportText}>DOWNLOAD REPORT</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Profits Grid */}
                <View style={[styles.grid, { gap }]}>
                    {filteredSales.map((item: Sale) => (
                        <ProfitCard
                            key={item.id}
                            item={item}
                            width={itemWidth}
                        />
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
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
    // Header
    header: {
        borderRadius: 40,
        padding: 40,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    brandLine: {
        width: 30,
        height: 2,
        backgroundColor: '#10B981',
    },
    brandLabel: {
        fontSize: 11,
        color: '#10B981',
        fontWeight: '800',
        letterSpacing: 2,
    },
    metricsContainer: {
        alignItems: 'flex-end',
    },
    metricItem: {
        alignItems: 'flex-end',
    },
    metricLabel: {
        fontSize: 9,
        color: '#10B981',
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
    },
    headerMain: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 24,
    },
    titleWrapper: {
        flex: 1,
        minWidth: 250,
    },
    headerTitle: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -1,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
        maxWidth: 400,
    },
    kpiContainer: {
        minWidth: 280,
    },
    kpiBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'space-between',
        gap: 20,
    },
    kpiDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    kpiLabel: {
        fontSize: 8,
        color: '#64748B',
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 2,
    },
    kpiValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFF',
    },
    filtersRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    searchBox: {
        flex: 1,
        height: 52,
        backgroundColor: '#111827',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    searchInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    exportBtn: {
        backgroundColor: '#111827',
        height: 52,
        paddingHorizontal: 20,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    exportText: {
        color: '#F8FAFC',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    card: {
        backgroundColor: '#16161D',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: Spacing.lg,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    headerInfo: {
        flex: 1,
    },
    headerLabel: {
        fontSize: 8,
        color: '#10B981',
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 2,
    },
    headerValue: {
        fontSize: 13,
        color: '#F8FAFC',
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    profitSection: {
        marginBottom: 24,
    },
    profitLabel: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
    },
    profitValue: {
        fontSize: 36,
        fontWeight: '900',
        color: '#10B981',
        letterSpacing: -1,
    },
    profitAmountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    plusSign: {
        fontSize: 20,
        fontWeight: '900',
        color: '#10B981',
        marginRight: 4,
    },
    currencySymbol: {
        fontSize: 14,
        fontWeight: '900',
        color: '#64748B',
        marginRight: 4,
    },
    breakdownContainer: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        marginBottom: 24,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    breakdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    breakdownLabel: {
        fontSize: 9,
        color: '#94A3B8',
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    breakdownValue: {
        fontSize: 12,
        color: '#F8FAFC',
        fontWeight: '700',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    marginBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    marginText: {
        fontSize: 10,
        color: '#10B981',
        fontWeight: '900',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
});
