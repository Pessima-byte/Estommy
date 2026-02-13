import React, { useState } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, ScrollView, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, UserCog, UserMinus, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUsers } from '../hooks/useUsers';
import { usersAPI } from '../api/client';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import UpdateUserRoleModal from './UpdateUserRoleModal';
import AddUserModal from './AddUserModal';

const UserCard = ({ item, width, onEdit, onDelete }: { item: any, width: number, onEdit: (user: any) => void, onDelete: (id: string) => void }) => {
    const isGold = item.role === 'ADMIN';
    const nodeId = item.id ? `#${item.id.slice(0, 6).toUpperCase()}` : '#USERID';

    return (
        <View style={[styles.card, { width }]}>
            {/* Header: Icon & ID */}
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, isGold && { borderColor: '#C5A059' }]}>
                    <ShieldCheck size={20} color={isGold ? '#C5A059' : '#FFF'} />
                </View>
                <View style={styles.nodeInfo}>
                    <Text style={styles.nodeLabel}>USER IDENTITY</Text>
                    <Text style={styles.nodeId}>{nodeId}</Text>
                </View>
            </View>

            {/* Title */}
            <Text style={[styles.cardTitle, isGold && { color: '#C5A059' }]}>
                {item.name?.toUpperCase() || 'UNKNOWN USER'}
            </Text>

            {/* Role & Email */}
            <View style={styles.descContainer}>
                <View style={[styles.descBadge, isGold && { borderColor: '#C5A059' }]}>
                    <Text style={[styles.descBadgeText, isGold && { color: '#C5A059' }]}>{item.role || 'GUEST'}</Text>
                </View>
                <Text style={styles.descText} numberOfLines={1}>
                    {item.email || 'No contact info'}
                </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.modifyBtn} onPress={() => onEdit(item)}>
                    <UserCog size={16} color="#94A3B8" />
                    <Text style={styles.modifyBtnText}>EDIT ROLE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)}>
                    <UserMinus size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function UsersScreen() {
    const { users, loading, refetch } = useUsers();
    const { width } = useWindowDimensions();
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleRemoveUser = (id: string) => {
        Alert.alert(
            'Confirm Removal',
            'Are you sure you want to terminate this user identity? This will revoke all access immediately.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await usersAPI.delete(id);
                            refetch();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove user account.');
                        }
                    }
                }
            ]
        );
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Responsive Layout
    const isTablet = width >= 768;
    const isDesktop = width >= 1024;
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
                        <View style={styles.orgLabelRow}>
                            <View style={styles.orgLine} />
                            <Text style={styles.orgLabel}>ADMINISTRATION</Text>
                        </View>

                        <View style={styles.headerMetrics}>
                            <Text style={styles.metricLabel}>ACTIVE ACCOUNTS</Text>
                            <Text style={styles.metricValue}>{users.length}</Text>
                        </View>
                    </View>

                    <View style={styles.headerMain}>
                        <View style={styles.titleWrapper}>
                            <Text style={styles.headerTitle}>USER MANAGEMENT</Text>
                            <Text style={styles.headerSubtitle}>
                                Configure access controls and manage staff identities.
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddingUser(true)}>
                            <Text style={styles.addBtnText}>ADD USER</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search size={18} color="#475569" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users..."
                        placeholderTextColor="#475569"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Users Grid */}
                <View style={[styles.grid, { gap }]}>
                    {filteredUsers.map((item, index) => (
                        <UserCard
                            key={item.id}
                            item={item}
                            width={itemWidth}
                            onEdit={setEditingUser}
                            onDelete={handleRemoveUser}
                        />
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Edit Role Modal */}
            {editingUser && (
                <UpdateUserRoleModal
                    visible={!!editingUser}
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={() => {
                        setEditingUser(null);
                        refetch();
                    }}
                />
            )}
            {isAddingUser && (
                <AddUserModal
                    visible={isAddingUser}
                    onClose={() => setIsAddingUser(false)}
                    onSuccess={() => {
                        setIsAddingUser(false);
                        refetch();
                    }}
                />
            )}
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
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 16,
        letterSpacing: 0.5,
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
        borderColor: '#94A3B8',
    },
    descBadgeText: {
        fontSize: 8,
        color: '#94A3B8',
        fontWeight: '800',
        letterSpacing: 1,
    },
    descText: {
        fontSize: 12,
        color: '#94A3B8',
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
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
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
