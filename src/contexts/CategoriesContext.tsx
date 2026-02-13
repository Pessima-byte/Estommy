"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { categoriesAPI } from "@/lib/api";

const CategoriesContext = createContext({
  categories: [] as any[],
  addCategory: async (category: any) => {},
  editCategory: async (id: string, updates: any) => {},
  deleteCategory: async (id: string) => {},
  loading: true,
  error: null as string | null,
});

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesAPI.getAll();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  }

  async function addCategory(category: any) {
    try {
      setError(null);
      const newCategory = await categoriesAPI.create(category);
      setCategories((prev) => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
      return newCategory;
    } catch (err: any) {
      setError(err.message || 'Failed to add category');
      throw err;
    }
  }

  async function editCategory(id: string, updates: any) {
    try {
      setError(null);
      const updatedCategory = await categoriesAPI.update(id, updates);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? updatedCategory : c)).sort((a, b) => a.name.localeCompare(b.name))
      );
      return updatedCategory;
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
      throw err;
    }
  }

  async function deleteCategory(id: string) {
    try {
      setError(null);
      await categoriesAPI.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
      throw err;
    }
  }

  return (
    <CategoriesContext.Provider value={{ categories, addCategory, editCategory, deleteCategory, loading, error }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoriesContext);
}


