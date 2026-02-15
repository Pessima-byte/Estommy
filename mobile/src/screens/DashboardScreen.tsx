import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, useWindowDimensions, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingCart, Users, Package, TrendingUp, ChevronRight, Search, UserMinus } from 'lucide-react-native';
import { Colors, Spacing } from '../constants/Theme';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { useSales } from '../hooks/useSales';
import { useActivities } from '../hooks/useActivities';
import { useDebtors } from '../hooks/useDebtors';
import AddProductScreen from './AddProductScreen';
import AddSaleScreen from './AddSaleScreen';
import AddCustomerScreen from './AddCustomerScreen';
import AddCreditRecordScreen from './AddCreditRecordScreen';
import StatCard from '../components/StatCard';
import QuickActionCard from '../components/QuickActionCard';
import { Activity } from '../types';

export default function DashboardScreen({ onNavigate }: { onNavigate?: (tabId: string) => void }) {
    const { width } = useWindowDimensions();
    const isIPadLandscape = width >= 1024;

    const { products, loading: loadingProducts, refetch: refetchProducts } = useProducts();
    const { customers, loading: loadingCustomers, refetch: refetchCustomers } = useCustomers();
    const { sales, loading: loadingSales, refetch: refetchSales } = useSales();
    const { activities, loading: loadingActivities, refetch: refetchActivities } = useActivities({ limit: 3 });
    const { debtors, loading: loadingDebtors, refetch: refetchDebtors } = useDebtors();

    const [activeModal, setActiveModal] = useState<string | null>(null);

    const isRefreshing = loadingProducts || loadingCustomers || loadingSales || loadingDebtors;

    const handleRefresh = async () => {
        await Promise.all([
            refetchProducts(),
            refetchCustomers(),
            refetchSales(),
            refetchActivities(),
            refetchDebtors()
        ]);
    };

    const handleNavigate = (tab: string) => {
        if (onNavigate) {
            onNavigate(tab);
        }
    };

    const statsData = useMemo(() => {
        const totalProductsCount = products.length;
        const totalDebtorsAmount = debtors.reduce((acc, d) => acc + (d.totalDebt || 0), 0);
        const totalCustomers = customers.length;
        const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);

        return {
            products: totalProductsCount.toLocaleString(),
            debtors: totalDebtorsAmount.toLocaleString(),
            customers: totalCustomers.toLocaleString(),
            stock: totalStock.toLocaleString(),
        };
    }, [products, customers, sales, debtors]);

    const cardWidth = !isIPadLandscape ? (width - Spacing.xl * 2 - Spacing.lg) / 2 : undefined;

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
                        colors={[Colors.primary]}
                    />
                }
            >
                {/* Header Hero Section */}
                <View style={styles.heroSection}>
                    <LinearGradient
                        colors={['#1F1F2B', '#0F0F17']}
                        style={styles.heroCard}
                    >
                        <View style={styles.heroHeader}>
                            <View style={styles.brandContainer}>
                                <Text style={styles.heroBrandTitle}>ESTOMMY</Text>
                                <View style={styles.heroSubtitleRow}>
                                    <View style={styles.heroBrandLine} />
                                    <Text style={styles.heroBrandSubtitle}>INVENTORY SYSTEM</Text>
                                </View>
                            </View>

                            <View style={styles.heroActionButtons}>
                                <TouchableOpacity style={styles.heroAddBtn} onPress={() => setActiveModal('addProduct')}>
                                    <Text style={styles.heroAddBtnText}>ADD PRODUCT</Text>
                                </TouchableOpacity>
                                {!isIPadLandscape && (
                                    <TouchableOpacity
                                        style={[styles.heroAddBtn, { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14 }]}
                                        onPress={() => (onNavigate as any)?.('search')}
                                    >
                                        <Search size={20} color="#FFF" />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={styles.heroReportBtn} onPress={() => handleNavigate('reports')}>
                                    <Text style={styles.heroReportBtnText}>VIEW REPORTS</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={[styles.statsGrid, isIPadLandscape && { flexWrap: 'nowrap' }]}>
                            <StatCard label="PRODUCTS" value={statsData.products} icon={Package} color={Colors.primary} flex={isIPadLandscape} width={cardWidth} onPress={() => handleNavigate('products')} />
                            <StatCard label="DEBTORS" value={statsData.debtors} icon={UserMinus} color={Colors.primary} flex={isIPadLandscape} width={cardWidth} onPress={() => handleNavigate('debtors')} />
                            <StatCard label="CUSTOMERS" value={statsData.customers} icon={Users} color={Colors.primary} flex={isIPadLandscape} width={cardWidth} />
                            <StatCard label="STOCK" value={statsData.stock} icon={Package} color={Colors.primary} flex={isIPadLandscape} width={cardWidth} />
                        </View>
                    </LinearGradient>
                </View>

                {/* Second Row of Actions */}
                <View style={styles.actionSection}>
                    <View style={[styles.actionGrid, isIPadLandscape && { flexWrap: 'nowrap' }]}>
                        <QuickActionCard title="New Sale" flex={isIPadLandscape} width={cardWidth} onPress={() => setActiveModal('addSale')} />
                        <QuickActionCard title="Add Customer" flex={isIPadLandscape} width={cardWidth} onPress={() => setActiveModal('addCustomer')} />
                        <QuickActionCard title="Add Debtor" flex={isIPadLandscape} width={cardWidth} onPress={() => setActiveModal('addDebtor')} />
                        <QuickActionCard title="View Reports" flex={isIPadLandscape} width={cardWidth} onPress={() => handleNavigate('reports')} />
                    </View>
                </View>

                {/* Activity Section */}
                <View style={styles.activitySection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
                        <TouchableOpacity onPress={() => handleNavigate('history')}>
                            <Text style={styles.viewAllText}>VIEW ALL</Text>
                        </TouchableOpacity>
                    </View>

                    {activities.map((item: Activity) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.logCard}
                            onPress={() => handleNavigate('history')}
                        >
                            <View style={styles.logDot} />
                            <View style={styles.logInfo}>
                                <Text style={styles.logText}>{item.action} {item.entityType}</Text>
                                <Text style={styles.logMeta}>{item.userName || 'System'} • {item.entityName || item.entityId?.slice(0, 8) || 'N/A'}</Text>
                            </View>
                            <ChevronRight size={18} color="#475569" />
                        </TouchableOpacity>
                    ))}
                    {activities.length === 0 && !loadingActivities && (
                        <View style={[styles.logCard, { justifyContent: 'center' }]}>
                            <Text style={[styles.logMeta, { textAlign: 'center' }]}>No recent activity found.</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Modals */}
            <Modal visible={activeModal === 'addProduct'} animationType="slide">
                <AddProductScreen onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
            </Modal>
            <Modal visible={activeModal === 'addSale'} animationType="slide">
                <AddSaleScreen onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
            </Modal>
            <Modal visible={activeModal === 'addCustomer'} animationType="slide">
                <AddCustomerScreen onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
            </Modal>
            <Modal visible={activeModal === 'addDebtor'} animationType="slide">
                <AddCreditRecordScreen onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0C10' },
    scrollContent: { padding: Spacing.xl },
    heroSection: { marginBottom: Spacing.xl },
    heroCard: { padding: 40, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48, flexWrap: 'wrap', gap: 20 },
    brandContainer: { minWidth: 300 },
    heroBrandTitle: { fontSize: 64, fontWeight: '900', color: '#F8FAFC', letterSpacing: -3, lineHeight: 70 },
    heroSubtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
    heroBrandLine: { width: 50, height: 3, backgroundColor: Colors.primary },
    heroBrandSubtitle: { fontSize: 14, fontWeight: '800', color: Colors.primary, letterSpacing: 6 },
    heroActionButtons: { flexDirection: 'row', gap: 16 },
    heroAddBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    heroAddBtnText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
    heroReportBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    heroReportBtnText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
    statsGrid: { flexDirection: 'row', gap: Spacing.lg, flexWrap: 'wrap' },
    actionSection: { marginBottom: Spacing.xxl },
    actionGrid: { flexDirection: 'row', gap: Spacing.lg, flexWrap: 'wrap' },
    activitySection: { marginTop: Spacing.md },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    sectionTitle: { fontSize: 12, color: '#F8FAFC', fontWeight: '900', letterSpacing: 3 },
    viewAllText: { fontSize: 10, color: Colors.primary, fontWeight: '900' },
    logCard: { flexDirection: 'row', alignItems: 'center', padding: 24, backgroundColor: '#111827', borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
    logDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginRight: 20 },
    logInfo: { flex: 1 },
    logText: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
    logMeta: { color: '#64748B', fontSize: 13, marginTop: 4 },
});

