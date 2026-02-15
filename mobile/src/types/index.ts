export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    costPrice: number;
    stock: number;
    status: string;
    image?: string | null;
    images?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface Customer {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    avatar?: string | null; // Added
    attachment?: string | null; // Added
    gender?: string | null; // Added
    liability?: number;
    totalDebt?: number; // Added
    creditLimit?: number;
    totalSpent: number;
    lastPurchaseDate?: string | null;
    rating?: number;
    status: string;
    walletBalance: number;
    createdAt: string;
    updatedAt: string;
}

export interface Sale {
    id: string;
    customerId: string;
    productId: string;
    date: string;
    amount: number;
    quantity: number;
    costPriceSnapshot: number;
    status: string;
    items?: string;
    customer?: Customer;
    product?: Product;
    createdAt: string;
    updatedAt: string;
}

export interface Category {
    id: string;
    name: string;
    description?: string | null;
    itemCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface Activity {
    id: string;
    action: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    userId: string;
    userName: string;
    details?: string;
    createdAt: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: 'ADMIN' | 'USER' | 'MANAGER';
    image?: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
}

export interface LoginCredentials {
    email: string;
    password?: string;
    pin?: string;
}

export interface Credit {
    id: string;
    customerId: string;
    amount: number;
    amountPaid: number;
    dueDate: string;
    status: string;
    notes?: string | null;
    paymentTerms?: string | null;
    interestRate?: number | null;
    reference?: string | null;
    contactPhone?: string | null;
    image?: string | null;
    createdAt: string;
    updatedAt: string;
    customer?: Customer;
}
