import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

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

                if (val === null || val === undefined) return '';

                const strVal = String(val);
                if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
                    return `"${strVal.replace(/"/g, '""')}"`;
                }
                return strVal;
            }).join(',');
        }).join('\n');

        const csvContent = header + rows;
        const fileName = `${fileNamePrefix}_${Date.now()}.csv`;

        // Web Browser Support
        if (Platform.OS === 'web') {
            try {
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
                setTimeout(() => window.URL.revokeObjectURL(url), 100);
                return;
            } catch (webError) {
                Alert.alert('Download Failed', 'Browser download failed.');
                return;
            }
        }

        // Native Support (iOS/Android)
        const FS = FileSystem as any;
        let fileUri: string | null = null;

        // Strategy A: Next-Gen API (Expo 52+)
        if (FS.Paths && FS.File) {
            console.log('[Export] Using Next-Gen API');
            const documentPath = FS.Paths.document || FS.Paths.cache;
            if (documentPath) {
                // In New API, we can join paths or create a File object directly
                const pathStr = typeof documentPath === 'string' ? documentPath : (documentPath.uri || documentPath.path);
                fileUri = pathStr.endsWith('/') ? `${pathStr}${fileName}` : `${pathStr}/${fileName}`;

                try {
                    // Try the new File object write method
                    const fileObj = new FS.File(fileUri);
                    await fileObj.write(csvContent);
                } catch (writeErr) {
                    console.warn('[Export] Next-Gen write failed, falling back to legacy writeAsStringAsync');
                    if (FS.writeAsStringAsync) {
                        await FS.writeAsStringAsync(fileUri, csvContent);
                    } else {
                        throw writeErr;
                    }
                }
            }
        }

        // Strategy B: Legacy API
        if (!fileUri) {
            console.log('[Export] Using Legacy API');
            const dir = FS.documentDirectory || FS.cacheDirectory;
            if (dir) {
                fileUri = dir.endsWith('/') ? `${dir}${fileName}` : `${dir}/${fileName}`;
                if (FS.writeAsStringAsync) {
                    await FS.writeAsStringAsync(fileUri, csvContent);
                } else {
                    throw new Error('FileSystem.writeAsStringAsync is missing');
                }
            }
        }

        if (!fileUri) {
            Alert.alert('Export Failed', 'Unable to determine a valid storage location on this device.');
            return;
        }

        // Share the result
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'text/csv',
                dialogTitle,
                UTI: 'public.comma-separated-values-text'
            });
        } else {
            Alert.alert('Sharing Unavailable', 'The sharing feature is not available on this device.');
        }

    } catch (error: any) {
        console.error('[Export] Error:', error);
        Alert.alert('System Error', error.message || 'An unexpected error occurred during export.');
    }
};
