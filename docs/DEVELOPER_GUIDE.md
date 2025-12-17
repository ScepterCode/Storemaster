# Developer Guide: Store Master Architecture

## Overview

This guide documents the architectural patterns, best practices, and conventions used in the Store Master application. It provides guidance for developers working on the codebase and serves as a reference for adding new features.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Multi-Tenant Architecture](#multi-tenant-architecture)
3. [Organization Context](#organization-context)
4. [Row-Level Security (RLS)](#row-level-security-rls)
5. [Service Layer Patterns](#service-layer-patterns)
6. [Hook Layer Patterns](#hook-layer-patterns)
7. [Error Handling](#error-handling)
8. [Offline-First Sync](#offline-first-sync)
9. [Adding New Features](#adding-new-features)
10. [Testing Guidelines](#testing-guidelines)
11. [Best Practices](#best-practices)

---

## Architecture Overview

The application follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      React Components                        │
│                    (UI & User Interaction)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  Organization Context Layer                  │
│              (Multi-Tenant Data Isolation)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Custom Hooks Layer                      │
│              (State Management & Business Logic)             │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Service Layer                           │
│           (Data Persistence & Sync Coordination)             │
└─────────────┬───────────────────────────┬───────────────────┘
              │                           │
┌─────────────▼──────────┐   ┌───────────▼──────────────────┐
│   Supabase + RLS       │   │   Local Storage Manager      │
│   (Remote Database)    │   │   (Offline Persistence)      │
└────────────────────────┘   └──────────────────────────────┘
```

### Key Principles

1. **Multi-Tenant**: Data is isolated by organization with RLS enforcement
2. **Offline-First**: All operations work locally first, then sync to remote
3. **Single Responsibility**: Each layer has a clear, distinct purpose
4. **Consistent Patterns**: All entities follow the same CRUD patterns
5. **Error Transparency**: Errors propagate with context through all layers
6. **Type Safety**: Strong typing at all boundaries with runtime validation

---

## Multi-Tenant Architecture

Store Master is a multi-tenant SaaS platform where each organization has isolated data. This section explains how multi-tenancy is implemented and how to work with it.

### Core Concepts

**Organization**: A business entity that subscribes to the platform. Each organization has:
- Unique identifier (`organization_id`)
- Subscription plan (Free, Basic, Pro, Enterprise)
- Team members with roles (owner, admin, member)
- Isolated data (products, customers, invoices, etc.)

**Data Isolation**: Every data table includes an `organization_id` column. Users can only access data belonging to their organization(s).

**Row-Level Security (RLS)**: Database-level policies automatically filter queries by organization, preventing unauthorized access.

### Multi-Tenant Database Schema

All data tables follow this pattern:

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  price DECIMAL,
  -- other fields
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy
CREATE POLICY "Users can only access their organization's products"
  ON products
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );
```

### Core Multi-Tenant Tables

**organizations**: Stores organization details and subscription info
```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled' | 'expired';
  max_users: number;
  max_products: number;
  max_invoices_per_month: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

**organization_members**: Links users to organizations with roles
```typescript
interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  is_active: boolean;
  joined_at: string;
}
```

**subscriptions**: Tracks subscription and billing details
```typescript
interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string;
  amount: number;
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  flutterwave_subscription_id?: string;
}
```

---

## Organization Context

The Organization Context provides organization data throughout the application. All components and hooks have access to the current organization.

### Using Organization Context

```typescript
import { useOrganization } from '@/contexts/OrganizationContext';

function MyComponent() {
  const {
    organization,      // Current organization
    membership,        // User's membership in this org
    loading,          // Loading state
    error,            // Error state
    isOwner,          // Is user the owner?
    isAdmin,          // Is user an admin?
    canManageUsers,   // Can user manage team members?
    refreshOrganization, // Reload organization data
  } = useOrganization();

  if (loading) return <div>Loading...</div>;
  if (!organization) return <div>No organization</div>;

  return (
    <div>
      <h1>{organization.name}</h1>
      <p>Plan: {organization.subscription_tier}</p>
      {isOwner && <button>Manage Subscription</button>}
    </div>
  );
}
```

### Organization Context Flow

```
User Logs In
     ↓
AuthContext loads user
     ↓
OrganizationContext loads user's memberships
     ↓
Select first/default organization
     ↓
Load organization details
     ↓
Organization available throughout app
```

### Permission Checks

The context provides role-based permission helpers:

```typescript
const { isOwner, isAdmin, canManageUsers } = useOrganization();

// Only owners can manage subscriptions
if (isOwner) {
  return <SubscriptionManagement />;
}

// Admins and owners can manage users
if (canManageUsers) {
  return <TeamManagement />;
}

// All members can view data
return <DataView />;
```

---

## Row-Level Security (RLS)

RLS policies enforce data isolation at the database level. This is the primary security mechanism for multi-tenancy.

### How RLS Works

When a user queries data, Supabase automatically adds a WHERE clause:

```sql
-- User query
SELECT * FROM products;

-- Actual query executed by Supabase
SELECT * FROM products
WHERE organization_id IN (
  SELECT organization_id 
  FROM organization_members 
  WHERE user_id = auth.uid()
);
```

### RLS Policy Patterns

**Standard User Policy** (most tables):
```sql
CREATE POLICY "Users access their organization's data"
  ON table_name
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
```

**Admin Policy** (admin-only tables):
```sql
CREATE POLICY "Only admins can access"
  ON admin_table
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users WHERE is_super_admin = true
    )
  );
```

**Insert Policy** (auto-assign organization):
```sql
CREATE POLICY "Users can insert into their organization"
  ON table_name
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );
```

### Testing RLS Policies

Always test RLS policies to ensure data isolation:

```typescript
// Test: User A cannot access User B's data
const { data: orgAProducts } = await supabase
  .from('products')
  .select('*')
  .eq('organization_id', organizationA.id);

// Should only return products from user's organization
expect(orgAProducts).toHaveLength(expectedCount);
expect(orgAProducts.every(p => p.organization_id === organizationA.id)).toBe(true);
```

### RLS Best Practices

1. **Always enable RLS**: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. **Test policies thoroughly**: Verify users cannot access other organizations' data
3. **Use indexed columns**: RLS policies should use indexed columns for performance
4. **Keep policies simple**: Complex policies can impact performance
5. **Document policies**: Explain the security model in comments

---

## Service Layer Patterns

### Purpose

The service layer handles **only** data persistence operations:
- API communication with Supabase
- Local storage operations
- Sync coordination
- Data validation

**Services should NOT**:
- Manage React state
- Show UI notifications (toasts)
- Handle user interactions
- Contain business logic

### Standard Service Structure

Every entity service follows this structure:

```typescript
/**
 * Entity Service
 * 
 * Handles all entity-related data operations including API synchronization
 * and local storage management.
 */

// 1. Imports
import { Entity } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/lib/offlineStorage';
import storageManager, { SyncQueueItem } from '@/lib/storageManager';
import { handleError, createValidationError, validateUserId } from '@/lib/errorHandler';
import { generateId } from '@/lib/formatter';

// 2. Type Definitions
export interface SyncResult {
  success: boolean;
  synced: boolean;
  error?: Error;
  data?: Entity;
}

// 3. API Operations
export const fetchFromAPI = async (userId?: string): Promise<Entity[]> => {
  validateUserId(userId, { operation: 'fetch', entityType: 'entity' });
  // Implementation
};

export const createInAPI = async (entity: Entity, userId: string): Promise<Entity> => {
  validateUserId(userId, { operation: 'create', entityType: 'entity', entityId: entity.id });
  // Validation
  // Implementation
};

export const updateInAPI = async (entity: Entity): Promise<Entity> => {
  // Validation
  // Implementation
};

export const deleteFromAPI = async (entityId: string): Promise<void> => {
  // Validation
  // Implementation
};

// 4. Storage Operations
export const getFromStorage = (): Entity[] => {
  return storageManager.getItems<Entity>(STORAGE_KEYS.ENTITIES);
};

export const saveToStorage = (entity: Entity): void => {
  storageManager.addItem<Entity>(STORAGE_KEYS.ENTITIES, entity);
};

export const updateInStorage = (entity: Entity): void => {
  storageManager.updateItem<Entity>(STORAGE_KEYS.ENTITIES, entity);
};

export const deleteFromStorage = (entityId: string): void => {
  storageManager.deleteItem<Entity>(STORAGE_KEYS.ENTITIES, entityId);
};

// 5. Sync Coordination
export const syncEntity = async (
  entity: Entity,
  userId: string,
  operation: 'create' | 'update'
): Promise<SyncResult> => {
  // Implementation follows offline-first pattern
};
```

### Sync Entity Pattern

The `syncEntity` function is the primary method for creating or updating entities. It implements the offline-first pattern:

```typescript
export const syncEntity = async (
  entity: Entity,
  userId: string,
  operation: 'create' | 'update'
): Promise<SyncResult> => {
  const result: SyncResult = {
    success: false,
    synced: false,
  };

  try {
    // 1. Validate inputs
    validateUserId(userId, { operation, entityType: 'entity', entityId: entity.id, userId });
    // Additional validation...

    // 2. Prepare entity with sync metadata
    const entityToSync: Entity = {
      ...entity,
      synced: false,
      lastModified: new Date().toISOString(),
      syncAttempts: (entity.syncAttempts || 0) + 1,
    };

    // 3. Try to sync with API first
    try {
      let syncedEntity: Entity;
      
      if (operation === 'create') {
        syncedEntity = await createInAPI(entityToSync, userId);
      } else {
        syncedEntity = await updateInAPI(entityToSync);
      }

      // 4. API sync successful - update storage with synced status
      if (operation === 'create') {
        saveToStorage(syncedEntity);
      } else {
        updateInStorage(syncedEntity);
      }

      result.success = true;
      result.synced = true;
      result.data = syncedEntity;
      
      return result;
    } catch (apiError) {
      // 5. API sync failed - save locally and queue for later sync
      console.warn(`Failed to sync entity to API, saving locally:`, apiError);
      
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      const entityWithError: Entity = {
        ...entityToSync,
        lastSyncError: errorMessage,
      };

      // Save to local storage
      if (operation === 'create') {
        saveToStorage(entityWithError);
      } else {
        updateInStorage(entityWithError);
      }

      // Queue for sync
      const syncOperation: SyncQueueItem = {
        id: generateId(),
        entityType: 'entity',
        entityId: entity.id,
        operation,
        data: entityWithError,
        userId,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 3,
        status: 'pending',
        lastError: errorMessage,
      };
      
      storageManager.queueSync(syncOperation);

      result.success = true;
      result.synced = false;
      result.data = entityWithError;
      result.error = apiError instanceof Error ? apiError : new Error(errorMessage);
      
      return result;
    }
  } catch (error) {
    // 6. Critical error (validation, auth, or storage error)
    result.success = false;
    result.synced = false;
    result.error = error instanceof Error ? error : new Error('Unknown error');
    
    throw handleError(error, {
      operation,
      entityType: 'entity',
      entityId: entity.id,
      userId
    });
  }
};
```

---

## Hook Layer Patterns

### Purpose

The hook layer handles:
- React state management
- Business logic orchestration
- User interaction handling
- UI notifications (toasts)
- Loading and error states

**Hooks should NOT**:
- Directly access localStorage
- Make direct API calls (use services instead)
- Duplicate storage logic

### Standard Hook Structure

Every entity hook follows this structure:

```typescript
/**
 * useEntity Hook
 * 
 * React hook for managing entity state and operations.
 */

import { useState, useEffect } from 'react';
import { Entity } from '@/types';
import { generateId } from '@/lib/formatter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchFromAPI,
  getFromStorage,
  deleteFromAPI,
  deleteFromStorage,
  syncEntity,
} from '@/services/entityService';
import { useAuthErrorHandler } from './useAuthErrorHandler';

export const useEntity = () => {
  // 1. State
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleError: handleAuthError } = useAuthErrorHandler();

  // 2. Load on mount and auth changes
  useEffect(() => {
    // Load from storage immediately
    try {
      const storedEntities = getFromStorage();
      setEntities(storedEntities);
    } catch (err) {
      console.error('Error loading entities from storage:', err);
    }

    // Fetch from API if authenticated
    if (user) {
      fetchEntities();
    } else {
      setEntities([]);
      setLoading(false);
    }
  }, [user]);

  // 3. Fetch function
  const fetchEntities = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const fetchedEntities = await fetchFromAPI(user.id);
      setEntities(fetchedEntities);
    } catch (err) {
      console.error('Error fetching entities:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      handleAuthError(err, 'Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Create function
  const handleAddEntity = async (entityData: Partial<Entity>): Promise<boolean> => {
    // Validation
    if (!entityData.name) {
      toast({
        title: 'Error',
        description: 'Please enter a name',
        variant: 'destructive',
      });
      return false;
    }

    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to add entities.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const entity: Entity = {
        id: generateId(),
        ...entityData,
        synced: false,
        lastModified: new Date().toISOString(),
      };

      // Use syncEntity
      const result = await syncEntity(entity, user.id, 'create');

      if (result.success && result.data) {
        setEntities([...entities, result.data]);

        // Show appropriate message
        if (result.synced) {
          toast({
            title: 'Success',
            description: 'Entity added successfully.',
          });
        } else {
          toast({
            title: 'Saved Locally',
            description: 'Entity saved. Will sync when online.',
          });
        }

        return true;
      }

      return false;
    } catch (err) {
      console.error('Error adding entity:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      handleAuthError(err, 'Failed to add entity. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 5. Update function
  const handleUpdateEntity = async (updatedEntity: Entity): Promise<boolean> => {
    // Similar pattern to handleAddEntity
  };

  // 6. Delete function
  const handleDeleteEntity = async (entityId: string): Promise<boolean> => {
    // Similar pattern with deleteFromAPI and deleteFromStorage
  };

  // 7. Return hook interface
  return {
    entities,
    loading,
    error,
    handleAddEntity,
    handleUpdateEntity,
    handleDeleteEntity,
    refreshEntities: fetchEntities,
  };
};
```

---

## Error Handling

### Error Flow

```
Component Action
      ↓
Hook Function (try/catch)
      ↓
Service Function (try/catch)
      ↓
API/Storage Operation
      ↓
Error Occurs
      ↓
Service catches → wraps with context → throws AppError
      ↓
Hook catches → logs → updates error state → shows toast
      ↓
Component displays error state
```

### Service Layer Error Handling

```typescript
try {
  // Operation
} catch (error) {
  throw handleError(error, {
    operation: 'create',
    entityType: 'product',
    entityId: product.id,
    userId
  });
}
```

### Hook Layer Error Handling

```typescript
try {
  // Call service
} catch (err) {
  console.error('Error:', err);
  setError(err instanceof Error ? err : new Error('Unknown error'));
  handleAuthError(err, 'User-friendly message');
  return false;
}
```

### Error Types

- **Network Errors**: Trigger local storage with sync queue
- **Validation Errors**: Thrown immediately, shown to user
- **Auth Errors**: Redirect to login, clear state
- **Storage Errors**: Critical, thrown immediately

---

## Offline-First Sync

### Sync Coordinator

The sync coordinator manages background synchronization:

```typescript
import syncCoordinator from '@/services/syncCoordinator';

// Manual sync
const report = await syncCoordinator.syncAll(user.id);
console.log(`Synced ${report.successful}/${report.totalOperations} operations`);

// Enable auto-sync
syncCoordinator.setAutoSync(true);
syncCoordinator.setSyncInterval(60000); // 1 minute

// Check status
const status = syncCoordinator.getSyncStatus();
if (status.pendingOperations > 0) {
  console.log(`${status.pendingOperations} operations pending`);
}
```

### Sync Queue

Failed operations are automatically queued:

```typescript
interface SyncQueueItem {
  id: string;
  entityType: 'product' | 'category' | 'customer' | 'invoice' | 'transaction';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  userId: string;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  lastError?: string;
}
```

### Retry Logic

- Exponential backoff: 1s, 2s, 4s, 8s
- Max retries: 3
- Failed operations marked after max retries
- Auto-retry on network reconnect

---

## Adding New Features

Follow these steps to add a new entity or feature to the multi-tenant application:

### 1. Create Database Table with Organization ID

Create a migration file in `supabase/migrations/`:

```sql
-- Create table with organization_id
CREATE TABLE my_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on organization_id for performance
CREATE INDEX idx_my_entities_organization_id ON my_entities(organization_id);

-- Enable RLS
ALTER TABLE my_entities ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can access their organization's entities"
  ON my_entities
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create policy for inserts (ensure organization_id matches user's org)
CREATE POLICY "Users can insert into their organization"
  ON my_entities
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
```

### 2. Define Types

Add to `src/types/index.ts`:

```typescript
export interface MyEntity extends SyncableEntity {
  id: string;
  organization_id: string;  // Required for multi-tenancy
  name: string;
  description?: string;
  user_id?: string;
  // Additional fields
}
```

### 3. Add Storage Key

Add to `src/lib/offlineStorage.ts`:

```typescript
export const STORAGE_KEYS = {
  // ... existing keys
  MY_ENTITIES: 'myEntities',
};
```

**Important**: Local storage must be scoped by organization:

```typescript
// Get storage key scoped to organization
const getStorageKey = (baseKey: string, organizationId: string): string => {
  return `${baseKey}_${organizationId}`;
};
```

### 4. Create Service with Organization Context

Create `src/services/myEntityService.ts`:

```typescript
import { MyEntity } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/lib/offlineStorage';
import storageManager, { SyncQueueItem } from '@/lib/storageManager';
import { handleError, createValidationError, validateUserId } from '@/lib/errorHandler';
import { generateId } from '@/lib/formatter';

// API Operations - organization_id is automatically filtered by RLS
export const fetchFromAPI = async (
  userId: string,
  organizationId: string
): Promise<MyEntity[]> => {
  validateUserId(userId, { operation: 'fetch', entityType: 'myEntity' });
  
  const { data, error } = await supabase
    .from('my_entities')
    .select('*')
    .eq('organization_id', organizationId)  // Explicit filter
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createInAPI = async (
  entity: MyEntity,
  userId: string,
  organizationId: string
): Promise<MyEntity> => {
  validateUserId(userId, { operation: 'create', entityType: 'myEntity', entityId: entity.id });
  
  // Ensure organization_id is set
  const entityWithOrg = {
    ...entity,
    organization_id: organizationId,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from('my_entities')
    .insert(entityWithOrg)
    .select()
    .single();

  if (error) throw error;
  return { ...data, synced: true };
};

// Storage Operations - scope by organization
export const getFromStorage = (organizationId: string): MyEntity[] => {
  const key = `${STORAGE_KEYS.MY_ENTITIES}_${organizationId}`;
  return storageManager.getItems<MyEntity>(key);
};

export const saveToStorage = (entity: MyEntity, organizationId: string): void => {
  const key = `${STORAGE_KEYS.MY_ENTITIES}_${organizationId}`;
  storageManager.addItem<MyEntity>(key, entity);
};

// Sync with organization context
export const syncEntity = async (
  entity: MyEntity,
  userId: string,
  organizationId: string,
  operation: 'create' | 'update'
): Promise<SyncResult> => {
  // Standard sync pattern with organization_id
  // ... implementation
};
```

### 5. Create Hook with Organization Context

Create `src/hooks/useMyEntity.ts`:

```typescript
import { useState, useEffect } from 'react';
import { MyEntity } from '@/types';
import { generateId } from '@/lib/formatter';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/components/ui/use-toast';
import {
  fetchFromAPI,
  getFromStorage,
  syncEntity,
  deleteFromAPI,
  deleteFromStorage,
} from '@/services/myEntityService';
import { useAuthErrorHandler } from './useAuthErrorHandler';

export const useMyEntity = () => {
  const [entities, setEntities] = useState<MyEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { organization } = useOrganization();  // Get organization context
  const { toast } = useToast();
  const { handleError: handleAuthError } = useAuthErrorHandler();

  useEffect(() => {
    // Load from storage immediately (scoped to organization)
    if (organization) {
      try {
        const storedEntities = getFromStorage(organization.id);
        setEntities(storedEntities);
      } catch (err) {
        console.error('Error loading entities from storage:', err);
      }
    }

    // Fetch from API if authenticated and has organization
    if (user && organization) {
      fetchEntities();
    } else {
      setEntities([]);
      setLoading(false);
    }
  }, [user, organization]);  // Re-fetch when organization changes

  const fetchEntities = async () => {
    if (!user || !organization) return;

    try {
      setLoading(true);
      setError(null);

      const fetchedEntities = await fetchFromAPI(user.id, organization.id);
      setEntities(fetchedEntities);
    } catch (err) {
      console.error('Error fetching entities:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      handleAuthError(err, 'Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntity = async (entityData: Partial<MyEntity>): Promise<boolean> => {
    if (!user?.id || !organization) {
      toast({
        title: 'Error',
        description: 'You must be logged in and have an organization.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const entity: MyEntity = {
        id: generateId(),
        organization_id: organization.id,  // Set organization_id
        ...entityData,
        synced: false,
        lastModified: new Date().toISOString(),
      };

      const result = await syncEntity(entity, user.id, organization.id, 'create');

      if (result.success && result.data) {
        setEntities([...entities, result.data]);
        toast({
          title: result.synced ? 'Success' : 'Saved Locally',
          description: result.synced 
            ? 'Entity added successfully.' 
            : 'Entity saved. Will sync when online.',
        });
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error adding entity:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      handleAuthError(err, 'Failed to add entity. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    entities,
    loading,
    error,
    handleAddEntity,
    // ... other methods
    refreshEntities: fetchEntities,
  };
};
```

### 5. Add to Sync Coordinator

Update `src/services/syncCoordinator.ts`:

```typescript
// Add case in syncOperation function
case 'myEntity':
  await syncMyEntityOperation(operation, userId);
  break;

// Implement sync function
async function syncMyEntityOperation(operation: SyncQueueItem, userId: string): Promise<void> {
  const { data } = operation;

  switch (operation.operation) {
    case 'create':
      await supabase.from('my_entities').insert({
        id: data.id,
        name: data.name,
        // ... other fields
        user_id: userId,
      });
      break;
    case 'update':
      await supabase.from('my_entities').update({
        name: data.name,
        // ... other fields
      }).eq('id', data.id);
      break;
    case 'delete':
      await supabase.from('my_entities').delete().eq('id', operation.entityId);
      break;
  }
}
```

### 6. Create UI Components

Create components that use the hook:

```typescript
import { useMyEntity } from '@/hooks/useMyEntity';

export function MyEntityPage() {
  const {
    entities,
    loading,
    handleAddEntity,
    handleUpdateEntity,
    handleDeleteEntity,
  } = useMyEntity();

  // Render UI
}
```

### 8. Add Tests with Multi-Tenancy

Create test files:
- `src/services/__tests__/myEntityService.test.ts`
- `src/test/integration/myEntity-multi-tenancy.integration.test.ts`

**Service Tests**:
```typescript
describe('MyEntityService - Multi-Tenancy', () => {
  it('should include organization_id when creating', async () => {
    const entity = { id: '1', name: 'Test' };
    const result = await createInAPI(entity, 'user-123', 'org-456');
    
    expect(result.organization_id).toBe('org-456');
  });

  it('should filter by organization when fetching', async () => {
    const entities = await fetchFromAPI('user-123', 'org-456');
    
    expect(entities.every(e => e.organization_id === 'org-456')).toBe(true);
  });
});
```

**Integration Tests** (test RLS policies):
```typescript
describe('MyEntity - Data Isolation', () => {
  it('should not allow access to other organization data', async () => {
    // Create two organizations
    const orgA = await createTestOrganization('Org A');
    const orgB = await createTestOrganization('Org B');
    
    // Create entity in Org A
    const entityA = await createInAPI(
      { id: '1', name: 'Entity A' },
      userA.id,
      orgA.id
    );
    
    // Try to fetch from Org B context
    const entitiesB = await fetchFromAPI(userB.id, orgB.id);
    
    // Should not include Org A's entity
    expect(entitiesB.find(e => e.id === entityA.id)).toBeUndefined();
  });
});
```

### 9. Check Subscription Limits

For operations that count against limits, check before allowing:

```typescript
import { checkLimit } from '@/lib/limitChecker';

const handleAddEntity = async (entityData: Partial<MyEntity>): Promise<boolean> => {
  if (!organization) return false;

  // Check if limit allows adding more entities
  const limitCheck = await checkLimit(organization.id, 'products');
  
  if (!limitCheck.allowed) {
    toast({
      title: 'Limit Reached',
      description: `You've reached your plan limit of ${limitCheck.limit} products. Please upgrade to add more.`,
      variant: 'destructive',
    });
    return false;
  }

  // Proceed with creation
  // ...
};
```

**Limits to Check**:
- `products`: Max products per organization
- `users`: Max team members per organization
- `invoices`: Max invoices per month

---

## Testing Guidelines

### Service Tests

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createInAPI, syncEntity } from '../myEntityService';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      // ... other methods
    })),
  },
}));

describe('MyEntityService', () => {
  it('should create entity in API', async () => {
    const entity = { id: '1', name: 'Test' };
    const result = await createInAPI(entity, 'user-123');
    expect(result.synced).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    // Test error scenarios
  });
});
```

### Hook Tests

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMyEntity } from '../useMyEntity';

// Mock service
vi.mock('@/services/myEntityService');

describe('useMyEntity', () => {
  it('should load entities on mount', async () => {
    const { result } = renderHook(() => useMyEntity());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.entities).toHaveLength(2);
    });
  });
});
```

---

## Best Practices

### 1. Always Use Services

❌ **Don't** access localStorage directly in hooks:
```typescript
const products = JSON.parse(localStorage.getItem('products') || '[]');
```

✅ **Do** use service functions:
```typescript
const products = getFromStorage();
```

### 2. Use syncEntity for Create/Update

❌ **Don't** call API and storage separately:
```typescript
await createInAPI(product, userId);
saveToStorage(product);
```

✅ **Do** use syncEntity:
```typescript
const result = await syncEntity(product, userId, 'create');
```

### 3. Handle Sync Status

✅ **Do** show different messages based on sync status:
```typescript
if (result.synced) {
  toast({ title: 'Success', description: 'Saved and synced' });
} else {
  toast({ title: 'Saved Locally', description: 'Will sync when online' });
}
```

### 4. Validate Before Operations

✅ **Do** validate in both hooks and services:
```typescript
// Hook validation (user-facing)
if (!entity.name) {
  toast({ title: 'Error', description: 'Name is required' });
  return false;
}

// Service validation (data integrity)
if (!entity.name) {
  throw createValidationError('Name is required', context);
}
```

### 5. Use TypeScript Strictly

✅ **Do** define proper types:
```typescript
interface MyEntity extends SyncableEntity {
  id: string;
  name: string;
}
```

### 6. Document Your Code

✅ **Do** add JSDoc comments:
```typescript
/**
 * Creates a new entity
 * 
 * @param {MyEntity} entity - The entity to create
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<MyEntity>} The created entity with sync metadata
 * @throws {AppError} If validation fails or API request fails
 */
export const createInAPI = async (entity: MyEntity, userId: string): Promise<MyEntity> => {
  // Implementation
};
```

### 7. Handle Authentication State

✅ **Do** clear state on logout:
```typescript
useEffect(() => {
  if (user) {
    fetchEntities();
  } else {
    setEntities([]);
    setLoading(false);
  }
}, [user]);
```

### 8. Use Error Context

✅ **Do** provide context in errors:
```typescript
throw handleError(error, {
  operation: 'create',
  entityType: 'product',
  entityId: product.id,
  userId,
  organizationId: organization.id  // Include organization context
});
```

### 9. Always Use Organization Context

❌ **Don't** hardcode or skip organization checks:
```typescript
const products = await fetchFromAPI(user.id);  // Missing organization!
```

✅ **Do** always include organization context:
```typescript
const { organization } = useOrganization();
if (!organization) return;

const products = await fetchFromAPI(user.id, organization.id);
```

### 10. Scope Local Storage by Organization

❌ **Don't** use global storage keys:
```typescript
localStorage.setItem('products', JSON.stringify(products));
```

✅ **Do** scope by organization:
```typescript
const key = `${STORAGE_KEYS.PRODUCTS}_${organization.id}`;
storageManager.addItem(key, product);
```

### 11. Test Data Isolation

✅ **Do** always test multi-tenant data isolation:
```typescript
it('should isolate data between organizations', async () => {
  const orgA = await createTestOrganization('Org A');
  const orgB = await createTestOrganization('Org B');
  
  await createProduct({ name: 'Product A' }, orgA.id);
  const productsB = await fetchProducts(orgB.id);
  
  expect(productsB).toHaveLength(0);  // Org B should not see Org A's products
});
```

---

## Common Patterns

### Optimistic Locking

For concurrent update prevention:

```typescript
export const updateInAPI = async (
  entity: Entity,
  expectedLastModified?: string
): Promise<Entity> => {
  if (expectedLastModified) {
    const { data: current } = await supabase
      .from('entities')
      .select('updated_at')
      .eq('id', entity.id)
      .single();
    
    if (current && current.updated_at !== expectedLastModified) {
      throw createValidationError(
        'Entity was modified by another user. Please refresh and try again.',
        { operation: 'update', entityType: 'entity', entityId: entity.id }
      );
    }
  }
  
  // Proceed with update
};
```

### Cascade Operations

For related entities:

```typescript
export const deleteFromAPI = async (categoryId: string): Promise<void> => {
  // Check for dependent entities
  const { data: products } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', categoryId);
  
  if (products && products.length > 0) {
    throw createValidationError(
      `Cannot delete category with ${products.length} products`,
      { operation: 'delete', entityType: 'category', entityId: categoryId }
    );
  }
  
  // Proceed with deletion
};
```

---

## Troubleshooting

### Sync Issues

**Problem**: Operations not syncing
- Check network connectivity
- Verify sync coordinator is enabled: `syncCoordinator.setAutoSync(true)`
- Check sync queue: `syncCoordinator.getSyncStatus()`
- Review browser console for errors

**Problem**: Duplicate data
- Ensure unique IDs using `generateId()`
- Check for race conditions in concurrent operations
- Verify sync queue is clearing completed operations

### State Issues

**Problem**: State not updating
- Verify service functions are being called
- Check that state setters are called with new references
- Ensure useEffect dependencies are correct

**Problem**: Stale data after logout
- Verify logout clears state in useEffect
- Check that user dependency is in useEffect array

---

## Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Vitest Documentation](https://vitest.dev/)

---

## Getting Help

If you encounter issues or have questions:

1. Check this guide for patterns and examples
2. Review existing service and hook implementations
3. Check the test files for usage examples
4. Review error messages and stack traces
5. Consult the team or create an issue

---

## Multi-Tenant Migration Checklist

When migrating existing single-tenant code to multi-tenant:

- [ ] Add `organization_id` column to database table
- [ ] Create RLS policies for the table
- [ ] Update TypeScript interface to include `organization_id`
- [ ] Update service to accept `organizationId` parameter
- [ ] Update service to filter by `organizationId` in queries
- [ ] Update service to include `organizationId` in inserts
- [ ] Scope local storage keys by organization
- [ ] Update hook to use `useOrganization()` context
- [ ] Pass `organizationId` to all service calls
- [ ] Add integration tests for data isolation
- [ ] Test RLS policies manually
- [ ] Update sync coordinator if needed

---

**Last Updated**: December 2024
**Version**: 2.0.0 (Multi-Tenant)
