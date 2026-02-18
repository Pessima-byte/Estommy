import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions, Modal, Platform, Alert, Linking } from 'react-native';
import { X, Mail, Phone, MapPin, Calendar, ShoppingBag, CreditCard, ArrowLeft, Download, ExternalLink, ChevronRight, User, Camera, Image as ImageIcon, FileText } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { customersAPI, salesAPI, creditsAPI, getImageUrl } from '../api/client';
import { Customer, Sale } from '../types';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import { exportToCSV } from '../utils/export';
import { ActivityLogger } from '../utils/activityLogger';
import { useQuery } from '@tanstack/react-query';

interface CustomerProfileScreenProps {
    customerId: string;
    onClose: () => void;
}

export default function CustomerProfileScreen({ customerId, onClose }: CustomerProfileScreenProps) {
    const { width, height } = useWindowDimensions();
    const isTablet = width >= 768;

    const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'credits'>('overview');

    // Customer Detail Query
    const { data: customer, isLoading: customerLoading } = useQuery({
        queryKey: ['customer', customerId],
        queryFn: () => customersAPI.getOne(customerId),
        enabled: !!customerId,
        staleTime: 1000 * 60 * 30 // 30 mins
    });

    // Sales Query 
    const { data: allSales, isLoading: salesLoading } = useQuery({
        queryKey: ['sales'],
        queryFn: () => salesAPI.getAll(),
        staleTime: 1000 * 60 * 5 // 5 min
    });

    // Credits Query
    const { data: allCredits, isLoading: creditsLoading } = useQuery({
        queryKey: ['credits'],
        queryFn: () => creditsAPI.getAll(),
        staleTime: 1000 * 60 * 5
    });

    const loading = customerLoading || salesLoading || creditsLoading;

    const sales = useMemo(() =>
        Array.isArray(allSales) ? allSales.filter((s: any) => s.customerId === customerId) : []
        , [allSales, customerId]);

    const credits = useMemo(() =>
        Array.isArray(allCredits) ? allCredits.filter((c: any) => c.customerId === customerId) : []
        , [allCredits, customerId]);

    const stats = useMemo(() => {
        const totalSpent = sales.reduce((sum, s) => sum + s.amount, 0);
        const pendingCredits = credits.filter(c => c.status === 'Pending').reduce((sum, c) => sum + c.amount, 0);

        const allDates = [
            ...sales.map(s => new Date(s.createdAt)),
            ...credits.map(c => new Date(c.createdAt || ''))
        ].sort((a, b) => b.getTime() - a.getTime());

        const lastActivity = allDates.length > 0
            ? allDates[0].toLocaleDateString('en-GB')
            : 'None';

        return { totalSpent, pendingCredits, lastActivity };
    }, [sales, credits]);

    const handleExportReport = async () => {
        if (!customer) return;

        try {
            // Prepare comprehensive customer report data
            const reportData = [
                // Customer Summary
                {
                    Section: 'CUSTOMER INFORMATION',
                    Field: 'Name',
                    Value: customer.name || 'N/A',
                    Details: ''
                },
                {
                    Section: 'CUSTOMER INFORMATION',
                    Field: 'Email',
                    Value: customer.email || 'N/A',
                    Details: ''
                },
                {
                    Section: 'CUSTOMER INFORMATION',
                    Field: 'Phone',
                    Value: customer.phone || 'N/A',
                    Details: ''
                },
                {
                    Section: 'CUSTOMER INFORMATION',
                    Field: 'Address',
                    Value: customer.address || 'N/A',
                    Details: ''
                },
                {
                    Section: 'CUSTOMER INFORMATION',
                    Field: 'Gender',
                    Value: customer.gender || 'N/A',
                    Details: ''
                },
                {
                    Section: 'CUSTOMER INFORMATION',
                    Field: 'Status',
                    Value: customer.status || 'Active',
                    Details: ''
                },
                {
                    Section: 'CUSTOMER INFORMATION',
                    Field: 'Member Since',
                    Value: new Date(customer.createdAt).toLocaleDateString('en-GB'),
                    Details: ''
                },
                // Financial Summary
                {
                    Section: 'FINANCIAL SUMMARY',
                    Field: 'Total Spent',
                    Value: `Le ${stats.totalSpent.toLocaleString()}`,
                    Details: `${sales.length} purchases`
                },
                {
                    Section: 'FINANCIAL SUMMARY',
                    Field: 'Current Debt',
                    Value: `Le ${(customer.totalDebt || 0).toLocaleString()}`,
                    Details: ''
                },
                {
                    Section: 'FINANCIAL SUMMARY',
                    Field: 'Pending Credits',
                    Value: `Le ${stats.pendingCredits.toLocaleString()}`,
                    Details: `${credits.filter(c => c.status === 'Pending').length} pending`
                },
                {
                    Section: 'FINANCIAL SUMMARY',
                    Field: 'Last Activity',
                    Value: stats.lastActivity,
                    Details: ''
                },
                // Sales Records
                ...sales.map((sale, index) => ({
                    Section: 'SALES HISTORY',
                    Field: `Sale #${index + 1}`,
                    Value: `Le ${sale.amount.toLocaleString()}`,
                    Details: `${new Date(sale.date).toLocaleDateString('en-GB')} - ${sale.status || 'Completed'}`
                })),
                // Credit Records
                ...credits.map((credit, index) => ({
                    Section: 'CREDIT HISTORY',
                    Field: `Credit #${index + 1}`,
                    Value: `Le ${credit.amount.toLocaleString()}`,
                    Details: `Due: ${new Date(credit.dueDate).toLocaleDateString('en-GB')} - ${credit.status || 'Pending'}`
                }))
            ];

            await exportToCSV(
                reportData,
                [
                    { header: 'Section', key: 'Section' },
                    { header: 'Field', key: 'Field' },
                    { header: 'Value', key: 'Value' },
                    { header: 'Details', key: 'Details' }
                ],
                `Customer_Report_${(customer.name || 'User').replace(/\s+/g, '_')}`,
                'Export Customer Report'
            );

            Alert.alert('Success', 'Customer report exported successfully!');

            // Log the export activity
            await ActivityLogger.log({
                action: 'EXPORT',
                entityType: 'CUSTOMER',
                entityId: customer.id,
                entityName: customer.name,
                description: `Exported comprehensive report for customer: ${customer.name}`
            });
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert('Export Failed', 'Unable to generate customer report.');
        }
    };

    // Log profile view
    useEffect(() => {
        if (customer) {
            ActivityLogger.logView('CUSTOMER', customer.id, customer.name);
        }
    }, [customer?.id]);

    if (loading || !customer) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#C5A059" />
                <Text style={styles.loadingText}>SYNCHRONIZING PROFILE...</Text>
            </View>
        );
    }

    const resolvedAvatar = (customer.avatar ? getImageUrl(customer.avatar) : null) ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name || 'User')}&background=1a1a1a&color=fff&size=128`;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0F1115', '#0A0A0C']}
                style={styles.gradient}
            >
                {/* Header Actions */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={onClose}>
                        <ArrowLeft size={20} color="#FFF" />
                        <Text style={styles.backText}>GO BACK</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.downloadBtn} onPress={handleExportReport}>
                        <Download size={18} color="#C5A059" />
                        <Text style={styles.downloadText}>REPORT</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Profile Header */}
                    <View style={styles.profileHeaderCard}>
                        <View style={styles.avatarWrapper}>
                            <View style={styles.avatarBorder}>
                                <Image
                                    source={{ uri: resolvedAvatar }}
                                    style={styles.avatar}
                                    contentFit="cover"
                                />
                            </View>
                            <View style={[styles.statusBadge, {
                                backgroundColor: (customer.status || 'Active') === 'Active' ? '#10B981' : '#F59E0B'
                            }]}>
                                <Text style={styles.statusText}>{(customer.status || 'Active').toUpperCase()}</Text>
                            </View>
                        </View>

                        <View style={styles.identityWrapper}>
                            <View style={styles.identityHeader}>
                                <View style={styles.labelLine} />
                                <Text style={styles.identityLabel}>VERIFIED ACCOUNT</Text>
                                <Text style={styles.idTag}>#{(customer.id || 'UNKNOWN').slice(-6).toUpperCase()}</Text>
                            </View>
                            <Text style={styles.nameText}>{(customer.name || 'Unknown User').toUpperCase()}</Text>
                            <Text style={styles.contactSub}>{customer.email || 'NO_EMAIL@SYSTEM.COM'} // {customer.phone || 'NO PHONE'}</Text>
                        </View>

                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>TOTAL SPENT</Text>
                                <Text style={styles.statValue}>Le {stats.totalSpent.toLocaleString()}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>CURRENT DEBT</Text>
                                <Text style={[styles.statValue, { color: '#F59E0B' }]}>Le {(customer.totalDebt || 0).toLocaleString()}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>SALES VOLUME</Text>
                                <Text style={styles.statValue}>{sales.length} Purchases</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>LAST ACTIVITY</Text>
                                <Text style={styles.statValue}>{stats.lastActivity}</Text>
                            </View>
                        </View>
                    </View>

                    {customer.attachment && (
                        <View style={styles.attachmentSection}>
                            <View style={styles.attachmentHeader}>
                                <FileText size={14} color="#C5A059" />
                                <Text style={styles.attachmentTitle}>IDENTITY DOCUMENTATION</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.attachmentPreview}
                                onPress={() => { }}
                            >
                                <Image
                                    source={{ uri: getImageUrl(customer.attachment) }}
                                    style={styles.attachmentThumb}
                                    contentFit="cover"
                                />
                                <View style={styles.attachmentInfo}>
                                    <Text style={styles.attachmentName}>Verification_Doc.jpg</Text>
                                    <Text style={styles.attachmentMeta}>SECURE CLOUD STORAGE</Text>
                                </View>
                                <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Navigation Tabs */}
                    <View style={styles.tabsContainer}>
                        {(['overview', 'sales', 'credits'] as const).map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                    {tab.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Tab Content */}
                    <View style={styles.tabContent}>
                        {activeTab === 'overview' && (
                            <View style={styles.overviewSection}>
                                <View style={styles.infoRow}>
                                    <View style={styles.infoCol}>
                                        <Text style={styles.infoLabel}>ADDRESS</Text>
                                        <Text style={styles.infoValue}>{customer.address || 'Not Registered'}</Text>
                                    </View>
                                </View>
                                <View style={styles.infoRow}>
                                    <View style={styles.infoCol}>
                                        <Text style={styles.infoLabel}>GENDER</Text>
                                        <Text style={styles.infoValue}>{customer.gender || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.infoCol}>
                                        <Text style={styles.infoLabel}>MEMBER SINCE</Text>
                                        <Text style={styles.infoValue}>
                                            {new Date(customer.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.signatureSection}>
                                    <Text style={styles.sectionTitle}>SIGNATURE VERIFICATION</Text>
                                    <View style={styles.signatureBox}>
                                        <Text style={styles.signatureText}>AUTHORIZED_SIGNATURE</Text>
                                        <View style={styles.signaturePlaceholder}>
                                            <User size={32} color="rgba(255,255,255,0.05)" />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {activeTab === 'sales' && (
                            <View style={styles.listSection}>
                                {sales.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyText}>NO SALES RECORDS FOUND</Text>
                                    </View>
                                ) : (
                                    sales.map((sale) => (
                                        <View key={sale.id} style={styles.listItem}>
                                            <View style={styles.listItemLeading}>
                                                <ShoppingBag size={18} color="#C5A059" />
                                            </View>
                                            <View style={styles.listItemBody}>
                                                <Text style={styles.listItemTitle}>SALE #{sale.id.slice(-6).toUpperCase()}</Text>
                                                <Text style={styles.listItemSubtitle}>
                                                    {new Date(sale.date).toLocaleDateString('en-GB')}
                                                </Text>
                                            </View>
                                            <View style={styles.listItemTrailing}>
                                                <Text style={styles.listItemAmount}>Le {sale.amount.toLocaleString()}</Text>
                                                <Text style={styles.listItemStatus}>{sale.status}</Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        )}

                        {activeTab === 'credits' && (
                            <View style={styles.listSection}>
                                {credits.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyText}>NO CREDIT ENTRIES FOUND</Text>
                                    </View>
                                ) : (
                                    credits.map((credit) => (
                                        <View key={credit.id} style={styles.listItem}>
                                            <View style={styles.listItemLeading}>
                                                <CreditCard size={18} color="#F59E0B" />
                                            </View>
                                            <View style={styles.listItemBody}>
                                                <Text style={styles.listItemTitle}>CREDIT #{credit.id.slice(-6).toUpperCase()}</Text>
                                                <Text style={styles.listItemSubtitle}>
                                                    DUE: {new Date(credit.dueDate).toLocaleDateString('en-GB')}
                                                </Text>
                                                {credit.notes && (
                                                    <View style={styles.notesContainer}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                            {credit.image && <ImageIcon size={10} color="#C5A059" />}
                                                            <Text style={styles.notesText} numberOfLines={2}>{credit.notes}</Text>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={styles.listItemTrailing}>
                                                <Text style={styles.listItemAmount}>Le {credit.amount.toLocaleString()}</Text>
                                                <Text style={[styles.listItemStatus, { color: credit.status === 'Paid' ? '#10B981' : '#F59E0B' }]}>
                                                    {credit.status}
                                                </Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    gradient: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0A0C10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#C5A059',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 3,
        marginTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
    },
    downloadText: {
        color: '#C5A059',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    profileHeaderCard: {
        backgroundColor: '#16161D',
        borderRadius: 36,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 24,
    },
    avatarWrapper: {
        position: 'relative',
        alignSelf: 'flex-start',
        marginBottom: 24,
    },
    avatarBorder: {
        width: 100,
        height: 100,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 4,
        backgroundColor: '#0A0C10',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 26,
    },
    statusBadge: {
        position: 'absolute',
        bottom: -8,
        right: -8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#16161D',
    },
    statusText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: '900',
    },
    identityWrapper: {
        marginBottom: 24,
    },
    identityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    labelLine: {
        width: 16,
        height: 1,
        backgroundColor: '#C5A059',
    },
    identityLabel: {
        color: '#C5A059',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 2,
    },
    idTag: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 9,
        fontWeight: '900',
        fontStyle: 'italic',
        marginLeft: 'auto',
    },
    nameText: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    contactSub: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 12,
    },
    statItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    statValue: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
        gap: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#FFF',
    },
    tabText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    activeTabText: {
        color: '#000',
    },
    tabContent: {
        minHeight: 300,
    },
    overviewSection: {
        gap: 20,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 20,
    },
    infoCol: {
        flex: 1,
    },
    infoLabel: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 8,
    },
    infoValue: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    signatureSection: {
        marginTop: 10,
    },
    sectionTitle: {
        color: '#C5A059',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 16,
    },
    signatureBox: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        padding: 24,
        alignItems: 'center',
        borderStyle: 'dashed',
    },
    signatureText: {
        color: 'rgba(255,255,255,0.1)',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: 20,
    },
    signaturePlaceholder: {
        width: 100,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listSection: {
        gap: 12,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        gap: 16,
    },
    listItemLeading: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listItemBody: {
        flex: 1,
    },
    listItemTitle: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 2,
    },
    listItemSubtitle: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        fontWeight: '600',
    },
    listItemTrailing: {
        alignItems: 'flex-end',
    },
    listItemAmount: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 2,
    },
    listItemStatus: {
        color: '#10B981',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
    },
    notesContainer: {
        marginTop: 6,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    notesText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontStyle: 'italic',
        lineHeight: 14,
    },
    emptyState: {
        paddingVertical: 60,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        borderStyle: 'dashed',
        borderRadius: 32,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    attachmentSection: {
        marginTop: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    attachmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    attachmentTitle: {
        fontSize: 9,
        color: '#C5A059',
        fontWeight: '900',
        letterSpacing: 2,
    },
    attachmentPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    attachmentThumb: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#000',
    },
    attachmentInfo: {
        flex: 1,
    },
    attachmentName: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    attachmentMeta: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 1,
        marginTop: 2,
    },
});
