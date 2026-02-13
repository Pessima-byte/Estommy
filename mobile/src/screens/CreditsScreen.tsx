import React, { useState } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, Search, AlertCircle, ArrowUpRight, Clock, CheckCircle2, Plus, ArrowUpDown, Filter, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCredits } from '../hooks/useCredits';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import SettlePaymentModal from './SettlePaymentModal';
import AddCreditRecordScreen from './AddCreditRecordScreen';
import { Modal } from 'react-native';

const CreditLedgerItem = ({ item, onSettle }: { item: any, onSettle: (credit: any) => void }) => {
    const isPaid = item.status === 'Paid';
    const amountDue = item.liability || (item.amount - (item.amountPaid || 0));

    return (
        <TouchableOpacity
            style={styles.ledgerItem}
            onPress={() => onSettle(item)}
            activeOpacity={0.7}
        >
            <View style={styles.ledgerLeft}>
                <View style={styles.ledgerIconContainer}>
                    <DollarIcon color="#C5A059" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.ledgerCustomerName} numberOfLines={1}>{item.customerName || 'N/A'}</Text>
                    {item.notes ? (
                        <Text style={styles.ledgerNotes} numberOfLines={1}>{item.notes}</Text>
                    ) : (
                        <Text style={styles.ledgerTimestamp}>RECENT TRANSACTION</Text>
                    )}
                </View>
            </View>

            <View style={styles.ledgerRight}>
                <View style={styles.ledgerAmountContainer}>
                    <Text style={styles.ledgerAmountLabel}>AMOUNT DUE</Text>
                    <View style={styles.ledgerAmountRow}>
                        <Text style={styles.ledgerCurrency}>LE</Text>
                        <Text style={styles.ledgerAmountValue}>{amountDue.toLocaleString()}</Text>
                    </View>
                </View>
                <View style={[styles.ledgerStatusBadge, {
                    backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                    borderColor: isPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)'
                }]}>
                    <Text style={[styles.ledgerStatusText, { color: isPaid ? '#10B981' : '#94A3B8' }]}>
                        {isPaid ? 'PAID' : 'PARTIAL'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

// Use simple icon if lucide doesn't have it directly or use existing
const DollarIcon = ({ color, size }: any) => (
    <Text style={{ color, fontSize: size, fontWeight: 'bold' }}>$</Text>
);

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
                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    <LinearGradient
                        colors={['#1F1F2B', '#111118']}
                        style={styles.heroCard}
                    >
                        {/* Title & Top Action */}
                        <View style={styles.heroHeaderRow}>
                            <View style={{ flex: 1 }}>
                                <View style={styles.brandSubtitleRow}>
                                    <View style={styles.brandLine} />
                                    <Text style={styles.brandSubtitle}>ACCOUNTS RECEIVABLE balance</Text>
                                </View>
                                <Text style={styles.heroTitle}>CREDIT LEDGER</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.addBtn}
                                activeOpacity={0.8}
                                onPress={() => setShowAdd(true)}
                            >
                                <Plus size={20} color="#000" />
                            </TouchableOpacity>
                        </View>

                        {/* Structured Intelligence Grid */}
                        <View style={styles.intelligenceGrid}>
                            <View style={styles.intelCard}>
                                <Text style={styles.intelLabel}>RECORDS tracked</Text>
                                <Text style={styles.intelValue}>{totalRecords}</Text>
                            </View>
                            <View style={styles.intelCard}>
                                <Text style={[styles.intelLabel, { color: '#C5A059' }]}>OUTSTANDING DUe</Text>
                                <View style={styles.intelValueRow}>
                                    <Text style={styles.intelCurrency}>LE</Text>
                                    <Text style={styles.intelValue}>{totalOutstanding.toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Search Box */}
                <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                        <Search size={18} color="#475569" style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search records..."
                            placeholderTextColor="#334155"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity style={styles.sortBtn} onPress={() => setSortModalVisible(true)}>
                        <ArrowUpDown size={20} color={sortBy === 'newest' ? '#334155' : Colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Ledger List */}
                <View style={styles.ledgerList}>
                    {filteredCredits.map((item) => (
                        <CreditLedgerItem
                            key={item.id}
                            item={item}
                            onSettle={setSelectedCredit}
                        />
                    ))}

                    {filteredCredits.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>NO CREDIT RECORDS</Text>
                            <Text style={styles.emptySubtext}>NO OUTSTANDING CREDITS OR HISTORY FOUND.</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

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
        backgroundColor: '#0A0C10',
    },
    scrollContent: {
        padding: Spacing.xl,
    },
    heroContainer: {
        marginBottom: 32,
    },
    heroCard: {
        padding: 24,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    heroHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    brandSubtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    brandLine: {
        width: 16,
        height: 2,
        backgroundColor: '#C5A059',
    },
    brandSubtitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 2,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#F8FAFC',
        letterSpacing: -0.5,
    },
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#C5A059',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#C5A059',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    intelligenceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    intelCard: {
        flex: 1,
        minWidth: '45%',
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    intelLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1.2,
        marginBottom: 8,
    },
    intelValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#F8FAFC',
    },
    intelValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    intelCurrency: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#C5A059',
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    searchBox: {
        flex: 1,
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '700',
    },
    sortBtn: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterModalContent: {
        width: '85%',
        maxWidth: 320,
        backgroundColor: '#1E1E26',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 2,
        marginBottom: 20,
        textAlign: 'center',
    },
    filterOption: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    filterOptionText: {
        fontSize: 14,
        color: '#F8FAFC',
        fontWeight: '700',
        textAlign: 'center',
    },
    ledgerList: {
        gap: 12,
    },
    ledgerItem: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    ledgerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    ledgerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(197, 160, 89, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ledgerCustomerName: {
        fontSize: 15,
        fontWeight: '900',
        color: '#F8FAFC',
    },
    ledgerTimestamp: {
        fontSize: 8,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 1.2,
        marginTop: 1,
    },
    ledgerNotes: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(197, 160, 89, 0.6)',
        marginTop: 2,
        fontStyle: 'italic',
    },
    ledgerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    ledgerAmountContainer: {
        alignItems: 'flex-end',
    },
    ledgerAmountLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#C5A059',
        letterSpacing: 1,
        marginBottom: 1,
    },
    ledgerAmountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 3,
    },
    ledgerCurrency: {
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(248, 250, 252, 0.5)',
    },
    ledgerAmountValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#F8FAFC',
    },
    ledgerStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    ledgerStatusText: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1.2,
    },
    emptyState: {
        padding: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.01)',
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.2)',
        marginBottom: 6,
    },
    emptySubtext: {
        fontSize: 9,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.1)',
        letterSpacing: 1.2,
        textAlign: 'center',
    },
});
