import React, { useState } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, ScrollView, TouchableOpacity, TextInput, Modal, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Menu, Trash2, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCategories } from '../hooks/useCategories';
import { categoriesAPI } from '../api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import AddCategoryScreen from './AddCategoryScreen';
import { useToast } from '../hooks/useToast';
import { useProfile } from '../hooks/useProfile';

const CategoryCard = ({ item, index, width, onEdit, onDelete, canEdit, canDelete }: { item: any, index: number, width: number, onEdit: (c: any) => void, onDelete: (id: string) => void, canEdit: boolean, canDelete: boolean }) => {
    const isGold = index % 2 !== 0; // Alternate styles like in the screenshot
    const nodeId = item.id ? `#${item.id.slice(0, 6).toUpperCase()}` : '#XD9NZG';

    return (
        <View style={[styles.card, { width }]}>
            {/* Header: Icon & Node ID */}
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, isGold && { borderColor: '#C5A059' }]}>
                    <Menu size={20} color={isGold ? '#C5A059' : '#FFF'} />
                </View>
                <View style={styles.nodeInfo}>
                    <Text style={styles.nodeLabel}>SYSTEM NODE</Text>
                    <Text style={styles.nodeId}>{nodeId}</Text>
                </View>
            </View>

            {/* Title */}
            <Text style={[styles.cardTitle, isGold && { color: '#C5A059' }]}>
                {item.name?.toUpperCase() || 'CATEGORY'}
            </Text>

            {/* Description Box */}
            <View style={styles.descContainer}>
                <View style={styles.descBadge}>
                    <Text style={styles.descBadgeText}>DESCRIPTION</Text>
                </View>
                <Text style={styles.descText} numberOfLines={3}>
                    {item.description || 'No specialized operational parameters defined for this node.'}
                </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
                {canEdit && (
                    <TouchableOpacity
                        style={styles.modifyBtn}
                        onPress={() => onEdit(item)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.modifyBtnText}>MODIFY MAP</Text>
                    </TouchableOpacity>
                )}
                {canDelete && (
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => onDelete(item.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Trash2 size={18} color="#64748B" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default function CategoriesScreen() {
    const { categories, loading, refetch } = useCategories();
    const { user } = useProfile();
    const { showToast } = useToast();
    const { width } = useWindowDimensions();
    const [isAdding, setIsAdding] = useState(false);
    const [editCategory, setEditCategory] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Check permissions (ADMIN and MANAGER can edit/delete)
    const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    const canDelete = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    const canCreate = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    const handleEdit = (category: any) => {
        setEditCategory(category);
        setIsAdding(true);
    };

    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoriesAPI.delete(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['categories'] });
            const previousCategories = queryClient.getQueryData(['categories']);

            // Optimistically remove
            queryClient.setQueryData(['categories'], (old: any[] = []) =>
                old.filter(c => c.id !== id)
            );

            return { previousCategories };
        },
        onError: (err: any, id, context: any) => {
            console.log('Mobile Delete Error:', err);
            queryClient.setQueryData(['categories'], context.previousCategories);

            let message = 'Failed to delete category. Please check your connection.';
            let title = 'Deletion Failed';

            if (err.response) {
                // Server responded
                const data = err.response.data;
                console.log('Error Data:', data);

                if (data?.error) {
                    message = data.error;
                } else if (data?.message) {
                    message = data.message;
                } else if (typeof data === 'string') {
                    // Possible HTML error page or raw string
                    message = data.length > 200 ? 'Server returned an invalid response.' : data;
                }

                // If it's a 400 or 403, it's likely a logic block (Safety Lock) or permission
                if (err.response.status === 400 || err.response.status === 403) {
                    title = 'Action Blocked';
                }
            } else if (err.message) {
                // Network or client error
                message = err.message;
            }

            Alert.alert(
                title,
                message,
                [{ text: 'OK' }]
            );
        },
        onSuccess: () => {
            showToast('Category node purged', 'success');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
    });

    const handleDelete = (id: string) => {
        if (!id) {
            showToast('Invalid category reference.', 'error');
            return;
        }

        if (deleteMutation.isPending) {
            showToast('Deletion in progress...', 'info');
            return;
        }

        Alert.alert(
            'Confirm Removal',
            'Are you sure you want to remove this category node? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteMutation.mutate(id)
                }
            ]
        );
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Responsive Layout
    const isTablet = width >= 768;
    const isDesktop = width >= 1024;
    const gap = Spacing.lg;
    const totalPadding = Spacing.xl * 2;
    const sidebarWidth = isDesktop ? 240 : 0;
    const availableWidth = width - sidebarWidth - totalPadding;

    // 3 columns on desktop, 2 on tablet, 1 on phone
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
                <Modal visible={isAdding} animationType="slide" transparent>
                    <AddCategoryScreen
                        onClose={() => {
                            setIsAdding(false);
                            setEditCategory(null);
                        }}
                        onSuccess={() => {
                            setIsAdding(false);
                            setEditCategory(null);
                            refetch();
                        }}
                        initialCategory={editCategory}
                    />
                </Modal>

                {/* Hero Header */}
                <LinearGradient
                    colors={['#1E1E26', '#12121A']}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <View style={styles.orgLabelRow}>
                            <View style={styles.orgLine} />
                            <Text style={styles.orgLabel}>ORGANIZATION</Text>
                        </View>

                        <View style={styles.headerMetrics}>
                            <Text style={styles.metricLabel}>TOTAL GROUPS</Text>
                            <Text style={styles.metricValue}>{categories.length}</Text>
                        </View>
                    </View>

                    <View style={styles.headerMain}>
                        <View style={styles.titleWrapper}>
                            <Text style={styles.headerTitle}>PRODUCT CATEGORIES</Text>
                            <Text style={styles.headerSubtitle}>
                                Structure your inventory into logical groups for efficient management.
                            </Text>
                        </View>

                        {canCreate && (
                            <TouchableOpacity
                                style={styles.addBtn}
                                onPress={() => setIsAdding(true)}
                            >
                                <Text style={styles.addBtnText}>ADD CATEGORY</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </LinearGradient>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search size={18} color="#475569" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search categories..."
                        placeholderTextColor="#475569"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={[styles.grid, { gap }]}>
                    {filteredCategories.map((item, index) => (
                        <CategoryCard
                            key={item.id}
                            item={item}
                            index={index}
                            width={itemWidth}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            canEdit={canEdit}
                            canDelete={canDelete}
                        />
                    ))}
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
    // Header Styles
    header: {
        borderRadius: 40,
        padding: 40,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    orgLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    orgLine: {
        width: 30,
        height: 2,
        backgroundColor: '#C5A059',
    },
    orgLabel: {
        fontSize: 11,
        color: '#C5A059',
        fontWeight: '800',
        letterSpacing: 2,
    },
    headerMetrics: {
        alignItems: 'flex-end',
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255,255,255,0.1)',
        paddingLeft: 20,
    },
    metricLabel: {
        fontSize: 9,
        color: '#C5A059',
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
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
    addBtn: {
        backgroundColor: '#FFF',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: BorderRadius.full,
    },
    addBtnText: {
        color: '#000',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 2,
    },

    // Search
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

    // Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },

    // Card Styles
    card: {
        backgroundColor: '#16161D',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: Spacing.lg,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    nodeInfo: {
        alignItems: 'flex-end',
    },
    nodeLabel: {
        fontSize: 9,
        color: '#C5A059',
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 4,
    },
    nodeId: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '900',
        letterSpacing: 1,
    },
    cardTitle: {
        fontSize: 26,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#FFF',
        marginBottom: 24,
        letterSpacing: -1,
    },
    descContainer: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 20,
        paddingTop: 24,
        position: 'relative',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.02)',
    },
    descBadge: {
        position: 'absolute',
        top: -10,
        right: 20,
        backgroundColor: '#000',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C5A059',
    },
    descBadgeText: {
        fontSize: 8,
        color: '#C5A059',
        fontWeight: '800',
        letterSpacing: 1,
    },
    descText: {
        fontSize: 13,
        color: '#94A3B8',
        lineHeight: 20,
        fontStyle: 'italic',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    modifyBtn: {
        flex: 1,
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    modifyBtnText: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '800',
        letterSpacing: 2,
        fontStyle: 'italic',
    },
    deleteBtn: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
});
