import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Camera, ImageIcon } from 'lucide-react-native';
import { Image } from 'expo-image';

interface ProductImagePickerProps {
    image: string;
    onPickImage: () => void;
    isTablet?: boolean;
}

const ProductImagePicker = ({ image, onPickImage, isTablet }: ProductImagePickerProps) => {
    return (
        <View style={[styles.imageSection, isTablet && styles.imageSectionTablet]}>
            <View style={styles.imagePlaceholder}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.image} />
                ) : (
                    <View style={styles.placeholderContainer}>
                        <ImageIcon size={32} color="rgba(255,255,255,0.1)" />
                        <Text style={styles.imagePlaceholderText}>PRODUCT IMAGE</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.cameraBtn} onPress={onPickImage}>
                    <Camera size={20} color="#000" />
                </TouchableOpacity>
            </View>
            <Text style={styles.imageHint}>
                Recommended: Square photo.
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
        width: 180,
        height: 180,
        borderRadius: 32,
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
    imageHint: {
        textAlign: 'center',
        fontSize: 9,
        color: '#64748B',
        fontWeight: '700',
        lineHeight: 16,
        letterSpacing: 1,
    },
});

export default ProductImagePicker;
