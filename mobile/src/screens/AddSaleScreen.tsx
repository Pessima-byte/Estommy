import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions, Modal, KeyboardAvoidingView, Platform, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ArrowRight, ChevronDown, Calendar, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { salesAPI, customersAPI } from '../api/client';
import { useCustomers } from '../hooks/useCustomers';
import { useProducts } from '../hooks/useProducts';
import { Customer, Product } from '../types';
import { useToast } from '../hooks/useToast';
import { Colors } from '../constants/Theme';
import { useSaleBasket } from '../hooks/useSaleBasket';
import SelectionModal from '../components/SelectionModal';
import SaleSuccessModal from '../components/SaleSuccessModal';
import SaleBasketList from '../components/SaleBasketList';

interface AddSaleScreenProps {
    onClose: () => void;
    onSuccess: () => void;
}

import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AddSaleScreen({ onClose, onSuccess }: AddSaleScreenProps) {
    const { showToast } = useToast();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const queryClient = useQueryClient();

    const { customers } = useCustomers();
    const { products } = useProducts();
    const { items, totalAmount, addItem, updateQuantity, removeItem, clearBasket } = useSaleBasket();

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [customerType, setCustomerType] = useState<'existing' | 'new'>('existing');

    const [customerModalVisible, setCustomerModalVisible] = useState(false);
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastSaleData, setLastSaleData] = useState<any>(null);

    const receiptId = useMemo(() => `OME-${Math.random().toString(36).substring(2, 7).toUpperCase()}`, []);

    const mutation = useMutation({
        mutationFn: async (saleParams: any) => {
            let customerId = saleParams.customerId;
            if (saleParams.isNewCustomer) {
                const newCustomer = await customersAPI.create({
                    name: saleParams.customerName,
                    status: 'Active',
                    totalSpent: 0,
                    walletBalance: 0
                });
                customerId = newCustomer.id;
            }

            return Promise.all(saleParams.items.map((item: any) =>
                salesAPI.create({
                    customerId: customerId,
                    productId: item.product.id,
                    date: new Date().toISOString().split('T')[0],
                    amount: item.product.price * item.quantity,
                    quantity: item.quantity,
                    costPriceSnapshot: item.product.costPrice,
                    status: 'Completed'
                })
            ));
        },
        onMutate: async (variables) => {
            // Instant feedback
            setLastSaleData({
                receiptId,
                customer: variables.customerName,
                total: totalAmount,
                items: items.map(i => ({ name: i.product.name, qty: i.quantity, price: i.product.price })),
                date: new Date().toLocaleDateString('en-GB')
            });
            setShowSuccess(true);

            // Optimistically update relevant queries (e.g. Sales list, Stats)
            await queryClient.cancelQueries({ queryKey: ['sales'] });
            await queryClient.cancelQueries({ queryKey: ['stats'] });
        },
        onError: () => {
            showToast('Sales queued for background sync.', 'info');
        },
        onSettled: () => {
            queryClient.invalidateQueries();
        }
    });

    const handleSubmit = async () => {
        if (items.length === 0) {
            showToast('Please select products.', 'error');
            return;
        }

        if (customerType === 'existing' && !selectedCustomer) {
            showToast('Please select a customer.', 'error');
            return;
        }

        if (customerType === 'new' && !newCustomerName.trim()) {
            showToast('Enter customer name.', 'error');
            return;
        }

        mutation.mutate({
            isNewCustomer: customerType === 'new',
            customerName: selectedCustomer?.name || newCustomerName,
            customerId: selectedCustomer?.id || '',
            items: items,
        });
    };

    const loading = mutation.isPending;

    const shareReceipt = async () => {
        if (!lastSaleData) return;

        const text = `
📜 *RECEIPT: ${lastSaleData.receiptId}*
------------------------------
📅 Date: ${lastSaleData.date}
👤 Customer: ${lastSaleData.customer}

🛍️ *Items:*
${lastSaleData.items.map((i: any) => `- ${i.name} (x${i.qty}): Le ${i.price.toLocaleString()}`).join('\n')}

💰 *TOTAL: Le ${lastSaleData.total.toLocaleString()}*
------------------------------
Generated by *ESTOMMY INVENTORY*
        `;

        try {
            if (await Sharing.isAvailableAsync()) {
                Alert.alert('Digital Receipt', text, [
                    { text: 'CLOSE', style: 'cancel' },
                    { text: 'WHATSAPP', onPress: () => Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`) }
                ]);
            }
        } catch (err) {
            showToast('Sharing not available', 'error');
        }
    };

    const filteredCustomers = useMemo(() => customers.filter((c: Customer) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [customers, searchQuery]);

    const filteredProducts = useMemo(() => products.filter((p: Product) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [products, searchQuery]);

    return (
        <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
                <LinearGradient
                    colors={['#18181F', '#0F1115']}
                    style={[styles.container, isTablet ? styles.containerTablet : {}]}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.headerTitle}>RECORD SALE</Text>
                                <View style={styles.headerSubtitleRow}>
                                    <View style={styles.subtitleLine} />
                                    <Text style={styles.headerSubtitle}>NEW TRANSACTION</Text>
                                </View>
                            </View>
                            <View style={styles.receiptTag}>
                                <Text style={styles.receiptLabel}>RECEIPT ID</Text>
                                <Text style={styles.receiptValue}>{receiptId}</Text>
                            </View>
                        </View>

                        <View style={[styles.mainContent, isTablet && styles.mainContentTablet]}>
                            <View style={[styles.amountSection, isTablet && styles.amountSectionTablet]}>
                                <View style={styles.amountCard}>
                                    <Text style={styles.amountLabel}>TOTAL AMOUNT</Text>
                                    <View style={styles.amountInputRow}>
                                        <Text style={styles.currencyPrefix}>LE</Text>
                                        <Text style={styles.amountInput}>{totalAmount.toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalLabel}>TOTAL</Text>
                                        <View style={styles.dot} />
                                    </View>
                                </View>
                            </View>

                            <View style={styles.formSection}>
                                <View style={styles.fieldContainer}>
                                    <View style={styles.labelRow}>
                                        <Text style={styles.label}>CUSTOMER NAME</Text>
                                        <View style={styles.toggleContainer}>
                                            <TouchableOpacity
                                                style={[styles.toggleBtn, customerType === 'existing' && styles.toggleBtnActive]}
                                                onPress={() => setCustomerType('existing')}
                                            >
                                                <Text style={[styles.toggleText, customerType === 'existing' && styles.toggleTextActive]}>EXISTING</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.toggleBtn, customerType === 'new' && styles.toggleBtnActive]}
                                                onPress={() => setCustomerType('new')}
                                            >
                                                <Text style={[styles.toggleText, customerType === 'new' && styles.toggleTextActive]}>NEW</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {customerType === 'existing' ? (
                                        <TouchableOpacity
                                            style={styles.dropdownInput}
                                            onPress={() => setCustomerModalVisible(true)}
                                        >
                                            <Text style={selectedCustomer ? styles.inputText : styles.placeholderText}>
                                                {selectedCustomer?.name || 'Select Customer...'}
                                            </Text>
                                            <ChevronDown size={20} color="rgba(255,255,255,0.3)" />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.dropdownInput}>
                                            <TextInput
                                                style={[styles.inputText, { flex: 1, padding: 0 }]}
                                                placeholder="Enter Customer Name..."
                                                placeholderTextColor="rgba(255,255,255,0.3)"
                                                value={newCustomerName}
                                                onChangeText={setNewCustomerName}
                                            />
                                        </View>
                                    )}
                                </View>

                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>PRODUCTS</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownInput}
                                        onPress={() => setProductModalVisible(true)}
                                    >
                                        <Text style={styles.placeholderText}>Add Product...</Text>
                                        <Plus size={20} color="rgba(255,255,255,0.3)" />
                                    </TouchableOpacity>
                                </View>

                                <SaleBasketList
                                    items={items}
                                    onUpdateQuantity={updateQuantity}
                                    onRemove={removeItem}
                                />
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                                <Text style={styles.cancelText}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
                                {loading ? <ActivityIndicator color="#000" /> : (
                                    <>
                                        <Text style={styles.saveText}>SAVE SALE</Text>
                                        <ArrowRight size={20} color="#000" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </LinearGradient>
            </KeyboardAvoidingView>

            <SelectionModal
                visible={customerModalVisible}
                onClose={() => setCustomerModalVisible(false)}
                title="Select Customer"
                data={filteredCustomers}
                onSelect={(c) => { setSelectedCustomer(c); setCustomerModalVisible(false); }}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                renderItem={(item) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={styles.listItemTitle}>{item.name}</Text>
                            <Text style={styles.listItemSubtitle}>{item.email || 'No email'}</Text>
                        </View>
                        <ArrowRight size={16} color="#64748B" />
                    </View>
                )}
            />

            <SelectionModal
                visible={productModalVisible}
                onClose={() => setProductModalVisible(false)}
                title="Select Product"
                data={filteredProducts}
                onSelect={addItem}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                renderItem={(item) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={styles.listItemTitle}>{item.name}</Text>
                            <Text style={styles.listItemSubtitle}>Stock: {item.stock} • Le {item.price.toLocaleString()}</Text>
                        </View>
                        <ArrowRight size={16} color="#64748B" />
                    </View>
                )}
            />

            <SaleSuccessModal
                visible={showSuccess}
                onClose={() => setShowSuccess(false)}
                onSuccess={onSuccess}
                receiptId={lastSaleData?.receiptId}
                total={lastSaleData?.total}
                onShare={shareReceipt}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
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
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        maxWidth: 900,
        maxHeight: 700,
        alignSelf: 'center',
    },
    scrollContent: {
        padding: 40,
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 48,
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
    receiptTag: {
        alignItems: 'flex-end',
    },
    receiptLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 2,
        marginBottom: 4,
    },
    receiptValue: {
        fontSize: 12,
        fontWeight: '900',
        color: '#C5A059',
        fontStyle: 'italic',
    },
    mainContent: {
        flexDirection: 'column',
        gap: 32,
    },
    mainContentTablet: {
        flexDirection: 'row',
        gap: 40,
        alignItems: 'stretch',
    },
    amountSection: {
        marginBottom: 20,
    },
    amountSectionTablet: {
        width: 280,
        marginBottom: 0,
    },
    amountCard: {
        backgroundColor: '#16161D',
        borderRadius: 24,
        padding: 24,
        height: 220,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    amountLabel: {
        fontSize: 9,
        color: '#C5A059',
        fontWeight: '800',
        letterSpacing: 2,
    },
    amountInputRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    currencyPrefix: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.3)',
        fontWeight: '900',
        fontStyle: 'italic',
    },
    amountInput: {
        fontSize: 48,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#FFF',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 16,
    },
    totalLabel: {
        fontSize: 8,
        color: '#64748B',
        fontWeight: '800',
        letterSpacing: 2,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#C5A059',
    },
    formSection: {
        flex: 1,
        gap: 20,
    },
    fieldContainer: {
        gap: 8,
    },
    label: {
        fontSize: 9,
        color: '#C5A059',
        fontWeight: '800',
        letterSpacing: 2,
    },
    dropdownInput: {
        height: 56,
        backgroundColor: '#1A1A22',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#1E1E26',
        borderRadius: 8,
        padding: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    toggleBtn: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    toggleBtnActive: {
        backgroundColor: '#FFF',
    },
    toggleText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 1,
    },
    toggleTextActive: {
        color: '#000',
    },
    placeholderText: {
        fontSize: 14,
        fontWeight: '700',
        fontStyle: 'italic',
        color: 'rgba(255,255,255,0.3)',
    },
    inputText: {
        fontSize: 14,
        fontWeight: '800',
        fontStyle: 'italic',
        color: '#F8FAFC',
    },
    footer: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 20,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '800',
        letterSpacing: 3,
        fontStyle: 'italic',
    },
    saveBtn: {
        flex: 2,
        backgroundColor: '#FFF',
        height: 60,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    saveText: {
        fontSize: 13,
        color: '#000',
        fontWeight: '900',
        letterSpacing: 4,
        fontStyle: 'italic',
    },
    itemsList: {
        gap: 12,
    },
    itemCard: {
        backgroundColor: '#1E1E26',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 4,
    },
    itemPrice: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
    },
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F1115',
        borderRadius: 8,
        padding: 4,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
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
});
