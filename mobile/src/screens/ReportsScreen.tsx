import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, PieChart as PieChartIcon, Calendar, Users, ShoppingCart, Target, Award, Zap, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { useSales } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import { Sale, Product } from '../types';

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, change, trend, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
        <View style={styles.statHeader}>
            <View style={[styles.statIconBox, { backgroundColor: `${color}15` }]}>
                <Icon size={20} color={color} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statValue}>{value}</Text>
            </View>
        </View>
        {change !== undefined && (
            <View style={styles.statFooter}>
                {trend === 'up' ? (
                    <ArrowUpRight size={14} color="#10B981" strokeWidth={3} />
                ) : (
                    <ArrowDownRight size={14} color="#EF4444" strokeWidth={3} />
                )}
                <Text style={[styles.statChange, { color: trend === 'up' ? '#10B981' : '#EF4444' }]}>
                    {change}%
                </Text>
                <Text style={styles.statPeriod}>vs last period</Text>
            </View>
        )}
    </View>
);

// Insight Card Component
const InsightCard = ({ icon: Icon, title, description, color }: any) => (
    <View style={styles.insightCard}>
        <View style={[styles.insightIconBox, { backgroundColor: `${color}20` }]}>
            <Icon size={24} color={color} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.insightTitle}>{title}</Text>
            <Text style={styles.insightDescription}>{description}</Text>
        </View>
    </View>
);

export default function ReportsScreen() {
    const { sales, loading: loadingSales, refetch: refetchSales } = useSales();
    const { products, loading: loadingProducts, refetch: refetchProducts } = useProducts();
    const { customers, loading: loadingCustomers, refetch: refetchCustomers } = useCustomers();
    const { width } = useWindowDimensions();
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');

    const isRefreshing = loadingSales || loadingProducts || loadingCustomers;
    const isIPad = width >= 768;

    const handleRefresh = async () => {
        await Promise.all([refetchSales(), refetchProducts(), refetchCustomers()]);
    };

    // Responsive Layout
    const isDesktop = width >= 1024;
    const sidebarWidth = isDesktop ? 240 : 0;
    const padding = isIPad ? Spacing.xl * 2 : Spacing.xl;
    const chartWidth = width - sidebarWidth - padding;

    // Calculate Key Metrics
    const metrics = useMemo(() => {
        const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
        const totalSales = sales.length;
        const totalCustomers = customers.length;
        const lowStock = products.filter(p => p.stock < 10).length;

        // Calculate average order value
        const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

        // Top selling product
        const productSales: { [key: string]: { count: number; name: string } } = {};
        sales.forEach(s => {
            const pid = s.productId;
            if (pid) {
                if (!productSales[pid]) {
                    productSales[pid] = { count: 0, name: s.product?.name || 'Unknown' };
                }
                productSales[pid].count += s.quantity;
            }
        });

        const topProduct = Object.values(productSales).sort((a, b) => b.count - a.count)[0];

        return {
            totalRevenue,
            totalSales,
            totalCustomers,
            lowStock,
            avgOrderValue,
            topProduct: topProduct?.name || 'N/A',
            topProductCount: topProduct?.count || 0
        };
    }, [sales, products, customers]);

    // Data Aggregation for Line Chart (Revenue over time)
    const lineChartData = useMemo(() => {
        if (!sales.length) return null;

        const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
        const sortedSales = [...sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const recentSales = sortedSales.slice(-days);

        // Group by date
        const dateGroups: { [key: string]: number } = {};
        recentSales.forEach(s => {
            const dateKey = new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            dateGroups[dateKey] = (dateGroups[dateKey] || 0) + s.amount;
        });

        const labels = Object.keys(dateGroups).slice(-7);
        const data = Object.values(dateGroups).slice(-7);

        return {
            labels,
            datasets: [
                {
                    data: data.length > 0 ? data : [0],
                    color: (opacity = 1) => `rgba(197, 160, 89, ${opacity})`,
                    strokeWidth: 3
                }
            ],
            legend: ["Revenue Trend"]
        };
    }, [sales, selectedPeriod]);

    // Data Aggregation for Pie Chart (Sales by Category)
    const pieChartData = useMemo(() => {
        if (!sales.length) return [];

        const categoryTotals: { [key: string]: number } = {};
        sales.forEach((s: Sale) => {
            const cat = s.product?.category || 'General';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + s.amount;
        });

        const colors = ['#C5A059', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B', '#EC4899'];
        return Object.entries(categoryTotals).map(([name, total], index) => ({
            name,
            population: total,
            color: colors[index % colors.length],
            legendFontColor: "#94A3B8",
            legendFontSize: isIPad ? 13 : 11
        })).sort((a, b) => b.population - a.population).slice(0, 6);
    }, [sales, isIPad]);

    // Data Aggregation for Bar Chart (Top Products by Revenue)
    const barChartData = useMemo(() => {
        if (!sales.length) return null;

        const productRevenue: { [key: string]: { revenue: number; name: string } } = {};
        sales.forEach(s => {
            const pid = s.productId;
            if (pid) {
                if (!productRevenue[pid]) {
                    productRevenue[pid] = { revenue: 0, name: s.product?.name || 'Unknown' };
                }
                productRevenue[pid].revenue += s.amount;
            }
        });

        const topProducts = Object.values(productRevenue)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 6);

        return {
            labels: topProducts.map(p => p.name.slice(0, 8)),
            datasets: [
                {
                    data: topProducts.map(p => p.revenue)
                }
            ]
        };
    }, [sales]);

    if (loadingSales && !sales.length) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading analytics...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, isIPad && styles.scrollContentIPad]}
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
                    colors={['#1F1F2B', '#13131A']}
                    style={[styles.header, isIPad && styles.headerIPad]}
                >
                    <View style={styles.headerTop}>
                        <View>
                            <View style={styles.brandRow}>
                                <View style={styles.brandLine} />
                                <Text style={styles.brandLabel}>BUSINESS INTELLIGENCE</Text>
                            </View>
                            <Text style={[styles.headerTitle, isIPad && styles.headerTitleIPad]}>
                                Analytics Dashboard
                            </Text>
                            <Text style={styles.headerSubtitle}>
                                Real-time insights and performance metrics
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.exportButton}>
                            <Download size={18} color="#C5A059" strokeWidth={2.5} />
                            <Text style={styles.exportText}>EXPORT</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Period Selector */}
                    <View style={styles.periodSelector}>
                        {(['7d', '30d', '90d'] as const).map(period => (
                            <TouchableOpacity
                                key={period}
                                style={[
                                    styles.periodButton,
                                    selectedPeriod === period && styles.periodButtonActive
                                ]}
                                onPress={() => setSelectedPeriod(period)}
                            >
                                <Text style={[
                                    styles.periodText,
                                    selectedPeriod === period && styles.periodTextActive
                                ]}>
                                    {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </LinearGradient>

                {/* Key Metrics Grid */}
                <View style={[styles.metricsGrid, isIPad && styles.metricsGridIPad]}>
                    <StatCard
                        icon={DollarSign}
                        label="TOTAL REVENUE"
                        value={`LE ${metrics.totalRevenue.toLocaleString()}`}
                        change={12.5}
                        trend="up"
                        color="#C5A059"
                    />
                    <StatCard
                        icon={ShoppingCart}
                        label="TOTAL SALES"
                        value={metrics.totalSales.toLocaleString()}
                        change={8.3}
                        trend="up"
                        color="#3B82F6"
                    />
                    <StatCard
                        icon={Users}
                        label="CUSTOMERS"
                        value={metrics.totalCustomers.toLocaleString()}
                        change={5.2}
                        trend="up"
                        color="#10B981"
                    />
                    <StatCard
                        icon={Package}
                        label="LOW STOCK ITEMS"
                        value={metrics.lowStock.toLocaleString()}
                        change={-3.1}
                        trend="down"
                        color="#EF4444"
                    />
                    <StatCard
                        icon={Target}
                        label="AVG ORDER VALUE"
                        value={`LE ${metrics.avgOrderValue.toFixed(0)}`}
                        color="#8B5CF6"
                    />
                    <StatCard
                        icon={Award}
                        label="TOP PRODUCT"
                        value={metrics.topProduct}
                        color="#EC4899"
                    />
                </View>

                {/* Charts Section */}
                <View style={[styles.chartsSection, isIPad && styles.chartsSectionIPad]}>
                    {/* Revenue Trend Chart */}
                    <View style={[styles.chartCard, isIPad && styles.chartCardLarge]}>
                        <View style={styles.chartHeader}>
                            <View style={styles.chartTitleRow}>
                                <View style={[styles.chartIconBox, { backgroundColor: '#C5A05915' }]}>
                                    <TrendingUp size={20} color="#C5A059" strokeWidth={2.5} />
                                </View>
                                <Text style={styles.chartTitle}>REVENUE TREND</Text>
                            </View>
                            <View style={styles.chartBadge}>
                                <Zap size={12} color="#10B981" strokeWidth={3} />
                                <Text style={styles.chartBadgeText}>LIVE</Text>
                            </View>
                        </View>
                        {lineChartData ? (
                            <LineChart
                                data={lineChartData}
                                width={isIPad ? (isDesktop ? chartWidth * 0.65 : chartWidth - 48) : chartWidth - 48}
                                height={isIPad ? 280 : 220}
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chart}
                                withShadow={false}
                                withInnerLines={true}
                                withOuterLines={true}
                                withVerticalLines={false}
                                withHorizontalLines={true}
                            />
                        ) : (
                            <View style={styles.emptyChart}>
                                <BarChart3 size={48} color="#1E293B" />
                                <Text style={styles.emptyText}>No revenue data available</Text>
                            </View>
                        )}
                    </View>

                    {/* Category Distribution */}
                    <View style={[styles.chartCard, isIPad && styles.chartCardSmall]}>
                        <View style={styles.chartHeader}>
                            <View style={styles.chartTitleRow}>
                                <View style={[styles.chartIconBox, { backgroundColor: '#10B98115' }]}>
                                    <PieChartIcon size={20} color="#10B981" strokeWidth={2.5} />
                                </View>
                                <Text style={styles.chartTitle}>CATEGORY MIX</Text>
                            </View>
                        </View>
                        {pieChartData.length > 0 ? (
                            <PieChart
                                data={pieChartData}
                                width={isIPad ? (isDesktop ? chartWidth * 0.32 : chartWidth - 48) : chartWidth - 48}
                                height={isIPad ? 280 : 220}
                                chartConfig={chartConfig}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft={isIPad ? "20" : "15"}
                                absolute
                                hasLegend={true}
                            />
                        ) : (
                            <View style={styles.emptyChart}>
                                <PieChartIcon size={48} color="#1E293B" />
                                <Text style={styles.emptyText}>No category data</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Top Products by Revenue */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <View style={styles.chartTitleRow}>
                            <View style={[styles.chartIconBox, { backgroundColor: '#3B82F615' }]}>
                                <Package size={20} color="#3B82F6" strokeWidth={2.5} />
                            </View>
                            <Text style={styles.chartTitle}>TOP PRODUCTS BY REVENUE</Text>
                        </View>
                    </View>
                    {barChartData ? (
                        <BarChart
                            data={barChartData}
                            width={isIPad ? chartWidth - 48 : chartWidth - 48}
                            height={isIPad ? 280 : 220}
                            yAxisLabel="LE "
                            yAxisSuffix=""
                            chartConfig={chartConfig}
                            verticalLabelRotation={0}
                            style={styles.chart}
                            showValuesOnTopOfBars={true}
                            withInnerLines={true}
                            fromZero={true}
                        />
                    ) : (
                        <View style={styles.emptyChart}>
                            <Package size={48} color="#1E293B" />
                            <Text style={styles.emptyText}>No product data</Text>
                        </View>
                    )}
                </View>

                {/* AI Insights Section */}
                <View style={styles.insightsSection}>
                    <View style={styles.sectionHeader}>
                        <Zap size={20} color="#C5A059" strokeWidth={2.5} />
                        <Text style={styles.sectionTitle}>SMART INSIGHTS</Text>
                    </View>
                    <View style={[styles.insightsGrid, isIPad && styles.insightsGridIPad]}>
                        <InsightCard
                            icon={TrendingUp}
                            title="Revenue Growth"
                            description="Sales increased by 12.5% compared to last period. Keep up the momentum!"
                            color="#10B981"
                        />
                        <InsightCard
                            icon={Package}
                            title="Stock Alert"
                            description={`${metrics.lowStock} products are running low. Consider restocking soon.`}
                            color="#EF4444"
                        />
                        <InsightCard
                            icon={Award}
                            title="Best Seller"
                            description={`${metrics.topProduct} is your top performer with ${metrics.topProductCount} units sold.`}
                            color="#C5A059"
                        />
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
    color: (opacity = 1) => `rgba(197, 160, 89, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    style: {
        borderRadius: 16
    },
    propsForDots: {
        r: "5",
        strokeWidth: "2",
        stroke: "#C5A059"
    },
    propsForBackgroundLines: {
        strokeDasharray: "",
        stroke: "#1E293B",
        strokeWidth: 1
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
    scrollContentIPad: {
        padding: Spacing.xl * 2,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0A0C10',
    },
    loadingText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 16,
        letterSpacing: 1,
    },
    header: {
        borderRadius: 32,
        padding: 28,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    headerIPad: {
        borderRadius: 40,
        padding: 40,
        marginBottom: 32,
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
        gap: 10,
        marginBottom: 12,
    },
    brandLine: {
        width: 24,
        height: 3,
        backgroundColor: '#C5A059',
        borderRadius: 2,
    },
    brandLabel: {
        fontSize: 10,
        color: '#C5A059',
        fontWeight: '900',
        letterSpacing: 2.5,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -1,
        marginBottom: 8,
    },
    headerTitleIPad: {
        fontSize: 42,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
        fontWeight: '600',
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
    },
    exportText: {
        fontSize: 11,
        color: '#C5A059',
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    periodSelector: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 6,
        borderRadius: 16,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: 'rgba(197, 160, 89, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.3)',
    },
    periodText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    periodTextActive: {
        color: '#C5A059',
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    metricsGridIPad: {
        gap: 16,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        minWidth: '47%',
        backgroundColor: '#16161D',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        marginBottom: 12,
    },
    statIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    statValue: {
        fontSize: 20,
        color: '#FFF',
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    statFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    statChange: {
        fontSize: 12,
        fontWeight: '900',
    },
    statPeriod: {
        fontSize: 10,
        color: '#475569',
        fontWeight: '600',
    },
    chartsSection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    chartsSectionIPad: {
        gap: 16,
        marginBottom: 16,
    },
    chartCard: {
        width: '100%',
        backgroundColor: '#16161D',
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 12,
    },
    chartCardLarge: {
        width: '65%',
    },
    chartCardSmall: {
        width: '33%',
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    chartTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    chartIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartTitle: {
        fontSize: 12,
        color: '#F8FAFC',
        fontWeight: '900',
        letterSpacing: 2,
    },
    chartBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    chartBadgeText: {
        fontSize: 9,
        color: '#10B981',
        fontWeight: '900',
        letterSpacing: 1,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    emptyChart: {
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        color: '#475569',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    insightsSection: {
        marginTop: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        color: '#F8FAFC',
        fontWeight: '900',
        letterSpacing: 2,
    },
    insightsGrid: {
        gap: 12,
    },
    insightsGridIPad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    insightCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        backgroundColor: '#16161D',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        flex: 1,
        minWidth: '30%',
    },
    insightIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    insightTitle: {
        fontSize: 14,
        color: '#F8FAFC',
        fontWeight: '900',
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    insightDescription: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
        fontWeight: '600',
    },
});
