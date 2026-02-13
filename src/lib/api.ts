// API utility functions for making requests to our backend

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Helper for requests
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return handleResponse<T>(response);
}

/**
 * Generic API Factory to reduce boilerplate
 */
const createAPI = <T>(endpoint: string) => ({
  getAll: (params?: Record<string, string>): Promise<T[]> => {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    return request<T[]>(url);
  },
  getOne: (id: string): Promise<T> => request<T>(`${endpoint}/${id}`),
  create: (data: Partial<T>): Promise<T> => request<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<T>): Promise<T> => request<T>(`${endpoint}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => request<void>(`${endpoint}/${id}`, {
    method: 'DELETE',
  }),
});

// Products API
export const productsAPI = createAPI<any>('/products');

// Customers API
export const customersAPI = {
  ...createAPI<any>('/customers'),
  checkAvailability: async (field: string, value: string, excludeId?: string) => {
    const params = new URLSearchParams({ field, value });
    if (excludeId) params.append('excludeId', excludeId);
    return request<{ available: boolean }>(`/customers/check?${params}`);
  },
};

// Sales API
export const salesAPI = {
  ...createAPI<any>('/sales'),
  getAllWithFilters: async (filters?: { startDate?: string; endDate?: string }) => {
    let url = '/sales';
    if (filters?.startDate && filters?.endDate) {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      url += `?${params.toString()}`;
    }
    return request<any[]>(url);
  },
};

// Credits API
export const creditsAPI = createAPI<any>('/credits');

// Profits API
export const profitsAPI = createAPI<any>('/profits');

// Upload API
export const uploadAPI = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<{ url: string; filename: string }>(response);
  },
};

// Backup API
export const backupAPI = {
  create: () => request<any>('/backup'),
  restore: (backupData: any, clearExisting = false) => request<any>('/backup', {
    method: 'POST',
    body: JSON.stringify({ data: backupData, clearExisting }),
  }),
};

// Users API
export const usersAPI = createAPI<any>('/users');

// Activities API
export const activitiesAPI = {
  getAll: (limit = 50, entityType?: string, action?: string) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (entityType) params.append('entityType', entityType);
    if (action) params.append('action', action);
    return request<any[]>(`/activities?${params}`);
  },
  create: (data: any) => request<any>('/activities', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Profile API (for current user)
export const profileAPI = {
  get: async () => {
    const response = await fetch(`${API_BASE}/profile`);
    return handleResponse(response);
  },
  update: async (data: any) => {
    const response = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/categories`);
    return handleResponse(response);
  },
  create: async (data: any) => {
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  update: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  delete: async (id: string) => {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

