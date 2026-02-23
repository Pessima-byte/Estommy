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
                <Search size={14} color={Colors.textMuted} />
                <TextInput
                    placeholder="SCAN_DATASET..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={onSearchChange}
                />
            </View>
            <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.filterDropdown} onPress={onCategoryPress}>
                    <Text style={styles.filterValue} numberOfLines={1}>{selectedCategory || 'CATEGORY'}</Text>
                    <ChevronDown size={14} color={Colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterDropdown} onPress={onStatusPress}>
                    <Text style={styles.filterValue} numberOfLines={1}>{selectedStatus || 'STATUS'}</Text>
                    <ChevronDown size={14} color={Colors.textMuted} />
                </TouchableOpacity>
                {hasFilters && (
                    <TouchableOpacity
                        style={styles.clearFiltersBtn}
                        onPress={onClearFilters}
                    >
                        <X size={14} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    filtersRow: {
        marginBottom: 20,
        gap: 8,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        height: 40,
        borderRadius: 8,
        paddingHorizontal: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    filterDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        height: 36,
        paddingHorizontal: 10,
        borderRadius: 6,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        flex: 1,
    },
    filterValue: {
        color: Colors.textMuted,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    clearFiltersBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.1)',
    },
});
