import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, Alert, Modal, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts } from '../hooks/useProducts';
import { Colors, Spacing } from '../constants/Theme';
import { Product } from '../types';
import AddProductScreen from './AddProductScreen';
import ProductCard from '../components/ProductCard';
import SelectionModal from '../components/SelectionModal';
import InventoryHero from '../components/products/InventoryHero';
import InventoryFilters from '../components/products/InventoryFilters';
import ProductDetailsModal from './ProductDetailsModal';
import { exportToCSV } from '../utils/export';

export default function ProductsScreen() {
    const { products, loading, refetch, deleteProduct } = useProducts();
    const { width } = useWindowDimensions();
    const [isAdding, setIsAdding] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [viewProduct, setViewProduct] = useState<Product | null>(null);
    const [isViewing, setIsViewing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [filterSearchQuery, setFilterSearchQuery] = useState('');

    const categories = useMemo(() => Array.from(new Set(products.map((p: Product) => p.category || 'General'))), [products]);
    const statuses = useMemo(() => Array.from(new Set(products.map((p: Product) => p.status || 'Active'))), [products]);

    const filteredProducts = useMemo(() => products.filter((p: Product) => {
        const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.id || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || (p.category || 'General') === selectedCategory;
        const matchesStatus = !selectedStatus || (p.status || 'Active') === selectedStatus;
        return matchesSearch && matchesCategory && matchesStatus;
    }), [products, searchQuery, selectedCategory, selectedStatus]);

    const stats = useMemo(() => ({
        totalAssets: products.length,
        stockedValue: products.reduce((acc: number, p: Product) => acc + (p.price * (p.stock || 0)), 0),
        lowStockCount: products.filter((p: Product) => p.status === 'Low Stock').length,
        outOfStockCount: products.filter((p: Product) => (p.stock || 0) <= 0).length,
    }), [products]);

    const isTablet = width >= 768;
    const isDesktop = width >= 1024;
    const isLargePhone = width >= 500;
    const gap = Spacing.md;
    const numCols = isDesktop ? 4 : isTablet ? 3 : isLargePhone ? 2 : 1;
    const sidebarWidth = width >= 1024 ? 240 : 0;
    const availableWidth = width - sidebarWidth - (Spacing.xl * 2);

    const itemWidth = (availableWidth - (gap * (numCols - 1))) / numCols;

    const handleEdit = (product: Product) => {
        setEditProduct(product);
        setIsAdding(true);
    };

    const handleDetails = (product: Product) => {
        setViewProduct(product);
        setIsViewing(true);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Confirm Deletion',
            'Are you sure you want to remove this asset from the registry?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteProduct(id);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete product');
                        }
                    }
                }
            ]
        );
    };

    const handleExportCSV = async () => {
        setExporting(true);
        try {
            await exportToCSV<Product>(
                products,
                [
                    { header: 'ID', key: 'id' },
                    { header: 'Name', key: 'name' },
                    { header: 'Category', key: (p) => p.category || 'General' },
                    { header: 'Price', key: 'price' },
                    { header: 'Cost Price', key: 'costPrice' },
                    { header: 'Stock', key: 'stock' },
                    { header: 'Status', key: (p) => p.status || 'Active' }
                ],
                'ESTOMMY_Inventory',
                'Export Product Inventory'
            );
        } catch (error) {
            Alert.alert('Export Failed', 'An error occurred while generating the CSV file.');
        } finally {
            setExporting(false);
        }
    };

    const headerComponent = useMemo(() => (
        <View>
            <InventoryHero
                {...stats}
                onExportCSV={handleExportCSV}
                onAddProduct={() => setIsAdding(true)}
                exporting={exporting}
            />
            <InventoryFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryPress={() => setCategoryModalVisible(true)}
                selectedStatus={selectedStatus}
                onStatusPress={() => setStatusModalVisible(true)}
                onClearFilters={() => {
                    setSelectedCategory(null);
                    setSelectedStatus(null);
                }}
            />
        </View>
    ), [stats, exporting, searchQuery, selectedCategory, selectedStatus]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                numColumns={numCols}
                key={numCols}
                ListHeaderComponent={headerComponent}
                renderItem={({ item }) => (
                    <ProductCard
                        item={item}
                        width={itemWidth}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onPress={handleDetails}
                    />
                )}
                columnWrapperStyle={numCols > 1 ? { gap } : null}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refetch}
                        tintColor={Colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No assets found in registry.</Text>
                    </View>
                }
                ListFooterComponent={<View style={{ height: 100 }} />}
            />

            <Modal visible={isAdding} animationType="slide">
                <AddProductScreen
                    onClose={() => {
                        setIsAdding(false);
                        setEditProduct(null);
                    }}
                    onSuccess={() => {
                        setIsAdding(false);
                        setEditProduct(null);
                        refetch();
                    }}
                    initialProduct={editProduct}
                />
            </Modal>

            <ProductDetailsModal
                visible={isViewing}
                onClose={() => {
                    setIsViewing(false);
                    setViewProduct(null);
                }}
                product={viewProduct}
            />

            <SelectionModal
                visible={categoryModalVisible}
                onClose={() => setCategoryModalVisible(false)}
                title="Filter Category"
                data={categories}
                onSelect={(cat) => { setSelectedCategory(cat); setCategoryModalVisible(false); }}
                searchQuery={filterSearchQuery}
                onSearchChange={setFilterSearchQuery}
            />

            <SelectionModal
                visible={statusModalVisible}
                onClose={() => setStatusModalVisible(false)}
                title="Filter Status"
                data={statuses}
                onSelect={(stat) => { setSelectedStatus(stat); setStatusModalVisible(false); }}
                searchQuery={filterSearchQuery}
                onSearchChange={setFilterSearchQuery}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0C10',
    },
    scrollContent: {
        padding: Spacing.xl,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#64748B',
        fontSize: 14,
        fontStyle: 'italic',
    }
});
