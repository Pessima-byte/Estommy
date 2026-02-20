import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, TouchableOpacity, TextInput, Alert, Modal, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exportToCSV } from '../utils/export';
import { Search, ChevronDown, Plus, X, ArrowUpDown, Clock, Filter } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCustomers } from '../hooks/useCustomers';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import AddCustomerScreen from './AddCustomerScreen';
import CustomerProfileScreen from './CustomerProfileScreen';
import CustomerCard from '../components/CustomerCard';
import { Customer } from '../types';

export default function CustomersScreen() {
    const { customers, loading, refetch, deleteCustomer } = useCustomers();
    const { width } = useWindowDimensions();
    const [isAdding, setIsAdding] = useState(false);
    const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
    const [viewCustomerId, setViewCustomerId] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'debt_desc'>('newest');
    const [sortModalVisible, setSortModalVisible] = useState(false);

    const statuses = useMemo(() => Array.from(new Set(customers.map((c) => c.status || 'Active'))), [customers]);

    const filteredCustomers = useMemo(() => {
        let result = customers.filter((c) => {
            const matchesSearch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = !selectedStatus || (c.status || 'Active') === selectedStatus;
            return matchesSearch && matchesStatus;
        });

        // Apply Sorting
        return result.sort((a, b) => {
            switch (sortBy) {
                case 'name_asc':
                    return (a.name || '').localeCompare(b.name || '');
                case 'name_desc':
                    return (b.name || '').localeCompare(a.name || '');
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'debt_desc':
                    return (b.totalDebt || 0) - (a.totalDebt || 0);
                default:
                    return 0;
            }
        });
    }, [customers, searchQuery, selectedStatus, sortBy]);

    const isTablet = width >= 768;
    const isDesktop = width >= 1024;
    const gap = Spacing.lg;
    const totalPadding = Spacing.xl * 2;
    const sidebarWidth = isDesktop ? 240 : 0;
    const availableWidth = width - sidebarWidth - totalPadding;
    const numCols = isDesktop ? 3 : (isTablet ? 2 : 1);
    const itemWidth = (availableWidth - (gap * (numCols - 1))) / numCols;

    const handleEdit = (customer: Customer) => {
        setEditCustomer(customer);
        setIsAdding(true);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Confirm Removal',
            'Are you sure you want to remove this client from the registry?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCustomer(id);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete customer');
                        }
                    }
                }
            ]
        );
    };

    const handleExportCSV = async () => {
        setExporting(true);
        try {
            await exportToCSV<Customer>(
                customers,
                [
                    { header: 'ID', key: 'id' },
                    { header: 'Name', key: 'name' },
                    { header: 'Email', key: (c) => c.email || '' },
                    { header: 'Phone', key: (c) => c.phone || '' },
                    { header: 'Gender', key: (c) => c.gender || '' },
                    { header: 'Address', key: (c) => c.address || '' },
                    { header: 'TotalDebt', key: (c) => c.totalDebt || 0 },
                    { header: 'Status', key: (c) => c.status || 'Active' }
                ],
                'customer_registry',
                'Export Customers'
            );
        } catch (error) {
            console.error(error);
        } finally {
            setExporting(false);
        }
    };

    const headerComponent = useMemo(() => (
        <>
            <LinearGradient colors={['#1E1E26', '#12121A']} style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.crmLabelRow}>
                        <View style={styles.crmLine} />
                        <Text style={styles.crmLabel}>CRM SYSTEM</Text>
                    </View>
                    <View style={styles.headerMetrics}>
                        <Text style={styles.metricLabel}>ACTIVE ACCOUNTS</Text>
                        <Text style={styles.metricValue}>{customers.length}</Text>
                    </View>
                </View>
                <View style={styles.headerMain}>
                    <View style={styles.titleWrapper}>
                        <Text style={styles.headerTitle}>CUSTOMER REGISTRY</Text>
                        <Text style={styles.headerSubtitle}>Maintain your demographic database and track individual customer journeys.</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV} disabled={exporting}>
                            <Text style={styles.exportBtnText}>{exporting ? 'EXPORTING...' : 'EXPORT CSV'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)}>
                            <Text style={styles.addBtnText}>ADD CUSTOMER</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.filtersRow}>
                <View style={styles.searchContainer}>
                    <Search size={18} color="#475569" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, phone or email..."
                        placeholderTextColor="#475569"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity style={styles.statusDropdown} onPress={() => setStatusModalVisible(true)}>
                    <Text style={styles.statusDropdownText}>{selectedStatus || 'ALL STATUSES'}</Text>
                    <ChevronDown size={16} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.sortBtn} onPress={() => setSortModalVisible(true)}>
                    <ArrowUpDown size={18} color={sortBy === 'newest' ? '#64748B' : Colors.primary} />
                </TouchableOpacity>

                {selectedStatus && (
                    <TouchableOpacity onPress={() => setSelectedStatus(null)} style={{ padding: 8 }}>
                        <X size={18} color={Colors.error} />
                    </TouchableOpacity>
                )}
            </View>
        </>
    ), [customers.length, exporting, searchQuery, selectedStatus, sortBy]);

    const keyExtractor = useCallback((item: Customer) => item.id, []);

    const renderItem = useCallback(({ item }: { item: Customer }) => (
        <CustomerCard
            item={item}
            width={itemWidth}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={setViewCustomerId}
        />
    ), [itemWidth, handleEdit, handleDelete, setViewCustomerId]);

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={filteredCustomers}
                keyExtractor={keyExtractor}
                numColumns={numCols}
                key={numCols}
                ListHeaderComponent={headerComponent}
                renderItem={renderItem}
                columnWrapperStyle={numCols > 1 ? { gap } : null}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refetch}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
                ListFooterComponent={<View style={{ height: 100 }} />}
            />

            <Modal visible={isAdding} animationType="slide">
                <AddCustomerScreen
                    onClose={() => { setIsAdding(false); setEditCustomer(null); }}
                    onSuccess={() => { setIsAdding(false); setEditCustomer(null); }}
                    initialCustomer={editCustomer}
                />
            </Modal>

            <Modal visible={!!viewCustomerId} animationType="fade" transparent>
                {viewCustomerId && (
                    <CustomerProfileScreen
                        customerId={viewCustomerId}
                        onClose={() => setViewCustomerId(null)}
                    />
                )}
            </Modal>

            <Modal visible={statusModalVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setStatusModalVisible(false)}
                >
                    <View style={styles.filterModalContent}>
                        <Text style={styles.modalTitle}>SELECT STATUS</Text>
                        <TouchableOpacity
                            style={styles.filterOption}
                            onPress={() => { setSelectedStatus(null); setStatusModalVisible(false); }}
                        >
                            <Text style={[styles.filterOptionText, !selectedStatus && { color: Colors.primary }]}>
                                All Statuses
                            </Text>
                        </TouchableOpacity>
                        {statuses.map((stat: string) => (
                            <TouchableOpacity
                                key={stat}
                                style={styles.filterOption}
                                onPress={() => { setSelectedStatus(stat); setStatusModalVisible(false); }}
                            >
                                <Text style={[styles.filterOptionText, selectedStatus === stat && { color: Colors.primary }]}>
                                    {stat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Sort Modal */}
            <Modal visible={sortModalVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSortModalVisible(false)}
                >
                    <View style={styles.filterModalContent}>
                        <Text style={styles.modalTitle}>SORT BY</Text>
                        {[
                            { key: 'newest', label: 'Recently Added', icon: Clock },
                            { key: 'oldest', label: 'Oldest First', icon: Clock },
                            { key: 'name_asc', label: 'Alphabetical (A-Z)', icon: ArrowUpDown },
                            { key: 'name_desc', label: 'Alphabetical (Z-A)', icon: ArrowUpDown },
                            { key: 'debt_desc', label: 'Highest Debt', icon: Filter },
                        ].map((option) => (
                            <TouchableOpacity
                                key={option.key}
                                style={styles.filterOption}
                                onPress={() => { setSortBy(option.key as any); setSortModalVisible(false); }}
                            >
                                <Text style={[styles.filterOptionText, sortBy === option.key && { color: Colors.primary }]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0C10' },
    scrollContent: { padding: Spacing.xl },
    header: { borderRadius: 40, padding: 40, marginBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    crmLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    crmLine: { width: 30, height: 2, backgroundColor: Colors.primary },
    crmLabel: { fontSize: 11, color: Colors.primary, fontWeight: '800', letterSpacing: 2 },
    headerMetrics: { alignItems: 'flex-end', borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', paddingLeft: 20 },
    metricLabel: { fontSize: 9, color: Colors.primary, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
    metricValue: { fontSize: 32, fontWeight: '900', color: '#FFF' },
    headerMain: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 },
    titleWrapper: { flex: 1, minWidth: 250 },
    headerTitle: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: -1, marginBottom: 8 },
    headerSubtitle: { fontSize: 14, color: '#64748B', lineHeight: 22, maxWidth: 400 },
    headerActions: { flexDirection: 'row', gap: 12 },
    exportBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    exportBtnText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    addBtn: { backgroundColor: '#FFF', paddingHorizontal: 24, paddingVertical: 14, borderRadius: BorderRadius.full },
    addBtnText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    filtersRow: { flexDirection: 'row', gap: 16, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' },
    searchContainer: { flex: 1, minWidth: 200, height: 48, backgroundColor: '#111827', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    searchInput: { flex: 1, color: '#FFF', fontSize: 13 },
    statusDropdown: { height: 48, backgroundColor: '#111827', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    statusDropdownText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    sortBtn: { width: 48, height: 48, backgroundColor: '#111827', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    filterModalContent: { width: '80%', maxWidth: 320, backgroundColor: '#1E1E26', borderRadius: 24, padding: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
    modalTitle: { fontSize: 13, fontWeight: '900', color: Colors.primary, letterSpacing: 2, marginBottom: 24, textAlign: 'center' },
    filterOption: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    filterOptionText: { fontSize: 14, color: '#F8FAFC', fontWeight: '700', textAlign: 'center' },
});

