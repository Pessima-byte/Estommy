import React, { useMemo, useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, useWindowDimensions, Modal, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingCart, Users, Package, TrendingUp, ChevronRight, UserMinus, CreditCard, ClipboardCheck, Plus, Sparkles } from 'lucide-react-native';
import { Colors, Spacing } from '../constants/Theme';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { useSales } from '../hooks/useSales';
import { useActivities } from '../hooks/useActivities';
import { useDebtors } from '../hooks/useDebtors';
import { useProfile } from '../hooks/useProfile';
import AddProductScreen from './AddProductScreen';
import AddSaleScreen from './AddSaleScreen';
import AddCustomerScreen from './AddCustomerScreen';
import AddCreditRecordScreen from './AddCreditRecordScreen';
import StatCard from '../components/StatCard';
import QuickActionCard from '../components/QuickActionCard';
import { Activity } from '../types';
import { Image } from 'expo-image';

const LOGO_IMAGE = require('../../assets/images/logo.jpg');

export default function DashboardScreen({ onNavigate }: { onNavigate?: (tabId: string) => void }) {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    const { products, loading: loadingProducts, refetch: refetchProducts } = useProducts();
    const { customers, loading: loadingCustomers, refetch: refetchCustomers } = useCustomers();
    const { sales, loading: loadingSales, refetch: refetchSales } = useSales();
    const { activities, loading: loadingActivities, refetch: refetchActivities } = useActivities({ limit: 4 });
    const { debtors, loading: loadingDebtors, refetch: refetchDebtors } = useDebtors();
    const { user } = useProfile();

    // HUD Animation Controller (Standard Animated for 100% Stability)
    const bootProgress = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(bootProgress, {
            toValue: 1,
            duration: 1200,
            easing: Easing.bezier(0.23, 1, 0.32, 1),
            useNativeDriver: true,
        }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 6000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 6000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    const cleanName = useMemo(() => {
        const name = user?.name?.split(' ')[0] || 'Member';
        return name.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\u200D/g, '');
    }, [user?.name]);

    const [activeModal, setActiveModal] = useState<string | null>(null);

    const isRefreshing = loadingProducts || loadingCustomers || loadingSales || loadingDebtors || loadingActivities;

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
        const totalCustomersCount = customers.length;
        const totalStockCount = products.reduce((acc, p) => acc + (p.stock || 0), 0);

        return {
            products: totalProductsCount.toLocaleString(),
            debtors: totalDebtorsAmount.toLocaleString(),
            customers: totalCustomersCount.toLocaleString(),
            stock: totalStockCount.toLocaleString(),
        };
    }, [products, customers, sales, debtors]);

    // Animated Styles (Native Drivers)
    const statsOpacity = bootProgress.interpolate({
        inputRange: [0, 0.2, 0.8],
        outputRange: [0, 0, 1],
        extrapolate: 'clamp'
    });

    const statsTranslateY = bootProgress.interpolate({
        inputRange: [0, 0.1, 1],
        outputRange: [30, 30, 0],
        extrapolate: 'clamp'
    });

    const protocolsOpacity = bootProgress.interpolate({
        inputRange: [0, 0.4, 0.9],
        outputRange: [0, 0, 1],
        extrapolate: 'clamp'
    });

    const protocolsTranslateY = bootProgress.interpolate({
        inputRange: [0, 0.3, 1],
        outputRange: [20, 20, 0],
        extrapolate: 'clamp'
    });

    const activityOpacity = bootProgress.interpolate({
        inputRange: [0, 0.6, 1],
        outputRange: [0, 0, 1],
        extrapolate: 'clamp'
    });

    const activityTranslateY = bootProgress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [10, 10, 0],
        extrapolate: 'clamp'
    });

    const cardWidth = !isTablet ? '48%' : undefined;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
            <LinearGradient
                colors={['#060609', '#0F172A', '#060608']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                pointerEvents="none"
            />
            {/* Atmosphere Layer */}
            <View style={styles.atmosphereGlow} pointerEvents="none" />
            <View style={[styles.atmosphereGlow, { top: '40%', left: -100, opacity: 0.03, backgroundColor: '#00D9FF' }]} pointerEvents="none" />

            <ScrollView
                contentContainerStyle={[styles.scrollContent, isTablet && { padding: Spacing.xl }]}
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
                <View style={[styles.header, !isTablet && { paddingHorizontal: 4 }]}>
                    {!isTablet && (
                        <View style={styles.headerTop}>
                            <TouchableOpacity
                                style={styles.idStation}
                                onPress={() => handleNavigate('ai')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.technicalLogo}>
                                    <Sparkles color={Colors.primary} size={20} strokeWidth={3} />
                                </View>
                                <View style={styles.visualTelemetry}>
                                    <View style={styles.telemetryTop}>
                                        {[0.3, 0.6, 1.0, 0.4, 0.8, 0.5, 0.9].map((op, i) => (
                                            <View key={i} style={[styles.telemetryBar, { height: 12 * op, opacity: op }]} />
                                        ))}
                                    </View>
                                    <View style={styles.scanningCore}>
                                        <View style={styles.scanningLine} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.profileButton} onPress={() => handleNavigate('settings')}>
                                {user?.image ? (
                                    <Image source={{ uri: user.image }} style={styles.profileImage} />
                                ) : (
                                    <View style={styles.profileInitial}>
                                        <Text style={styles.profileInitialText}>{(cleanName[0] || 'U').toUpperCase()}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    <Animated.View style={{ opacity: statsOpacity, transform: [{ translateY: statsTranslateY }] }}>
                        <LinearGradient
                            colors={['#171721', '#0C0C12']}
                            style={[styles.heroCard, isTablet && styles.heroCardTablet]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={[styles.heroHeader, !isTablet && { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }]}>
                                {!isTablet && (
                                    <View style={styles.logoWrapper}>
                                        <Animated.View
                                            style={[
                                                styles.logoGlow,
                                                {
                                                    opacity: glowAnim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0.1, 0.4]
                                                    }),
                                                    transform: [{
                                                        scale: glowAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [1, 1.03]
                                                        })
                                                    }]
                                                }
                                            ]}
                                        />
                                        <View style={styles.logoPill}>
                                            <Image
                                                source={LOGO_IMAGE}
                                                style={styles.heroLogo}
                                                contentFit="cover"
                                            />
                                        </View>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={[
                                        styles.heroAddBtn,
                                        !isTablet && { flex: 0, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: 90 },
                                        isTablet && styles.heroAddBtnTablet,
                                        isTablet && { width: '100%', flexDirection: 'row', alignItems: 'center' }
                                    ]}
                                    onPress={() => setActiveModal('addProduct')}
                                    activeOpacity={0.8}
                                >
                                    {isTablet && (
                                        <View style={styles.heroAddBtnIconBox}>
                                            <Plus size={20} color="#C5A059" strokeWidth={3} />
                                        </View>
                                    )}
                                    <View style={isTablet ? styles.heroAddBtnContent : null}>
                                        {isTablet && <Text style={styles.heroAddBtnLabel}>STATION_LOGISTICS_ENTRY</Text>}
                                        <Text style={[
                                            styles.heroAddBtnText,
                                            !isTablet && { fontSize: 8, letterSpacing: 1 },
                                            isTablet && styles.heroAddBtnTextTablet
                                        ]}>NEW ASSET</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <View style={[
                                styles.statsGrid,
                                isTablet && { flexWrap: 'nowrap', justifyContent: 'flex-start', gap: 20 },
                                !isTablet && { justifyContent: 'space-between', flexWrap: 'wrap', flexDirection: 'row', rowGap: 10 }
                            ]}>
                                <StatCard label="PRODUCTS" value={statsData.products} icon={Package} color={Colors.primary} flex={isTablet} width={cardWidth} onPress={() => handleNavigate('products')} />
                                <StatCard label="DEBTORS" value={statsData.debtors} icon={UserMinus} color={Colors.error} flex={isTablet} width={cardWidth} onPress={() => handleNavigate('debtors')} />
                                {!isTablet && (
                                    <>
                                        <StatCard label="CUSTOMERS" value={statsData.customers} icon={Users} color={Colors.accent} width={cardWidth} onPress={() => handleNavigate('customers')} />
                                        <StatCard label="STOCK" value={statsData.stock} icon={Package} color={Colors.success} width={cardWidth} onPress={() => handleNavigate('products')} />
                                    </>
                                )}
                                {isTablet && (
                                    <>
                                        <StatCard label="CUSTOMERS" value={statsData.customers} icon={Users} color={Colors.primary} flex={true} onPress={() => handleNavigate('customers')} />
                                        <StatCard label="STOCK" value={statsData.stock} icon={Package} color={Colors.primary} flex={true} onPress={() => handleNavigate('products')} />
                                    </>
                                )}
                            </View>
                        </LinearGradient>
                    </Animated.View>
                </View>

                {/* Second Row of Actions */}
                <Animated.View style={[styles.actionSection, { opacity: protocolsOpacity, transform: [{ translateY: protocolsTranslateY }] }]}>
                    <View style={styles.labelRow}>
                        <View style={styles.labelIndicator} />
                        <Text style={styles.sectionLabel}>OPERATIONAL PROTOCOLS</Text>
                    </View>
                    <View style={[styles.gridActions, isTablet && { flexWrap: 'nowrap', gap: 12 }]}>
                        <QuickActionCard
                            title="New Sale"
                            icon={ShoppingCart}
                            width={isTablet ? (width - 72) / 4 : (width - 48) / 2}
                            onPress={() => setActiveModal('addSale')}
                            color={Colors.primary}
                        />
                        <QuickActionCard
                            title="Add Customer"
                            icon={Users}
                            width={isTablet ? (width - 72) / 4 : (width - 48) / 2}
                            onPress={() => setActiveModal('addCustomer')}
                            color={Colors.accent}
                        />
                        <QuickActionCard
                            title="Update Credit"
                            icon={CreditCard}
                            width={isTablet ? (width - 72) / 4 : (width - 48) / 2}
                            onPress={() => setActiveModal('addDebtor')}
                            color={Colors.error}
                        />
                        <QuickActionCard
                            title="Audit Stock"
                            icon={Package}
                            width={isTablet ? (width - 72) / 4 : (width - 48) / 2}
                            onPress={() => handleNavigate('products')}
                            color={Colors.success}
                        />
                    </View>
                </Animated.View>

                {/* Activity Section */}
                <Animated.View style={[styles.activitySection, { opacity: activityOpacity, transform: [{ translateY: activityTranslateY }] }]}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.labelRow}>
                            <View style={styles.labelIndicator} />
                            <Text style={styles.sectionLabel}>LATEST ACTIVITY</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleNavigate('history')}>
                            <Text style={styles.viewAllText}>VIEW ALL</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.logContainer}>
                        {/* Timeline background line */}
                        <View style={styles.timelineLine} />

                        {activities.map((item: Activity, index: number) => {
                            const cleanedUser = item.userName.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\u200D/g, '').trim();
                            const isCredit = item.entityType === 'CREDIT';
                            const isCustomer = item.entityType === 'CUSTOMER';
                            const isProduct = item.entityType === 'PRODUCT' || item.entityType === 'STOCK';

                            let TypeIcon = ClipboardCheck;
                            if (isCredit) TypeIcon = CreditCard;
                            if (isCustomer) TypeIcon = Users;
                            if (isProduct) TypeIcon = Package;

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.logCard}
                                    onPress={() => handleNavigate('history')}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.logIndicator}>
                                        <View style={[styles.logDotGlow, { backgroundColor: index === 0 ? Colors.primary : 'rgba(255,255,255,0.1)' }]} />
                                        <View style={[styles.logDot, { backgroundColor: index === 0 ? Colors.primary : Colors.textMuted }]} />
                                    </View>

                                    <View style={styles.logIconBox}>
                                        <TypeIcon size={12} color={index === 0 ? Colors.primary : Colors.textMuted} />
                                    </View>

                                    <View style={styles.logInfo}>
                                        <Text style={styles.logTitle}>{item.action} {item.entityType}</Text>
                                        <Text style={styles.logMeta}>{cleanedUser.toUpperCase()} // <Text style={{ color: Colors.primary }}>{item.entityName || 'EVENT'}</Text></Text>
                                    </View>

                                    <ChevronRight size={14} color="rgba(255,255,255,0.1)" />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Modals */}
            <Modal visible={activeModal === 'addProduct'} animationType="slide" transparent={false}>
                <AddProductScreen onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
            </Modal>
            <Modal visible={activeModal === 'addSale'} animationType="slide" transparent={false}>
                <AddSaleScreen onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
            </Modal>
            <Modal visible={activeModal === 'addCustomer'} animationType="slide" transparent={false}>
                <AddCustomerScreen onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
            </Modal>
            <Modal visible={activeModal === 'addDebtor'} animationType="slide" transparent={false}>
                <AddCreditRecordScreen onClose={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { padding: Spacing.md },
    header: { marginBottom: Spacing.lg },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    profileButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, padding: 2 },
    profileImage: { width: '100%', height: '100%', borderRadius: 20 },
    profileInitial: { width: '100%', height: '100%', borderRadius: 20, backgroundColor: Colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },
    profileInitialText: { color: Colors.primary, fontWeight: '900', fontSize: 16 },

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

    heroCard: {
        padding: 12,
        paddingVertical: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden'
    },
    heroCardTablet: {
        padding: 24,
        paddingVertical: 32,
        borderRadius: 24,
    },
    heroHeader: { marginBottom: 12 },
    logoWrapper: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoGlow: {
        position: 'absolute',
        width: 154,
        height: 56,
        borderRadius: 40,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#C5A059',
        shadowColor: '#C5A059',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    logoPill: {
        width: 150, // Reduced size slightly
        aspectRatio: 2.8,
        borderRadius: 40,
        overflow: 'hidden',
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.2,
        borderColor: 'rgba(197, 160, 89, 0.4)', // Gold tinted border
    },
    heroLogo: {
        width: '100%',
        height: '100%',
    },
    heroAddBtn: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        flex: 0,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    heroAddBtnTablet: {
        height: 64,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.05)', // Muted glass background
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderLeftWidth: 6,
        borderLeftColor: '#C5A059',
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    heroAddBtnIconBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(197, 160, 89, 0.1)', // Subtle gold tint back
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
    },
    heroAddBtnContent: {
        flex: 1,
        justifyContent: 'center',
    },
    heroAddBtnLabel: {
        fontSize: 7,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)', // Muted white label
        letterSpacing: 2,
        marginBottom: 2,
    },
    heroAddBtnText: { color: '#000', fontWeight: '900', fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase' },
    heroAddBtnTextTablet: {
        fontSize: 14,
        letterSpacing: 4,
        fontWeight: '900',
        color: '#FFFFFF', // High-contrast white text
    },

    statsGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' },

    actionSection: { marginBottom: Spacing.lg, paddingHorizontal: 4 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    labelIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary },
    sectionLabel: { fontSize: 8, fontWeight: '900', color: Colors.textMuted, letterSpacing: 4, textTransform: 'uppercase' },
    gridActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'space-between',
    },

    activitySection: { marginTop: Spacing.xs },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm, paddingHorizontal: 4 },
    viewAllText: { fontSize: 9, color: Colors.primary, fontWeight: '900', letterSpacing: 1.5 },
    logContainer: {
        backgroundColor: 'rgba(15,15,23,0.5)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 10,
        overflow: 'hidden'
    },
    timelineLine: {
        position: 'absolute',
        left: 20,
        top: 20,
        bottom: 20,
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    logCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    logIndicator: {
        width: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    logDotGlow: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        opacity: 0.2,
    },
    logDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        zIndex: 1,
    },
    logIconBox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.02)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    logInfo: { flex: 1 },
    logTitle: { color: '#F8FAFC', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
    logMeta: { color: Colors.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' },

    idStation: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    technicalLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.02)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    visualTelemetry: { gap: 6 },
    telemetryTop: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 14 },
    telemetryBar: { width: 3, backgroundColor: Colors.primary, borderRadius: 1 },
    scanningCore: { width: 60, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1, overflow: 'hidden' },
    scanningLine: { width: '40%', height: '100%', backgroundColor: Colors.primary, opacity: 0.6 },
});
