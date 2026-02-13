import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2, Box } from 'lucide-react-native';
import { Colors, Spacing } from '../constants/Theme';
import { getImageUrl } from '../api/client';
import { Product } from '../types';

interface ProductCardProps {
    item: Product;
    width: number;
    onEdit: (p: Product) => void;
    onDelete: (id: string) => void;
}

const ProductCard = ({ item, width, onEdit, onDelete }: ProductCardProps) => (
    <View style={[styles.productCard, { width }]}>
        <View style={styles.cardImageContainer}>
            <Image
                source={{ uri: getImageUrl(item.image) || 'https://placehold.co/400x300?text=ESTOMMY' }}
                style={styles.cardImage}
                contentFit="cover"
                transition={200}
            />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.imageOverlay}
            />

            <View style={styles.badgeRow}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.category?.toUpperCase() || 'GENERAL'}</Text>
                </View>
                <View style={[styles.stockStatusBadge, {
                    backgroundColor: item.status === 'In Stock' ? 'rgba(197, 160, 89, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    borderColor: item.status === 'In Stock' ? Colors.primary : '#F59E0B'
                }]}>
                    <View style={[styles.statusDot, { backgroundColor: item.status === 'In Stock' ? Colors.primary : '#F59E0B' }]} />
                    <Text style={[styles.stockStatusText, { color: item.status === 'In Stock' ? '#F8FAFC' : '#F59E0B' }]}>
                        {item.status?.toUpperCase()}
                    </Text>
                </View>
            </View>
        </View>

        <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.name?.toUpperCase()}</Text>
                <Text style={styles.cardUID}>UID: {item.id.slice(0, 8).toUpperCase()}</Text>
            </View>

            <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>PRICE</Text>
                <View style={styles.priceValueRow}>
                    <Text style={styles.currencySymbol}>LE</Text>
                    <Text style={styles.priceValue}>{item.price.toLocaleString()}</Text>
                </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.reserveRow}>
                <View style={{ flex: 1 }}>
                    <View style={styles.reserveLabelRow}>
                        <Box size={12} color="#94A3B8" />
                        <Text style={styles.reserveLabel}>STOCK LEVEL</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${Math.min(((item.stock || 0) / 100) * 100, 100)}%` }]} />
                    </View>
                </View>
                <View style={styles.reserveValueContainer}>
                    <Text style={styles.reserveValue}>{item.stock || 0}</Text>
                    <Text style={styles.reserveUnit}>UNITS</Text>
                </View>
            </View>

            <View style={styles.cardActionRow}>
                <TouchableOpacity style={styles.adjustDataBtn} onPress={() => onEdit(item)}>
                    <Text style={styles.adjustDataText}>EDIT DETAILS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)}>
                    <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    </View>
);

const styles = StyleSheet.create({
    productCard: {
        backgroundColor: '#16161D',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: Spacing.lg,
    },
    cardImageContainer: {
        width: '100%',
        aspectRatio: 1.25,
        position: 'relative',
        backgroundColor: '#262630',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    badgeRow: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    categoryBadge: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        maxWidth: '100%',
    },
    categoryBadgeText: {
        color: '#E2E8F0',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    stockStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    stockStatusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    cardContent: {
        padding: 14,
    },
    cardHeader: {
        marginBottom: 8,
        height: 36,
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#F8FAFC',
        letterSpacing: 0.3,
        marginBottom: 2,
        lineHeight: 16,
    },
    cardUID: {
        fontSize: 8,
        color: '#64748B',
        fontWeight: '600',
        letterSpacing: 1,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    priceContainer: {
        marginBottom: 12,
    },
    priceLabel: {
        fontSize: 9,
        color: '#64748B',
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 2,
    },
    priceValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 3,
    },
    currencySymbol: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: 'bold',
    },
    priceValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#F8FAFC',
        letterSpacing: -0.5,
    },
    cardDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 12,
    },
    reserveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 14,
    },
    reserveLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    reserveLabel: {
        fontSize: 9,
        color: '#94A3B8',
        fontWeight: '700',
        letterSpacing: 1,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    reserveValueContainer: {
        alignItems: 'flex-end',
    },
    reserveValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#F8FAFC',
    },
    reserveUnit: {
        fontSize: 8,
        color: '#64748B',
        fontWeight: '700',
    },
    cardActionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    adjustDataBtn: {
        flex: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    adjustDataText: {
        color: '#E2E8F0',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    deleteBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
});

export default ProductCard;
