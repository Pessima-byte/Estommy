import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, useWindowDimensions } from 'react-native';
import { ChevronDown, Tag, Layers, DollarSign, Package } from 'lucide-react-native';
import { Colors } from '../constants/Theme';

interface ProductFormFieldsProps {
    name: string;
    setName: (val: string) => void;
    category: string;
    onCategoryPress: () => void;
    costPrice: string;
    setCostPrice: (val: string) => void;
    price: string;
    setPrice: (val: string) => void;
    stock: string;
    setStock: (val: string) => void;
}

const ProductFormFields = ({
    name, setName,
    category, onCategoryPress,
    costPrice, setCostPrice,
    price, setPrice,
    stock, setStock
}: ProductFormFieldsProps) => {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    return (
        <View style={[styles.formSection, isTablet && { gap: 16 }]}>
            <View style={[styles.fieldContainer, isTablet && { gap: 8 }]}>
                <View style={styles.labelRow}>
                    <Text style={[styles.label, isTablet && { fontSize: 10 }]}>PRODUCT NAME</Text>
                </View>
                <View style={[styles.inputWrapper, isTablet && { height: 52, borderRadius: 12 }]}>
                    <Tag size={isTablet ? 16 : 12} color={Colors.primary} opacity={0.3} />
                    <TextInput
                        style={[styles.input, isTablet && { fontSize: 15 }]}
                        placeholder="e.g. Premium Hub Device"
                        placeholderTextColor="rgba(255,255,255,0.15)"
                        value={name}
                        onChangeText={setName}
                        selectionColor={Colors.primary}
                    />
                </View>
            </View>

            <View style={[styles.fieldContainer, isTablet && { gap: 8 }]}>
                <View style={styles.labelRow}>
                    <Text style={[styles.label, isTablet && { fontSize: 10 }]}>CATEGORY</Text>
                </View>
                <TouchableOpacity
                    style={[styles.inputWrapper, isTablet && { height: 52, borderRadius: 12 }]}
                    onPress={onCategoryPress}
                    activeOpacity={0.7}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Layers size={isTablet ? 16 : 12} color={Colors.primary} opacity={0.3} />
                        <Text style={[styles.input, isTablet && { fontSize: 15 }, !category && { color: 'rgba(255,255,255,0.15)' }]}>
                            {category || 'Select Classification'}
                        </Text>
                    </View>
                    <ChevronDown size={isTablet ? 20 : 16} color="rgba(255,255,255,0.2)" />
                </TouchableOpacity>
            </View>

            <View style={[styles.row, isTablet && { gap: 20 }]}>
                <View style={[styles.fieldContainer, { flex: 1 }, isTablet && { gap: 8 }]}>
                    <View style={styles.labelRow}>
                        <Text style={[styles.label, isTablet && { fontSize: 10 }]}>COST (LE)</Text>
                    </View>
                    <View style={[styles.inputWrapper, isTablet && { height: 52, borderRadius: 12 }]}>
                        <DollarSign size={isTablet ? 16 : 12} color={Colors.primary} opacity={0.3} />
                        <TextInput
                            style={[styles.input, isTablet && { fontSize: 15 }]}
                            placeholder="0.00"
                            placeholderTextColor="rgba(255,255,255,0.15)"
                            keyboardType="numeric"
                            value={costPrice}
                            onChangeText={setCostPrice}
                            selectionColor={Colors.primary}
                        />
                    </View>
                </View>
                <View style={[styles.fieldContainer, { flex: 1 }, isTablet && { gap: 8 }]}>
                    <View style={styles.labelRow}>
                        <Text style={[styles.label, isTablet && { fontSize: 10 }]}>PRICE (LE)</Text>
                    </View>
                    <View style={[styles.inputWrapper, isTablet && { height: 52, borderRadius: 12 }]}>
                        <DollarSign size={isTablet ? 16 : 12} color={Colors.primary} opacity={0.3} />
                        <TextInput
                            style={[styles.input, isTablet && { fontSize: 15 }]}
                            placeholder="0.00"
                            placeholderTextColor="rgba(255,255,255,0.15)"
                            keyboardType="numeric"
                            value={price}
                            onChangeText={setPrice}
                            selectionColor={Colors.primary}
                        />
                    </View>
                </View>
            </View>

            <View style={[styles.fieldContainer, isTablet && { gap: 8 }]}>
                <View style={styles.labelRow}>
                    <Text style={[styles.label, isTablet && { fontSize: 10 }]}>STOCK LEVEL</Text>
                </View>
                <View style={[styles.inputWrapper, isTablet && { height: 52, borderRadius: 12 }]}>
                    <Package size={isTablet ? 16 : 12} color={Colors.primary} opacity={0.3} />
                    <TextInput
                        style={[styles.input, isTablet && { fontSize: 15 }]}
                        placeholder="Current Inventory Count"
                        placeholderTextColor="rgba(255,255,255,0.15)"
                        keyboardType="numeric"
                        value={stock}
                        onChangeText={setStock}
                        selectionColor={Colors.primary}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    formSection: {
        flex: 1,
        gap: 8,
    },
    fieldContainer: {
        gap: 4,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 2,
    },
    label: {
        fontSize: 7,
        color: Colors.primary,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 1.5,
    },
    inputWrapper: {
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        gap: 10,
        justifyContent: 'space-between',
    },
    input: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 12,
        fontWeight: '800',
        fontStyle: 'italic',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
});

export default ProductFormFields;
