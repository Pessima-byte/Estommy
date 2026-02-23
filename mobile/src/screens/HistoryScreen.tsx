import React, { useState } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { History, Search, Clock, User, HardDrive, Package, ShoppingCart, CreditCard, Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useActivities } from '../hooks/useActivities';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';

const ActivityIcon = ({ type, color }: { type: string, color: string }) => {
    switch (type) {
        case 'PRODUCT': return <Package size={18} color={color} />;
        case 'SALE': return <ShoppingCart size={18} color={color} />;
        case 'CUSTOMER': return <User size={18} color={color} />;
        case 'CREDIT': return <CreditCard size={18} color={color} />;
        case 'USER': return <Shield size={18} color={color} />;
        default: return <HardDrive size={18} color={color} />;
    }
};

const ActivityItem = ({ item, width }: { item: any, width: number }) => {
    const date = new Date(item.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const fullDate = new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

    return (
        <View style={[styles.card, { width }]}>
            <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                    <ActivityIcon type={item.entityType} color="#C5A059" />
                </View>
                <View style={styles.timeInfo}>
                    <Text style={styles.timeLabel}>{fullDate.toUpperCase()}</Text>
                    <Text style={styles.timeValue}>{date}</Text>
                </View>
            </View>

            <View style={styles.contentSection}>
                <Text style={styles.actionText}>{item.action} {item.entityType}</Text>
                <Text style={styles.descriptionText}>{item.description || `Modification to ${item.entityName || 'system node'}`}</Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.userRow}>
                    <User size={10} color="#64748B" />
                    <Text style={styles.userText}>{item.userName?.toUpperCase() || 'SYSTEM'}</Text>
                </View>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>VERIFIED</Text>
                </View>
            </View>
        </View>
    );
};

export default function HistoryScreen() {
    const { activities, loading, refetch } = useActivities();
    const { width } = useWindowDimensions();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredActivities = activities.filter((a: any) =>
        (a.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.entityType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.userName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Responsive Layout
    const isTablet = width >= 768;
    const isDesktop = width >= 768;
    const gap = Spacing.lg;
    const totalPadding = Spacing.xl * 2;
    const sidebarWidth = isDesktop ? 240 : 0;
    const availableWidth = width - sidebarWidth - totalPadding;

    const numCols = isDesktop ? 3 : (isTablet ? 2 : 1);
    const itemWidth = (availableWidth - (gap * (numCols - 1))) / numCols;

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
                            <Text style={styles.brandLabel}>SYSTEM AUDIT</Text>
                        </View>
                    </View>

                    <View style={styles.headerMain}>
                        <View style={styles.titleWrapper}>
                            <Text style={styles.headerTitle}>ACTIVITY LOG</Text>
                            <Text style={styles.headerSubtitle}>
                                Complete immutable record of all system events and operations.
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Filters */}
                <View style={styles.searchContainer}>
                    <Search size={18} color="#475569" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search system events..."
                        placeholderTextColor="#475569"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Activities Grid */}
                <View style={[styles.grid, { gap }]}>
                    {filteredActivities.map((item: any) => (
                        <ActivityItem
                            key={item.id}
                            item={item}
                            width={itemWidth}
                        />
                    ))}
                    {filteredActivities.length === 0 && !loading && (
                        <View style={styles.emptyContainer}>
                            <Clock size={48} color="#1E293B" />
                            <Text style={styles.emptyText}>NO RECENT SYSTEM ACTIVITY</Text>
                        </View>
                    )}
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
    header: {
        borderRadius: 40,
        padding: 40,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    headerTop: {
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
        backgroundColor: '#C5A059',
    },
    brandLabel: {
        fontSize: 11,
        color: '#C5A059',
        fontWeight: '800',
        letterSpacing: 2,
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
    },
    searchContainer: {
        height: 52,
        backgroundColor: '#111827',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    searchInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 14,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    card: {
        backgroundColor: '#16161D',
        borderRadius: 32,
        padding: 24,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
    },
    timeInfo: {
        alignItems: 'flex-end',
    },
    timeLabel: {
        fontSize: 8,
        color: '#64748B',
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 2,
    },
    timeValue: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '700',
    },
    contentSection: {
        marginBottom: 24,
    },
    actionText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 13,
        color: '#94A3B8',
        lineHeight: 18,
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    userText: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '800',
        letterSpacing: 1,
    },
    statusBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 8,
        color: '#10B981',
        fontWeight: '900',
        letterSpacing: 1,
    },
    emptyContainer: {
        flex: 1,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    emptyText: {
        color: '#1E293B',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 4,
    },
});
