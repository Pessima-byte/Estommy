import React from 'react';
import { StyleSheet, View, Text, useWindowDimensions, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, Check, X, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';

// Hardcoded matching backend/lib/roles.ts
const ROLES = [
    {
        id: 'ADMIN',
        label: 'ADMINISTRATOR',
        description: 'Full system control. Access to all modules, settings, and user management.',
        color: '#EAB308', // Gold
        permissions: [
            'ALL_ACCESS',
            'MANAGE_USERS',
            'SYSTEM_SETTINGS',
            'BACKUP_RESTORE'
        ]
    },
    {
        id: 'MANAGER',
        label: 'MANAGER',
        description: 'Operational oversight. Can manage inventory, sales, customers, and credits.',
        color: '#3B82F6', // Blue
        permissions: [
            'VIEW_PRODUCTS', 'CREATE_PRODUCTS', 'EDIT_PRODUCTS', 'DELETE_PRODUCTS',
            'VIEW_CUSTOMERS', 'CREATE_CUSTOMERS',
            'VIEW_SALES', 'CREATE_SALES',
            'VIEW_CREDITS', 'CREATE_CREDITS',
            'VIEW_PROFITS'
        ]
    },
    {
        id: 'USER',
        label: 'STANDARD USER',
        description: 'Restricted access. Can view data and record new sales.',
        color: '#94A3B8', // Slate
        permissions: [
            'VIEW_PRODUCTS',
            'VIEW_CUSTOMERS',
            'VIEW_SALES', 'CREATE_SALES',
            'VIEW_CREDITS',
            'VIEW_DEBTORS'
        ]
    }
];

const RoleCard = ({ role, width }: { role: any, width: number }) => {
    return (
        <View style={[styles.card, { width, borderColor: role.color }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { borderColor: role.color }]}>
                    <ShieldCheck size={24} color={role.color} />
                </View>
                <View style={styles.headerText}>
                    <Text style={[styles.roleLabel, { color: role.color }]}>{role.label}</Text>
                    <Text style={styles.roleId}>{role.id}</Text>
                </View>
            </View>

            <Text style={styles.description}>{role.description}</Text>

            <View style={styles.divider} />

            <Text style={styles.permHeader}>CAPABILITIES</Text>
            <View style={styles.permList}>
                {role.permissions.map((perm: string) => (
                    <View key={perm} style={styles.permItem}>
                        <Check size={12} color={role.color} />
                        <Text style={styles.permText}>{perm.replace(/_/g, ' ')}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

export default function PermissionsScreen() {
    const { width } = useWindowDimensions();

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
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Hero Header */}
                <LinearGradient
                    colors={['#1E1E26', '#12121A']}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <View style={styles.orgLabelRow}>
                            <View style={styles.orgLine} />
                            <Text style={styles.orgLabel}>ACCESS CONTROL</Text>
                        </View>
                    </View>

                    <View style={styles.headerMain}>
                        <View style={styles.titleWrapper}>
                            <Text style={styles.headerTitle}>ROLE DEFINITIONS</Text>
                            <Text style={styles.headerSubtitle}>
                                Reference guide for system access levels and user capabilities.
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Roles Grid */}
                <View style={[styles.grid, { gap }]}>
                    {ROLES.map((role) => (
                        <RoleCard
                            key={role.id}
                            role={role}
                            width={itemWidth}
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    card: {
        backgroundColor: '#16161D',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        marginBottom: Spacing.lg,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    headerText: {
        flex: 1,
    },
    roleLabel: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 4,
    },
    roleId: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '700',
        letterSpacing: 1,
    },
    description: {
        fontSize: 13,
        color: '#94A3B8',
        lineHeight: 20,
        marginBottom: 24,
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 20,
    },
    permHeader: {
        fontSize: 10,
        color: '#FFF',
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 12,
    },
    permList: {
        gap: 8,
    },
    permItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    permText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },
});
