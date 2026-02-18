import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, useWindowDimensions, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { X, ImageIcon, Camera, ArrowRight, ChevronDown, Check } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import { productsAPI, filesAPI, categoriesAPI } from '../api/client';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useCategories } from '../hooks/useCategories';
import { useToast } from '../hooks/useToast';
import { Product } from '../types';
import SelectionModal from '../components/SelectionModal';

import ProductImagePicker from '../components/ProductImagePicker';
import ProductFormFields from '../components/ProductFormFields';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AddProductScreenProps {
    onClose: () => void;
    onSuccess: () => void;
    initialProduct?: Product | null;
}

export default function AddProductScreen({ onClose, onSuccess, initialProduct }: AddProductScreenProps) {
    const { showToast } = useToast();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const queryClient = useQueryClient();

    const [name, setName] = useState(initialProduct?.name || '');
    const [category, setCategory] = useState(initialProduct?.category || '');
    const [costPrice, setCostPrice] = useState(initialProduct?.costPrice?.toString() || '');
    const [price, setPrice] = useState(initialProduct?.price?.toString() || '');
    const [stock, setStock] = useState(initialProduct?.stock?.toString() || '');
    const [image, setImage] = useState(initialProduct?.image || '');
    const [images, setImages] = useState<string[]>(initialProduct?.images || []);

    // Category Selection Logic
    const { categories, refetch: refetchCategories } = useCategories();
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [categorySearchQuery, setCategorySearchQuery] = useState('');

    const filteredCategories = categories.filter((c: any) =>
        c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
    );

    const handleCreateCategory = async () => {
        if (!categorySearchQuery.trim()) return;

        try {
            const existing = categories.find((c: any) => c.name.toLowerCase() === categorySearchQuery.toLowerCase());
            if (existing) {
                setCategory(existing.name);
                setCategoryModalVisible(false);
                return;
            }

            const newCategory = await categoriesAPI.create({ name: categorySearchQuery });
            await refetchCategories();
            setCategory(newCategory.name);
            setCategoryModalVisible(false);
            setCategorySearchQuery('');
        } catch (error) {
            console.error('Failed to create category', error);
            setCategory(categorySearchQuery);
            setCategoryModalVisible(false);
        }
    };

    const isEditing = !!initialProduct;

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
            allowsMultipleSelection: true,
            selectionLimit: 5
        });

        if (!result.canceled) {
            const newUris = result.assets.map(a => a.uri);
            if (newUris.length > 0) {
                if (!image) {
                    setImage(newUris[0]);
                    setImages(prev => [...prev, ...newUris.slice(1)]);
                } else {
                    setImages(prev => [...prev, ...newUris]);
                }
            }
        }
    };

    const mutation = useMutation({
        mutationFn: async (rawData: any) => {
            // Perform image uploads inside the mutation so they retry on reconnect
            let finalImage = rawData.image;
            if (rawData.image && (rawData.image.startsWith('file:') || rawData.image.startsWith('content:'))) {
                try {
                    const res = await filesAPI.upload(rawData.image);
                    finalImage = res.url;
                } catch (e) {
                    // Rethrow so the mutation retries later if onlineManager permits
                    throw e;
                }
            }

            const finalImages = [];
            for (const img of rawData.images || []) {
                if (img.startsWith('file:') || img.startsWith('content:')) {
                    try {
                        const res = await filesAPI.upload(img);
                        finalImages.push(res.url);
                    } catch (e) {
                        throw e;
                    }
                } else {
                    finalImages.push(img);
                }
            }

            const payload = {
                ...rawData,
                image: finalImage,
                images: finalImages
            };

            if (isEditing && initialProduct) {
                return productsAPI.update(initialProduct.id, payload);
            } else {
                return productsAPI.create(payload);
            }
        },
        onMutate: async (newProduct) => {
            await queryClient.cancelQueries({ queryKey: ['products'] });
            const previousProducts = queryClient.getQueryData(['products']);

            queryClient.setQueryData(['products'], (old: any[] = []) => {
                if (isEditing && initialProduct) {
                    return old.map(p => p.id === initialProduct.id ? { ...p, ...newProduct } : p);
                }
                const tempProduct = { id: 'temp-' + Date.now(), ...newProduct };
                return [tempProduct, ...(Array.isArray(old) ? old : [])];
            });

            return { previousProducts };
        },
        onError: (err, newProduct, context: any) => {
            queryClient.setQueryData(['products'], context.previousProducts);
            showToast('Sync queued for later.', 'info');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    });

    const handleSubmit = async () => {
        if (!name || !price || !stock) {
            showToast('All fields are required.', 'error');
            return;
        }

        const rawData = {
            name,
            category,
            price: parseFloat(price),
            costPrice: parseFloat(costPrice || '0'),
            stock: parseInt(stock),
            image, // Local uri (will be uploaded during mutation)
            images, // Local uris
            status: parseInt(stock) > 0 ? 'In Stock' : 'Out of Stock'
        };

        mutation.mutate(rawData);
        onSuccess();
    };

    const loading = mutation.isPending;

    const handleRemoveImage = (uri: string, isPrimary: boolean) => {
        if (isPrimary) {
            setImage('');
        } else {
            setImages(prev => prev.filter(img => img !== uri));
        }
    };

    return (
        <View style={styles.overlay}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ width: '100%', alignItems: 'center' }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            >
                <LinearGradient
                    colors={['#18181F', '#0F1115']}
                    style={[styles.container, isTablet ? styles.containerTablet : {}]}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.headerTitle}>{isEditing ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</Text>
                                <View style={styles.headerSubtitleRow}>
                                    <View style={styles.subtitleLine} />
                                    <Text style={styles.headerSubtitle}>{isEditing ? 'UPDATE PRODUCT INFO' : 'ADD NEW ITEM'}</Text>
                                </View>
                            </View>
                            <View style={styles.assetClassTag}>
                                <Text style={styles.assetClassLabel}>PRODUCT ID</Text>
                                <Text style={styles.assetClassValue}>{initialProduct?.id.slice(0, 8).toUpperCase() || 'NEW'}</Text>
                            </View>
                        </View>

                        <View style={[styles.mainContent, isTablet && styles.mainContentTablet]}>
                            <ProductImagePicker
                                image={image}
                                images={images}
                                onPickImage={pickImage}
                                onRemoveImage={handleRemoveImage}
                                isTablet={isTablet}
                            />

                            <ProductFormFields
                                name={name}
                                setName={setName}
                                category={category}
                                onCategoryPress={() => setCategoryModalVisible(true)}
                                costPrice={costPrice}
                                setCostPrice={setCostPrice}
                                price={price}
                                setPrice={setPrice}
                                stock={stock}
                                setStock={setStock}
                            />
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.abortBtn} onPress={onClose}>
                                <Text style={styles.abortText}>CANCEL</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.provisionBtn}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <>
                                        <Text style={styles.provisionText}>{isEditing ? 'SAVE CHANGES' : 'SAVE PRODUCT'}</Text>
                                        <ArrowRight size={20} color="#000" strokeWidth={2.5} />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </LinearGradient>
            </KeyboardAvoidingView>

            <SelectionModal
                visible={categoryModalVisible}
                onClose={() => setCategoryModalVisible(false)}
                title="Select Category"
                data={filteredCategories}
                onSelect={(c) => { setCategory(c.name); setCategoryModalVisible(false); }}
                searchQuery={categorySearchQuery}
                onSearchChange={setCategorySearchQuery}
                onCreateNew={handleCreateCategory}
                createNewText={`Create "${categorySearchQuery}"`}
                renderItem={(item) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
                        {category === item.name && <Check size={16} color={Colors.primary} />}
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        backgroundColor: '#0F1115',
    },
    containerTablet: {
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
        overflow: 'hidden',
        maxWidth: 900,
        maxHeight: 650,
        alignSelf: 'center',
    },
    scrollContent: {
        padding: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#F8FAFC',
        letterSpacing: -1,
        marginBottom: 8,
    },
    headerSubtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    subtitleLine: {
        width: 24,
        height: 2,
        backgroundColor: Colors.primary,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 3,
    },
    assetClassTag: {
        alignItems: 'flex-end',
    },
    assetClassLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 2,
        marginBottom: 4,
    },
    assetClassValue: {
        fontSize: 12,
        fontWeight: '900',
        color: Colors.primary,
        fontStyle: 'italic',
    },
    mainContent: {
        flexDirection: 'column',
        gap: 24,
    },
    mainContentTablet: {
        flexDirection: 'row',
        gap: 48,
    },
    footer: {
        marginTop: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 20,
    },
    abortBtn: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    abortText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '800',
        letterSpacing: 2,
        fontStyle: 'italic',
    },
    provisionBtn: {
        flex: 1,
        backgroundColor: '#FFF',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: "#FFF",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    provisionText: {
        fontSize: 14,
        color: '#000',
        fontWeight: '900',
        letterSpacing: 3,
        fontStyle: 'italic',
    },
});
