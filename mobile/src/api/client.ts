import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import { Product, Customer, Sale, Category, Activity, User, LoginCredentials } from '../types';

// Default to Vercel Cloud API
export const API_BASE_URL_DEFAULT = process.env.EXPO_PUBLIC_API_URL || 'https://estommy.vercel.app/api';

let authToken: string | null = null;

const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL_DEFAULT,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

let cachedBaseUrl: string | null = null;

export const getBaseURL = async () => {
    if (cachedBaseUrl) return cachedBaseUrl;
    const saved = await SecureStore.getItemAsync('api_base_url');
    cachedBaseUrl = saved || API_BASE_URL_DEFAULT;
    return cachedBaseUrl;
};

export const setBaseURL = async (url: string) => {
    await SecureStore.setItemAsync('api_base_url', url);
    cachedBaseUrl = url;
    api.defaults.baseURL = url;
};

// Request Interceptor
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    // If baseURL is not set (e.g. initial load), try to get it
    if (!config.baseURL || config.baseURL === API_BASE_URL_DEFAULT) {
        config.baseURL = (await getBaseURL()) || undefined;
    }


    if (!authToken) {
        authToken = (await SecureStore.getItemAsync('auth_token')) || null;
    }

    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
});

// Response Interceptor
api.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        if (error.response?.status === 401) {
            authToken = null;
            await SecureStore.deleteItemAsync('auth_token');
        }
        return Promise.reject(error);
    }
);

/**
 * Generic API Factory to reduce boilerplate
 */
const createAPI = <T>(endpoint: string) => ({
    getAll: (params?: any): Promise<T[]> => api.get(endpoint, { params }),
    getOne: (id: string): Promise<T> => api.get(`${endpoint}/${id}`),
    create: (data: Partial<T>): Promise<T> => api.post(endpoint, data),
    update: (id: string, data: Partial<T>): Promise<T> => api.put(`${endpoint}/${id}`, data),
    delete: (id: string): Promise<void> => api.delete(`${endpoint}/${id}`),
});

export const authAPI = {
    login: (credentials: LoginCredentials): Promise<any> => api.post('/auth/mobile/login', credentials),
    socialLogin: (payload: { provider: string; token: string; email?: string; name?: string; image?: string }): Promise<any> =>
        api.post('/auth/mobile/social', payload),
    logout: async () => {
        authToken = null;
        await SecureStore.deleteItemAsync('auth_token');
    },
    getToken: () => SecureStore.getItemAsync('auth_token'),
    // New: Validate token check
    validateToken: (): Promise<User> => api.get('/profile'),
};

export const productsAPI = createAPI<Product>('/products');
export const salesAPI = createAPI<Sale>('/sales');
export const customersAPI = {
    ...createAPI<Customer>('/customers'),
    search: (params: { email?: string, phone?: string }): Promise<Customer[]> => api.get('/customers', { params }),
    checkAvailability: (field: string, value: string, excludeId?: string): Promise<{ available: boolean }> =>
        api.get('/customers/check', { params: { field, value, excludeId } }),
};

export const categoriesAPI = createAPI<Category>('/categories');
export const creditsAPI = createAPI<any>('/credits');
export const usersAPI = createAPI<User>('/users');
export const profileAPI = {
    get: (): Promise<User> => api.get('/profile'),
    update: (data: Partial<User>): Promise<User> => api.put('/profile', data),
};

export const statsAPI = {
    getDashboard: (): Promise<any> => api.get('/stats/dashboard'),
};

export const filesAPI = {
    upload: async (uri: string): Promise<{ url: string }> => {
        // Force Upload to Vercel
        const uploadUrl = 'https://estommy.vercel.app/api/upload';
        const token = await authAPI.getToken();

        console.warn('[Upload] Starting upload. URI:', uri);

        try {
            const response = await FileSystem.uploadAsync(uploadUrl, uri, {
                fieldName: 'file',
                httpMethod: 'POST',
                uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                headers: {
                    'Accept': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });

            console.warn('[Upload] Response Status:', response.status);

            if (response.status >= 200 && response.status < 300) {
                console.warn('[Upload] Success body:', response.body);
                return JSON.parse(response.body);
            } else {
                console.error('[Upload] Failed body:', response.body);
                throw new Error(`Upload failed: ${response.status}`);
            }
        } catch (error: any) {
            console.error('[Upload] Exception:', error);
            throw error;
        }
    },
};

export const activitiesAPI = {
    getAll: (params?: { limit?: number, entityType?: string, action?: string }): Promise<Activity[]> =>
        api.get('/activities', { params }),
    create: (data: Partial<Activity>): Promise<Activity> => api.post('/activities', data),
};

export const searchAPI = {
    global: (query: string): Promise<{ products: Product[], customers: Customer[], sales: Sale[] }> =>
        api.get('/search', { params: { q: query } }),
};

// Helper for image URLs
export const getImageUrl = (path: string | null | undefined) => {
    if (!path) return undefined;
    // Filter out legacy default avatars to prevent 404/Connection Refused on old IPs
    if (path.includes('male-avatar.png') || path.includes('female-avatar.png')) return undefined;

    if (path.startsWith('http')) return path;
    const currentBase = api.defaults.baseURL || API_BASE_URL_DEFAULT;
    const base = currentBase.replace('/api', '');
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default api;


