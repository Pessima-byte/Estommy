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
            >
                <View style={[styles.modalContent, isTablet && { width: 880, height: 620 }]}>
                    <LinearGradient
                        colors={['#060609', '#0F172A', '#060608']}
                        style={styles.container}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    {/* Atmosphere Layer */}
                    <View style={styles.atmosphereGlow} pointerEvents="none" />
                    <View style={[styles.atmosphereGlow, { top: '40%', left: -100, opacity: 0.03, backgroundColor: '#00D9FF' }]} pointerEvents="none" />

                    <ScrollView
                        contentContainerStyle={[styles.scrollContent, isTablet && { padding: 32 }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        scrollEnabled={false}
                    >
                        <View style={[styles.header, isTablet && { marginBottom: 30 }]}>
                            <View style={{ flex: 1, paddingRight: 24 }}>
                                <Text style={[styles.headerTitle, isTablet && { fontSize: 20 }]} numberOfLines={1}>
                                    {isEditing ? 'EDIT PRODUCT REGISTRY' : 'NEW PRODUCT ENTRY'}
                                </Text>
                                <View style={styles.headerSubtitleRow}>
                                    <View style={[styles.subtitleLine, isTablet && { width: 40, height: 3 }]} />
                                    <Text style={[styles.headerSubtitle, isTablet && { fontSize: 12 }]} numberOfLines={1}>
                                        {isEditing ? 'UPDATING_TELEMETRY' : 'INITIALIZING_CORE_DATA'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.typeTag}>
                                <Text style={[styles.typeLabel, isTablet && { fontSize: 10 }]}>IDENT_CORE</Text>
                                <Text style={[styles.typeValue, isTablet && { fontSize: 14 }]}>{initialProduct?.id.slice(0, 8).toUpperCase() || 'NEW_ASSET'}</Text>
                            </View>
                        </View>

                        <View style={[styles.mainBody, isTablet && styles.mainBodyTablet]}>
                            <View style={styles.leftCol}>
                                <ProductImagePicker
                                    image={image}
                                    images={images}
                                    onPickImage={pickImage}
                                    onRemoveImage={handleRemoveImage}
                                    isTablet={isTablet}
                                />
                            </View>

                            <View style={styles.rightCol}>
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

                                <View style={[styles.buttonRow, isTablet && { marginTop: 30, gap: 20 }]}>
                                    <TouchableOpacity
                                        style={[styles.abortBtn, isTablet && { height: 56, paddingHorizontal: 32 }]}
                                        onPress={onClose}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.abortText, isTablet && { fontSize: 14 }]}>CANCEL</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.saveBtn, loading && { opacity: 0.7 }, isTablet && { height: 56 }]}
                                        onPress={handleSubmit}
                                        disabled={loading}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.btnContent}>
                                            <Text style={[styles.saveBtnText, isTablet && { fontSize: 16 }]}>{isEditing ? 'SYNC_CHANGES' : 'SAVE_PRODUCT'}</Text>
                                            <ArrowRight size={isTablet ? 20 : 16} color="#000" strokeWidth={3} />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>

            <SelectionModal
                visible={categoryModalVisible}
                onClose={() => setCategoryModalVisible(false)}
                title="Classification Logic"
                data={filteredCategories}
                onSelect={(c) => { setCategory(c.name); setCategoryModalVisible(false); }}
                searchQuery={categorySearchQuery}
                onSearchChange={setCategorySearchQuery}
                onCreateNew={handleCreateCategory}
                createNewText={`Create "${categorySearchQuery}"`}
                renderItem={(item) => (
                    <View style={styles.categoryItem}>
                        <Text style={styles.categoryText}>{item.name}</Text>
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
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '92%',
        maxHeight: '94%',
        backgroundColor: '#0F1115',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
        elevation: 20,
    },
    container: {
        ...StyleSheet.absoluteFillObject,
    },
    atmosphereGlow: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: Colors.primary,
        opacity: 0.1,
        transform: [{ scale: 2.5 }],
    },
    scrollContent: {
        padding: 16,
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 13,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#FFF',
        letterSpacing: 0,
        marginBottom: 2,
    },
    headerSubtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    subtitleLine: {
        width: 20,
        height: 2,
        backgroundColor: Colors.primary,
    },
    headerSubtitle: {
        fontSize: 8,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 1.5,
    },
    typeTag: {
        alignItems: 'flex-end',
    },
    typeLabel: {
        fontSize: 6,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: 1,
        marginBottom: 2,
    },
    typeValue: {
        fontSize: 8,
        fontWeight: '900',
        color: Colors.primary,
        fontStyle: 'italic',
        letterSpacing: 0,
    },
    mainBody: {
        gap: 12,
    },
    mainBodyTablet: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 24,
    },
    leftCol: {
        flex: 1,
    },
    rightCol: {
        flex: 1.4,
        gap: 16,
    },
    buttonRow: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    abortBtn: {
        height: 48,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    abortText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '900',
        letterSpacing: 1,
    },
    saveBtn: {
        flex: 1,
        height: 48,
        backgroundColor: '#FFF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    saveBtnText: {
        fontSize: 12,
        color: '#000',
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    categoryText: {
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '700',
    },
});
