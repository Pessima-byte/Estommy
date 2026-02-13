import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal, useWindowDimensions } from 'react-native';
import { Search, X, Package, Users, ShoppingCart, ChevronRight } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import { searchAPI } from '../api/client';

interface SearchModalProps {
    visible: boolean;
    onClose: () => void;
    onNavigate: (tab: string, id?: string) => void;
}

export default function SearchModal({ visible, onClose, onNavigate }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ products: any[], customers: any[], sales: any[] }>({
        products: [],
        customers: [],
        sales: []
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.length < 2) {
            setResults({ products: [], customers: [], sales: [] });
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchAPI.global(query);
                setResults(data);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSelect = (tab: string, item: any) => {
        onNavigate(tab, item.id);
        onClose();
    };

    const hasResults = results.products.length > 0 || results.customers.length > 0 || results.sales.length > 0;

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.searchBar}>
                            <Search size={20} color={Colors.textMuted} />
                            <TextInput
                                style={styles.input}
                                placeholder="Search products, customers, sales..."
                                placeholderTextColor={Colors.textMuted}
                                value={query}
                                onChangeText={setQuery}
                                autoFocus
                            />
                            {loading ? (
                                <ActivityIndicator size="small" color={Colors.primary} />
                            ) : (
                                query.length > 0 && (
                                    <TouchableOpacity onPress={() => setQuery('')}>
                                        <X size={18} color={Colors.textMuted} />
                                    </TouchableOpacity>
                                )
                            )}
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Text style={styles.closeText}>CANCEL</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Results */}
                    <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
                        {query.length < 2 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>Enter 2 or more characters to search...</Text>
                            </View>
                        ) : !loading && !hasResults ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No matches found for "{query}"</Text>
                            </View>
                        ) : (
                            <>
                                {results.products.length > 0 && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>PRODUCTS</Text>
                                        {results.products.map(p => (
                                            <TouchableOpacity key={p.id} style={styles.item} onPress={() => handleSelect('products', p)}>
                                                <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                                    <Package size={16} color="#3B82F6" />
                                                </View>
                                                <View style={styles.itemInfo}>
                                                    <Text style={styles.itemName}>{p.name}</Text>
                                                    <Text style={styles.itemMeta}>{p.category} • Le {p.price.toLocaleString()}</Text>
                                                </View>
                                                <ChevronRight size={16} color={Colors.textMuted} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {results.customers.length > 0 && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>CUSTOMERS</Text>
                                        {results.customers.map(c => (
                                            <TouchableOpacity key={c.id} style={styles.item} onPress={() => handleSelect('customers', c)}>
                                                <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                                    <Users size={16} color="#10B981" />
                                                </View>
                                                <View style={styles.itemInfo}>
                                                    <Text style={styles.itemName}>{c.name}</Text>
                                                    <Text style={styles.itemMeta}>{c.phone || c.email || 'No contact'}</Text>
                                                </View>
                                                <ChevronRight size={16} color={Colors.textMuted} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {results.sales.length > 0 && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>SALES</Text>
                                        {results.sales.map(s => (
                                            <TouchableOpacity key={s.id} style={styles.item} onPress={() => handleSelect('sales', s)}>
                                                <View style={[styles.iconBox, { backgroundColor: 'rgba(197, 160, 89, 0.1)' }]}>
                                                    <ShoppingCart size={16} color="#C5A059" />
                                                </View>
                                                <View style={styles.itemInfo}>
                                                    <Text style={styles.itemName}>Ref: #{s.id.slice(0, 8).toUpperCase()}</Text>
                                                    <Text style={styles.itemMeta}>{s.product?.name} • Le {s.amount.toLocaleString()}</Text>
                                                </View>
                                                <ChevronRight size={16} color={Colors.textMuted} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-start',
        paddingTop: 60,
    },
    content: {
        flex: 1,
        backgroundColor: '#0F1115',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    searchBar: {
        flex: 1,
        height: 50,
        backgroundColor: '#1A1D23',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    closeBtn: {
        paddingHorizontal: 8,
    },
    closeText: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
    resultsList: {
        flex: 1,
        padding: Spacing.lg,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 10,
        color: Colors.primary,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 16,
        opacity: 0.8,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        color: '#F8FAFC',
        fontWeight: '700',
        marginBottom: 4,
    },
    itemMeta: {
        fontSize: 12,
        color: '#64748B',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#475569',
        fontSize: 14,
        textAlign: 'center',
        fontStyle: 'italic',
    }
});
