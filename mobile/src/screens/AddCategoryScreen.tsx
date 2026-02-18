import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, useWindowDimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { categoriesAPI } from '../api/client';
import { useToast } from '../hooks/useToast';

interface AddCategoryScreenProps {
    onClose: () => void;
    onSuccess: () => void;
    initialCategory?: any | null;
}

import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AddCategoryScreen({ onClose, onSuccess, initialCategory }: AddCategoryScreenProps) {
    const { showToast } = useToast();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const queryClient = useQueryClient();

    const [name, setName] = useState(initialCategory?.name || '');
    const [description, setDescription] = useState(initialCategory?.description || '');

    const isEditing = !!initialCategory;

    const mutation = useMutation({
        mutationFn: async (payload: any) => {
            if (isEditing) {
                return categoriesAPI.update(initialCategory.id, payload);
            } else {
                return categoriesAPI.create(payload);
            }
        },
        // Optimistic Update
        onMutate: async (newCategory) => {
            await queryClient.cancelQueries({ queryKey: ['categories'] });
            const previousCategories = queryClient.getQueryData(['categories']);

            queryClient.setQueryData(['categories'], (old: any[] = []) => {
                if (isEditing) {
                    return old.map(c => c.id === initialCategory.id ? { ...c, ...newCategory } : c);
                }
                return [...old, { id: 'temp-' + Date.now(), ...newCategory }];
            });

            return { previousCategories };
        },
        onError: (err, newCategory, context: any) => {
            queryClient.setQueryData(['categories'], context.previousCategories);
            showToast('Sync failed. We will retry when online.', 'info');
            onSuccess();
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
        onSuccess: () => {
            showToast(isEditing ? 'Update synced' : 'Category synced', 'success');
            onSuccess();
        }
    });

    const handleSubmit = async () => {
        if (!name) {
            showToast('Please enter a name.', 'error');
            return;
        }

        const payload = {
            name,
            description: description || null,
        };

        mutation.mutate(payload);

        // Close modal immediately for "Instant" feel
        if (!mutation.isError) {
            onSuccess();
        }
    };

    const loading = mutation.isPending;

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
                        {/* Header */}
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.headerTitle}>{isEditing ? 'EDIT CATEGORY' : 'NEW CATEGORY'}</Text>
                                <View style={styles.headerSubtitleRow}>
                                    <View style={styles.subtitleLine} />
                                    <Text style={styles.headerSubtitle}>
                                        {isEditing ? 'UPDATE SYSTEM MAPPING' : 'ADD TO YOUR INVENTORY'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={24} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.form}>
                            {/* Category Name */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>CATEGORY NAME</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. ELECTRONICS"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        value={name}
                                        onChangeText={setName}
                                        autoCapitalize="characters"
                                    />
                                </View>
                            </View>

                            {/* Description */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>DESCRIPTION</Text>
                                <View style={[styles.inputWrapper, styles.textArea]}>
                                    <TextInput
                                        style={[styles.input, { height: '100%', textAlignVertical: 'top', paddingVertical: 16 }]}
                                        placeholder="What kind of items belong here?"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        value={description}
                                        onChangeText={setDescription}
                                        multiline
                                        numberOfLines={4}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                                <Text style={styles.cancelText}>CANCEL</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <>
                                        <Text style={styles.saveText}>{isEditing ? 'SAVE CHANGES' : 'SAVE CATEGORY'}</Text>
                                        <ArrowRight size={20} color="#000" strokeWidth={2.5} />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </LinearGradient>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
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
        maxHeight: 650,
        maxWidth: 600,
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
        backgroundColor: '#C5A059',
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#C5A059',
        letterSpacing: 3,
    },
    closeBtn: {
        padding: 4,
    },
    form: {
        gap: 24,
    },
    fieldContainer: {
        gap: 8,
    },
    label: {
        fontSize: 10,
        color: '#C5A059',
        fontWeight: '800',
        letterSpacing: 2,
    },
    inputWrapper: {
        height: 56,
        backgroundColor: '#1A1A22',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    textArea: {
        height: 120,
    },
    input: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '600',
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 20,
        marginTop: 32,
    },
    cancelBtn: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cancelText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '800',
        letterSpacing: 2,
        fontStyle: 'italic',
    },
    saveBtn: {
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
    saveText: {
        fontSize: 14,
        color: '#000',
        fontWeight: '900',
        letterSpacing: 3,
        fontStyle: 'italic',
    },
});
