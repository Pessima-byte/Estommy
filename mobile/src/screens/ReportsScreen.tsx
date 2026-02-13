import React, { useMemo } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, TrendingUp, DollarSign, Package, PieChart as PieChartIcon, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { useSales } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import { Sale, Product } from '../types';

export default function ReportsScreen() {
    const { sales, loading: loadingSales, refetch: refetchSales } = useSales();
    const { products, loading: loadingProducts, refetch: refetchProducts } = useProducts();
    const { width } = useWindowDimensions();

    const isRefreshing = loadingSales || loadingProducts;

    const handleRefresh = async () => {
        await Promise.all([refetchSales(), refetchProducts()]);
    };

    // Responsive Layout
    const isDesktop = width >= 1024;
    const sidebarWidth = isDesktop ? 240 : 0;
    const padding = Spacing.xl * 2;
    const chartWidth = width - sidebarWidth - padding;

    // Data Aggregation for Line Chart (Revenue over time)
    const lineChartData = useMemo(() => {
        if (!sales.length) return null;

        // Group sales by date (last 7 days or just last few entries)
        const sortedSales = [...sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const last7Days = sortedSales.slice(-7);

        return {
            labels: last7Days.map((s: Sale) => new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })),
            datasets: [
                {
                    data: last7Days.map((s: Sale) => s.amount),
                    color: (opacity = 1) => `rgba(197, 160, 89, ${opacity})`, // Gold
                    strokeWidth: 2
                }
            ],
            legend: ["Revenue (Last 7 Trans.)"]
        };
    }, [sales]);

    // Data Aggregation for Pie Chart (Sales by Category)
    const pieChartData = useMemo(() => {
        if (!sales.length) return [];

        const categoryTotals: { [key: string]: number } = {};
        sales.forEach((s: Sale) => {
            const cat = s.product?.category || 'General';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + s.amount;
        });

        const colors = ['#C5A059', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B'];
        return Object.entries(categoryTotals).map(([name, total], index) => ({
            name,
            population: total,
            color: colors[index % colors.length],
            legendFontColor: "#94A3B8",
            legendFontSize: 12
        })).sort((a, b) => b.population - a.population).slice(0, 5);
    }, [sales]);

    // Data Aggregation for Bar Chart (Stock Levels)
    const barChartData = useMemo(() => {
        if (!products.length) return null;

        const topProducts = [...products].sort((a, b) => b.stock - a.stock).slice(0, 5);

        return {
            labels: topProducts.map(p => p.name.slice(0, 6) + '..'),
            datasets: [
                {
                    data: topProducts.map(p => p.stock)
                }
            ]
        };
    }, [products]);

    if (loadingSales && !sales.length) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={Colors.primary}
                    />
                }
            >
                {/* Hero Header */}
                <LinearGradient
                    colors={['#1E1E26', '#12121A']}
                    style={styles.header}
                >
                    <View style={styles.brandRow}>
                        <View style={styles.brandLine} />
                        <Text style={styles.brandLabel}>INTELLIGENCE</Text>
                    </View>
                    <Text style={styles.headerTitle}>EXECUTIVE REPORTS</Text>
                    <Text style={styles.headerSubtitle}>
                        Visual data analytics and performance monitoring.
                    </Text>
                </LinearGradient>

                {/* Main Grid */}
                <View style={styles.chartsGrid}>

                    {/* Revenue Trend Chart */}
                    <View style={[styles.chartCard, { width: isDesktop ? '66%' : '100%' }]}>
                        <View style={styles.chartHeader}>
                            <TrendingUp size={18} color="#C5A059" />
                            <Text style={styles.chartTitle}>REVENUE TREND</Text>
                        </View>
                        {lineChartData ? (
                            <LineChart
                                data={lineChartData}
                                width={isDesktop ? chartWidth * 0.66 : chartWidth}
                                height={220}
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chart}
                            />
                        ) : (
                            <View style={styles.emptyChart}><Text style={styles.emptyText}>No data available</Text></View>
                        )}
                    </View>

                    {/* Category Distribution */}
                    <View style={[styles.chartCard, { width: isDesktop ? '32%' : '100%' }]}>
                        <View style={styles.chartHeader}>
                            <PieChartIcon size={18} color="#10B981" />
                            <Text style={styles.chartTitle}>CATEGORY MIX</Text>
                        </View>
                        {pieChartData.length > 0 ? (
                            <PieChart
                                data={pieChartData}
                                width={isDesktop ? chartWidth * 0.32 : chartWidth}
                                height={220}
                                chartConfig={chartConfig}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft={"15"}
                                absolute
                            />
                        ) : (
                            <View style={styles.emptyChart}><Text style={styles.emptyText}>No data available</Text></View>
                        )}
                    </View>

                    {/* Stock Inventory Analysis */}
                    <View style={[styles.chartCard, { width: '100%' }]}>
                        <View style={styles.chartHeader}>
                            <Package size={18} color="#3B82F6" />
                            <Text style={styles.chartTitle}>TOP STOCK LEVELS</Text>
                        </View>
                        {barChartData ? (
                            <BarChart
                                data={barChartData}
                                width={chartWidth}
                                height={220}
                                yAxisLabel=""
                                yAxisSuffix=""
                                chartConfig={chartConfig}
                                verticalLabelRotation={0}
                                style={styles.chart}
                            />
                        ) : (
                            <View style={styles.emptyChart}><Text style={styles.emptyText}>No products found</Text></View>
                        )}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const chartConfig = {
    backgroundColor: "#16161D",
    backgroundGradientFrom: "#16161D",
    backgroundGradientTo: "#16161D",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    style: {
        borderRadius: 16
    },
    propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: "#C5A059"
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0C10',
    },
    scrollContent: {
        padding: Spacing.xl,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0A0C10',
    },
    header: {
        borderRadius: 40,
        padding: 40,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    brandLine: {
        width: 30,
        height: 2,
        backgroundColor: '#C5A059',
    },
    brandLabel: {
        fontSize: 11,
        color: '#C5A059',
        fontWeight: '800',
        letterSpacing: 2,
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
    },
    chartsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.lg,
    },
    chartCard: {
        backgroundColor: '#16161D',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: Spacing.md,
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    chartTitle: {
        fontSize: 12,
        color: '#F8FAFC',
        fontWeight: '900',
        letterSpacing: 2,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16
    },
    emptyChart: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    }
});
