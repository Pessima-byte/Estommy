import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, useWindowDimensions, FlatList, Image } from 'react-native';
import {
    Home,
    Package,
    Tag,
    Users,
    BarChart2,
    Warehouse,
    CreditCard,
    DollarSign,
    FileText,
    User,
    ShieldAlert,
    Search
} from 'lucide-react-native';
import DashboardScreen from '../screens/DashboardScreen';
import ProductsScreen from '../screens/ProductsScreen';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';

const LOGO_IMAGE = require('../../assets/images/logo.jpg');

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, component: DashboardScreen },
    { id: 'products', label: 'Products', icon: Package, component: ProductsScreen },
    { id: 'categories', label: 'Categories', icon: Tag, component: null },
    { id: 'customers', label: 'Customers', icon: Users, component: null },
    { id: 'sales', label: 'Sales', icon: BarChart2, component: null },
    { id: 'stock', label: 'Stock', icon: Warehouse, component: null },
    { id: 'credits', label: 'Credits', icon: CreditCard, component: null },
    { id: 'debtors', label: 'Debtors', icon: DollarSign, component: null },
    { id: 'profits', label: 'Profits', icon: DollarSign, component: null },
    { id: 'reports', label: 'Reports', icon: FileText, component: null },
    { id: 'users', label: 'Users', icon: User, component: null },
    { id: 'permissions', label: 'Permissions', icon: ShieldAlert, component: null },
];

const Placeholder = ({ name }: any) => (
    <View style={{ flex: 1, backgroundColor: '#0A0C10', justifyContent: 'center', alignItems: 'center' }}>
        <Home size={64} color="#1E293B" />
        <Text style={{ color: '#64748B', marginTop: 20, fontWeight: '900', letterSpacing: 4 }}>UNDER_CONSTRUCTION</Text>
    </View>
);

export default function Navigation() {
    const { width, height } = useWindowDimensions();
    const isIPadLandscape = width >= 1024;
    const [activeTab, setActiveTab] = useState('dashboard');

    const ActiveComponent = NAV_ITEMS.find(item => item.id === activeTab)?.component || Placeholder;

    if (isIPadLandscape) {
        return (
            <View style={styles.ipadContainer}>
                {/* Web-Style Sidebar for iPad */}
                <View style={styles.sidebar}>
                    <View style={styles.sidebarLogoWrapper}>
                        <View style={styles.logoCard}>
                            <Image source={LOGO_IMAGE} style={styles.sidebarLogo} resizeMode="cover" />
                        </View>
                    </View>

                    <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            const isPermissions = item.id === 'permissions';

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
                                    onPress={() => setActiveTab(item.id)}
                                >
                                    <View style={styles.itemContent}>
                                        {isPermissions ? (
                                            <View style={styles.avatarCircleSmall}>
                                                <Text style={styles.avatarTextSmall}>N</Text>
                                            </View>
                                        ) : (
                                            <Icon size={20} color={isActive ? '#00D1FF' : '#94A3B8'} />
                                        )}
                                        <Text style={[styles.sidebarLabel, isActive && styles.sidebarLabelActive]}>
                                            {item.label}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Main Content Area */}
                <View style={styles.mainContent}>
                    {/* Top Bar for iPad */}
                    <View style={styles.topBar}>
                        <View style={styles.searchContainer}>
                            <Search size={18} color="#94A3B8" />
                            <Text style={styles.searchPlaceholder}>Search for anything...</Text>
                        </View>
                        <Image
                            source={{ uri: 'https://github.com/shadcn.png' }}
                            style={styles.topBarAvatar}
                        />
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#0A0C10' }}>
                        <ActiveComponent />
                    </View>
                </View>
            </View>
        );
    }

    // Fallback to Bottom Tabs for Phone (or iPad Portrait)
    return (
        <View style={styles.phoneContainer}>
            <View style={{ flex: 1 }}>
                <ActiveComponent />
            </View>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                {NAV_ITEMS.slice(0, 5).map((item) => {
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
        </View>
    );
}

const styles = StyleSheet.create({
    ipadContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#0A0C10',
    },
    sidebar: {
        width: 260,
        backgroundColor: '#0F1115',
        borderRightWidth: 1,
        borderRightColor: '#1E293B',
        paddingTop: 10,
    },
    sidebarLogoWrapper: {
        padding: 15,
        marginBottom: 10,
    },
    logoCard: {
        height: 100,
        width: '100%',
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: '#FFF',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    sidebarLogo: {
        width: '100%',
        height: '100%',
    },
    sidebarNav: {
        flex: 1,
        paddingHorizontal: 15,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginBottom: 8,
    },
    sidebarItemActive: {
        backgroundColor: 'rgba(0, 50, 80, 0.4)',
        borderWidth: 1,
        borderColor: '#00D1FF',
        shadowColor: '#00D1FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 8,
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sidebarLabel: {
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    sidebarLabelActive: {
        color: '#00D1FF',
        fontWeight: '700',
    },
    avatarCircleSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    avatarTextSmall: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
    },
    mainContent: {
        flex: 1,
    },
    topBar: {
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
        backgroundColor: '#0F1115',
    },
    searchContainer: {
        width: 400,
        height: 40,
        backgroundColor: '#1A1D23',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        gap: 10,
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
});
