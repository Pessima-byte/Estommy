import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, ScrollView, TouchableOpacity, TextInput, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, Search, AlertCircle, ArrowUpRight, Clock, CheckCircle2, Plus, ArrowUpDown, Filter, X, Download } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCredits } from '../hooks/useCredits';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import SettlePaymentModal from './SettlePaymentModal';
import AddCreditRecordScreen from './AddCreditRecordScreen';
import { Modal } from 'react-native';
import { exportToCSV } from '../utils/export';
import { ActivityLogger } from '../utils/activityLogger';
import CreditLedgerItem from '../components/CreditLedgerItem';





export default function CreditsScreen() {
    const { credits, loading, refetch } = useCredits();
    const { width } = useWindowDimensions();
    const [selectedCredit, setSelectedCredit] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_desc' | 'name_asc'>('newest');
    const [sortModalVisible, setSortModalVisible] = useState(false);

    const filteredCredits = credits.filter(c =>
        (c.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'oldest':
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'amount_desc':
                const aDue = a.liability || (a.amount - (a.amountPaid || 0));
                const bDue = b.liability || (b.amount - (b.amountPaid || 0));
                return bDue - aDue;
            case 'name_asc':
                return (a.customerName || '').localeCompare(b.customerName || '');
            default:
                return 0;
        }
    });

    const totalOutstanding = credits.reduce((sum, c) => sum + (c.liability || 0), 0);
    const totalRecords = credits.length;

    const headerComponent = useMemo(() => (
        <View>
            <LinearGradient colors={['#1E1E26', '#12121A']} style={styles.heroCard}>
                <View style={styles.heroHeaderRow}>
                    <View style={styles.brandContainer}>
                        <View style={styles.brandSubtitleRow}>
                            <View style={styles.brandLine} />
                            <Text style={styles.brandSubtitle} numberOfLines={1}>CREDIT_INTELLIGENCE</Text>
                        </View>
                    </View>
                    <View style={styles.headerMetrics}>
                        <Text style={styles.metricLabel} numberOfLines={1}>TOTAL_LIABILITY</Text>
                        <View style={styles.metricValueRow}>
                            <Text style={styles.metricCurrency}>LE</Text>
                            <Text style={styles.metricValue} numberOfLines={1}>{totalOutstanding.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.headerMain}>
                    <View style={styles.titleWrapper}>
                        <Text style={styles.heroTitle}>CREDIT LEDGER</Text>
                        <Text style={styles.heroSubtitle}>Monitor accounts receivable, track pending settlements and analyze liability flow.</Text>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.exportBtn}
                            activeOpacity={0.8}
                            onPress={async () => {
                                try {
                                    await exportToCSV(
                                        credits,
                                        [
                                            { header: 'ID', key: 'id' },
                                            { header: 'Customer', key: 'customerName' },
                                            { header: 'Amount (LE)', key: 'amount' },
                                            { header: 'Paid (LE)', key: 'amountPaid' },
                                            { header: 'Due (LE)', key: 'liability' },
                                            { header: 'Status', key: 'status' },
                                            { header: 'Date', key: (c: any) => new Date(c.createdAt).toLocaleDateString() },
                                            { header: 'Notes', key: (c: any) => c.notes || '' }
                                        ],
                                        'credit_ledger_report',
                                        'Export Credit Records'
                                    );
                                    await ActivityLogger.logExport('CREDIT', credits.length);
                                } catch (e) {
                                    console.error(e);
                                }
                            }}
                        >
                            <Text style={styles.exportBtnText}>EXPORT</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => setShowAdd(true)}>
                            <Text style={styles.addBtnText}>ADD NEW</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                    <Search size={18} color="#475569" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by customer name or ID..."
                        placeholderTextColor="#475569"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity style={styles.sortBtn} onPress={() => setSortModalVisible(true)}>
                    <ArrowUpDown size={18} color={sortBy === 'newest' ? '#64748B' : Colors.primary} />
                </TouchableOpacity>
            </View>
        </View>
    ), [totalOutstanding, totalRecords, credits, searchQuery, sortBy]);

    const keyExtractor = useCallback((item: any) => item.id, []);

    const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
        <CreditLedgerItem
            item={item}
            onSettle={setSelectedCredit}
            index={index}
        />
    ), [setSelectedCredit]);

    return (
        <SafeAreaView style={styles.container}>
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

            <FlatList
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                data={filteredCredits}
                keyExtractor={keyExtractor}
                ListHeaderComponent={headerComponent}
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>NO CREDIT RECORDS</Text>
                        <Text style={styles.emptySubtext}>NO OUTSTANDING CREDITS OR HISTORY FOUND.</Text>
                    </View>
                }
                ListFooterComponent={<View style={{ height: 100 }} />}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refetch}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            />

            {/* Settle Modal */}
            {selectedCredit && (
                <SettlePaymentModal
                    visible={!!selectedCredit}
                    credit={selectedCredit}
                    onClose={() => setSelectedCredit(null)}
                    onSuccess={() => {
                        setSelectedCredit(null);
                        refetch();
                    }}
                />
            )}

            <Modal visible={showAdd} animationType="slide">
                <AddCreditRecordScreen
                    onClose={() => setShowAdd(false)}
                    onSuccess={() => {
                        setShowAdd(false);
                        refetch();
                    }}
                />
            </Modal>

            {/* Sort Modal */}
            <Modal visible={sortModalVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSortModalVisible(false)}
                >
                    <View style={styles.filterModalContent}>
                        <Text style={styles.modalTitle}>SORT RECORDS</Text>
                        {[
                            { key: 'newest', label: 'Recently Added', icon: Clock },
                            { key: 'oldest', label: 'Oldest First', icon: Clock },
                            { key: 'amount_desc', label: 'Highest Amount', icon: Filter },
                            { key: 'name_asc', label: 'Customer Name (A-Z)', icon: ArrowUpDown },
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
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Spacing.md,
        paddingHorizontal: 8,
    },
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
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    heroHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    brandContainer: {
        flex: 1,
    },
    brandSubtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    brandLine: {
        width: 20,
        height: 2,
        backgroundColor: Colors.primary,
    },
    brandSubtitle: {
        fontSize: 9,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 2,
    },
    headerMetrics: {
        alignItems: 'flex-end',
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255,255,255,0.1)',
        paddingLeft: 12,
    },
    metricLabel: {
        fontSize: 7,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 1,
        marginBottom: 2,
    },
    metricValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    metricCurrency: {
        fontSize: 9,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
    },
    metricValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
    },
    headerMain: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
    },
    titleWrapper: {
        flex: 1,
        minWidth: 200,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    heroSubtitle: {
        fontSize: 11,
        color: '#64748B',
        lineHeight: 16,
        maxWidth: 400,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    exportBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    exportBtnText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
    },
    addBtn: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    addBtnText: {
        color: '#000',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    searchBox: {
        flex: 1,
        height: 44,
        backgroundColor: '#111827',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    searchInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 13,
    },
    sortBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#111827',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterModalContent: {
        width: '80%',
        maxWidth: 320,
        backgroundColor: '#1E1E26',
        borderRadius: 24,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    modalTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 2,
        marginBottom: 24,
        textAlign: 'center',
    },
    filterOption: {
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    filterOptionText: {
        fontSize: 14,
        color: '#F8FAFC',
        fontWeight: '700',
        textAlign: 'center',
    },
    ledgerItem: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 8,
    },
    ledgerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
    },
    avatarText: {
        color: '#C5A059',
        fontSize: 14,
        fontWeight: '900',
    },
    ledgerCustomerName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#F8FAFC',
        textTransform: 'uppercase',
    },
    timestampRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    ledgerTimestamp: {
        fontSize: 7,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1.2,
    },
    ledgerNotes: {
        fontSize: 9,
        fontWeight: '600',
        color: 'rgba(197, 160, 89, 0.6)',
        marginTop: 2,
        fontStyle: 'italic',
    },
    ledgerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ledgerAmountContainer: {
        alignItems: 'flex-end',
    },
    ledgerAmountLabel: {
        fontSize: 7,
        fontWeight: '900',
        color: 'rgba(197, 160, 89, 0.4)',
        letterSpacing: 1,
        marginBottom: 1,
    },
    ledgerAmountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    ledgerCurrency: {
        fontSize: 8,
        fontWeight: '900',
        color: 'rgba(248, 250, 252, 0.3)',
    },
    ledgerAmountValue: {
        fontSize: 16,
        fontWeight: '900',
        color: '#F8FAFC',
    },
    ledgerStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 60,
        alignItems: 'center',
    },
    ledgerStatusText: {
        fontSize: 7,
        fontWeight: '900',
        letterSpacing: 1,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.01)',
        marginTop: 20,
    },
    emptyText: {
        fontSize: 12,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.2)',
        marginBottom: 4,
        letterSpacing: 2,
    },
    emptySubtext: {
        fontSize: 8,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.1)',
        letterSpacing: 1,
        textAlign: 'center',
    },
});
