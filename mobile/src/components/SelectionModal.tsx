import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Modal, FlatList, useWindowDimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Search, ArrowRight, Check, Plus } from 'lucide-react-native';
import { Colors } from '../constants/Theme';

interface SelectionModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    data: any[];
    onSelect: (item: any) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    renderItem?: (item: any) => React.ReactElement;
    onCreateNew?: () => void;
    createNewText?: string;
    keyExtractor?: (item: any) => string;
}

const SelectionModal = ({
    visible,
    onClose,
    title,
    data,
    onSelect,
    searchQuery,
    onSearchChange,
    renderItem,
    onCreateNew,
    createNewText,
    keyExtractor
}: SelectionModalProps) => {
    const { width, height } = useWindowDimensions();

    const defaultRenderItem = (item: any) => (
        <View style={styles.defaultItemContent}>
            <View>
                <Text style={styles.listItemTitle}>{item.name || item.title || item.label || String(item)}</Text>
                {item.subtitle && <Text style={styles.listItemSubtitle}>{item.subtitle}</Text>}
            </View>
            <ArrowRight size={16} color="#64748B" />
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={[styles.modalContent, { height: height * 0.8, width: Math.min(width * 0.9, 600) }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{title}</Text>
                            <TouchableOpacity onPress={onClose}>
                                <X size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchBox}>
                            <Search size={20} color="#64748B" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search..."
                                placeholderTextColor="#64748B"
                                value={searchQuery}
                                onChangeText={onSearchChange}
                                autoFocus
                            />
                        </View>

                        {onCreateNew && searchQuery.trim().length > 0 && !data.some(d => (d.name || d).toLowerCase() === searchQuery.toLowerCase()) && (
                            <TouchableOpacity style={styles.createNewBtn} onPress={onCreateNew}>
                                <View style={styles.createNewIcon}>
                                    <Plus size={16} color="#000" />
                                </View>
                                <Text style={styles.createNewText}>{createNewText || `Create "${searchQuery}"`}</Text>
                            </TouchableOpacity>
                        )}

                        <FlatList
                            data={data}
                            keyExtractor={keyExtractor || ((item) => item.id || item.name || String(item))}
                            contentContainerStyle={{ padding: 20, gap: 10 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.listItem}
                                    onPress={() => {
                                        onSelect(item);
                                        onSearchChange('');
                                    }}
                                >
                                    {renderItem ? renderItem(item) : defaultRenderItem(item)}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No results found.</Text>
                                </View>
                            }
                        />
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        backgroundColor: '#16161D',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFF',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        height: 64,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        gap: 12,
    },
    searchInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 14,
    },
    listItem: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    defaultItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    listItemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 4,
    },
    listItemSubtitle: {
        fontSize: 12,
        color: '#64748B',
    },
    createNewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    createNewIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createNewText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '800',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#64748B',
        fontSize: 14,
        fontStyle: 'italic',
    }
});

export default SelectionModal;
