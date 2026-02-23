import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { X, Package, Tag, Wallet, Box, Calendar, Clock, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Colors, Spacing } from '../constants/Theme';
import { getImageUrl } from '../api/client';
import { Product } from '../types';

interface ProductDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    product: Product | null;
}

export default function ProductDetailsModal({ visible, onClose, product }: ProductDetailsModalProps) {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

    if (!product) return null;

    const allImages = [
        product.image,
        ...(product.images || [])
    ].filter(Boolean) as string[];

    const currentImageUrl = allImages.length > 0 ? getImageUrl(allImages[activeImageIndex]) : null;

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <LinearGradient
                        colors={['#060609', '#0F172A', '#060608']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    {/* Atmosphere Glow */}
                    <View style={styles.atmosphereGlow} pointerEvents="none" />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleContainer}>
                            <View style={styles.headerIconWrapper}>
                                <Package size={20} color="#C5A059" strokeWidth={2.5} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={styles.headerTitle}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.7}
                                >
                                    PRODUCT SPECIFICATIONS
                                </Text>
                                <Text
                                    style={styles.headerSubtitle}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.7}
                                >
                                    ASSET UID: {product.id.substring(0, 24).toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color="rgba(255,255,255,0.4)" strokeWidth={3} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {/* Image Station */}
                        <View style={styles.imageStation}>
                            {currentImageUrl ? (
                                <View style={styles.mainImageWrapper}>
                                    <Image
                                        source={{ uri: currentImageUrl }}
                                        style={styles.mainImage}
                                        contentFit="cover"
                                        transition={400}
                                    />
                                    <TouchableOpacity
                                        style={styles.zoomBtn}
                                        onPress={() => setFullScreenImage(currentImageUrl)}
                                    >
                                        <Maximize2 size={16} color="#000" strokeWidth={3} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Package size={64} color="rgba(197, 160, 89, 0.1)" />
                                </View>
                            )}

                            {allImages.length > 1 && (
                                <View style={styles.thumbnailStation}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {allImages.map((img, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                onPress={() => setActiveImageIndex(idx)}
                                                style={[styles.miniThumbnail, activeImageIndex === idx && styles.miniThumbnailActive]}
                                            >
                                                <Image
                                                    source={{ uri: getImageUrl(img) }}
                                                    style={{ width: '100%', height: '100%', borderRadius: 8 }}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        {/* Tactical Info Grid */}
                        <View style={styles.tacticalGrid}>
                            <DetailCard
                                label="PRODUCT NAME"
                                value={product.name.toUpperCase()}
                                icon={Package}
                                fullWidth
                            />

                            <View style={styles.gridRow}>
                                <DetailCard
                                    label="CATEGORY"
                                    value={product.category.toUpperCase()}
                                    icon={Tag}
                                />
                                <DetailCard
                                    label="STOCK STATUS"
                                    value={product.status.toUpperCase()}
                                    icon={Box}
                                    valueColor="#C5A059"
                                />
                            </View>

                            <View style={styles.gridRow}>
                                <DetailCard
                                    label="RETAIL PRICE"
                                    value={`LE ${product.price.toLocaleString()}`}
                                    icon={Wallet}
                                    highlight
                                />
                                <DetailCard
                                    label="COST PRICE"
                                    value={`LE ${product.costPrice?.toLocaleString() || '0'}`}
                                    icon={Wallet}
                                />
                            </View>

                            <View style={styles.gridRow}>
                                <DetailCard
                                    label="CURRENT STOCK"
                                    value={`${product.stock} UNITS`}
                                    icon={Package}
                                />
                                <DetailCard
                                    label="ADDED ON"
                                    value={new Date(product.createdAt).toLocaleDateString('en-GB')}
                                    icon={Calendar}
                                />
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>

            {/* Custom Full Screen Image Viewer Modal */}
            <Modal visible={!!fullScreenImage} transparent animationType="fade">
                <View style={styles.fullScreenOverlay}>
                    <TouchableOpacity
                        style={styles.fullScreenClose}
                        onPress={() => setFullScreenImage(null)}
                    >
                        <X size={32} color="#FFF" />
                    </TouchableOpacity>
                    {fullScreenImage && (
                        <Image
                            source={{ uri: fullScreenImage }}
                            style={styles.fullScreenImage}
                            contentFit="contain"
                        />
                    )}
                </View>
            </Modal>
        </Modal>
    );
}

function DetailCard({ label, value, icon: Icon, fullWidth, highlight, valueColor }: any) {
    return (
        <View style={[styles.detailCard, fullWidth && styles.fullWidthCard]}>
            <View style={styles.cardHeader}>
                <Icon size={10} color="rgba(255,255,255,0.4)" strokeWidth={2} />
                <Text style={styles.cardLabel} numberOfLines={1}>{label}</Text>
            </View>
            <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={[
                    styles.cardValue,
                    highlight && styles.highlightValue,
                    valueColor ? { color: valueColor } : {}
                ]}
            >
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(6, 6, 9, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 500,
        height: '92%',
        borderRadius: 36,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
    },
    atmosphereGlow: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#C5A059',
        opacity: 0.1,
        transform: [{ scale: 2.5 }],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 24,
    },
    headerTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginRight: 10,
    },
    headerIconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1,
    },
    headerSubtitle: {
        fontSize: 7,
        color: 'rgba(197, 160, 89, 0.6)',
        fontWeight: '900',
        letterSpacing: 1,
        marginTop: 2,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 0,
    },
    imageStation: {
        marginBottom: 24,
    },
    mainImageWrapper: {
        width: '100%',
        aspectRatio: 1.4,
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    zoomBtn: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#C5A059',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#C5A059',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    imagePlaceholder: {
        width: '100%',
        aspectRatio: 1.4,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.01)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    thumbnailStation: {
        marginTop: 12,
    },
    miniThumbnail: {
        width: 50,
        height: 50,
        borderRadius: 10,
        marginRight: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    miniThumbnailActive: {
        borderColor: '#C5A059',
    },
    tacticalGrid: {
        gap: 12,
    },
    detailCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    fullWidthCard: {
        width: '100%',
    },
    gridRow: {
        flexDirection: 'row',
        gap: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    cardLabel: {
        fontSize: 7,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: 1.5,
    },
    cardValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFF',
        fontStyle: 'italic',
        textTransform: 'uppercase',
    },
    highlightValue: {
        color: '#C5A059',
    },
    fullScreenOverlay: {
        flex: 1,
        backgroundColor: 'rgba(6, 6, 9, 0.98)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '100%',
        height: '80%',
    },
    fullScreenClose: {
        position: 'absolute',
        top: 60,
        right: 30,
        zIndex: 10,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
