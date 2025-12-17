/**
 * Data Migration Utility
 * Handles migration of existing localStorage data to include sync metadata
 */

import { getItems } from './storageManager';
import type { Product, Category, Customer, Invoice, Transaction, SyncableEntity } from '../types';

// Storage keys for each entity type
const STORAGE_KEYS = {
  products: 'products',
  categories: 'categories',
  customers: 'customers',
  invoices: 'invoices',
  transactions: 'transactions',
} as const;

// Migration version tracking
const MIGRATION_VERSION_KEY = 'migration_version';
const CURRENT_MIGRATION_VERSION = 1;

interface MigrationResult {
  entityType: string;
  itemsMigrated: number;
  success: boolean;
  error?: string;
}

interface MigrationReport {
  version: number;
  timestamp: string;
  results: MigrationResult[];
  totalItemsMigrated: number;
  allSuccessful: boolean;
}

/**
 * Check if migrations have already been run
 */
export function getMigrationVersion(): number {
  try {
    const version = localStorage.getItem(MIGRATION_VERSION_KEY);
    return version ? parseInt(version, 10) : 0;
  } catch (error) {
    console.error('Error reading migration version:', error);
    return 0;
  }
}

/**
 * Set the current migration version
 */
function setMigrationVersion(version: number): void {
  try {
    localStorage.setItem(MIGRATION_VERSION_KEY, version.toString());
  } catch (error) {
    console.error('Error setting migration version:', error);
  }
}

/**
 * Check if an item already has sync metadata
 */
function hasSyncMetadata(item: any): item is SyncableEntity {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'synced' in item &&
    'lastModified' in item &&
    typeof item.synced === 'boolean' &&
    typeof item.lastModified === 'string'
  );
}

/**
 * Add sync metadata to an item
 */
function addSyncMetadata<T extends { id: string }>(item: T): T & SyncableEntity {
  // If item already has sync metadata, return as is
  if (hasSyncMetadata(item)) {
    return item as T & SyncableEntity;
  }

  // Add sync metadata
  return {
    ...item,
    synced: true, // Assume existing data is synced
    lastModified: new Date().toISOString(),
    syncAttempts: 0,
  };
}

/**
 * Migrate products to include sync metadata
 */
export function migrateProducts(): MigrationResult {
  const entityType = 'products';
  
  try {
    const products = getItems<Product>(STORAGE_KEYS.products);
    
    if (products.length === 0) {
      return {
        entityType,
        itemsMigrated: 0,
        success: true,
      };
    }

    // Check if migration is needed
    const needsMigration = products.some(product => !hasSyncMetadata(product));
    
    if (!needsMigration) {
      return {
        entityType,
        itemsMigrated: 0,
        success: true,
      };
    }

    // Add sync metadata to all products
    const migratedProducts = products.map(product => addSyncMetadata(product));
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(migratedProducts));
    
    return {
      entityType,
      itemsMigrated: migratedProducts.length,
      success: true,
    };
  } catch (error) {
    console.error('Error migrating products:', error);
    return {
      entityType,
      itemsMigrated: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Migrate categories to include sync metadata
 */
export function migrateCategories(): MigrationResult {
  const entityType = 'categories';
  
  try {
    const categories = getItems<Category>(STORAGE_KEYS.categories);
    
    if (categories.length === 0) {
      return {
        entityType,
        itemsMigrated: 0,
        success: true,
      };
    }

    const needsMigration = categories.some(category => !hasSyncMetadata(category));
    
    if (!needsMigration) {
      return {
        entityType,
        itemsMigrated: 0,
        success: true,
      };
    }

    const migratedCategories = categories.map(category => addSyncMetadata(category));
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(migratedCategories));
    
    return {
      entityType,
      itemsMigrated: migratedCategories.length,
      success: true,
    };
  } catch (error) {
    console.error('Error migrating categories:', error);
    return {
      entityType,
      itemsMigrated: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Migrate customers to include sync metadata
 */
export function migrateCustomers(): MigrationResult {
  const entityType = 'customers';
  
  try {
    const customers = getItems<Customer>(STORAGE_KEYS.customers);
    
    if (customers.length === 0) {
      return {
        entityType,
        itemsMigrated: 0,
        success: true,
      };
    }

    const needsMigration = customers.some(customer => !hasSyncMetadata(customer));
    
    if (!needsMigration) {
      return {
        entityType,
        itemsMigrated: 0,
        success: true,
      };
    }

    const migratedCustomers = customers.map(customer => addSyncMetadata(customer));
    localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(migratedCustomers));
    
    return {
      entityType,
      itemsMigrated: migratedCustomers.length,
      success: true,
    };
  } catch (error) {
    console.error('Error migrating customers:', error);
    return {
      entityType,
      itemsMigrated: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Migrate invoices to include sync metadata
 */
export function migrateInvoices(): MigrationResult {
  const entityType = 'invoices';
  
  try {
    const invoices = getItems<Invoice>(STORAGE_KEYS.invoices);
    
    if (invoices.length === 0) {
      return {
        entityType,
        itemsMigrated: 0,
        success: true,
      };
    }

    const needsMigration = invoices.some(invoice => !hasSyncMetadata(invoice));
    
    if (!needsMigration) {
      return {
        entityType,
        itemsMigrated: 0,
        success: true,
      };
    }

    const migratedInvoices = invoices.map(invoice => addSyncMetadata(invoice));
    localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(migratedInvoices));
    
    return {
      entityType,
      itemsMigrated: migratedInvoices.length,
      success: true,
    };
  } catch (error) {
    console.error('Error migrating invoices:', error);
    return {
      entityType,
      itemsMigrated: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Migrate transactions to include sync metadata
 */
export function migrateTransactions(): MigrationResult {
  const entityType = 'transactions';
  
  try {
    const transactions = getItems<Transaction>(STORAGE_KEYS.transactions);
    
    if (transactions.length === 0) {
      return {
        entityType,
        itemsMigrated: 0,
        success: true,
      };
    }

    const needsMigration = transactions.some(transaction => !hasSyncMetadata(transaction));
    
    if (!needsMigration) {
      return {
        entityType,
        itemsMigrated: 0,
        success: true,
      };
    }

    const migratedTransactions = transactions.map(transaction => addSyncMetadata(transaction));
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(migratedTransactions));
    
    return {
      entityType,
      itemsMigrated: migratedTransactions.length,
      success: true,
    };
  } catch (error) {
    console.error('Error migrating transactions:', error);
    return {
      entityType,
      itemsMigrated: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run all migrations
 */
export function runMigrations(): MigrationReport {
  const currentVersion = getMigrationVersion();
  
  // Check if migrations have already been run
  if (currentVersion >= CURRENT_MIGRATION_VERSION) {
    console.log(`Migrations already up to date (version ${currentVersion})`);
    return {
      version: currentVersion,
      timestamp: new Date().toISOString(),
      results: [],
      totalItemsMigrated: 0,
      allSuccessful: true,
    };
  }

  console.log('Running data migrations...');
  
  const results: MigrationResult[] = [
    migrateProducts(),
    migrateCategories(),
    migrateCustomers(),
    migrateInvoices(),
    migrateTransactions(),
  ];

  const totalItemsMigrated = results.reduce((sum, result) => sum + result.itemsMigrated, 0);
  const allSuccessful = results.every(result => result.success);

  // Update migration version if all successful
  if (allSuccessful) {
    setMigrationVersion(CURRENT_MIGRATION_VERSION);
  }

  const report: MigrationReport = {
    version: CURRENT_MIGRATION_VERSION,
    timestamp: new Date().toISOString(),
    results,
    totalItemsMigrated,
    allSuccessful,
  };

  console.log('Migration complete:', report);
  
  return report;
}

/**
 * Reset migration version (for testing purposes)
 */
export function resetMigrationVersion(): void {
  try {
    localStorage.removeItem(MIGRATION_VERSION_KEY);
    console.log('Migration version reset');
  } catch (error) {
    console.error('Error resetting migration version:', error);
  }
}
