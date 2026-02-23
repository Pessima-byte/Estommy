import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { X, ArrowRight, ChevronDown, Calendar, Search, Minus, Plus, Trash2, CreditCard, Camera, Image as ImageIcon, ChevronLeft } from 'lucide-react-native';
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

import SelectionModal from '../components/SelectionModal';

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
            showToast('Document Captured Successfully', 'success');
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
                <View style={[styles.modalContent, isTablet && { width: 920, height: 580 }]}>
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
                        contentContainerStyle={[styles.scrollContent, isTablet && { padding: 24, paddingTop: 20, paddingBottom: 20 }]}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={!isTablet}
                    >
                        <View style={[styles.header, isTablet && { marginBottom: 16, alignItems: 'center' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                {isTablet && (
                                    <TouchableOpacity
                                        onPress={onClose}
                                        style={{
                                            marginRight: 16,
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            padding: 8,
                                            borderRadius: 10,
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <ChevronLeft size={20} color="#C5A059" />
                                    </TouchableOpacity>
                                )}
                                <View style={{ flex: 1 }}>
                                    <Text
                                        style={[styles.headerTitle, isTablet && { fontSize: 20 }]}
                                        numberOfLines={1}
                                    >
                                        NEW CREDIT RECORD
                                    </Text>
                                    <View style={styles.headerSubtitleRow}>
                                        <View style={[styles.subtitleLine, isTablet && { width: 30, height: 2 }]} />
                                        <Text
                                            style={[styles.headerSubtitle, isTablet && { fontSize: 10 }]}
                                            numberOfLines={1}
                                        >
                                            NEW DEBT ENTRY
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.typeTag}>
                                <Text style={[styles.typeLabel, isTablet && { fontSize: 9 }]}>RECORD TYPE</Text>
                                <Text style={[styles.typeValue, isTablet && { fontSize: 11 }]}>MANUAL ENTRY</Text>
                            </View>
                        </View>

                        <View style={[styles.mainBody, isTablet && [styles.mainBodyTablet, { gap: 20 }]]}>
                            {/* Left Column */}
                            <View style={[styles.leftCol, isTablet && { gap: 12 }]}>
                                {/* Customer Name */}
                                <View style={[styles.fieldGroup, isTablet && { gap: 6 }]}>
                                    <View style={styles.labelRow}>
                                        <Text style={[styles.fieldLabel, isTablet && { fontSize: 10 }]}>CUSTOMER NAME</Text>
                                        <View style={[styles.toggleRow, isTablet && { padding: 2, borderRadius: 8 }]}>
                                            <TouchableOpacity
                                                style={[styles.toggleBtn, customerType === 'existing' && styles.toggleBtnActive, isTablet && { paddingHorizontal: 12, paddingVertical: 6 }]}
                                                onPress={() => setCustomerType('existing')}
                                            >
                                                <Text style={[styles.toggleText, customerType === 'existing' && styles.toggleTextActive, isTablet && { fontSize: 10 }]}>EXISTING</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.toggleBtn, customerType === 'new' && styles.toggleBtnActive, isTablet && { paddingHorizontal: 12, paddingVertical: 6 }]}
                                                onPress={() => setCustomerType('new')}
                                            >
                                                <Text style={[styles.toggleText, customerType === 'new' && styles.toggleTextActive, isTablet && { fontSize: 10 }]}>NEW</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {customerType === 'existing' ? (
                                        <TouchableOpacity
                                            style={[styles.inputBox, isTablet && { height: 46, borderRadius: 10 }]}
                                            onPress={() => setCustomerModalVisible(true)}
                                        >
                                            <Text style={[selectedCustomer ? styles.inputText : styles.placeholderText, isTablet && { fontSize: 14 }]}>
                                                {selectedCustomer?.name || 'Search or select customer...'}
                                            </Text>
                                            <ChevronDown size={isTablet ? 20 : 20} color="rgba(255,255,255,0.2)" />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={[styles.inputBox, isTablet && { height: 46, borderRadius: 10 }]}>
                                            <TextInput
                                                style={[styles.inputText, isTablet && { fontSize: 14 }]}
                                                placeholder="Enter new customer name..."
                                                placeholderTextColor="rgba(255,255,255,0.2)"
                                                value={newCustomerName}
                                                onChangeText={setNewCustomerName}
                                            />
                                        </View>
                                    )}
                                </View>

                                {/* Add Products */}
                                <View style={[styles.fieldGroup, isTablet && { gap: 6 }]}>
                                    <Text style={[styles.fieldLabel, isTablet && { fontSize: 10 }]}>ADD PRODUCTS (OPTIONAL)</Text>
                                    <TouchableOpacity
                                        style={[styles.inputBox, isTablet && { height: 46, borderRadius: 10 }]}
                                        onPress={() => setProductModalVisible(true)}
                                    >
                                        <Text style={[styles.placeholderText, isTablet && { fontSize: 14 }]}>Search items...</Text>
                                        <Plus size={isTablet ? 20 : 20} color="rgba(255,255,255,0.2)" />
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
                            <View style={[styles.rightCol, isTablet && { gap: 12 }]}>
                                <View style={[styles.statsRow, isTablet && { gap: 8 }]}>
                                    {/* Total Amount Card */}
                                    <View style={[styles.amountCard, isTablet && { padding: 14, borderRadius: 18 }]}>
                                        <View style={styles.amountTop}>
                                            <View style={styles.amountLabelRow}>
                                                <Text style={[styles.amountLabel, isTablet && { fontSize: 9 }]}>CREDIT_VALUE</Text>
                                                <View style={[styles.currencyBadge, isTablet && { paddingHorizontal: 4, paddingVertical: 1 }]}>
                                                    <Text style={[styles.currencyText, isTablet && { fontSize: 10 }]}>LE</Text>
                                                </View>
                                            </View>
                                            <View style={styles.amountAdjusters}>
                                                <TouchableOpacity
                                                    style={[styles.adjustBtn, isTablet && { width: 32, height: 32 }]}
                                                    onPress={() => setAmount(prev => Math.max(0, prev - 100))}
                                                >
                                                    <Minus size={isTablet ? 18 : 16} color="rgba(255,255,255,0.4)" />
                                                </TouchableOpacity>
                                                <View style={styles.adjustDivider} />
                                                <TouchableOpacity
                                                    style={[styles.adjustBtn, isTablet && { width: 32, height: 32 }]}
                                                    onPress={() => setAmount(prev => prev + 100)}
                                                >
                                                    <Plus size={isTablet ? 18 : 16} color="rgba(255,255,255,0.4)" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <TextInput
                                            style={[styles.hugeAmountInput, isTablet && { fontSize: 32, height: 40 }]}
                                            value={amount.toString()}
                                            onChangeText={(val) => setAmount(Number(val.replace(/[^0-9]/g, '')))}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor="rgba(255,255,255,0.05)"
                                        />
                                    </View>

                                    {/* Record Date */}
                                    <View style={[styles.fieldGroup, isTablet && { gap: 6 }]}>
                                        <Text style={[styles.fieldLabel, isTablet && { fontSize: 10 }]}>ENTRY_TIMESTAMP</Text>
                                        <View style={[styles.inputBox, isTablet && { height: 46, borderRadius: 10 }]}>
                                            <Text style={[styles.inputText, isTablet && { fontSize: 14 }]}>{new Date(date).toLocaleDateString('en-GB').toUpperCase()}</Text>
                                            <Calendar size={isTablet ? 20 : 18} color="rgba(197, 160, 89, 0.4)" />
                                        </View>
                                    </View>
                                </View>

                                {/* Notes */}
                                <View style={[styles.fieldGroup, isTablet && { gap: 6 }]}>
                                    <Text style={[styles.fieldLabel, isTablet && { fontSize: 10 }]}>MISSION_LOG_DATA</Text>
                                    <TextInput
                                        style={[styles.inputBox, styles.textArea, isTablet && { height: 80, borderRadius: 10 }, styles.inputText, isTablet && { fontSize: 14 }]}
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
                                <View style={[styles.fieldGroup, isTablet && { gap: 6 }]}>
                                    <View style={styles.labelRow}>
                                        <Text style={[styles.fieldLabel, isTablet && { fontSize: 10 }]}>ATTACHMENT / PHOTO</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.attachmentBtn, !!imageUri && styles.attachmentBtnActive, isTablet && { height: 56, borderRadius: 12 }]}
                                        onPress={pickImage}
                                    >
                                        <LinearGradient
                                            colors={imageUri ? ['rgba(197, 160, 89, 0.15)', 'rgba(197, 160, 89, 0.05)'] : ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                                            style={StyleSheet.absoluteFill}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 0, y: 1 }}
                                        />
                                        {imageUri ? (
                                            <View style={styles.attachmentPreview}>
                                                <ImageIcon size={isTablet ? 20 : 18} color="#C5A059" />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.attachmentName, isTablet && { fontSize: 11 }]} numberOfLines={1}>{imageUri.split('/').pop()?.toUpperCase() || 'SCAN_DOC.IMG'}</Text>
                                                    <Text style={[styles.statusText, isTablet && { fontSize: 8 }]}>STATUS: VERIFIED_ATTACHMENT</Text>
                                                </View>
                                                <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeBtn}>
                                                    <X size={14} color="#FFF" />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <View style={styles.scannerContent}>
                                                <Camera size={isTablet ? 20 : 18} color="#C5A059" style={{ opacity: 0.6 }} />
                                                <Text style={[styles.attachmentText, isTablet && { fontSize: 10 }]}>INITIALIZE SCANNER</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {/* Action Buttons */}
                                <View style={[styles.buttonRow, isTablet && { marginTop: 12, gap: 12 }]}>
                                    <TouchableOpacity style={[styles.abortBtn, isTablet && { height: 42, borderRadius: 8 }]} onPress={onClose}>
                                        <Text style={[styles.abortText, isTablet && { fontSize: 11 }]} numberOfLines={1}>CANCEL</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.saveBtn, loading && styles.saveBtnDisabled, isTablet && { height: 48, borderRadius: 10 }]}
                                        onPress={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#000" />
                                        ) : (
                                            <>
                                                <Text style={[styles.saveBtnText, isTablet && { fontSize: 14 }]} numberOfLines={1}>SAVE DEBT RECORD</Text>
                                                <ArrowRight size={isTablet ? 20 : 16} color="#000" strokeWidth={3} />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
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
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                renderItem={(item) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                        <View>
                            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800', fontStyle: 'italic' }}>{item.name}</Text>
                            <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '700', marginTop: 2 }}>{item.phone || 'REGISTRY_NULL'}</Text>
                        </View>
                        <ArrowRight size={16} color="#C5A059" />
                    </View>
                )}
            />

            <SelectionModal
                visible={productModalVisible}
                onClose={() => setProductModalVisible(false)}
                title="Select Product"
                data={filteredProducts}
                onSelect={handleAddProduct}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                renderItem={(item) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                        <View>
                            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800', fontStyle: 'italic' }}>{item.name}</Text>
                            <Text style={{ color: '#C5A059', fontSize: 10, fontWeight: '700', marginTop: 2 }}>LE {item.price.toLocaleString()}</Text>
                        </View>
                        <ArrowRight size={16} color="#C5A059" />
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
        width: '90%',
        maxHeight: '98%',
        backgroundColor: '#0F1115',
        borderRadius: 28,
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
        backgroundColor: '#C5A059',
        opacity: 0.1,
        transform: [{ scale: 2.5 }],
    },
    scrollContent: {
        padding: 16,
        paddingTop: 30,
        paddingBottom: 40,
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 6,
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
        backgroundColor: '#C5A059',
    },
    headerSubtitle: {
        fontSize: 8,
        fontWeight: '800',
        color: '#C5A059',
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
        color: '#C5A059',
        fontStyle: 'italic',
        letterSpacing: 0,
    },
    mainBody: {
        gap: 6,
    },
    mainBodyTablet: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    leftCol: {
        flex: 1,
        gap: 8,
    },
    rightCol: {
        flex: 1,
        gap: 8,
    },
    fieldGroup: {
        gap: 4,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fieldLabel: {
        fontSize: 7,
        fontWeight: '900',
        color: '#C5A059',
        letterSpacing: 1.5,
        fontStyle: 'italic',
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    toggleBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    toggleBtnActive: {
        backgroundColor: '#FFF',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    toggleText: {
        fontSize: 8,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
    },
    toggleTextActive: {
        color: '#000',
    },
    inputBox: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 34,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textArea: {
        height: 54,
        paddingVertical: 8,
        alignItems: 'flex-start',
    },
    inputText: {
        fontSize: 12,
        fontWeight: '800',
        fontStyle: 'italic',
        color: '#FFF',
    },
    placeholderText: {
        fontSize: 11,
        fontWeight: '600',
        fontStyle: 'italic',
        color: 'rgba(255,255,255,0.2)',
    },
    itemsDisplay: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    itemsList: {
        padding: 8,
        gap: 6,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    itemInfo: {
        flex: 1,
        paddingRight: 10,
    },
    itemName: {
        fontSize: 11,
        fontWeight: '900',
        color: '#FFF',
        fontStyle: 'italic',
        textTransform: 'uppercase',
    },
    itemMeta: {
        fontSize: 8,
        fontWeight: '800',
        color: 'rgba(197, 160, 89, 0.4)',
        letterSpacing: 1,
        marginTop: 1,
    },
    itemControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    qtyBtn: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyText: {
        width: 20,
        textAlign: 'center',
        color: '#FFF',
        fontSize: 11,
        fontWeight: '900',
        fontStyle: 'italic',
    },
    trashBtn: {
        padding: 4,
    },
    emptyItems: {
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    emptyIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.01)',
    },
    emptyText: {
        fontSize: 8,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.1)',
        letterSpacing: 3,
    },
    manualEntryRow: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    manualInput: {
        fontSize: 10,
        fontWeight: '800',
        fontStyle: 'italic',
        color: '#FFF',
        padding: 0,
    },
    statsRow: {
        gap: 8,
    },
    amountCard: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.15)',
        overflow: 'hidden',
    },
    amountTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    amountLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    amountLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#C5A059',
        letterSpacing: 2,
    },
    currencyBadge: {
        backgroundColor: '#C5A059',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
    },
    currencyText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#000',
        fontStyle: 'italic',
    },
    amountAdjusters: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 10,
        padding: 1,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    adjustBtn: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    adjustDivider: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    hugeAmountInput: {
        fontSize: 22,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#FFF',
        textAlign: 'right',
        height: 32,
        padding: 0,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    abortBtn: {
        flex: 1,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    abortText: {
        fontSize: 8,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1,
        fontStyle: 'italic',
    },
    saveBtn: {
        flex: 3,
        height: 38,
        backgroundColor: '#FFF',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 8,
    },
    saveBtnDisabled: {
        opacity: 0.5,
    },
    saveBtnText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 1,
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
    selectionModalContent: {
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
    attachmentBtn: {
        height: 40,
        backgroundColor: 'transparent',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.15)',
        overflow: 'hidden',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    attachmentBtnActive: {
        borderColor: '#C5A059',
        borderWidth: 1.5,
    },
    scannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    attachmentText: {
        fontSize: 9,
        color: '#C5A059',
        fontWeight: '900',
        letterSpacing: 2,
        opacity: 0.8,
    },
    attachmentPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    attachmentImg: {
        width: 30,
        height: 30,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    attachmentName: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 0.5,
    },
    statusText: {
        fontSize: 7,
        color: '#C5A059',
        fontWeight: '800',
        opacity: 0.6,
        marginTop: 1,
    },
    removeBtn: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePickerContainer: {
        gap: 8,
    },
});
