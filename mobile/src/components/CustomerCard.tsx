import { StyleSheet, View, Text, TouchableOpacity, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Eye, Trash2, Mail, Phone, MessageCircle, User } from 'lucide-react-native';
import { getImageUrl } from '../api/client';
import { Colors } from '../constants/Theme';
import { Customer } from '../types';

interface CustomerCardProps {
    item: Customer;
    width: number;
    onEdit: (c: Customer) => void;
    onDelete: (id: string) => void;
    onView: (id: string) => void;
}

const CustomerCard = ({ item, width, onEdit, onDelete, onView }: CustomerCardProps) => {
    const phone = item.phone || 'No Phone';
    const liability = item.totalDebt || 0;
    const gender = item.gender || 'NOT SET';

    const resolvedAvatar = (item.avatar ? getImageUrl(item.avatar) : null) ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'User')}&background=1a1a1a&color=fff&size=128`;

    const openWhatsApp = () => {
        if (!item.phone) return;
        const phoneNum = item.phone.replace(/\D/g, '');
        Linking.openURL(`whatsapp://send?phone=${phoneNum}`);
    };

    return (
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
                    {item.phone && (
                        <TouchableOpacity
                            style={[styles.iconBtn, { borderColor: 'rgba(37, 211, 102, 0.2)', backgroundColor: 'rgba(37, 211, 102, 0.05)' }]}
                            onPress={openWhatsApp}
                        >
                            <MessageCircle size={16} color="#25D366" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => onView(item.id)}
                    >
                        <Eye size={16} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => onDelete(item.id)}
                    >
                        <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.identitySection}>
                <View style={styles.labelRow}>
                    <View style={styles.labelLine} />
                    <Text style={styles.labelText}>CLIENT IDENTITY</Text>
                </View>
                <Text style={styles.nameText} numberOfLines={1}>{item.name?.toUpperCase()}</Text>

                <View style={styles.contactRow}>
                    <Mail size={12} color={Colors.primary} />
                    <Text style={styles.contactText} numberOfLines={1}>{item.email || 'no_email@system.com'}</Text>
                </View>
                <View style={styles.contactRow}>
                    <Phone size={12} color={Colors.primary} />
                    <Text style={styles.contactText}>{phone}</Text>
                </View>
            </View>

            <View style={styles.statsBox}>
                <View style={styles.statCol}>
                    <Text style={styles.statLabel}>LIABILITY</Text>
                    <Text style={styles.statValue}>Le {liability.toLocaleString()}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                    <Text style={styles.statLabel}>GENDER</Text>
                    <Text style={styles.statValue}>{gender}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.modifyBtn}
                onPress={() => onEdit(item)}
            >
                <Text style={styles.modifyBtnText}>MODIFY MAP</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { backgroundColor: '#16161D', borderRadius: 32, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    avatarContainer: { width: 64, height: 64, position: 'relative' },
    avatarPlaceholder: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20, backgroundColor: '#2A2A35', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
    avatar: { width: '100%', height: '100%', borderRadius: 20 },
    onlineDot: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.success, borderWidth: 2, borderColor: '#16161D' },
    actionIcons: { flexDirection: 'row', gap: 8 },
    iconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    identitySection: { marginBottom: 24 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    labelLine: { width: 16, height: 1, backgroundColor: Colors.primary },
    labelText: { fontSize: 9, color: Colors.primary, fontWeight: '800', letterSpacing: 2 },
    nameText: { fontSize: 22, fontWeight: '900', fontStyle: 'italic', color: '#FFF', marginBottom: 12, letterSpacing: -0.5 },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    contactText: { fontSize: 10, color: '#94A378', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    statsBox: { flexDirection: 'row', backgroundColor: '#0A0C10', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    statCol: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    statLabel: { fontSize: 8, color: Colors.primary, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
    statValue: { fontSize: 13, fontWeight: '800', color: '#FFF' },
    modifyBtn: { height: 48, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modifyBtnText: { fontSize: 10, fontWeight: '900', color: '#E2E8F0', letterSpacing: 2, fontStyle: 'italic' },
});

export default CustomerCard;
