import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
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
    return (
        <View style={styles.formSection}>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>PRODUCT NAME</Text>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Product Name"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={name}
                        onChangeText={setName}
                    />
                </View>
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>CATEGORY</Text>
                <TouchableOpacity
                    style={styles.inputWrapper}
                    onPress={onCategoryPress}
                >
                    <Text style={[styles.input, !category && { color: 'rgba(255,255,255,0.2)' }]}>
                        {category || 'Select Category'}
                    </Text>
                    <ChevronDown size={20} color="rgba(255,255,255,0.3)" style={styles.chevron} />
                </TouchableOpacity>
            </View>

            <View style={styles.row}>
                <View style={[styles.fieldContainer, { flex: 1 }]}>
                    <Text style={styles.label}>COST (LE)</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            keyboardType="numeric"
                            value={costPrice}
                            onChangeText={setCostPrice}
                        />
                    </View>
                </View>
                <View style={[styles.fieldContainer, { flex: 1 }]}>
                    <Text style={styles.label}>PRICE (LE)</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            keyboardType="numeric"
                            value={price}
                            onChangeText={setPrice}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>STOCK LEVEL</Text>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        keyboardType="numeric"
                        value={stock}
                        onChangeText={setStock}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    formSection: {
        flex: 1,
        gap: 16,
    },
    fieldContainer: {
        gap: 6,
    },
    label: {
        fontSize: 10,
        color: Colors.primary,
        fontWeight: '800',
        letterSpacing: 2,
    },
    inputWrapper: {
        height: 48,
        backgroundColor: '#1A1A22',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    input: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '600',
        fontStyle: 'italic',
    },
    chevron: {
        position: 'absolute',
        right: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 20,
    },
});

export default ProductFormFields;
