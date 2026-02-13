import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

/**
 * Interface for CSV Column mapping
 */
export interface CSVColumn<T> {
    header: string;
    key: keyof T | ((item: T) => string | number);
}

/**
 * Utility to export data as CSV and share it
 */
export const exportToCSV = async <T>(
    data: T[],
    columns: CSVColumn<T>[],
    fileNamePrefix: string,
    dialogTitle: string = 'Export File'
): Promise<void> => {
    try {
        if (!data || data.length === 0) {
            Alert.alert('Notice', 'No data available to export.');
            return;
        }

        const header = columns.map(col => col.header).join(',') + '\n';
        const rows = data.map(item => {
            return columns.map(col => {
                let val: any;
                if (typeof col.key === 'function') {
                    val = col.key(item);
                } else {
                    val = (item as any)[col.key];
                }

                // Handle null/undefined
                if (val === null || val === undefined) return '';

                // Escape strings and wrap in quotes if they contain commas
                const strVal = String(val);
                if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
                    return `"${strVal.replace(/"/g, '""')}"`;
                }
                return strVal;
            }).join(',');
        }).join('\n');

        const csvContent = header + rows;

        const dir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
        if (!dir) {
            Alert.alert('Error', 'Storage directory not found on device.');
            return;
        }

        const fileName = `${fileNamePrefix}_${Date.now()}.csv`;
        const fileUri = dir.endsWith('/') ? `${dir}${fileName}` : `${dir}/${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, csvContent);

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'text/csv',
                dialogTitle,
                UTI: 'public.comma-separated-values-text'
            });
        } else {
            Alert.alert('Error', 'Sharing feature is unavailable on this device.');
        }
    } catch (error) {
        console.error('CSV Export Error:', error);
        throw error;
    }
};
