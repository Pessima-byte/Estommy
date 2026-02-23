import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Phone, Clock, FileText } from 'lucide-react-native';
import { getImageUrl } from '../api/client';
import { Colors } from '../constants/Theme';

const CARD_HEIGHT = 285;

const DebtorCard = React.memo(({ debtor, onHistory, onSelect, lastNote, lastImage, onImagePress, width, index = 0 }: { debtor: any, onHistory: (d: any) => void, onSelect: (d: any) => void, lastNote?: string, lastImage?: string, onImagePress?: (uri: string) => void, width: number, index?: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 30,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                delay: index * 30,
                damping: 15,
                stiffness: 120,
                useNativeDriver: true,
            })
        ]).start();
    }, [index]);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            <TouchableOpacity
                style={[styles.debtorCard, { width }]}
                activeOpacity={0.9}
                onPress={() => onSelect(debtor)}
            >
                {/* Header Section */}
                <View style={styles.cardHeader}>
                    <View style={styles.nameHeader}>
                        <Text
                            style={styles.debtorName}
                            numberOfLines={2}
                            adjustsFontSizeToFit
                            minimumFontScale={0.85}
                        >
                            {debtor.name?.toUpperCase()}
                        </Text>
                        <Text style={styles.customerID}>ID_{debtor.id.slice(-6).toUpperCase()}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>ACTIVE</Text>
                    </View>
                </View>

                {/* Main Content Row */}
                <View style={styles.contentRow}>
                    {/* Avatar with HUD Frame */}
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarFrame}>
                            {debtor.avatar ? (
                                <Image source={{ uri: getImageUrl(debtor.avatar) }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarInitial}>{debtor.name?.[0]?.toUpperCase()}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Info Column */}
                    <View style={styles.infoCol}>
                        <View style={styles.phoneBox}>
                            <Phone size={8} color="#94A3B8" />
                            <Text style={styles.phoneText} numberOfLines={1}>{debtor.phone || 'NO_PHONE'}</Text>
                        </View>

                        <View style={styles.debtValueBox}>
                            <Text style={styles.debtLabel}>TOTAL_LIABILITY</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.currency}>LE</Text>
                                <Text
                                    style={styles.amount}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.7}
                                >
                                    {(debtor.totalDebt || 0).toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Media Section (Fixed height) */}
                <View style={styles.mediaSection}>
                    {lastImage ? (
                        <TouchableOpacity
                            style={styles.imageContainer}
                            activeOpacity={0.95}
                            onPress={() => onImagePress?.(lastImage)}
                        >
                            <Image
                                source={{ uri: getImageUrl(lastImage) }}
                                style={styles.panoramicImage}
                                contentFit="cover"
                                transition={400}
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(10,10,15,0.9)']}
                                style={styles.imageFade}
                            />
                            {lastNote && (
                                <View style={styles.imageNoteBox}>
                                    <Clock size={8} color="#C5A059" />
                                    <Text style={styles.imageNoteText} numberOfLines={1}>{lastNote}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ) : lastNote ? (
                        <View style={styles.noteBox}>
                            <Text style={styles.noteText} numberOfLines={3}>{lastNote}</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyMedia}>
                            <FileText size={14} color="rgba(197, 160, 89, 0.1)" />
                            <Text style={styles.emptyMediaText}>EMPTY_REPORTS_LOG</Text>
                        </View>
                    )}
                </View>

                <View style={{ flex: 1 }} />

                {/* Footer Action */}
                <View style={styles.cardFooter}>
                    <View style={styles.footerLine} />
                    <TouchableOpacity
                        style={styles.historyBtn}
                        onPress={() => onHistory(debtor)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.historyBtnText}>LOG_VIEW</Text>
                        <View style={styles.arrowBox}>
                            <ChevronRight size={10} color="#C5A059" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* HUD Elements */}
                <View style={[styles.corner, { top: 6, left: 6, borderTopWidth: 1, borderLeftWidth: 1 }]} />
                <View style={[styles.corner, { bottom: 6, right: 6, borderBottomWidth: 1, borderRightWidth: 1 }]} />
            </TouchableOpacity>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    debtorCard: {
        height: CARD_HEIGHT,
        backgroundColor: 'rgba(16, 17, 24, 0.85)',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.1)',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
        height: 48,
    },
    nameHeader: {
        flex: 1,
        marginRight: 8,
    },
    debtorName: {
        fontSize: 9,
        fontWeight: '900',
        color: '#F8FAFC',
        letterSpacing: 0.2,
        marginBottom: 1,
        lineHeight: 12,
    },
    customerID: {
        fontSize: 7,
        fontWeight: '900',
        color: '#C5A059',
        opacity: 0.5,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
        gap: 3,
    },
    statusDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#10B981',
    },
    statusText: {
        fontSize: 6,
        fontWeight: '900',
        color: '#10B981',
        letterSpacing: 0.5,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    avatarWrapper: {
        padding: 2,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
        borderRadius: 12,
    },
    avatarFrame: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#1E202C',
        overflow: 'hidden',
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
        backgroundColor: 'rgba(197, 160, 89, 0.05)',
    },
    avatarInitial: {
        fontSize: 18,
        fontWeight: '900',
        color: '#C5A059',
    },
    infoCol: {
        flex: 1,
    },
    phoneBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    phoneText: {
        fontSize: 9, // Slightly smaller
        color: '#94A3B8',
        fontWeight: '700',
        letterSpacing: 0.1,
    },
    debtValueBox: {
        marginTop: 0,
    },
    debtLabel: {
        fontSize: 7,
        color: '#64748B',
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 1,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    currency: {
        fontSize: 8,
        fontWeight: '900',
        color: '#C5A059',
    },
    amount: {
        fontSize: 14,
        fontWeight: '900',
        color: '#F8FAFC',
        letterSpacing: -0.5,
    },
    mediaSection: {
        width: '100%',
        height: 75, // Standardized media height
        marginBottom: 8,
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        backgroundColor: '#000',
    },
    panoramicImage: {
        width: '100%',
        height: '100%',
        opacity: 0.7,
    },
    imageFade: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70%',
    },
    imageNoteBox: {
        position: 'absolute',
        bottom: 6,
        left: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    imageNoteText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '700',
        opacity: 0.8,
    },
    noteBox: {
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    noteText: {
        fontSize: 9,
        color: '#94A37D',
        fontStyle: 'italic',
        lineHeight: 12,
    },
    emptyMedia: {
        height: '100%',
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(197, 160, 89, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    emptyMediaText: {
        fontSize: 6,
        fontWeight: '900',
        color: 'rgba(197, 160, 89, 0.1)',
        letterSpacing: 1.5,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
    },
    footerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginRight: 10,
    },
    historyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
    },
    historyBtnText: {
        fontSize: 7,
        fontWeight: '900',
        color: '#C5A059',
        letterSpacing: 1,
    },
    arrowBox: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    corner: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderColor: '#C5A059',
        opacity: 0.2,
    },
});

export default DebtorCard;
