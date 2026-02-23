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
    const [manualAmount, setManualAmount] = useState('');
    const [lastSaleData, setLastSaleData] = useState<any>(null);

    const receiptId = useMemo(() => `OME-${Math.random().toString(36).substring(2, 7).toUpperCase()}`, []);

    // Sync manual amount with basket total when items change
    React.useEffect(() => {
        if (items.length > 0) {
            setManualAmount(totalAmount.toString());
        }
    }, [items, totalAmount]);

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
                    productId: item.product.id || 'manual',
                    date: new Date().toISOString().split('T')[0],
                    amount: item.amount || (item.product.price * item.quantity),
                    quantity: item.quantity,
                    costPriceSnapshot: item.product.costPrice,
                    status: 'Completed'
                })
            ));
        },
        onMutate: async (variables) => {
            // Instant feedback
            const finalTotal = items.length > 0 ? totalAmount : parseFloat(manualAmount || '0');
            setLastSaleData({
                receiptId,
                customer: variables.customerName,
                total: finalTotal,
                items: items.length > 0
                    ? items.map(i => ({ name: i.product.name, qty: i.quantity, price: i.product.price }))
                    : [{ name: 'Custom Sale Item', qty: 1, price: finalTotal }],
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
        if (items.length === 0 && !manualAmount.trim()) {
            showToast('Please select products or enter an amount.', 'error');
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

        const finalAmount = parseFloat(manualAmount) || 0;
        let finalItems: any[] = items;

        // If amount is overridden, distribute proportionally
        if (items.length > 0 && finalAmount !== totalAmount) {
            const ratio = finalAmount / totalAmount;
            finalItems = items.map(item => ({
                ...item,
                amount: (item.product.price * item.quantity) * ratio
            }));
        } else if (items.length === 0) {
            finalItems = [{
                product: { id: 'manual', name: 'Manual Entry', price: finalAmount, stock: 99999, costPrice: 0 } as any,
                quantity: 1,
                amount: finalAmount
            }];
        }

        mutation.mutate({
            isNewCustomer: customerType === 'new',
            customerName: selectedCustomer?.name || newCustomerName,
            customerId: selectedCustomer?.id || '',
            items: finalItems,
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
                <View style={[styles.modalContent, isTablet && { width: 820, height: 500 }]}>
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
                        contentContainerStyle={[
                            styles.scrollContent,
                            isTablet && { padding: 32, flexGrow: 1, justifyContent: 'space-between' }
                        ]}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={[styles.header, isTablet && { marginBottom: 24 }]}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text
                                    style={[styles.headerTitle, isTablet && { fontSize: 22 }]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.8}
                                >
                                    RECORD SALE
                                </Text>
                                <View style={styles.headerSubtitleRow}>
                                    <View style={[styles.subtitleLine, isTablet && { width: 32, height: 2 }]} />
                                    <Text style={[styles.headerSubtitle, isTablet && { fontSize: 10 }]}>NEW TRANSACTION</Text>
                                </View>
                            </View>
                            <View style={styles.receiptTag}>
                                <Text style={[styles.receiptLabel, isTablet && { fontSize: 9 }]}>RECEIPT ID</Text>
                                <Text style={[styles.receiptValue, isTablet && { fontSize: 13 }]}>{receiptId}</Text>
                            </View>
                        </View>

                        <View style={[styles.mainContent, isTablet && styles.mainContentTablet]}>
                            <View style={[styles.amountSection, isTablet && styles.amountSectionTablet]}>
                                <View style={[styles.amountCard, isTablet && { padding: 22, backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                                    <Text style={[styles.amountLabel, isTablet && { fontSize: 12, marginBottom: 10 }]}>TOTAL AMOUNT</Text>
                                    <View style={styles.amountInputRow}>
                                        <Text style={[styles.currencyPrefix, isTablet && { fontSize: 20 }]}>LE</Text>
                                        <TextInput
                                            style={[styles.amountInput, isTablet && { fontSize: 48, height: 54 }]}
                                            value={manualAmount}
                                            onChangeText={setManualAmount}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                        />
                                    </View>
                                    <View style={[styles.totalRow, isTablet && { marginTop: 15 }]}>
                                        <Text style={[styles.totalLabel, isTablet && { fontSize: 10 }]}>GROSS_TOTAL</Text>
                                        <View style={[styles.dot, isTablet && { width: 5, height: 5, shadowColor: '#C5A059', shadowRadius: 6, shadowOpacity: 0.8 }]} />
                                    </View>
                                </View>
                            </View>

                            <View style={styles.formSection}>
                                <View style={[styles.fieldContainer, isTablet && { gap: 12 }]}>
                                    <View style={[styles.labelRow, isTablet && { marginBottom: 6 }]}>
                                        <Text style={[styles.label, isTablet && { fontSize: 12 }]}>CUSTOMER NAME</Text>
                                        <View style={[styles.toggleContainer, isTablet && { padding: 4 }]}>
                                            <TouchableOpacity
                                                style={[styles.toggleBtn, customerType === 'existing' && styles.toggleBtnActive, isTablet && { paddingVertical: 8, paddingHorizontal: 20 }]}
                                                onPress={() => setCustomerType('existing')}
                                            >
                                                <Text style={[styles.toggleText, customerType === 'existing' && styles.toggleTextActive, isTablet && { fontSize: 13 }]}>EXISTING</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.toggleBtn, customerType === 'new' && styles.toggleBtnActive, isTablet && { paddingVertical: 8, paddingHorizontal: 20 }]}
                                                onPress={() => setCustomerType('new')}
                                            >
                                                <Text style={[styles.toggleText, customerType === 'new' && styles.toggleTextActive, isTablet && { fontSize: 13 }]}>NEW</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {customerType === 'existing' ? (
                                        <TouchableOpacity
                                            style={[styles.dropdownInput, isTablet && { height: 56, borderRadius: 14 }]}
                                            onPress={() => setCustomerModalVisible(true)}
                                        >
                                            <Text style={[selectedCustomer ? styles.inputText : styles.placeholderText, isTablet && { fontSize: 16 }]}>
                                                {selectedCustomer?.name || 'Select Customer...'}
                                            </Text>
                                            <ChevronDown size={isTablet ? 26 : 20} color="rgba(255,255,255,0.3)" />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={[styles.dropdownInput, isTablet && { height: 56, borderRadius: 14 }]}>
                                            <TextInput
                                                style={[styles.inputText, { flex: 1, padding: 0 }, isTablet && { fontSize: 16 }]}
                                                placeholder="Enter Customer Name..."
                                                placeholderTextColor="rgba(255,255,255,0.3)"
                                                value={newCustomerName}
                                                onChangeText={setNewCustomerName}
                                            />
                                        </View>
                                    )}
                                </View>

                                <View style={[styles.fieldContainer, isTablet && { gap: 16 }]}>
                                    <Text style={[styles.label, isTablet && { fontSize: 12 }]}>PRODUCTS</Text>
                                    <TouchableOpacity
                                        style={[styles.dropdownInput, isTablet && { height: 56, borderRadius: 14 }]}
                                        onPress={() => {
                                            setManualAmount('');
                                            setProductModalVisible(true);
                                        }}
                                    >
                                        <Text style={[styles.placeholderText, isTablet && { fontSize: 16 }]}>Add Product...</Text>
                                        <Plus size={isTablet ? 26 : 20} color="rgba(255,255,255,0.3)" />
                                    </TouchableOpacity>
                                </View>

                                <View style={isTablet ? { flex: 1, minHeight: 60 } : null}>
                                    <SaleBasketList
                                        items={items}
                                        onUpdateQuantity={updateQuantity}
                                        onRemove={removeItem}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={[styles.footer, isTablet && { marginTop: 24, gap: 16 }]}>
                            <TouchableOpacity style={[styles.cancelBtn, isTablet && { height: 52, borderRadius: 12 }]} onPress={onClose}>
                                <Text style={[styles.cancelText, isTablet && { fontSize: 12 }]}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.saveBtn,
                                    isTablet && {
                                        height: 52,
                                        borderRadius: 12,
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        borderLeftWidth: 5,
                                        borderLeftColor: '#C5A059'
                                    }
                                ]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#C5A059" /> : (
                                    <>
                                        <Text style={[styles.saveText, isTablet && { fontSize: 13, color: '#FFF' }]}>SAVE SALE</Text>
                                        <ArrowRight size={isTablet ? 20 : 20} color={isTablet ? "#FFF" : "#000"} />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
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
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '92%',
        maxHeight: '96%',
        backgroundColor: '#0F1115',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
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
        paddingTop: 24,
        paddingBottom: 30,
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#FFF',
        letterSpacing: 0,
        marginBottom: 2,
    },
    headerSubtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    subtitleLine: {
        width: 24,
        height: 2,
        backgroundColor: '#C5A059',
    },
    headerSubtitle: {
        fontSize: 8,
        fontWeight: '800',
        color: '#C5A059',
        letterSpacing: 2,
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
        fontSize: 10,
        fontWeight: '900',
        color: '#C5A059',
        fontStyle: 'italic',
    },
    mainContent: {
        flexDirection: 'column',
        gap: 12,
    },
    mainContentTablet: {
        flexDirection: 'row',
        gap: 40,
        alignItems: 'stretch',
    },
    amountSection: {
        marginBottom: 10,
    },
    amountSectionTablet: {
        width: 280,
        marginBottom: 0,
    },
    amountCard: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 24,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.15)',
        overflow: 'hidden',
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
        fontSize: 26,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#FFF',
        flex: 1,
        textAlign: 'right',
        height: 36,
        padding: 0,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 8,
    },
    totalLabel: {
        fontSize: 7,
        color: 'rgba(255,255,255,0.3)',
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#C5A059',
    },
    formSection: {
        flex: 1,
        gap: 12,
    },
    fieldContainer: {
        gap: 8,
    },
    label: {
        fontSize: 8,
        color: '#C5A059',
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    dropdownInput: {
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
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
        fontSize: 12,
        fontWeight: '700',
        fontStyle: 'italic',
        color: 'rgba(255,255,255,0.3)',
    },
    inputText: {
        fontSize: 12,
        fontWeight: '800',
        fontStyle: 'italic',
        color: '#F8FAFC',
    },
    footer: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        paddingBottom: 20,
    },
    saveBtn: {
        flex: 2,
        backgroundColor: '#FFF',
        height: 40,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    saveText: {
        fontSize: 10,
        color: '#000',
        fontWeight: '900',
        letterSpacing: 1,
        fontStyle: 'italic',
    },
    cancelBtn: {
        flex: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '800',
        letterSpacing: 2,
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
