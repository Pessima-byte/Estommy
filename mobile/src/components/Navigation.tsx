import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, useWindowDimensions, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LayoutGrid, Package, Tags, Users, ShoppingCart, Database, CreditCard, UserMinus, TrendingUp, BarChart3, ShieldCheck, Search, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useMutationState, useIsFetching } from '@tanstack/react-query';

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

export default function Navigation({ onLogout }: NavigationProps) {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768; // Standard tablet breakpoint
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

    return (
        <View style={{ flex: 1 }}>
            {isTablet ? (
                <View style={styles.ipadContainer}>
                    {renderOfflineBanner()}
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

                        <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {NAV_ITEMS.filter((item) => {
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
                                        style={[
                                            styles.sidebarItem,
                                            isActive && styles.sidebarItemActive
                                        ]}
                                        onPress={() => setActiveTab(item.id)}
                                        activeOpacity={0.7}
                                    >
                                        {isActive && (
                                            <LinearGradient
                                                colors={['#00D1FF20', 'transparent']}
                                                start={{ x: 0, y: 0.5 }}
                                                end={{ x: 1, y: 0.5 }}
                                                style={StyleSheet.absoluteFill}
                                            />
                                        )}
                                        <Icon size={isTablet ? 20 : 18} color={isActive ? '#00D1FF' : '#64748B'} strokeWidth={isActive ? 2.5 : 2} />
                                        <Text style={[styles.sidebarLabel, isActive && styles.sidebarLabelActive]}>
                                            {item.label.toUpperCase()}
                                        </Text>
                                        {isActive && <View style={styles.activeIndicator} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <View style={styles.sidebarFooter}>
                            <View style={styles.userProfile}>
                                <View style={styles.avatarWrapper}>
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
                                    <View style={styles.onlinePing} />
                                </View>
                                <View style={styles.profileInfo}>
                                    <Text style={styles.userName} numberOfLines={1}>{user?.name || 'User identity'}</Text>
                                    <Text style={styles.userRoleText}>{user?.role || 'ASSOCIATE'}</Text>
                                </View>
                                <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                                    <Settings size={16} color="#475569" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={styles.mainContent}>
                        <View style={styles.topBar}>
                            <View style={styles.topBarLeft}>
                                <Text style={styles.topBarSectionTitle}>{activeTab.toUpperCase()}</Text>
                                <View style={styles.topBarBreadcrumbLine} />
                            </View>
                            <TouchableOpacity
                                style={styles.searchContainer}
                                onPress={() => setSearchVisible(true)}
                                activeOpacity={0.8}
                            >
                                <Search size={16} color="#475569" />
                                <Text style={styles.searchPlaceholder}>COMMAND_SEARCH...</Text>
                                <View style={styles.searchShortcut}>
                                    <Text style={styles.shortcutText}>⌘ K</Text>
                                </View>
                            </TouchableOpacity>
                            <View style={styles.topBarRight}>
                                <TouchableOpacity style={styles.topBarIcon}>
                                    <Settings size={20} color="#475569" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.topBarAvatar}
                                    onPress={() => setActiveTab('settings')}
                                    activeOpacity={0.8}
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
                        </View>
                        <View style={{ flex: 1, backgroundColor: '#0A0C10' }}>
                            {renderContent()}
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.phoneContainer}>
                    {renderOfflineBanner()}
                    <View style={{ flex: 1 }}>
                        {renderContent()}
                    </View>

                    <View style={styles.navAtmosphere}>
                        <View style={styles.dockedNav}>
                            {[
                                NAV_ITEMS.find(i => i.id === 'dashboard')!,
                                NAV_ITEMS.find(i => i.id === 'products')!,
                                NAV_ITEMS.find(i => i.id === 'credits')!,
                                NAV_ITEMS.find(i => i.id === 'customers')!,
                                NAV_ITEMS.find(i => i.id === 'debtors')!,
                            ].map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.bottomNavItem}
                                        onPress={() => setActiveTab(item.id)}
                                        activeOpacity={0.7}
                                    >
                                        {isActive && (
                                            <View style={styles.activeHalo}>
                                                <View style={[styles.haloCore, { backgroundColor: Colors.primary }]} />
                                            </View>
                                        )}
                                        <Icon size={20} color={isActive ? Colors.primary : 'rgba(255,255,255,0.3)'} strokeWidth={isActive ? 2.5 : 2} />
                                        <Text style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}>
                                            {item.label.toUpperCase()}
                                        </Text>

                                        {isActive && <View style={styles.activeTechnicalLine} />}
                                    </TouchableOpacity>
                                );
                            })}
                            <View style={[styles.navCorner, { top: 0, left: 16, borderTopWidth: 1, borderLeftWidth: 1 }]} />
                            <View style={[styles.navCorner, { top: 0, right: 16, borderTopWidth: 1, borderRightWidth: 1 }]} />
                        </View>
                    </View>
                </View>
            )}

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
        width: 260,
        backgroundColor: '#0A0A0F',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.05)',
        zIndex: 50,
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
        paddingHorizontal: 16,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        gap: 16,
        marginBottom: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    sidebarItemActive: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(0, 209, 255, 0.1)',
    },
    activeIndicator: {
        position: 'absolute',
        right: 0,
        width: 3,
        height: 20,
        backgroundColor: '#00D1FF',
        borderRadius: 2,
        shadowColor: '#00D1FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },
    sidebarLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    sidebarLabelActive: {
        color: '#F8FAFC',
    },
    sidebarFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    userProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarCircle: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    onlinePing: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#0A0A0F',
    },
    profileInfo: {
        flex: 1,
    },
    avatarText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
    },
    sidebarAvatarImg: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    userName: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '800',
    },
    userRoleText: {
        color: '#64748B',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
        marginTop: 2,
    },
    logoutBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    topBar: {
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(10, 10, 15, 0.8)',
        zIndex: 40,
    },
    topBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    topBarSectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        fontStyle: 'italic',
        letterSpacing: 1,
    },
    topBarBreadcrumbLine: {
        width: 40,
        height: 1,
        backgroundColor: '#C5A059',
        opacity: 0.3,
    },
    topBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    topBarIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    searchContainer: {
        flex: 1,
        maxWidth: 500,
        height: 44,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    searchPlaceholder: {
        color: '#475569',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    searchShortcut: {
        marginLeft: 'auto',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    shortcutText: {
        color: '#475569',
        fontSize: 10,
        fontWeight: '900',
    },
    topBarAvatar: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(0, 209, 255, 0.2)',
    },
    topBarAvatarImg: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    mainContent: {
        flex: 1,
    },
    phoneContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    navAtmosphere: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    dockedNav: {
        width: '100%',
        height: Platform.OS === 'ios' ? 88 : 70,
        paddingBottom: Platform.OS === 'ios' ? 24 : 0,
        flexDirection: 'row',
        backgroundColor: '#0A0A0F',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
    },
    bottomNavItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeHalo: {
        position: 'absolute',
        top: '15%',
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    haloCore: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
        opacity: 0.15,
        transform: [{ scale: 1.5 }],
    },
    activeTechnicalLine: {
        position: 'absolute',
        bottom: 8,
        width: 12,
        height: 2,
        backgroundColor: Colors.primary,
        borderRadius: 1,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    bottomLabel: {
        fontSize: 6,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.3)',
        marginTop: 4,
        textAlign: 'center',
        letterSpacing: 1.5,
    },
    bottomLabelActive: {
        color: Colors.primary,
    },
    navCorner: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderColor: 'rgba(255,255,255,0.1)',
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
