import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Modal, FlatList, useWindowDimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Search, ArrowRight, Check, Plus, Database, ChevronLeft } from 'lucide-react-native';
import { Colors } from '../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';

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
            <View style={{ flex: 1 }}>
                <Text style={styles.listItemTitle}>{item.name || item.title || item.label || String(item)}</Text>
                {item.subtitle && <Text style={styles.listItemSubtitle}>{item.subtitle.toUpperCase()}</Text>}
            </View>
            <View style={styles.itemAction}>
                <ArrowRight size={14} color="#C5A059" strokeWidth={3} />
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={[styles.modalContent, { height: height * 0.8, width: Math.min(width * 0.9, 500) }]}>
                        <LinearGradient
                            colors={['#060609', '#0F172A', '#060608']}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.atmosphereGlow} pointerEvents="none" />

                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                                <ChevronLeft size={22} color="#C5A059" strokeWidth={3} />
                            </TouchableOpacity>
                            <View style={styles.headerTitleGroup}>
                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                    <Text
                                        style={[styles.modalTitle, { textAlign: 'right' }]}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        minimumFontScale={0.8}
                                    >
                                        {title.toUpperCase()}
                                    </Text>
                                    <Text style={styles.modalSubtitle}>CORE_LOGIC_ENGINE // v2.4.0</Text>
                                </View>
                                <View style={styles.headerIconBox}>
                                    <Database size={18} color="#C5A059" strokeWidth={2.5} />
                                </View>
                            </View>
                        </View>

                        <View style={styles.searchContainer}>
                            <View style={styles.searchBox}>
                                <Search size={16} color="#C5A059" strokeWidth={2.5} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search Registry..."
                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                    value={searchQuery}
                                    onChangeText={onSearchChange}
                                    selectionColor="#C5A059"
                                />
                            </View>
                        </View>

                        {onCreateNew && searchQuery.trim().length > 0 && !data.some(d => (d.name || d).toLowerCase() === searchQuery.toLowerCase()) && (
                            <TouchableOpacity style={styles.createNewBtn} onPress={onCreateNew} activeOpacity={0.8}>
                                <View style={styles.createNewIcon}>
                                    <Plus size={16} color="#000" strokeWidth={3} />
                                </View>
                                <View>
                                    <Text style={styles.createNewTitle}>INITIALIZE NEW ENTRY</Text>
                                    <Text style={styles.createNewText}>{createNewText || `Sync "${searchQuery}" to Cloud`}</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        <FlatList
                            data={data}
                            keyExtractor={keyExtractor || ((item) => item.id || item.name || String(item))}
                            contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 100 }}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.listItem}
                                    onPress={() => {
                                        onSelect(item);
                                        onSearchChange('');
                                    }}
                                    activeOpacity={0.7}
                                >
                                    {renderItem ? renderItem(item) : defaultRenderItem(item)}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Database size={40} color="rgba(197, 160, 89, 0.05)" />
                                    <Text style={styles.emptyText}>Empty Registry: No data found.</Text>
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
        backgroundColor: 'rgba(6, 6, 9, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
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
        opacity: 0.08,
        transform: [{ scale: 2.5 }],
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 28,
    },
    headerTitleGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 14,
        marginLeft: 10,
    },
    headerIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1.5,
    },
    modalSubtitle: {
        fontSize: 7,
        fontWeight: '900',
        color: 'rgba(197, 160, 89, 0.6)',
        letterSpacing: 1,
        marginTop: 2,
        textAlign: 'right',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        gap: 10,
    },
    searchInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
        fontStyle: 'italic',
    },
    listItem: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    defaultItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    listItemTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFF',
        fontStyle: 'italic',
        textTransform: 'uppercase',
    },
    listItemSubtitle: {
        fontSize: 8,
        fontWeight: '900',
        color: 'rgba(197, 160, 89, 0.6)',
        letterSpacing: 1.5,
        marginTop: 4,
    },
    itemAction: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(197, 160, 89, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    createNewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(197, 160, 89, 0.05)',
        marginHorizontal: 20,
        marginVertical: 10,
        borderRadius: 18,
        gap: 14,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.2)',
    },
    createNewIcon: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: '#C5A059',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#C5A059',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    createNewTitle: {
        fontSize: 8,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 2,
    },
    createNewText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        fontStyle: 'italic',
        marginTop: 2,
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
        gap: 16,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 12,
        fontWeight: '800',
        fontStyle: 'italic',
        letterSpacing: 0.5,
    }
});

export default SelectionModal;
