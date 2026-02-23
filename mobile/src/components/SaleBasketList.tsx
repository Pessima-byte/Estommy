import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Plus, Minus, Trash2 } from 'lucide-react-native';
import { Product } from '../types';

interface BasketItemProps {
    item: {
        product: Product;
        quantity: number;
    };
    onUpdateQuantity: (id: string, delta: number) => void;
    onRemove: (id: string) => void;
}

const BasketItem = ({ item, onUpdateQuantity, onRemove }: BasketItemProps) => {
    return (
        <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemPrice}>Le {item.product.price.toLocaleString()} x {item.quantity}</Text>
            </View>
            <View style={styles.itemActions}>
                <View style={styles.qtyControl}>
                    <TouchableOpacity onPress={() => onUpdateQuantity(item.product.id, -1)} style={styles.miniBtn}>
                        <Minus size={14} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => onUpdateQuantity(item.product.id, 1)} style={styles.miniBtn}>
                        <Plus size={14} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => onRemove(item.product.id)}>
                    <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function SaleBasketList({ items, onUpdateQuantity, onRemove }: {
    items: { product: Product, quantity: number }[],
    onUpdateQuantity: (id: string, delta: number) => void,
    onRemove: (id: string) => void
}) {
    if (items.length === 0) return null;

    return (
        <View style={styles.itemsList}>
            {items.map((item) => (
                <BasketItem
                    key={item.product.id}
                    item={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemove={onRemove}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    itemsList: {
        gap: 12,
    },
    itemCard: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 16,
        padding: 12,
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
        fontWeight: '900',
        fontSize: 12,
        fontStyle: 'italic',
        textTransform: 'uppercase',
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
    miniBtn: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    qtyText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 12,
        minWidth: 16,
        textAlign: 'center',
    },
});
