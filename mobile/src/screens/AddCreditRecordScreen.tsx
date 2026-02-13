import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { X, ArrowRight, ChevronDown, Calendar, Search, Minus, Plus, Trash2, CreditCard, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { creditsAPI, customersAPI, filesAPI } from '../api/client';
import { useCustomers } from '../hooks/useCustomers';
import { useProducts } from '../hooks/useProducts';
import { Customer, Product } from '../types';
import { useToast } from '../hooks/useToast';

interface AddCreditRecordScreenProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddCreditRecordScreen({ onClose, onSuccess }: AddCreditRecordScreenProps) {
    const { showToast } = useToast();
    const { width, height } = useWindowDimensions();
    const isTablet = width >= 768;

    const { customers, refetch: refetchCustomers } = useCustomers();
    const { products } = useProducts();

    // Form States
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [customerType, setCustomerType] = useState<'existing' | 'new'>('existing');

    // Items state
    const [selectedItems, setSelectedItems] = useState<{ product: Product; quantity: number }[]>([]);
    const [manualDescription, setManualDescription] = useState('');

    // Amount state
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [customerModalVisible, setCustomerModalVisible] = useState(false);
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Derived data
    const calculatedTotal = useMemo(() => {
        return selectedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    }, [selectedItems]);

    // Update amount whenever products change (to be helpful like web)
    React.useEffect(() => {
        if (calculatedTotal > 0) {
            setAmount(calculatedTotal);
        }
    }, [calculatedTotal]);

    const handleAddProduct = (product: Product) => {
        setProductModalVisible(false);
        setSelectedItems(prev => {
            const exists = prev.find(i => i.product.id === product.id);
            if (exists) {
                return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { product, quantity: 1 }];
        });
        setSearchQuery('');
    };

    const updateItemQuantity = (productId: string, delta: number) => {
        setSelectedItems(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeItem = (productId: string) => {
        setSelectedItems(prev => prev.filter(item => item.product.id !== productId));
    };
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('Permission to access media library is required!', 'error');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        let customerId = selectedCustomer?.id;
        let customerName = selectedCustomer?.name;

        if (customerType === 'new') {
            if (!newCustomerName.trim()) {
                showToast('Please enter customer name.', 'error');
                return;
            }
            customerName = newCustomerName;
        } else if (!customerId) {
            showToast('Please select a customer.', 'error');
            return;
        }

        if (amount <= 0) {
            showToast('Please enter an amount.', 'error');
            return;
        }

        try {
            setLoading(true);

            let uploadedImageUrl = null;
            if (imageUri) {
                const uploadRes = await filesAPI.upload(imageUri);
                uploadedImageUrl = uploadRes.url;
            }

            // 1. Create customer if new
            if (customerType === 'new') {
                const newCustomer = await customersAPI.create({
                    name: newCustomerName,
                    status: 'Active',
                    totalDebt: 0
                });
                customerId = newCustomer.id;
            }

            // 2. Prepare description with items
            const itemsText = selectedItems.map(i => `${i.quantity}x ${i.product.name} (@${i.product.price})`).join(', ');
            const fullNotes = [
                itemsText ? `Items: ${itemsText}` : '',
                manualDescription ? `Extra: ${manualDescription}` : '',
                notes
            ].filter(Boolean).join('\n');

            // 3. Create credit record
            await creditsAPI.create({
                customer: customerName,
                customerId,
                amount: Number(amount),
                notes: fullNotes,
                status: 'Pending',
                dueDate: new Date(date).toISOString(),
                image: uploadedImageUrl,
                items: selectedItems.map(i => ({
                    productId: i.product.id,
                    quantity: i.quantity,
                    price: i.product.price
                }))
            });

            showToast('Debt record saved successfully', 'success');
            if (refetchCustomers) refetchCustomers();
            onSuccess();
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to save record.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const SelectionModal = ({ visible, onClose, title, data, onSelect, type }: any) => (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
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
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                        </View>

                        <FlatList
                            data={data}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: 20, gap: 10 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.listItem}
                                    onPress={() => onSelect(item)}
                                >
                                    <View>
                                        <Text style={styles.listItemTitle}>{item.name}</Text>
                                        <Text style={styles.listItemSubtitle}>
                                            {type === 'product'
                                                ? `Le ${item.price.toLocaleString()}`
                                                : item.phone || 'Registry Null'
                                            }
                                        </Text>
                                    </View>
                                    <ArrowRight size={16} color="#C5A059" />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );

    const filteredCustomers = customers.filter((c: Customer) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredProducts = products.filter((p: Product) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.overlay}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ width: '100%', alignItems: 'center' }}
            >
                <LinearGradient
                    colors={['#1A1A23', '#0F0F0F']}
                    style={[styles.container, isTablet ? styles.containerTablet : {}]}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.headerTitle}>NEW CREDIT RECORD</Text>
                                <View style={styles.headerSubtitleRow}>
                                    <View style={styles.subtitleLine} />
                                    <Text style={styles.headerSubtitle}>NEW DEBT ENTRY</Text>
                                </View>
                            </View>
                            <View style={styles.typeTag}>
                                <Text style={styles.typeLabel}>RECORD TYPE</Text>
                                <Text style={styles.typeValue}>MANUAL ENTRY</Text>
                            </View>
                        </View>

                        <View style={[styles.mainBody, isTablet && styles.mainBodyTablet]}>
                            {/* Left Column */}
                            <View style={styles.leftCol}>
                                {/* Customer Name */}
                                <View style={styles.fieldGroup}>
                                    <View style={styles.labelRow}>
                                        <Text style={styles.fieldLabel}>CUSTOMER NAME</Text>
                                        <View style={styles.toggleRow}>
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
                                            style={styles.inputBox}
                                            onPress={() => setCustomerModalVisible(true)}
                                        >
                                            <Text style={selectedCustomer ? styles.inputText : styles.placeholderText}>
                                                {selectedCustomer?.name || 'Search or select customer...'}
                                            </Text>
                                            <ChevronDown size={20} color="rgba(255,255,255,0.2)" />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.inputBox}>
                                            <TextInput
                                                style={styles.inputText}
                                                placeholder="Enter new customer name..."
                                                placeholderTextColor="rgba(255,255,255,0.2)"
                                                value={newCustomerName}
                                                onChangeText={setNewCustomerName}
                                            />
                                        </View>
                                    )}
                                </View>

                                {/* Add Products */}
                                <View style={styles.fieldGroup}>
                                    <Text style={styles.fieldLabel}>ADD PRODUCTS (OPTIONAL)</Text>
                                    <TouchableOpacity
                                        style={styles.inputBox}
                                        onPress={() => setProductModalVisible(true)}
                                    >
                                        <Text style={styles.placeholderText}>Search items...</Text>
                                        <Plus size={20} color="rgba(255,255,255,0.2)" />
                                    </TouchableOpacity>

                                    {/* Selected Items List */}
                                    <View style={styles.itemsDisplay}>
                                        {selectedItems.length > 0 ? (
                                            <View style={styles.itemsList}>
                                                {selectedItems.map((item) => (
                                                    <View key={item.product.id} style={styles.itemRow}>
                                                        <View style={styles.itemInfo}>
                                                            <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
                                                            <Text style={styles.itemMeta}>LE {item.product.price.toLocaleString()}</Text>
                                                        </View>
                                                        <View style={styles.itemControls}>
                                                            <View style={styles.qtyControl}>
                                                                <TouchableOpacity onPress={() => updateItemQuantity(item.product.id, -1)} style={styles.qtyBtn}>
                                                                    <Minus size={12} color="#FFF" />
                                                                </TouchableOpacity>
                                                                <Text style={styles.qtyText}>{item.quantity}</Text>
                                                                <TouchableOpacity onPress={() => updateItemQuantity(item.product.id, 1)} style={styles.qtyBtn}>
                                                                    <Plus size={12} color="#FFF" />
                                                                </TouchableOpacity>
                                                            </View>
                                                            <TouchableOpacity onPress={() => removeItem(item.product.id)} style={styles.trashBtn}>
                                                                <Trash2 size={16} color="#EF4444" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        ) : (
                                            <View style={styles.emptyItems}>
                                                <View style={styles.emptyIconCircle}>
                                                    <CreditCard size={24} color="rgba(255,255,255,0.1)" strokeWidth={1} />
                                                </View>
                                                <Text style={styles.emptyText}>NO ITEMS SELECTED</Text>
                                            </View>
                                        )}
                                        <View style={styles.manualEntryRow}>
                                            <TextInput
                                                style={styles.manualInput}
                                                placeholder="Add manual item description..."
                                                placeholderTextColor="rgba(255,255,255,0.3)"
                                                value={manualDescription}
                                                onChangeText={setManualDescription}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Right Column */}
                            <View style={styles.rightCol}>
                                <View style={styles.statsRow}>
                                    {/* Total Amount Card */}
                                    <View style={styles.amountCard}>
                                        <View style={styles.amountTop}>
                                            <View style={styles.amountLabelRow}>
                                                <Text style={styles.amountLabel}>TOTAL AMOUNT</Text>
                                                <View style={styles.currencyBadge}>
                                                    <Text style={styles.currencyText}>LE</Text>
                                                </View>
                                            </View>
                                            <View style={styles.amountAdjusters}>
                                                <TouchableOpacity
                                                    style={styles.adjustBtn}
                                                    onPress={() => setAmount(prev => Math.max(0, prev - 100))}
                                                >
                                                    <Minus size={18} color="rgba(255,255,255,0.4)" />
                                                </TouchableOpacity>
                                                <View style={styles.adjustDivider} />
                                                <TouchableOpacity
                                                    style={styles.adjustBtn}
                                                    onPress={() => setAmount(prev => prev + 100)}
                                                >
                                                    <Plus size={18} color="rgba(255,255,255,0.4)" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <TextInput
                                            style={styles.hugeAmountInput}
                                            value={amount.toString()}
                                            onChangeText={(val) => setAmount(Number(val.replace(/[^0-9]/g, '')))}
                                            keyboardType="numeric"
                                            placeholder="0.00"
                                            placeholderTextColor="rgba(255,255,255,0.05)"
                                        />
                                    </View>

                                    {/* Record Date */}
                                    <View style={styles.fieldGroup}>
                                        <Text style={styles.fieldLabel}>RECORD DATE</Text>
                                        <View style={styles.inputBox}>
                                            <Text style={styles.inputText}>{new Date(date).toLocaleDateString('en-GB')}</Text>
                                            <Calendar size={20} color="rgba(255,255,255,0.2)" />
                                        </View>
                                    </View>
                                </View>

                                {/* Notes */}
                                <View style={styles.fieldGroup}>
                                    <Text style={styles.fieldLabel}>ADDITIONAL NOTES</Text>
                                    <TextInput
                                        style={[styles.inputBox, styles.textArea, styles.inputText]}
                                        placeholder="Add any extra details here..."
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        multiline
                                        numberOfLines={4}
                                        value={notes}
                                        onChangeText={setNotes}
                                        textAlignVertical="top"
                                    />
                                </View>

                                {/* Attachment */}
                                <View style={styles.fieldGroup}>
                                    <View style={styles.labelRow}>
                                        <Text style={styles.fieldLabel}>ATTACHMENT / PHOTO</Text>
                                    </View>
                                    <View style={styles.imagePickerContainer}>
                                        <TouchableOpacity
                                            style={[styles.inputBox, styles.pickerBox, !!imageUri && styles.pickerBoxActive]}
                                            onPress={pickImage}
                                        >
                                            <View style={styles.pickerLeft}>
                                                <Camera size={20} color={imageUri ? '#FFF' : '#C5A059'} />
                                                <Text style={[styles.placeholderText, !!imageUri && styles.inputText]}>
                                                    {imageUri ? 'PHOTO ATTACHED' : 'SNAP OR ATTACH PHOTO'}
                                                </Text>
                                            </View>
                                            {imageUri ? (
                                                <TouchableOpacity onPress={() => setImageUri(null)} style={styles.clearImg}>
                                                    <X size={16} color="#FFF" />
                                                </TouchableOpacity>
                                            ) : (
                                                <ArrowRight size={16} color="rgba(197, 160, 89, 0.2)" />
                                            )}
                                        </TouchableOpacity>
                                        {imageUri && (
                                            <View style={styles.previewContainer}>
                                                <ImageIcon size={14} color="#C5A059" />
                                                <Text style={styles.previewPath} numberOfLines={1}>{imageUri.split('/').pop()}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity style={styles.abortBtn} onPress={onClose}>
                                        <Text style={styles.abortText}>ABORT</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                                        onPress={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#000" />
                                        ) : (
                                            <>
                                                <Text style={styles.saveBtnText}>SAVE DEBT RECORD</Text>
                                                <View style={styles.saveBtnLine} />
                                                <ArrowRight size={20} color="#000" strokeWidth={3} />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </LinearGradient>
            </KeyboardAvoidingView>

            {/* Selection Modals */}
            <SelectionModal
                visible={customerModalVisible}
                onClose={() => setCustomerModalVisible(false)}
                title="Select Customer"
                data={filteredCustomers}
                onSelect={(c: Customer) => {
                    setSelectedCustomer(c);
                    setCustomerModalVisible(false);
                    setSearchQuery('');
                }}
            />

            <SelectionModal
                visible={productModalVisible}
                onClose={() => setProductModalVisible(false)}
                title="Select Product"
                data={filteredProducts}
                onSelect={handleAddProduct}
                type="product"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '100%',
        backgroundColor: '#0F0F0F',
    },
    containerTablet: {
        borderRadius: 40,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        maxWidth: 1000,
        maxHeight: 750,
        overflow: 'hidden',
    },
    scrollContent: {
        padding: 40,
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 40,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#FFF',
        letterSpacing: -1,
        marginBottom: 8,
    },
    headerSubtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    subtitleLine: {
        width: 32,
        height: 2,
        backgroundColor: '#C5A059',
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#C5A059',
        letterSpacing: 4,
    },
    typeTag: {
        alignItems: 'flex-end',
    },
    typeLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.2)',
        letterSpacing: 2,
        marginBottom: 4,
    },
    typeValue: {
        fontSize: 12,
        fontWeight: '900',
        color: '#C5A059',
        fontStyle: 'italic',
        letterSpacing: 0.5,
    },
    mainBody: {
        gap: 40,
    },
    mainBodyTablet: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    leftCol: {
        flex: 1,
        gap: 24,
    },
    rightCol: {
        flex: 1,
        gap: 24,
    },
    fieldGroup: {
        gap: 10,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fieldLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#C5A059',
        letterSpacing: 3,
        fontStyle: 'italic',
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    toggleBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    toggleBtnActive: {
        backgroundColor: '#FFF',
    },
    toggleText: {
        fontSize: 8,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.2)',
    },
    toggleTextActive: {
        color: '#000',
    },
    inputBox: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        paddingHorizontal: 20,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textArea: {
        height: 120,
        paddingVertical: 15,
        alignItems: 'flex-start',
    },
    inputText: {
        fontSize: 16,
        fontWeight: '800',
        fontStyle: 'italic',
        color: '#FFF',
    },
    placeholderText: {
        fontSize: 14,
        fontWeight: '600',
        fontStyle: 'italic',
        color: 'rgba(255,255,255,0.2)',
    },
    itemsDisplay: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    itemsList: {
        padding: 10,
        gap: 8,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    itemInfo: {
        flex: 1,
        paddingRight: 10,
    },
    itemName: {
        fontSize: 12,
        fontWeight: '900',
        color: '#FFF',
        fontStyle: 'italic',
        textTransform: 'uppercase',
    },
    itemMeta: {
        fontSize: 9,
        fontWeight: '800',
        color: 'rgba(197, 160, 89, 0.4)',
        letterSpacing: 1,
        marginTop: 2,
    },
    itemControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    qtyBtn: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyText: {
        width: 24,
        textAlign: 'center',
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
        fontStyle: 'italic',
    },
    trashBtn: {
        padding: 4,
    },
    emptyItems: {
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    emptyIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.01)',
    },
    emptyText: {
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.1)',
        letterSpacing: 4,
    },
    manualEntryRow: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    manualInput: {
        fontSize: 11,
        fontWeight: '800',
        fontStyle: 'italic',
        color: '#FFF',
        padding: 0,
    },
    statsRow: {
        gap: 24,
    },
    amountCard: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    amountTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    amountLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    amountLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#C5A059',
        letterSpacing: 3,
    },
    currencyBadge: {
        backgroundColor: '#C5A059',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    currencyText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#000',
        fontStyle: 'italic',
    },
    amountAdjusters: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    adjustBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    adjustDivider: {
        width: 1,
        height: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    hugeAmountInput: {
        fontSize: 48,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#FFF',
        textAlign: 'right',
        height: 60,
        padding: 0,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 10,
    },
    abortBtn: {
        flex: 1,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
    },
    abortText: {
        fontSize: 11,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.2)',
        letterSpacing: 4,
        fontStyle: 'italic',
    },
    saveBtn: {
        flex: 2.5,
        height: 64,
        backgroundColor: '#FFF',
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    saveBtnDisabled: {
        opacity: 0.5,
    },
    saveBtnText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 3,
        fontStyle: 'italic',
    },
    saveBtnLine: {
        width: 32,
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
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
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 1,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        backgroundColor: '#0A0C10',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    searchInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 14,
        height: 40,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        marginBottom: 8,
    },
    listItemTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    listItemSubtitle: {
        color: '#64748B',
        fontSize: 12,
    },
    imagePickerContainer: {
        gap: 8,
    },
    pickerBox: {
        justifyContent: 'space-between',
    },
    pickerBoxActive: {
        backgroundColor: '#C5A059',
        borderColor: '#C5A059',
    },
    pickerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    clearImg: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
    },
    previewPath: {
        fontSize: 9,
        color: '#C5A059',
        fontWeight: '700',
        fontStyle: 'italic',
        letterSpacing: 0.5,
    },
});
