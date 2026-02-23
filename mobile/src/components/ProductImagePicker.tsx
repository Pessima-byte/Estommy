import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Camera, ImageIcon, Trash2, Box } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Colors } from '../constants/Theme';

interface ProductImagePickerProps {
    image: string;
    images?: string[];
    onPickImage: () => void;
    onRemoveImage?: (uri: string, isPrimary: boolean) => void;
    isTablet?: boolean;
}

const ProductImagePicker = ({ image, images = [], onPickImage, onRemoveImage, isTablet }: ProductImagePickerProps) => {
    const totalCount = images.length + (image ? 1 : 0);

    return (
        <View style={[styles.imageSection, isTablet && styles.imageSectionTablet]}>
            <View style={[styles.imagePlaceholder, isTablet && { width: 210, height: 210, borderRadius: 28 }]}>
                <View style={[styles.technicalFrame, isTablet && { borderRadius: 28 }]}>
                    <View style={[styles.corner, { top: -2, left: -2, borderTopWidth: 2, borderLeftWidth: 2 }, isTablet && { width: 14, height: 14 }]} />
                    <View style={[styles.corner, { top: -2, right: -2, borderTopWidth: 2, borderRightWidth: 2 }, isTablet && { width: 14, height: 14 }]} />
                    <View style={[styles.corner, { bottom: -2, left: -2, borderBottomWidth: 2, borderLeftWidth: 2 }, isTablet && { width: 14, height: 14 }]} />
                    <View style={[styles.corner, { bottom: -2, right: -2, borderBottomWidth: 2, borderRightWidth: 2 }, isTablet && { width: 14, height: 14 }]} />
                </View>

                {image ? (
                    <Image source={{ uri: image }} style={[styles.image, isTablet && { width: 202, height: 202, borderRadius: 24 }]} />
                ) : (
                    <View style={styles.placeholderContainer}>
                        <ImageIcon size={isTablet ? 52 : 32} color="rgba(255,255,255,0.03)" />
                        <Text style={[styles.imagePlaceholderText, isTablet && { fontSize: 9, marginTop: 12 }]}>PRIMARY_CAPTURE</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.cameraBtn, isTablet && { width: 48, height: 48, borderRadius: 14, bottom: -10, right: 14 }]}
                    onPress={onPickImage}
                    activeOpacity={0.8}
                >
                    <Camera size={isTablet ? 22 : 18} color="#000" strokeWidth={2.5} />
                </TouchableOpacity>

                {image ? (
                    <TouchableOpacity
                        style={[styles.deletePrimaryBtn, isTablet && { width: 32, height: 32, borderRadius: 9, top: 10, right: 10 }]}
                        onPress={() => onRemoveImage?.(image, true)}
                    >
                        <Trash2 size={isTablet ? 16 : 14} color="#FFF" />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Additional Images Gallery */}
            {(images.length > 0 || image) && (
                <View style={[styles.galleryWrapper, isTablet && { width: 260, marginTop: 16 }]}>
                    <View style={styles.galleryHeader}>
                        <Text style={[styles.galleryTitle, isTablet && { fontSize: 9 }]}>ANGLE_GALLERY</Text>
                        <View style={styles.countBadge}>
                            <Text style={[styles.countText, isTablet && { fontSize: 11 }]}>{totalCount}/6</Text>
                        </View>
                    </View>
                    <View style={[styles.galleryRow, isTablet && { gap: 10 }]}>
                        {images.map((img, idx) => (
                            <View key={idx} style={styles.thumbnailContainer}>
                                <Image source={{ uri: img }} style={[styles.thumbnail, isTablet && { width: 56, height: 56, borderRadius: 10 }]} />
                                <TouchableOpacity
                                    style={[styles.removeThumbnailBtn, isTablet && { width: 20, height: 20, borderRadius: 5 }]}
                                    onPress={() => onRemoveImage?.(img, false)}
                                >
                                    <Trash2 size={isTablet ? 11 : 10} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {totalCount < 6 && (
                            <TouchableOpacity style={[styles.addThumbnailBtn, isTablet && { width: 56, height: 56, borderRadius: 10 }]} onPress={onPickImage}>
                                <Box size={isTablet ? 18 : 14} color={Colors.primary} opacity={0.3} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            <View style={[styles.hintBox, isTablet && { marginTop: 16 }]}>
                <View style={[styles.hintDot, isTablet && { width: 4, height: 4 }]} />
                <Text style={[styles.imageHint, isTablet && { fontSize: 9 }]}>
                    Full telemetry capture enabled.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    imageSection: {
        alignItems: 'center',
        paddingVertical: 5,
    },
    imageSectionTablet: {
        width: 280,
    },
    imagePlaceholder: {
        width: 140,
        height: 140,
        backgroundColor: 'rgba(255,255,255,0.01)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        position: 'relative',
    },
    technicalFrame: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    corner: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderColor: Colors.primary,
        opacity: 0.2,
    },
    image: {
        width: 136,
        height: 136,
        borderRadius: 18,
    },
    placeholderContainer: {
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: 7,
        color: 'rgba(255,255,255,0.15)',
        fontWeight: '900',
        fontStyle: 'italic',
        marginTop: 10,
        letterSpacing: 2,
    },
    cameraBtn: {
        position: 'absolute',
        bottom: -8,
        right: 12,
        backgroundColor: '#FFF',
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#FFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    deletePrimaryBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    galleryWrapper: {
        width: 220,
        marginTop: 5,
    },
    galleryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 2,
    },
    galleryTitle: {
        fontSize: 7,
        color: Colors.primary,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 1.5,
    },
    countBadge: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    countText: {
        fontSize: 9,
        color: Colors.primary,
        fontWeight: '900',
    },
    galleryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'flex-start',
    },
    thumbnailContainer: {
        position: 'relative',
    },
    thumbnail: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    removeThumbnailBtn: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        width: 16,
        height: 16,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#0F1115',
    },
    addThumbnailBtn: {
        width: 48,
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255,255,255,0.01)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hintBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
    },
    hintDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: Colors.primary,
        opacity: 0.3,
    },
    imageHint: {
        fontSize: 7,
        color: 'rgba(255,255,255,0.2)',
        fontWeight: '800',
        fontStyle: 'italic',
        letterSpacing: 0.5,
    },
});

export default ProductImagePicker;
