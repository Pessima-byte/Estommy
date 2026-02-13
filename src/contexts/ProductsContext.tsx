"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { productsAPI } from "@/lib/api";
import { ActivityLogger } from "@/lib/activityLogger";

const ProductsContext = createContext({
  products: [] as any[],
  addProduct: async (product: any) => { return {} as any },
  editProduct: async (id: string, updates: any) => { return {} as any },
  deleteProduct: async (id: string) => { },
  loading: true,
  error: null as string | null,
});

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
    // Background polling for real-time sync
    const interval = setInterval(() => loadProducts(true), 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadProducts(silent = false) {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await productsAPI.getAll();
      setProducts(data);
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function addProduct(product: any) {
    try {
      setError(null);
      const newProduct = await productsAPI.create(product);
      setProducts((prev) => [...prev, newProduct]);
      ActivityLogger.product.created(newProduct.name, newProduct.id);
      return newProduct;
    } catch (err: any) {
      setError(err.message || 'Failed to add product');
      throw err;
    }
  }

  async function editProduct(id: string, updates: any) {
    try {
      setError(null);
      const updatedProduct = await productsAPI.update(id, updates);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? updatedProduct : p))
      );
      ActivityLogger.product.updated(updatedProduct.name, updatedProduct.id);
      return updatedProduct;
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
      throw err;
    }
  }

  async function deleteProduct(id: string) {
    try {
      setError(null);
      const product = products.find(p => p.id === id);
      await productsAPI.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (product) {
        ActivityLogger.product.deleted(product.name, id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
      throw err;
    }
  }

  return (
    <ProductsContext.Provider value={{ products, addProduct, editProduct, deleteProduct, loading, error }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext);
} 