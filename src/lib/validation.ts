import { z } from 'zod';

// Product Schema
export const productSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    category: z.string().min(1, "Category is required"),
    price: z.number().min(0, "Price must be non-negative"),
    costPrice: z.number().min(0, "Cost price must be non-negative"),
    stock: z.number().int().min(0, "Stock must be a non-negative integer"),
    status: z.enum(["In Stock", "Low Stock", "Out of Stock"]).optional(),
    image: z.string().nullable().optional().or(z.literal('')),
    images: z.array(z.string()).optional(),
});

// Customer Schema
export const customerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address").nullable().optional().or(z.literal('')),
    phone: z.string().nullable().optional().or(z.literal('')),
    status: z.enum(["Active", "Inactive"]).optional(),
    avatar: z.string().nullable().optional().or(z.literal('')),
    attachment: z.string().nullable().optional().or(z.literal('')),
    totalDebt: z.number().min(0, "Debt must be non-negative").optional(),
});

// Sale Schema
export const saleSchema = z.object({
    customerId: z.string().min(1, "Customer is required"),
    productId: z.string().min(1, "Product is required"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    amount: z.number().min(0, "Amount must be non-negative"),
    quantity: z.number().int().min(1, "Quantity must be at least 1").optional().default(1),
    status: z.enum(["Completed", "Pending", "Refunded"]).optional(),
});
