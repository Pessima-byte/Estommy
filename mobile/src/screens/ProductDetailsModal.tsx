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
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <LinearGradient
                    colors={['#0F1115', '#08090C']}
                    style={[styles.container, isTablet && styles.containerTablet]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleRow}>
                            <Package size={24} color={Colors.primary} />
                            <View>
                                <Text style={styles.headerTitle}>PRODUCT SPECIFICATIONS</Text>
                                <Text style={styles.headerSubtitle}>ASSET UID: {product.id.toUpperCase()}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color="#F8FAFC" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {/* Image Gallery Section */}
                        <View style={styles.gallerySection}>
                            <View style={styles.mainImageWrapper}>
                                {currentImageUrl ? (
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => setFullScreenImage(currentImageUrl)}
                                        style={styles.mainImageBtn}
                                    >
                                        <Image
                                            source={{ uri: currentImageUrl }}
                                            style={styles.mainImage}
                                            contentFit="cover"
                                            transition={300}
                                        />
                                        <View style={styles.zoomBadge}>
                                            <Maximize2 size={16} color="#000" />
                                        </View>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Package size={64} color="rgba(255,255,255,0.05)" />
                                    </View>
                                )}

                                {allImages.length > 1 && (
                                    <View style={styles.galleryControls}>
                                        <TouchableOpacity
                                            style={styles.controlBtn}
                                            onPress={() => setActiveImageIndex(prev => (prev > 0 ? prev - 1 : allImages.length - 1))}
                                        >
                                            <ChevronLeft size={20} color="#FFF" />
                                        </TouchableOpacity>
                                        <Text style={styles.galleryCount}>{activeImageIndex + 1} / {allImages.length}</Text>
                                        <TouchableOpacity
                                            style={styles.controlBtn}
                                            onPress={() => setActiveImageIndex(prev => (prev < allImages.length - 1 ? prev + 1 : 0))}
                                        >
                                            <ChevronRight size={20} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {allImages.length > 1 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailsRow}>
                                    {allImages.map((img, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            onPress={() => setActiveImageIndex(idx)}
                                            style={[styles.thumbnailWrapper, activeImageIndex === idx && styles.thumbnailActive]}
                                        >
                                            <Image
                                                source={{ uri: getImageUrl(img) }}
                                                style={styles.thumbnail}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>

                        {/* Info Section */}
                        <View style={styles.detailsGrid}>
                            <DetailCard
                                label="PRODUCT NAME"
                                value={product.name.toUpperCase()}
                                icon={Package}
                                fullWidth
                            />
                            <DetailCard
                                label="CATEGORY"
                                value={product.category.toUpperCase()}
                                icon={Tag}
                            />
                            <DetailCard
                                label="STOCK STATUS"
                                value={product.status.toUpperCase()}
                                icon={Box}
                                color={product.status === 'In Stock' ? Colors.primary : '#F59E0B'}
                            />
                            <DetailCard
                                label="RETAIL PRICE"
                                value={`LE ${product.price.toLocaleString()}`}
                                icon={Wallet}
                                highlight
                            />
                            <DetailCard
                                label="COST PRICE"
                                value={`LE ${product.costPrice?.toLocaleString() || '0'}`}
                                icon={DollarSignIcon}
                            />
                            <DetailCard
                                label="CURRENT STOCK"
                                value={`${product.stock} UNITS`}
                                icon={WarehouseIcon}
                            />
                            <DetailCard
                                label="ADDED ON"
                                value={new Date(product.createdAt).toLocaleDateString()}
                                icon={Calendar}
                            />
                        </View>
                    </ScrollView>
                </LinearGradient>
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

function DollarSignIcon({ size, color }: any) {
    return <Text style={{ color, fontSize: size, fontWeight: '900' }}>$</Text>;
}

function WarehouseIcon({ size, color }: any) {
    return <Box size={size} color={color} />;
}

function DetailCard({ label, value, icon: Icon, fullWidth, highlight, color }: any) {
    return (
        <View style={[styles.detailCard, fullWidth && styles.fullWidthCard]}>
            <View style={styles.detailHeader}>
                {Icon && <Icon size={12} color={highlight ? Colors.primary : "#475569"} />}
                <Text style={styles.detailLabel}>{label}</Text>
            </View>
            <Text style={[styles.detailValue, highlight && styles.highlightValue, color ? { color } : {}]}>
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        flex: 1,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    containerTablet: {
        maxWidth: 600,
        maxHeight: '90%',
        alignSelf: 'center',
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#F8FAFC',
        letterSpacing: 2,
    },
    headerSubtitle: {
        fontSize: 9,
        color: Colors.primary,
        fontWeight: '700',
        letterSpacing: 1,
        marginTop: 2,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.02)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    scrollContent: {
        padding: 24,
    },
    gallerySection: {
        marginBottom: 32,
    },
    mainImageWrapper: {
        width: '100%',
        aspectRatio: 1.5,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        position: 'relative',
    },
    mainImageBtn: {
        width: '100%',
        height: '100%',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoomBadge: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    galleryControls: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    controlBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    galleryCount: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        overflow: 'hidden',
    },
    thumbnailsRow: {
        marginTop: 16,
    },
    thumbnailWrapper: {
        width: 70,
        height: 70,
        borderRadius: 12,
        marginRight: 10,
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
    },
    thumbnailActive: {
        borderColor: Colors.primary,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    detailCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    fullWidthCard: {
        minWidth: '100%',
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#475569',
        letterSpacing: 1,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '900',
        color: '#F1F5F9',
        fontStyle: 'italic',
    },
    highlightValue: {
        color: Colors.primary,
        fontSize: 18,
    },
    fullScreenOverlay: {
        flex: 1,
        backgroundColor: '#000',
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
        padding: 10,
    }
});
