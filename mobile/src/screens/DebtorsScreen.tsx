import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, FlatList, TouchableOpacity, TextInput, RefreshControl, Platform, Modal } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronRight, Plus, ArrowUpDown, Clock, Filter, X, Image as ImageIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDebtors } from '../hooks/useDebtors';
import { useCredits } from '../hooks/useCredits';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import SettleDebtorModal from './SettleDebtorModal';
import AddCreditRecordScreen from './AddCreditRecordScreen';
import { getImageUrl } from '../api/client';
import { exportToCSV } from '../utils/export';
import { Download } from 'lucide-react-native';
import { ActivityLogger } from '../utils/activityLogger';
import DebtorCard from '../components/DebtorCard';





export default function DebtorsScreen() {
    const { debtors, loading: loadingDebtors, refetch: refetchDebtors } = useDebtors();
    const { credits, refetch: refetchCredits, loading: loadingCredits } = useCredits();
    const { width } = useWindowDimensions();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDebtor, setSelectedDebtor] = useState<any>(null);
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



    const isTablet = width >= 768;
    const isDesktop = width >= 768;
    const numCols = isDesktop ? 3 : 2;
    const gap = isTablet ? Spacing.lg : 8;
    const horizontalPadding = isTablet ? Spacing.xl : 8;
    const sidebarWidth = isDesktop ? 240 : 0;
    const availableWidth = width - sidebarWidth - (horizontalPadding * 2);
    const itemWidth = (availableWidth - (gap * (numCols - 1))) / numCols;

    const filteredDebtors = useMemo(() => {
        return debtors.filter((d: any) =>
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
    }, [debtors, searchTerm, sortBy]);

    const totalOutstanding = debtors.reduce((acc: number, curr: any) => acc + (curr.totalDebt || 0), 0);

    const handleHistory = (debtor: any) => {
        // We select the entire debtor so we can settle their aggregate debt
        setSelectedDebtor(debtor);
    };

    const handleExportCSV = async () => {
        try {
            await exportToCSV(
                debtors,
                [
                    { header: 'ID', key: 'id' },
                    { header: 'Name', key: 'name' },
                    { header: 'Phone', key: (d: any) => d.phone || 'N/A' },
                    { header: 'Total Debt (LE)', key: (d: any) => d.totalDebt || 0 },
                    { header: 'Status', key: (d: any) => (d.totalDebt > 0 ? 'Active Debt' : 'Clear') }
                ],
                'ESTOMMY_Debtors_List',
                'Export Debtors Data'
            );

            // Log the export activity
            await ActivityLogger.logExport('DEBTOR', debtors.length);
        } catch (error) {
            console.error('Debtors Export Error:', error);
        }
    };

    const headerComponent = useMemo(() => (
        <View style={styles.headerContainer}>
            <View style={styles.headerTop}>
                <View style={styles.titleBox}>
                    <Text style={styles.titleMain} numberOfLines={1}>DEBTORS</Text>
                    <View style={styles.subtitleRow}>
                        <View style={styles.subtitleLine} />
                        <Text style={styles.subtitleText} numberOfLines={1}>OUTSTANDING_REGISTRY</Text>
                    </View>
                </View>

                <View style={styles.totalLiabilityCard}>
                    <Text style={styles.totalLabel} numberOfLines={1}>TOTAL_DEBT_LOAD</Text>
                    <View style={styles.totalValueRow}>
                        <Text style={styles.totalCurrency}>LE</Text>
                        <Text style={styles.totalValue} numberOfLines={1}>{totalOutstanding.toLocaleString()}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.searchActionRow}>
                <View style={styles.searchBarBox}>
                    <Search size={14} color="#C5A059" style={{ opacity: 0.6 }} />
                    <TextInput
                        style={styles.searchBarInput}
                        placeholder="SEARCH_DATA..."
                        placeholderTextColor="rgba(197, 160, 89, 0.3)"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.actionIconBtn} onPress={() => setSortModalVisible(true)}>
                        <ArrowUpDown size={16} color="#C5A059" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIconBtn} onPress={handleExportCSV}>
                        <Download size={16} color="#C5A059" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mainAddBtn} onPress={() => setShowAdd(true)}>
                        <Plus size={20} color="#000" strokeWidth={3} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    ), [searchTerm, sortBy, totalOutstanding, debtors]);

    const keyExtractor = useCallback((item: any) => item.id, []);

    const renderItem = useCallback(({ item: debtor, index }: { item: any; index: number }) => {
        const latestCredit = latestCreditsMap[debtor.id];
        return (
            <DebtorCard
                debtor={debtor}
                lastNote={latestCredit?.notes}
                lastImage={latestCredit?.image}
                onHistory={handleHistory}
                onSelect={handleHistory}
                onImagePress={(uri) => setViewerImage(uri)}
                width={itemWidth}
                index={index}
            />
        );
    }, [latestCreditsMap, setViewerImage, itemWidth]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
            <LinearGradient
                colors={['#060609', '#0F172A', '#060608']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                pointerEvents="none"
            />
            {/* Atmosphere Layer: Enhanced multi-source glow */}
            <View style={styles.atmosphereGlow} pointerEvents="none" />
            <View style={[styles.atmosphereGlow, { top: '40%', left: -100, opacity: 0.03, backgroundColor: '#00D9FF' }]} pointerEvents="none" />

            <FlatList
                data={filteredDebtors}
                keyExtractor={keyExtractor}
                numColumns={numCols}
                key={numCols}
                contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
                columnWrapperStyle={numCols > 1 ? { gap } : null}
                ListHeaderComponent={headerComponent}
                renderItem={renderItem}
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

            {/* Reuse Settle Modal to settle total debtor balance */}
            {selectedDebtor && (
                <SettleDebtorModal
                    visible={!!selectedDebtor}
                    debtor={selectedDebtor}
                    credits={credits.filter((c: any) => c.customerId === selectedDebtor.id)}
                    onClose={() => setSelectedDebtor(null)}
                    onSuccess={() => {
                        setSelectedDebtor(null);
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
    scrollContent: {
        paddingTop: Spacing.md,
    },
    headerContainer: {
        marginBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Changed to center for better alignment with the card
        marginBottom: 24, // Slightly more space before search
    },
    titleBox: {
        flex: 1,
    },
    titleMain: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        fontStyle: 'italic',
        letterSpacing: -0.5,
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    subtitleLine: {
        width: 12,
        height: 1,
        backgroundColor: '#C5A059',
    },
    subtitleText: {
        fontSize: 7.5,
        fontWeight: '900',
        color: '#C5A059',
        letterSpacing: 1.2,
    },
    totalLiabilityCard: {
        backgroundColor: 'rgba(197, 160, 89, 0.03)',
        paddingHorizontal: 14,
        paddingVertical: 12, // More vertical breathing room
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.12)',
        alignItems: 'flex-end',
        minWidth: 110,
    },
    totalLabel: {
        fontSize: 6.5,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 2,
    },
    totalValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 3,
    },
    totalCurrency: {
        fontSize: 9,
        fontWeight: '900',
        color: '#C5A059',
        opacity: 0.8,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#F8FAFC',
        letterSpacing: -0.2,
    },
    searchActionRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    searchBarBox: {
        flex: 1,
        height: 38, // Slimmer search
        backgroundColor: 'rgba(255,255,255,0.01)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        gap: 8,
    },
    searchBarInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    actionIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainAddBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    emptyState: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterModalContent: {
        width: '80%',
        backgroundColor: '#0F1115',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
        shadowColor: '#C5A059',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#C5A059',
        letterSpacing: 2,
        marginBottom: 20,
        textAlign: 'center',
    },
    filterOption: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    filterOptionText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '700',
        fontStyle: 'italic',
    },
    viewerContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    viewerBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    viewerContent: {
        flex: 1,
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
        right: 20,
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
