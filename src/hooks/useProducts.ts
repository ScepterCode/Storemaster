/**
 * useProducts Hook
 * 
 * React hook for managing product state and operations in the application.
 * Handles product CRUD operations, offline-first sync, and authentication state changes.
 * 
 * @module useProducts
 * 
 * State Management Pattern:
 * - Loads products from local storage immediately on mount
 * - Fetches from API when user is authenticated
 * - Clears state on logout
 * - Updates state optimistically after operations
 * 
 * Error Handling Pattern:
 * - Catches all errors from service layer
 * - Displays user-friendly toast notifications
 * - Handles authentication errors with redirect
 * - Maintains error state for component display
 * 
 * Sync Behavior:
 * - Uses syncEntity for create/update operations
 * - Shows different messages for synced vs. locally-saved data
 * - Handles offline operations gracefully
 * 
 * @returns {Object} Product state and operations
 * @property {Product[]} products - Array of all products
 * @property {boolean} loading - Loading state indicator
 * @property {Error | null} error - Current error state
 * @property {Function} handleAddProduct - Creates a new product
 * @property {Function} handleUpdateProduct - Updates an existing product
 * @property {Function} handleDeleteProduct - Deletes a product
 * @property {Function} refreshProducts - Refreshes products from API
 * 
 * @example
 * const { products, handleAddProduct, loading } = useProducts();
 * 
 * // Add a new product
 * await handleAddProduct();
 * 
 * // Update a product
 * await handleUpdateProduct(updatedProduct);
 */

import { useState, useEffect } from "react";
import { Product } from "@/types";
import { generateId } from "@/lib/formatter";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useToast } from "@/components/ui/use-toast";
import {
  fetchProductsFromAPI,
  getFromStorage,
  deleteFromAPI,
  deleteFromStorage,
  syncEntity,
} from "@/services/productService";
import { AppError, getUserMessage, logError } from "@/lib/errorHandler";
import { useAuthErrorHandler } from "./useAuthErrorHandler";
import { canAddProduct } from "@/lib/limitChecker";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    quantity: 0,
    unitPrice: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { toast } = useToast();
  const { handleError: handleAuthError } = useAuthErrorHandler();

  useEffect(() => {
    // Load products from offline storage (scoped by organization)
    try {
      const storedProducts = getFromStorage(organization?.id);
      setProducts(storedProducts);
    } catch (err) {
      console.error("Error loading products from storage:", err);
    }

    // If user is authenticated and has an organization, fetch data from Supabase
    if (user && organization) {
      fetchProducts();
    } else {
      // Clear state when user logs out or has no organization
      setProducts([]);
      setLoading(false);
    }
  }, [user, organization]);

  const fetchProducts = async () => {
    if (!user || !organization?.id) return;

    try {
      setLoading(true);
      setError(null);

      const fetchedProducts = await fetchProductsFromAPI(user.id, organization.id);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err instanceof Error ? err : new Error("Unknown error fetching products"));
      handleAuthError(err, "Failed to load product data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (): Promise<boolean> => {
    if (!newProduct.name || !newProduct.unitPrice || !newProduct.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields, including product name, unit price, and category.",
        variant: "destructive",
      });
      return false;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to add products.",
        variant: "destructive",
      });
      return false;
    }

    if (!organization?.id) {
      toast({
        title: "Organization Required",
        description: "You must belong to an organization to add products.",
        variant: "destructive",
      });
      return false;
    }

    // Check product limit before adding
    try {
      const canAdd = await canAddProduct(organization.id);
      if (!canAdd) {
        setShowUpgradePrompt(true);
        toast({
          title: "Product Limit Reached",
          description: "You've reached your plan's product limit. Please upgrade to add more products.",
          variant: "destructive",
        });
        return false;
      }
    } catch (err) {
      console.error("Error checking product limit:", err);
      // Continue with product creation if limit check fails
    }

    try {
      setLoading(true);
      setError(null);

      const product: Product = {
        id: generateId(),
        name: newProduct.name,
        quantity: Number(newProduct.quantity) || 0,
        unitPrice: Number(newProduct.unitPrice),
        category: newProduct.category,
        category_id: newProduct.category_id || newProduct.category, // Use category_id if available, fallback to category name
        categoryName: newProduct.categoryName || newProduct.category,
        description: newProduct.description,
        synced: false,
        lastModified: new Date().toISOString(),
      };

      // Use syncEntity to handle both API and storage
      const result = await syncEntity(product, user.id, 'create', organization.id);

      if (result.success && result.data) {
        // Update state with the synced product
        setProducts([...products, result.data]);

        // Show appropriate message based on sync status
        if (result.synced) {
          toast({
            title: "Success",
            description: "Product added successfully.",
            variant: "default",
          });
        } else {
          toast({
            title: "Saved Locally",
            description: "Product saved. Will sync when connection is restored.",
            variant: "default",
          });
        }

        // Reset form and close dialog
        setNewProduct({
          name: "",
          quantity: 0,
          unitPrice: 0,
        });
        setProductDialogOpen(false);

        return true;
      }

      return false;
    } catch (err) {
      console.error("Error adding product:", err);
      setError(err instanceof Error ? err : new Error("Unknown error adding product"));
      handleAuthError(err, "Failed to add product. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product): Promise<boolean> => {
    if (!updatedProduct.id) {
      toast({
        title: "Error",
        description: "Cannot update product without an ID",
        variant: "destructive",
      });
      return false;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to update products.",
        variant: "destructive",
      });
      return false;
    }

    if (!organization?.id) {
      toast({
        title: "Organization Required",
        description: "You must belong to an organization to update products.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Use syncEntity to handle both API and storage
      const result = await syncEntity(updatedProduct, user.id, 'update', organization.id);

      if (result.success && result.data) {
        // Update state with the synced product
        setProducts(products.map((p) => (p.id === result.data!.id ? result.data! : p)));

        // Show appropriate message based on sync status
        if (result.synced) {
          toast({
            title: "Success",
            description: "Product updated successfully.",
            variant: "default",
          });
        } else {
          toast({
            title: "Saved Locally",
            description: "Product updated. Will sync when connection is restored.",
            variant: "default",
          });
        }

        return true;
      }

      return false;
    } catch (err) {
      console.error("Error updating product:", err);
      setError(err instanceof Error ? err : new Error("Unknown error updating product"));
      handleAuthError(err, "Failed to update product. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to delete products.",
        variant: "destructive",
      });
      return false;
    }

    if (!organization?.id) {
      toast({
        title: "Organization Required",
        description: "You must belong to an organization to delete products.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to delete from API first
      try {
        await deleteFromAPI(productId);
        
        toast({
          title: "Success",
          description: "Product deleted successfully.",
          variant: "default",
        });
      } catch (apiError) {
        console.warn("Failed to delete from API, deleting locally:", apiError);
        
        toast({
          title: "Deleted Locally",
          description: "Product deleted locally. Will sync when connection is restored.",
          variant: "default",
        });
      }

      // Always delete from local storage (scoped by organization)
      deleteFromStorage(productId, organization.id);

      // Update state
      setProducts(products.filter((product) => product.id !== productId));

      return true;
    } catch (err) {
      console.error("Error deleting product:", err);
      setError(err instanceof Error ? err : new Error("Unknown error deleting product"));
      handleAuthError(err, "Failed to delete product. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = async (): Promise<void> => {
    await fetchProducts();
  };

  return {
    products,
    setProducts,
    productDialogOpen,
    setProductDialogOpen,
    newProduct,
    setNewProduct,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    loading,
    error,
    refreshProducts,
    showUpgradePrompt,
    setShowUpgradePrompt,
  };
};
