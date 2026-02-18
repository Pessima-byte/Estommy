import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, useWindowDimensions, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LayoutGrid, Package, Tags, Users, ShoppingCart, Database, CreditCard, UserMinus, TrendingUp, BarChart3, ShieldCheck, Search, Settings } from 'lucide-react-native';
import DashboardScreen from '../screens/DashboardScreen';
import ProductsScreen from '../screens/ProductsScreen';
import CustomersScreen from '../screens/CustomersScreen';
import SalesScreen from '../screens/SalesScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import CreditsScreen from '../screens/CreditsScreen';
import DebtorsScreen from '../screens/DebtorsScreen';
import ProfitsScreen from '../screens/ProfitsScreen';
import UsersScreen from '../screens/UsersScreen';
import PermissionsScreen from '../screens/PermissionsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SearchModal from './SearchModal';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import { useProfile } from '../hooks/useProfile';

const LOGO_IMAGE = require('../../assets/images/logo.jpg');

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, component: DashboardScreen },
    { id: 'products', label: 'Products', icon: Package, component: ProductsScreen },
    { id: 'categories', label: 'Categories', icon: Tags, component: CategoriesScreen },
    { id: 'customers', label: 'Customers', icon: Users, component: CustomersScreen },
    { id: 'sales', label: 'Sales', icon: ShoppingCart, component: SalesScreen },
    { id: 'credits', label: 'Credits', icon: CreditCard, component: CreditsScreen },
    { id: 'debtors', label: 'Debtors', icon: UserMinus, component: DebtorsScreen },
    { id: 'profits', label: 'Profits', icon: TrendingUp, component: ProfitsScreen },
    { id: 'reports', label: 'Reports', icon: BarChart3, component: ReportsScreen },
    { id: 'users', label: 'Users', icon: Users, component: UsersScreen },
    { id: 'history', label: 'Activity Log', icon: TrendingUp, component: HistoryScreen },
    { id: 'permissions', label: 'Permissions', icon: ShieldCheck, component: PermissionsScreen },
    { id: 'settings', label: 'Settings', icon: Settings, component: SettingsScreen },
];

const Placeholder = ({ name }: any) => (
    <View style={{ flex: 1, backgroundColor: '#0A0C10', justifyContent: 'center', alignItems: 'center' }}>
        <LayoutGrid size={64} color="#1E293B" />
        <Text style={{ color: '#64748B', marginTop: 20, fontWeight: '900', letterSpacing: 4 }}>UNDER_CONSTRUCTION</Text>
    </View>
);

interface NavigationProps {
    onLogout: () => void;
}

import { useMutationState, useIsFetching } from '@tanstack/react-query';

export default function Navigation({ onLogout }: NavigationProps) {
    const { width } = useWindowDimensions();
    const isIPadLandscape = width >= 1024;
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchVisible, setSearchVisible] = useState(false);
    const { user } = useProfile();

    // Monitor background syncs
    const isFetching = useIsFetching();
    const isMutating = useMutationState({
        filters: { status: 'pending' },
        select: (mutation) => mutation.state.status,
    }).length > 0;

    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const start = Date.now();
                await fetch('https://www.google.com', { mode: 'no-cors' });
                setIsOffline(false);
            } catch (e) {
                setIsOffline(true);
            }
        };
        checkConnection();
        const interval = setInterval(checkConnection, 10000);
        return () => clearInterval(interval);
    }, []);

    const renderOfflineBanner = () => {
        if (!isOffline && !isMutating) return null;

        return (
            <View style={[styles.offlineBanner, !isOffline && isMutating && { backgroundColor: Colors.primary + '20' }]}>
                <View style={[styles.pulseDot, isMutating && { backgroundColor: Colors.primary }]} />
                <Text style={styles.offlineText}>
                    {isOffline ? 'OFFLINE MODE (LOCAL STORAGE)' : 'SYNCING CHANGES TO CLOUD...'}
                </Text>
            </View>
        );
    };

    const renderContent = () => {
        const item = NAV_ITEMS.find(i => i.id === activeTab);
        if (!item || !item.component) return null;

        const Component = item.component;
        const extraProps: any = {};
        if (item.id === 'settings') {
            extraProps.onLogout = onLogout;
        }

        return (
            <View style={{ flex: 1 }}>
                <Component
                    onNavigate={(tabId: string) => {
                        if (tabId === 'search') {
                            setSearchVisible(true);
                        } else {
                            setActiveTab(tabId);
                        }
                    }}
                    {...extraProps}
                />
            </View>
        );
    };

    if (isIPadLandscape) {
        return (
            <View style={styles.ipadContainer}>
                {renderOfflineBanner()}
                {/* Web-Style Sidebar for iPad */}
                <View style={styles.sidebar}>
                    <View style={styles.sidebarLogoWrapper}>
                        <View style={styles.logoPill}>
                            <Image
                                source={LOGO_IMAGE}
                                style={styles.sidebarLogo}
                                contentFit="cover"
                            />
                        </View>
                    </View>

                    <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
                        {NAV_ITEMS.filter((item) => {
                            // Hide Users and Permissions for non-admin users
                            if (item.id === 'users' || item.id === 'permissions') {
                                return user?.role === 'ADMIN';
                            }
                            return true;
                        }).map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
                                    onPress={() => setActiveTab(item.id)}
                                >
                                    <Icon size={18} color={isActive ? '#00D1FF' : '#94A3B8'} />
                                    <Text style={[styles.sidebarLabel, isActive && styles.sidebarLabelActive]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <View style={styles.sidebarFooter}>
                        <View style={styles.userProfile}>
                            <View style={[styles.avatarCircle, user?.role === 'ADMIN' && { borderColor: '#C5A059' }]}>
                                {user?.image ? (
                                    <Image
                                        source={{ uri: user.image }}
                                        style={styles.sidebarAvatarImg}
                                        contentFit="cover"
                                    />
                                ) : (
                                    <Text style={[styles.avatarText, user?.role === 'ADMIN' && { color: '#C5A059' }]}>
                                        {(user?.name?.[0] || 'U').toUpperCase()}
                                    </Text>
                                )}
                            </View>
                            <Text style={styles.userName} numberOfLines={1}>{user?.name || 'User identity'}</Text>
                        </View>
                    </View>
                </View>

                {/* Main Content Area */}
                <View style={styles.mainContent}>
                    {/* Top Bar for iPad */}
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            style={styles.searchContainer}
                            onPress={() => setSearchVisible(true)}
                        >
                            <Search size={18} color="#94A3B8" />
                            <Text style={styles.searchPlaceholder}>Search for anything...</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.topBarAvatar}
                            onPress={() => setActiveTab('settings')}
                        >
                            {user?.image ? (
                                <Image
                                    source={{ uri: user.image }}
                                    style={styles.topBarAvatarImg}
                                    contentFit="cover"
                                />
                            ) : (
                                <Text style={{ color: user?.role === 'ADMIN' ? '#C5A059' : '#FFF', fontSize: 10, fontWeight: '900' }}>
                                    {(user?.name?.slice(0, 2) || 'UI').toUpperCase()}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#0A0C10' }}>
                        {renderContent()}
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.phoneContainer}>
            {renderOfflineBanner()}
            <View style={{ flex: 1 }}>
                {renderContent()}
            </View>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                {[
                    NAV_ITEMS.find(i => i.id === 'dashboard')!,
                    NAV_ITEMS.find(i => i.id === 'products')!,
                    NAV_ITEMS.find(i => i.id === 'sales')!,
                    NAV_ITEMS.find(i => i.id === 'customers')!,
                    NAV_ITEMS.find(i => i.id === 'settings')!,
                ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.bottomNavItem}
                            onPress={() => setActiveTab(item.id)}
                        >
                            <Icon size={24} color={isActive ? Colors.primary : Colors.textMuted} />
                            <Text style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <SearchModal
                visible={searchVisible}
                onClose={() => setSearchVisible(false)}
                onNavigate={(tabId) => setActiveTab(tabId)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    offlineBanner: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: '50%',
        transform: [{ translateX: -125 }],
        width: 250,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        zIndex: 9999,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
    },
    offlineText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    ipadContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#0A0C10',
    },
    sidebar: {
        width: 240,
        backgroundColor: '#0F1115',
        borderRightWidth: 1,
        borderRightColor: '#1E293B',
    },
    sidebarLogoWrapper: {
        padding: 15,
        marginBottom: 10,
    },
    logoPill: {
        width: '100%',
        aspectRatio: 2.4,
        borderRadius: 60,
        overflow: 'hidden',
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    sidebarLogo: {
        width: '100%',
        height: '100%',
    },
    sidebarNav: {
        flex: 1,
        paddingHorizontal: Spacing.sm,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.md,
        marginBottom: 4,
        borderLeftWidth: 4,
        borderLeftColor: 'transparent',
    },
    sidebarItemActive: {
        backgroundColor: 'rgba(0, 209, 255, 0.12)',
        borderLeftColor: '#00D1FF',
    },
    sidebarLabel: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '500',
    },
    sidebarLabelActive: {
        color: '#00D1FF',
        fontWeight: '700',
    },
    sidebarFooter: {
        padding: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: '#1E293B',
    },
    userProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    avatarCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    sidebarAvatarImg: {
        width: '100%',
        height: '100%',
        borderRadius: 14,
    },
    topBarAvatarImg: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    userName: {
        color: '#94A3B8',
        fontSize: 13,
    },
    mainContent: {
        flex: 1,
    },
    topBar: {
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
        backgroundColor: '#0F1115',
    },
    searchContainer: {
        width: 400,
        height: 40,
        backgroundColor: '#1A1D23',
        borderRadius: BorderRadius.sm,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        borderWidth: 1,
        borderColor: '#334155',
    },
    searchPlaceholder: {
        color: '#475569',
        fontSize: 14,
    },
    topBarAvatar: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    phoneContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingBottom: 30,
        paddingTop: 10,
        height: 90,
    },
    bottomNavItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    bottomLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.textMuted,
    },
    bottomLabelActive: {
        color: Colors.primary,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    text: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '600',
    },
});
