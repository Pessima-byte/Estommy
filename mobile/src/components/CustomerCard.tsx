import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Trash2, Mail, Phone, MessageCircle, User } from 'lucide-react-native';
import { getImageUrl } from '../api/client';
import { Colors } from '../constants/Theme';
import { Customer } from '../types';

const CARD_HEIGHT = 260;

interface CustomerCardProps {
    item: Customer;
    width: number;
    onEdit: (c: Customer) => void;
    onDelete: (id: string) => void;
    onView: (id: string) => void;
    isTablet?: boolean;
    index?: number;
}

const CustomerCard = ({ item, width, onEdit, onDelete, onView, isTablet, index = 0 }: CustomerCardProps) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(30)).current;

    const phone = item.phone || 'No Phone';
    const liability = item.totalDebt || 0;
    const gender = item.gender || 'NOT SET';

    const resolvedAvatar = (item.avatar ? getImageUrl(item.avatar) : null) ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'User')}&background=1a1a1a&color=fff&size=128`;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: index * 50,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                delay: index * 50,
                damping: 15,
                stiffness: 100,
                useNativeDriver: true,
            })
        ]).start();
    }, [index]);

    const openWhatsApp = () => {
        if (!item.phone) return;
        const phoneNum = item.phone.replace(/\D/g, '');
        Linking.openURL(`whatsapp://send?phone=${phoneNum}`);
    };

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            <View style={[styles.card, { width }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarPlaceholder}>
                            <User size={24} color="rgba(255,255,255,0.2)" />
                        </View>
                        <Image
                            source={{ uri: resolvedAvatar }}
                            style={[styles.avatar, { position: 'absolute' }]}
                            contentFit="cover"
                            transition={200}
                        />
                        <View style={styles.onlineDot} />
                    </View>

                    <View style={styles.actionIcons}>
                        <TouchableOpacity style={styles.iconBtn} onPress={openWhatsApp}>
                            <MessageCircle size={14} color="#25D366" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.iconBtn, { borderColor: 'rgba(239, 68, 68, 0.2)' }]} onPress={() => onDelete(item.id)}>
                            <Trash2 size={14} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.identitySection}>
                    <View style={styles.labelRow}>
                        <View style={styles.labelLine} />
                        <Text style={styles.labelText}>CUSTOMER_PROFILE</Text>
                    </View>
                    <Text style={[styles.nameText, isTablet && { fontSize: 16, lineHeight: 20 }]} numberOfLines={2}>{item.name?.toUpperCase()}</Text>

                    <View style={styles.contactContainer}>
                        <View style={styles.contactRow}>
                            <Phone size={isTablet ? 10 : 8} color="#94A3B8" />
                            <Text style={[styles.contactText, isTablet && { fontSize: 9 }]} numberOfLines={1}>{phone}</Text>
                        </View>

                        <View style={styles.contactRow}>
                            <Mail size={isTablet ? 10 : 8} color="#94A3B8" />
                            <Text style={[styles.contactText, isTablet && { fontSize: 9 }]} numberOfLines={1}>{item.email || 'NO_ADDRESS_GIVEN'}</Text>
                        </View>
                    </View>
                </View>

                <View style={{ flex: 1 }} />

                <View style={styles.statsBox}>
                    <View style={styles.statCol}>
                        <Text style={[styles.statLabel, isTablet && { fontSize: 8 }]} numberOfLines={1}>OUTSTANDING</Text>
                        <Text style={[styles.statValue, isTablet && { fontSize: 11 }, liability > 0 && { color: '#EF4444' }]} numberOfLines={1}>
                            LE {liability.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCol}>
                        <Text style={[styles.statLabel, isTablet && { fontSize: 8 }]} numberOfLines={1}>GENDER</Text>
                        <Text style={[styles.statValue, isTablet && { fontSize: 11 }]} numberOfLines={1}>{gender}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.modifyBtn, isTablet && { height: 42 }]}
                    onPress={() => onEdit(item)}
                >
                    <Text style={[styles.modifyBtnText, isTablet && { fontSize: 9 }]}>MODIFY MAP</Text>
                </TouchableOpacity>

                {/* HUD Corner Markers */}
                <View style={[styles.corner, { top: 6, left: 6, borderTopWidth: 1, borderLeftWidth: 1 }]} />
                <View style={[styles.corner, { bottom: 6, right: 6, borderBottomWidth: 1, borderRightWidth: 1 }]} />
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        height: CARD_HEIGHT,
        backgroundColor: '#16161D',
        borderRadius: 20,
        padding: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    avatarContainer: { width: 40, height: 40, position: 'relative' },
    avatarPlaceholder: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 10, backgroundColor: '#2A2A35', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    avatar: { width: '100%', height: '100%', borderRadius: 10 },
    onlineDot: { position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success, borderWidth: 2, borderColor: '#16161D' },
    actionIcons: { flexDirection: 'row', gap: 8 },
    iconBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    identitySection: { marginBottom: 8 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    labelLine: { width: 12, height: 1, backgroundColor: Colors.primary },
    labelText: { fontSize: 7, color: Colors.primary, fontWeight: '800', letterSpacing: 1 },
    nameText: { fontSize: 12, fontWeight: '900', fontStyle: 'italic', color: '#FFF', marginBottom: 6, letterSpacing: -0.2, lineHeight: 15 },
    contactContainer: { gap: 4 },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    contactText: { fontSize: 8, color: '#94A3B8', fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
    statsBox: { flexDirection: 'row', backgroundColor: '#0A0C10', borderRadius: 12, padding: 8, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    statCol: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    statLabel: { fontSize: 6, color: Colors.primary, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
    statValue: { fontSize: 9, fontWeight: '800', color: '#FFF' },
    modifyBtn: { height: 32, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modifyBtnText: { fontSize: 7, fontWeight: '900', color: '#E2E8F0', letterSpacing: 1, fontStyle: 'italic' },
    corner: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderColor: '#C5A059',
        opacity: 0.2,
    },
});

export default React.memo(CustomerCard);
