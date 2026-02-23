import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Animated } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2 } from 'lucide-react-native';
import { Colors } from '../constants/Theme';
import { getImageUrl } from '../api/client';
import { Product } from '../types';

const CARD_HEIGHT = 300;

interface ProductCardProps {
    item: Product;
    width: number;
    onEdit: (p: Product) => void;
    onDelete: (id: string) => void;
    onPress: (p: Product) => void;
    isTablet?: boolean;
    index?: number;
}

const ProductCard = ({ item, width, onEdit, onDelete, onPress, isTablet, index = 0 }: ProductCardProps) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(30)).current;

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

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            <TouchableOpacity
                style={[styles.productCard, { width }]}
                activeOpacity={0.9}
                onPress={() => onPress(item)}
            >
                <View style={styles.cardImageContainer}>
                    <Image
                        source={{ uri: getImageUrl(item.image) || 'https://placehold.co/400x300?text=ESTOMMY' }}
                        style={styles.cardImage}
                        contentFit="cover"
                        transition={200}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(10,10,15,0.8)']}
                        style={styles.imageOverlay}
                    />

                    <View style={styles.badgeRow}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>{item.category?.toUpperCase() || 'GENERAL'}</Text>
                        </View>
                        {isTablet && (
                            <View style={[styles.stockStatusBadge, {
                                borderColor: item.status === 'In Stock' ? Colors.primary + '40' : '#F59E0B40'
                            }]}>
                                <View style={[styles.statusDot, { backgroundColor: item.status === 'In Stock' ? Colors.primary : '#F59E0B' }]} />
                                <Text style={[styles.stockStatusText, { color: item.status === 'In Stock' ? '#F8FAFC' : '#F59E0B' }]}>
                                    {item.status?.toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle} numberOfLines={2}>{item.name?.toUpperCase()}</Text>
                        <Text style={styles.cardUID}>UNIT_ID: {item.id.slice(0, 8).toUpperCase()}</Text>
                    </View>

                    <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>UNIT_VAL</Text>
                        <View style={styles.priceValueRow}>
                            <Text style={styles.currencySymbol}>LE</Text>
                            <Text style={styles.priceValue}>{item.price.toLocaleString()}</Text>
                        </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.reserveRow}>
                        <View style={styles.reserveLabelRow}>
                            <View style={styles.reserveValueContainer}>
                                <Text style={styles.reserveValue}>{item.stock || 0}</Text>
                                <Text style={styles.reserveUnit}>UNITS</Text>
                            </View>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${Math.min(((item.stock || 0) / 100) * 100, 100)}%` }]} />
                        </View>
                    </View>

                    <View style={{ flex: 1 }} />

                    <View style={styles.cardActionRow}>
                        <TouchableOpacity style={styles.adjustDataBtn} onPress={() => onEdit(item)}>
                            <Text style={styles.adjustDataText}>ACCESS_DATA</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)}>
                            <Trash2 size={14} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* HUD Corner Markers */}
                <View style={[styles.corner, { top: 6, left: 6, borderTopWidth: 1, borderLeftWidth: 1 }]} />
                <View style={[styles.corner, { bottom: 6, right: 6, borderBottomWidth: 1, borderRightWidth: 1 }]} />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    productCard: {
        height: CARD_HEIGHT,
        backgroundColor: 'rgba(15,15,23,0.7)',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.1)',
        marginBottom: 12,
    },
    cardImageContainer: {
        width: '100%',
        height: 110,
        position: 'relative',
        backgroundColor: '#000',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        opacity: 0.9,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
    },
    badgeRow: {
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryBadge: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    categoryBadgeText: {
        color: '#94A3B8',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
    },
    stockStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        gap: 4,
    },
    statusDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    stockStatusText: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    cardContent: {
        padding: 10,
        flex: 1,
    },
    cardHeader: {
        marginBottom: 8,
        height: 42,
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#F8FAFC',
        letterSpacing: 0.2,
        marginBottom: 2,
        lineHeight: 14,
    },
    cardUID: {
        fontSize: 7,
        color: '#C5A059',
        fontWeight: '900',
        letterSpacing: 1,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        opacity: 0.6,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    priceLabel: {
        fontSize: 7,
        color: '#94A3B8',
        fontWeight: '900',
        letterSpacing: 1,
    },
    priceValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    currencySymbol: {
        fontSize: 8,
        color: '#C5A059',
        fontWeight: '900',
        opacity: 0.8,
    },
    priceValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#F8FAFC',
        letterSpacing: 0.3,
    },
    cardDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        marginBottom: 8,
    },
    reserveRow: {
        marginBottom: 8,
    },
    reserveLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    progressBarBg: {
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 1,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#C5A059',
        borderRadius: 1,
    },
    reserveValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    reserveValue: {
        fontSize: 11,
        fontWeight: '900',
        color: '#F8FAFC',
    },
    reserveUnit: {
        fontSize: 7,
        color: '#94A3B8',
        fontWeight: '900',
    },
    cardActionRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 'auto',
    },
    adjustDataBtn: {
        flex: 1,
        height: 32,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    adjustDataText: {
        color: '#F8FAFC',
        fontSize: 7.5,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    deleteBtn: {
        width: 32,
        height: 32,
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.1)',
    },
    corner: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderColor: '#C5A059',
        opacity: 0.2,
    },
});

export default React.memo(ProductCard);
