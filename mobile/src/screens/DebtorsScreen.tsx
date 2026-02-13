import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, FlatList, TouchableOpacity, TextInput, RefreshControl, Platform, Modal } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronRight, Plus, ArrowUpDown, Clock, Filter, X, Image as ImageIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDebtors } from '../hooks/useDebtors';
import { useCredits } from '../hooks/useCredits';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import SettlePaymentModal from './SettlePaymentModal';
import AddCreditRecordScreen from './AddCreditRecordScreen';
import { getImageUrl } from '../api/client';

const DebtorCard = ({ debtor, onHistory, onSelect, lastNote, lastImage, onImagePress }: { debtor: any, onHistory: (d: any) => void, onSelect: (d: any) => void, lastNote?: string, lastImage?: string, onImagePress?: (uri: string) => void }) => {
    return (
        <TouchableOpacity
            style={styles.debtorCard}
            activeOpacity={0.85}
            onPress={() => onSelect(debtor)}
        >
            <View style={styles.cardMain}>
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        {debtor.avatar ? (
                            <Image source={{ uri: getImageUrl(debtor.avatar) }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitial}>{debtor.name[0].toUpperCase()}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.statusDot} />
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.debtorName} numberOfLines={1}>{debtor.name}</Text>
                    <View style={styles.phoneRow}>
                        <Text style={styles.debtorPhone}>{debtor.phone || 'REGISTRY NULL'}</Text>
                        <View style={styles.dotSeparator} />
                        <Text style={styles.debtorStatus}>ACTIVE</Text>
                    </View>
                </View>

                <View style={styles.valueSection}>
                    <Text style={styles.debtLabel}>DEBT</Text>
                    <View style={styles.debtValueRow}>
                        <Text style={styles.debtCurrency}>LE</Text>
                        <Text style={styles.debtValue}>{(debtor.totalDebt || 0).toLocaleString()}</Text>
                    </View>
                </View>
            </View>

            {lastImage ? (
                <TouchableOpacity
                    style={styles.imagePreviewContainer}
                    activeOpacity={0.9}
                    onPress={() => onImagePress?.(lastImage)}
                >
                    <Image
                        source={{ uri: getImageUrl(lastImage) }}
                        style={styles.panoramicImage}
                        contentFit="cover"
                        transition={500}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(19,19,26,0.8)']}
                        style={styles.imageOverlay}
                    />
                    {lastNote && (
                        <View style={styles.imageNoteBox}>
                            <Text style={styles.imageNote} numberOfLines={1}>{lastNote}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            ) : lastNote && (
                <View style={styles.standaloneNoteBox}>
                    <Text style={styles.lastNote} numberOfLines={1}>{lastNote}</Text>
                </View>
            )}

            <View style={styles.cardFooter}>
                <View style={styles.footerLine} />
                <TouchableOpacity style={styles.historyTrigger} onPress={() => onHistory(debtor)}>
                    <Text style={styles.historyText}>VIEW LEDGER HISTORY</Text>
                    <View style={styles.historyArrow}>
                        <ChevronRight size={10} color="#C5A059" strokeWidth={3} />
                    </View>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

export default function DebtorsScreen() {
    const { debtors, loading: loadingDebtors, refetch: refetchDebtors } = useDebtors();
    const { credits, refetch: refetchCredits, loading: loadingCredits } = useCredits();
    const { width } = useWindowDimensions();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDebtorId, setSelectedDebtorId] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'debt_desc'>('debt_desc');
    const [sortModalVisible, setSortModalVisible] = useState(false);
    const [viewerImage, setViewerImage] = useState<string | null>(null);

    const latestCreditsMap = useMemo(() => {
        const map: Record<string, any> = {};
        credits.forEach(credit => {
            const existing = map[credit.customerId];
            if (!existing || new Date(credit.createdAt) > new Date(existing.createdAt)) {
                map[credit.customerId] = credit;
            }
        });
        return map;
    }, [credits]);

    const refetchAll = () => {
        refetchDebtors();
        refetchCredits();
    };

    const loading = loadingDebtors || loadingCredits;

    // Find the actual credit object to settle from the reactive credits array
    const creditToSettle = credits.find(c => c.id === selectedDebtorId);

    const filteredDebtors = debtors.filter((d: any) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.phone || '').includes(searchTerm)
    ).sort((a: any, b: any) => {
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

    const totalOutstanding = debtors.reduce((acc: number, curr: any) => acc + (curr.totalDebt || 0), 0);

    const handleHistory = (debtor: any) => {
        const customerCredits = credits.filter((c: any) => c.customerId === debtor.id);
        if (customerCredits.length > 0) {
            // Sort by most recent/highest amount to be helpful, or just take the first
            setSelectedDebtorId(customerCredits[0].id);
        }
    };

    const headerComponent = useMemo(() => (
        <View>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>DEBTORS</Text>
                    <Text style={styles.subtitle}>CUSTOMERS WITH OUTSTANDING BALANCES</Text>
                </View>
                <View style={styles.outstandingCard}>
                    <Text style={styles.outstandingLabel}>TOTAL OUTSTANDING</Text>
                    <View style={styles.outstandingValueRow}>
                        <Text style={styles.outstandingCurrency}>LE</Text>
                        <Text style={styles.outstandingValue}>{totalOutstanding.toLocaleString()}</Text>
                    </View>
                </View>
            </View>

            {/* Search & Actions */}
            <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                    <Search size={20} color="rgba(255,255,255,0.2)" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search debtors..."
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
                <TouchableOpacity style={styles.sortBtn} onPress={() => setSortModalVisible(true)}>
                    <ArrowUpDown size={20} color={sortBy === 'debt_desc' ? 'rgba(255,255,255,0.4)' : Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.addBtn}
                    activeOpacity={0.8}
                    onPress={() => setShowAdd(true)}
                >
                    <Plus size={20} color="#000" />
                </TouchableOpacity>
            </View>
        </View>
    ), [searchTerm, sortBy, totalOutstanding]);

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={filteredDebtors}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.scrollContent}
                ListHeaderComponent={headerComponent}
                renderItem={({ item: debtor }) => {
                    const latestCredit = latestCreditsMap[debtor.id];
                    return (
                        <DebtorCard
                            debtor={debtor}
                            lastNote={latestCredit?.notes}
                            lastImage={latestCredit?.image}
                            onHistory={handleHistory}
                            onSelect={handleHistory}
                            onImagePress={(uri) => setViewerImage(uri)}
                        />
                    );
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refetchAll}
                        tintColor="#C5A059"
                        colors={["#C5A059"]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No debtors found matching your search.</Text>
                    </View>
                }
                ListFooterComponent={<View style={{ height: 100 }} />}
                removeClippedSubviews={Platform.OS === 'android'}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={10}
            />

            {/* Reuse Settle Modal for details/history */}
            {creditToSettle && (
                <SettlePaymentModal
                    visible={!!selectedDebtorId}
                    credit={creditToSettle}
                    onClose={() => setSelectedDebtorId(null)}
                    onSuccess={() => {
                        setSelectedDebtorId(null);
                        refetchAll();
                    }}
                />
            )}

            <Modal visible={showAdd} animationType="slide">
                <AddCreditRecordScreen
                    onClose={() => setShowAdd(false)}
                    onSuccess={() => {
                        setShowAdd(false);
                        refetchAll();
                    }}
                />
            </Modal>

            {/* Image Viewer Modal */}
            <Modal visible={!!viewerImage} transparent animationType="fade">
                <View style={styles.viewerContainer}>
                    <TouchableOpacity
                        style={styles.viewerBackdrop}
                        activeOpacity={1}
                        onPress={() => setViewerImage(null)}
                    />
                    <View style={styles.viewerContent}>
                        <Image
                            source={{ uri: getImageUrl(viewerImage) }}
                            style={styles.fullImage}
                            contentFit="contain"
                        />
                        <TouchableOpacity
                            style={styles.closeViewerBtn}
                            onPress={() => setViewerImage(null)}
                        >
                            <X size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Sort Modal */}
            <Modal visible={sortModalVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSortModalVisible(false)}
                >
                    <View style={styles.filterModalContent}>
                        <Text style={styles.modalTitle}>SORT DEBTORS</Text>
                        {[
                            { key: 'debt_desc', label: 'Highest Debt', icon: Filter },
                            { key: 'newest', label: 'Recently Added', icon: Clock },
                            { key: 'oldest', label: 'Oldest First', icon: Clock },
                            { key: 'name_asc', label: 'Alphabetical (A-Z)', icon: ArrowUpDown },
                            { key: 'name_desc', label: 'Alphabetical (Z-A)', icon: ArrowUpDown },
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
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#F8FAFC',
        fontStyle: 'italic',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 2,
        marginTop: 4,
    },
    outstandingCard: {
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
        alignItems: 'flex-end',
    },
    outstandingLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#C5A059',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    outstandingValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    outstandingCurrency: {
        fontSize: 12,
        fontWeight: '900',
        color: '#F8FAFC',
        opacity: 0.5,
    },
    outstandingValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#F8FAFC',
    },
    searchRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
        alignItems: 'center',
    },
    searchBox: {
        flex: 1,
        height: 52,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 26,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '600',
    },
    addBtn: {
        height: 52,
        width: 52,
        backgroundColor: '#F8FAFC',
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    sortBtn: {
        width: 52,
        height: 52,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 26,
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
        maxWidth: 340,
        backgroundColor: '#16161D',
        borderRadius: 32,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    modalTitle: {
        fontSize: 12,
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
    listContainer: {
        gap: 12,
    },
    debtorCard: {
        backgroundColor: '#13131A',
        borderRadius: 28,
        padding: 20,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarSection: {
        position: 'relative',
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#000',
        borderWidth: 1.5,
        borderColor: 'rgba(197, 160, 89, 0.3)',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1E1E26',
    },
    avatarInitial: {
        color: '#C5A059',
        fontSize: 20,
        fontWeight: '900',
    },
    statusDot: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#13131A',
    },
    infoSection: {
        flex: 1,
    },
    debtorName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        fontStyle: 'italic',
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    noteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    lastNote: {
        fontSize: 10,
        color: 'rgba(197, 160, 89, 0.6)',
        fontWeight: '700',
        fontStyle: 'italic',
        flex: 1,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    debtorPhone: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '800',
        letterSpacing: 1,
    },
    dotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    debtorStatus: {
        fontSize: 9,
        color: '#C5A059',
        fontWeight: '900',
        letterSpacing: 1,
    },
    valueSection: {
        alignItems: 'flex-end',
    },
    debtLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: 'rgba(197, 160, 89, 0.5)',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    debtValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    debtCurrency: {
        fontSize: 11,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.25)',
        fontStyle: 'italic',
    },
    debtValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        fontStyle: 'italic',
    },
    cardFooter: {
        marginTop: 16,
    },
    footerLine: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        width: '100%',
        marginBottom: 12,
    },
    historyTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    historyText: {
        fontSize: 9,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.2)',
        letterSpacing: 2,
    },
    historyArrow: {
        width: 20,
        height: 20,
        borderRadius: 6,
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 32,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.05)',
    },
    emptyText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: 1,
    },
    imagePreviewContainer: {
        height: 120,
        width: '100%',
        borderRadius: 20,
        marginTop: 16,
        overflow: 'hidden',
        backgroundColor: '#000',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    panoramicImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    imageNoteBox: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
    },
    imageNote: {
        fontSize: 11,
        color: '#FFF',
        fontWeight: '900',
        fontStyle: 'italic',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    standaloneNoteBox: {
        marginTop: 12,
        paddingHorizontal: 4,
    },
    viewerContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewerBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    viewerContent: {
        width: '100%',
        height: '80%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    closeViewerBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 24,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    }
});
