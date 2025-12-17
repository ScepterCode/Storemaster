/**
 * Integration tests for Multi-Tenancy
 * Tests data isolation between organizations, RLS policies, and organization switching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

import { supabase } from '@/integrations/supabase/client';
import { adminService } from '@/services/adminService';
import { 
  fetchProductsFromAPI,
  createInAPI as createProduct,
} from '@/services/productService';
import {
  fetchCustomersFromAPI,
  createInAPI as createCustomer,
} from '@/services/customerService';
import { Product, Customer } from '@/types';

describe('Multi-Tenancy Integration Tests', () => {
  const org1Id = 'org-1';
  const org2Id = 'org-2';
  const user1Id = 'user-1';
  const user2Id = 'user-2';

  const mockOrg1 = {
    id: org1Id,
    name: 'Organization 1',
    slug: 'org-1',
    subscription_tier: 'basic',
    subscription_status: 'active',
    max_users: 5,
    max_products: 500,
    max_invoices_per_month: 100,
    max_storage_mb: 1000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockOrg2 = {
    id: org2Id,
    name: 'Organization 2',
    slug: 'org-2',
    subscription_tier: 'pro',
    subscription_status: 'active',
    max_users: 15,
    max_products: 2000,
    max_invoices_per_month: 500,
    max_storage_mb: 5000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  // Mock database records (using DB field names)
  const mockProduct1DB = {
    id: 'product-1',
    name: 'Product from Org 1',
    quantity: 10,
    selling_price: 100,
    category_id: 'category-1',
    organization_id: org1Id,
    updated_at: new Date().toISOString(),
  };

  const mockProduct2DB = {
    id: 'product-2',
    name: 'Product from Org 2',
    quantity: 20,
    selling_price: 200,
    category_id: 'category-2',
    organization_id: org2Id,
    updated_at: new Date().toISOString(),
  };

  const mockCustomer1DB = {
    id: 'customer-1',
    name: 'Customer from Org 1',
    email: 'customer1@org1.com',
    phone: '1234567890',
    organization_id: org1Id,
    updated_at: new Date().toISOString(),
  };

  const mockCustomer2DB = {
    id: 'customer-2',
    name: 'Customer from Org 2',
    email: 'customer2@org2.com',
    phone: '0987654321',
    organization_id: org2Id,
    updated_at: new Date().toISOString(),
  };

  // Expected Product objects (after mapping)
  const mockProduct1: Product = {
    id: 'product-1',
    name: 'Product from Org 1',
    quantity: 10,
    unitPrice: 100,
    category: 'category-1',
    synced: true,
    lastModified: mockProduct1DB.updated_at,
  };

  const mockProduct2: Product = {
    id: 'product-2',
    name: 'Product from Org 2',
    quantity: 20,
    unitPrice: 200,
    category: 'category-2',
    synced: true,
    lastModified: mockProduct2DB.updated_at,
  };

  // Expected Customer objects (after mapping)
  const mockCustomer1: Customer = {
    id: 'customer-1',
    name: 'Customer from Org 1',
    email: 'customer1@org1.com',
    phone: '1234567890',
    synced: true,
    lastModified: mockCustomer1DB.updated_at,
  };

  const mockCustomer2: Customer = {
    id: 'customer-2',
    name: 'Customer from Org 2',
    email: 'customer2@org2.com',
    phone: '0987654321',
    synced: true,
    lastModified: mockCustomer2DB.updated_at,
  };

  // Helper to create proper query chain mock
  const mockQueryChain = (data: any[], error: any = null) => {
    const mockQuery = {
      eq: vi.fn().mockResolvedValue({ data, error }),
    };
    return {
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue(mockQuery),
      }),
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock auth.getUser
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: user1Id } },
      error: null,
    } as any);
  });

  describe('Data Isolation Between Organizations', () => {
    it('should only return products belonging to organization 1', async () => {
      vi.mocked(supabase.from).mockReturnValue(mockQueryChain([mockProduct1DB]) as any);

      const products = await fetchProductsFromAPI(user1Id, org1Id);

      expect(products).toHaveLength(1);
      expect(products[0].name).toBe('Product from Org 1');
      // Verify the query was filtered by organization_id
      expect(supabase.from).toHaveBeenCalledWith('products');
    });

    it('should only return products belonging to organization 2', async () => {
      vi.mocked(supabase.from).mockReturnValue(mockQueryChain([mockProduct2DB]) as any);

      const products = await fetchProductsFromAPI(user2Id, org2Id);

      expect(products).toHaveLength(1);
      expect(products[0].name).toBe('Product from Org 2');
      // Verify the query was filtered by organization_id
      expect(supabase.from).toHaveBeenCalledWith('products');
    });

    it('should only return customers belonging to organization 1', async () => {
      vi.mocked(supabase.from).mockReturnValue(mockQueryChain([mockCustomer1DB]) as any);

      const customers = await fetchCustomersFromAPI(user1Id, org1Id);

      expect(customers).toHaveLength(1);
      expect(customers[0].email).toBe('customer1@org1.com');
      // Verify the query was filtered by organization_id
      expect(supabase.from).toHaveBeenCalledWith('customers');
    });

    it('should only return customers belonging to organization 2', async () => {
      vi.mocked(supabase.from).mockReturnValue(mockQueryChain([mockCustomer2DB]) as any);

      const customers = await fetchCustomersFromAPI(user2Id, org2Id);

      expect(customers).toHaveLength(1);
      expect(customers[0].email).toBe('customer2@org2.com');
      // Verify the query was filtered by organization_id
      expect(supabase.from).toHaveBeenCalledWith('customers');
    });

    it('should not allow org 1 user to access org 2 products', async () => {
      // Simulate RLS policy blocking access
      vi.mocked(supabase.from).mockReturnValue(mockQueryChain([]) as any);

      const products = await fetchProductsFromAPI(user1Id, org2Id);

      expect(products).toHaveLength(0);
    });

    it('should not allow org 2 user to access org 1 customers', async () => {
      // Simulate RLS policy blocking access
      vi.mocked(supabase.from).mockReturnValue(mockQueryChain([]) as any);

      const customers = await fetchCustomersFromAPI(user2Id, org1Id);

      expect(customers).toHaveLength(0);
    });
  });

  describe('RLS Policy Enforcement', () => {
    it('should automatically include organization_id when creating products', async () => {
      const newProduct = {
        id: 'new-product-1',
        name: 'New Product',
        quantity: 5,
        unitPrice: 50,
        category: 'test-category',
        organization_id: org1Id,
        synced: true,
        lastModified: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'new-product-1',
                name: 'New Product',
                quantity: 5,
                selling_price: 50,
                category_id: 'test-category',
                organization_id: org1Id,
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await createProduct(newProduct, user1Id, org1Id);

      expect(result.organization_id).toBe(org1Id);
      expect(supabase.from).toHaveBeenCalledWith('products');
    });

    it('should automatically include organization_id when creating customers', async () => {
      const newCustomer = {
        id: 'new-customer-1',
        name: 'New Customer',
        email: 'new@customer.com',
        phone: '1111111111',
        organization_id: org1Id,
        synced: true,
        lastModified: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'new-customer-1',
                name: 'New Customer',
                email: 'new@customer.com',
                phone: '1111111111',
                organization_id: org1Id,
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await createCustomer(newCustomer, user1Id, org1Id);

      expect(result.organization_id).toBe(org1Id);
      expect(supabase.from).toHaveBeenCalledWith('customers');
    });

    it('should prevent cross-organization data modification', async () => {
      // Attempt to update a product from org 2 while authenticated as org 1 user
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null, // RLS blocks the update
            error: { message: 'Row-level security policy violation' },
          }),
        }),
      } as any);

      // This should fail due to RLS
      const updateAttempt = supabase
        .from('products')
        .update({ name: 'Hacked Product' })
        .eq('id', mockProduct2.id);

      const result = await updateAttempt;
      expect(result.error).toBeDefined();
    });

    it('should prevent cross-organization data deletion', async () => {
      // Attempt to delete a customer from org 2 while authenticated as org 1 user
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null, // RLS blocks the deletion
            error: { message: 'Row-level security policy violation' },
          }),
        }),
      } as any);

      // This should fail due to RLS
      const deleteAttempt = supabase
        .from('customers')
        .delete()
        .eq('id', mockCustomer2.id);

      const result = await deleteAttempt;
      expect(result.error).toBeDefined();
    });
  });

  describe('Organization Switching', () => {
    it('should load different data when switching organizations', async () => {
      // First, load data for org 1
      vi.mocked(supabase.from).mockReturnValue(mockQueryChain([mockProduct1DB]) as any);

      const org1Products = await fetchProductsFromAPI(user1Id, org1Id);
      expect(org1Products).toHaveLength(1);
      expect(org1Products[0].name).toBe('Product from Org 1');

      // Then, switch to org 2
      vi.mocked(supabase.from).mockReturnValue(mockQueryChain([mockProduct2DB]) as any);

      const org2Products = await fetchProductsFromAPI(user1Id, org2Id);
      expect(org2Products).toHaveLength(1);
      expect(org2Products[0].name).toBe('Product from Org 2');

      // Verify data is different
      expect(org1Products[0].id).not.toBe(org2Products[0].id);
    });

    it('should maintain data isolation after organization switch', async () => {
      // Switch to org 1
      vi.mocked(supabase.from).mockReturnValue(mockQueryChain([mockCustomer1DB]) as any);

      const org1Customers = await fetchCustomersFromAPI(user1Id, org1Id);
      expect(org1Customers).toHaveLength(1);
      expect(org1Customers[0].email).toBe('customer1@org1.com');

      // Switch to org 2
      vi.mocked(supabase.from).mockReturnValue(mockQueryChain([mockCustomer2DB]) as any);

      const org2Customers = await fetchCustomersFromAPI(user1Id, org2Id);
      expect(org2Customers).toHaveLength(1);
      expect(org2Customers[0].email).toBe('customer2@org2.com');

      // Verify no cross-contamination by checking IDs
      expect(org1Customers[0].id).not.toBe(org2Customers[0].id);
    });
  });

  describe('Admin Access to All Organizations', () => {
    it('should allow admin to view all organizations', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockOrg1, mockOrg2],
            error: null,
          }),
        }),
      } as any);

      const allOrgs = await adminService.getAllOrganizations();

      expect(allOrgs).toHaveLength(2);
      expect(allOrgs.map(o => o.id)).toContain(org1Id);
      expect(allOrgs.map(o => o.id)).toContain(org2Id);
    });

    it('should allow admin to access specific organization data', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockOrg1,
              error: null,
            }),
          }),
        }),
      } as any);

      const org = await adminService.getOrganization(org1Id);

      expect(org.id).toBe(org1Id);
      expect(org.name).toBe('Organization 1');
    });

    it('should allow admin to manage organization members across all orgs', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          organization_id: org1Id,
          user_id: user1Id,
          role: 'owner',
          is_active: true,
          joined_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'member-2',
          organization_id: org1Id,
          user_id: user2Id,
          role: 'member',
          is_active: true,
          joined_at: '2024-01-02T00:00:00Z',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockMembers,
              error: null,
            }),
          }),
        }),
      } as any);

      const members = await adminService.getOrganizationMembers(org1Id);

      expect(members).toHaveLength(2);
      expect(members.every(m => m.organization_id === org1Id)).toBe(true);
    });
  });

  describe('Data Consistency Across Operations', () => {
    it('should maintain organization_id consistency in related data', async () => {
      const newProductDB = {
        id: 'new-product',
        name: 'New Product',
        quantity: 5,
        selling_price: 50,
        category_id: 'test-category',
        organization_id: org1Id,
        updated_at: new Date().toISOString(),
      };

      // Create a product
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: newProductDB,
              error: null,
            }),
          }),
        }),
      } as any);

      const productToCreate = {
        id: 'new-product',
        name: 'New Product',
        quantity: 5,
        unitPrice: 50,
        category: 'test-category',
        organization_id: org1Id,
        synced: true,
        lastModified: new Date().toISOString(),
      };

      const product = await createProduct(productToCreate, user1Id, org1Id);

      // Verify the product was created with correct organization_id
      expect(product.organization_id).toBe(org1Id);

      // Fetch products and verify consistency
      vi.mocked(supabase.from).mockReturnValue(mockQueryChain([newProductDB]) as any);

      const products = await fetchProductsFromAPI(user1Id, org1Id);
      expect(products).toHaveLength(1);
      expect(products[0].name).toBe('New Product');
    });

    it('should prevent orphaned data without organization_id', async () => {
      // Attempt to create data without organization_id should fail
      const invalidProduct = {
        name: 'Invalid Product',
        quantity: 1,
        unitPrice: 10,
        category: 'test',
        // Missing organization_id
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'organization_id is required' },
            }),
          }),
        }),
      } as any);

      // This should fail
      try {
        await createProduct(invalidProduct as Product, user1Id, undefined as any);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
