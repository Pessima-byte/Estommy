import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Search, ChevronDown, X } from 'lucide-react-native';
import { Colors } from '../../constants/Theme';

interface InventoryFiltersProps {
    searchQuery: string;
    onSearchChange: (text: string) => void;
    selectedCategory: string | null;
    onCategoryPress: () => void;
    selectedStatus: string | null;
    onStatusPress: () => void;
    onClearFilters: () => void;
}

export default function InventoryFilters({
    searchQuery,
    onSearchChange,
    selectedCategory,
    onCategoryPress,
    selectedStatus,
    onStatusPress,
    onClearFilters
}: InventoryFiltersProps) {
    const hasFilters = selectedCategory || selectedStatus;

    return (
        <View style={styles.filtersRow}>
            <View style={styles.searchBox}>
                <Search size={18} color="#475569" />
                <TextInput
                    placeholder="Search inventory..."
                    placeholderTextColor="#475569"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={onSearchChange}
                />
            </View>
            <TouchableOpacity style={styles.filterDropdown} onPress={onCategoryPress}>
                <Text style={styles.filterValue} numberOfLines={1}>{selectedCategory || 'ALL CATEGORIES'}</Text>
                <ChevronDown size={16} color="#475569" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterDropdown} onPress={onStatusPress}>
                <Text style={styles.filterValue} numberOfLines={1}>{selectedStatus || 'STATUS'}</Text>
                <ChevronDown size={16} color="#475569" />
            </TouchableOpacity>
            {hasFilters && (
                <TouchableOpacity
                    style={styles.clearFiltersBtn}
                    onPress={onClearFilters}
                >
                    <X size={14} color="#EF4444" />
                    <Text style={styles.clearFiltersText}>CLEAR</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    filtersRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    searchBox: {
        flex: 1,
        minWidth: 200,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    searchInput: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 14,
    },
    filterDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        height: 48,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        flex: 1,
        minWidth: 100,
    },
    filterValue: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    clearFiltersBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        gap: 6,
    },
    clearFiltersText: {
        color: '#EF4444',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
});
