import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Camera, ImageIcon, Trash2, Box } from 'lucide-react-native';
import { Image } from 'expo-image';

interface ProductImagePickerProps {
    image: string;
    images?: string[];
    onPickImage: () => void;
    onRemoveImage?: (uri: string, isPrimary: boolean) => void;
    isTablet?: boolean;
}

const ProductImagePicker = ({ image, images = [], onPickImage, onRemoveImage, isTablet }: ProductImagePickerProps) => {
    return (
        <View style={[styles.imageSection, isTablet && styles.imageSectionTablet]}>
            <View style={styles.imagePlaceholder}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.image} />
                ) : (
                    <View style={styles.placeholderContainer}>
                        <ImageIcon size={32} color="rgba(255,255,255,0.1)" />
                        <Text style={styles.imagePlaceholderText}>PRIMARY IMAGE</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.cameraBtn} onPress={onPickImage}>
                    <Camera size={20} color="#000" />
                </TouchableOpacity>

                {image ? (
                    <TouchableOpacity
                        style={styles.deletePrimaryBtn}
                        onPress={() => onRemoveImage?.(image, true)}
                    >
                        <Trash2 size={16} color="#FFF" />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Additional Images Gallery */}
            {(images.length > 0 || image) && (
                <View style={styles.galleryWrapper}>
                    <Text style={styles.galleryTitle}>GALLERY ({images.length + (image ? 1 : 0)}/6)</Text>
                    <View style={styles.galleryRow}>
                        {images.map((img, idx) => (
                            <View key={idx} style={styles.thumbnailContainer}>
                                <Image source={{ uri: img }} style={styles.thumbnail} />
                                <TouchableOpacity
                                    style={styles.removeThumbnailBtn}
                                    onPress={() => onRemoveImage?.(img, false)}
                                >
                                    <Trash2 size={12} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {(images.length + (image ? 1 : 0)) < 6 && (
                            <TouchableOpacity style={styles.addThumbnailBtn} onPress={onPickImage}>
                                <Box size={16} color="rgba(255,255,255,0.2)" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            <Text style={styles.imageHint}>
                Capture up to 6 high-quality angles.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    imageSection: {
        alignItems: 'center',
    },
    imageSectionTablet: {
        width: 280,
    },
    imagePlaceholder: {
        width: 180,
        height: 180,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 32,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        position: 'relative',
    },
    image: {
        width: 176,
        height: 176,
        borderRadius: 30,
    },
    placeholderContainer: {
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.2)',
        fontWeight: '800',
        marginTop: 12,
        fontStyle: 'italic',
        letterSpacing: 1,
    },
    cameraBtn: {
        position: 'absolute',
        bottom: -10,
        right: -10,
        backgroundColor: '#FFF',
        width: 44,
        height: 44,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    deletePrimaryBtn: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: '#EF4444',
        width: 32,
        height: 32,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#0F1115',
    },
    imageHint: {
        textAlign: 'center',
        fontSize: 9,
        color: '#64748B',
        fontWeight: '700',
        lineHeight: 16,
        letterSpacing: 1,
        marginTop: 12,
    },
    galleryWrapper: {
        width: 250,
        marginTop: 10,
    },
    galleryTitle: {
        fontSize: 8,
        color: 'rgba(255,255,255,0.3)',
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 8,
    },
    galleryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    thumbnailContainer: {
        position: 'relative',
    },
    thumbnail: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    removeThumbnailBtn: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        width: 18,
        height: 18,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#0F1115',
    },
    addThumbnailBtn: {
        width: 48,
        height: 48,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255,255,255,0.01)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ProductImagePicker;
