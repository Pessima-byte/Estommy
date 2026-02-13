import { useState, useMemo, useCallback } from 'react';
import { Product } from '../types';
import { useToast } from './useToast';

export interface BasketItem {
    product: Product;
    quantity: number;
}

export function useSaleBasket() {
    const [items, setItems] = useState<BasketItem[]>([]);
    const { showToast } = useToast();

    const totalAmount = useMemo(() =>
        items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
        [items]);

    const addItem = useCallback((product: Product) => {
        setItems((prev) => {
            const exists = prev.find(i => i.product.id === product.id);
            if (exists) {
                if (exists.quantity < product.stock) {
                    return prev.map(i => i.product.id === product.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                    );
                } else {
                    showToast(`Stock limit reached for ${product.name}.`, 'error');
                    return prev;
                }
            }
            return [...prev, { product, quantity: 1 }];
        });
    }, [showToast]);

    const updateQuantity = useCallback((productId: string, delta: number) => {
        setItems((prev) => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = item.quantity + delta;
                if (newQty < 1) return item;
                if (newQty > item.product.stock) {
                    showToast(`Only ${item.product.stock} units available.`, 'error');
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    }, [showToast]);

    const removeItem = useCallback((productId: string) => {
        setItems((prev) => prev.filter(item => item.product.id !== productId));
    }, []);

    const clearBasket = useCallback(() => {
        setItems([]);
    }, []);

    return {
        items,
        totalAmount,
        addItem,
        updateQuantity,
        removeItem,
        clearBasket,
    };
}
