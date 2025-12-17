# Design Document

## Overview

This design addresses the architectural and communication issues in the Store Master application by establishing consistent patterns for data synchronization, proper separation of concerns, robust error handling, and a unified offline-first strategy. The solution focuses on refactoring the service and hook layers to eliminate duplication, improve maintainability, and ensure data consistency across all modules.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Components                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Custom Hooks Layer                      │
│  - State Management                                          │
│  - Business Logic Orchestration                              │
│  - UI Event Handling                                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Service Layer                           │
│  - Data Persistence (API + Local Storage)                    │
│  - Sync Coordination                                         │
│  - Data Validation                                           │
└─────────────┬───────────────────────────┬───────────────────┘
              │                           │
┌─────────────▼──────────┐   ┌───────────▼──────────────────┐
│   Supabase Client      │   │   Local Storage Manager      │
│   - Remote Database    │   │   - Offline Persistence      │
│   - Authentication     │   │   - Sync Queue               │
└────────────────────────┘   └──────────────────────────────┘
```

### Key Architectural Principles

1. **Offline-First**: All operations work locally first, then sync to remote
2. **Single Responsibility**: Each layer has a clear, distinct purpose
3. **Consistent Patterns**: All entities follow the same CRUD patterns
4. **Error Transparency**: Errors propagate with context through all layers
5. **Type Safety**: Strong typing at all boundaries with runtime validation

## Components and Interfaces

### 1. Enhanced Storage Manager

**Purpose**: Centralized local storage management with sync queue support

**Location**: `src/lib/storageManager.ts`

**Key Features**:
- Unified storage operations for all entities
- Sync queue for failed operations
- Data validation on read/write
- Type-safe operations

**Interface**:
```typescript
interface StorageManager {
  // Core CRUD operations
  getItems<T>(key: string): T[];
  addItem<T>(key: string, item: T): void;
  updateItem<T>(key: string, item: T): void;
  deleteItem<T>(key: string, itemId: string): void;
  
  // Sync queue operations
  queueSync(operation: SyncOperation): void;
  getSyncQueue(): SyncOperation[];
  clearSyncQueue(operationId: string): void;
  
  // Validation
  validateItem<T>(item: unknown, schema: Schema<T>): T;
}

interface SyncOperation {
  id: string;
  entityType: 'product' | 'category' | 'customer' | 'invoice' | 'transaction';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}
```

### 2. Standardized Service Layer

**Purpose**: Consistent data persistence across all entities

**Pattern**: All services follow the same structure

**Service Interface Template**:
```typescript
interface EntityService<T> {
  // API operations
  fetchFromAPI(userId: string): Promise<T[]>;
  createInAPI(entity: T, userId: string): Promise<T>;
  updateInAPI(entity: T): Promise<T>;
  deleteFromAPI(entityId: string): Promise<void>;
  
  // Storage operations
  getFromStorage(): T[];
  saveToStorage(entity: T): void;
  updateInStorage(entity: T): void;
  deleteFromStorage(entityId: string): void;
  
  // Sync coordination
  syncEntity(entity: T, userId: string, operation: 'create' | 'update'): Promise<SyncResult>;
}

interface SyncResult {
  success: boolean;
  synced: boolean;
  error?: Error;
  data?: any;
}
```

### 3. Refactored Hook Layer

**Purpose**: State management and business logic without storage concerns

**Hook Responsibilities**:
- Manage component state
- Orchestrate service calls
- Handle user interactions
- Provide loading/error states
- Trigger UI notifications

**Hook Interface Template**:
```typescript
interface EntityHook<T> {
  // State
  entities: T[];
  loading: boolean;
  error: Error | null;
  
  // Operations
  create(entity: Partial<T>): Promise<boolean>;
  update(entity: T): Promise<boolean>;
  delete(entityId: string): Promise<boolean>;
  refresh(): Promise<void>;
  
  // UI helpers
  dialogOpen: boolean;
  setDialogOpen(open: boolean): void;
}
```

### 4. Sync Coordinator

**Purpose**: Manage background synchronization of offline changes

**Location**: `src/services/syncCoordinator.ts`

**Key Features**:
- Automatic retry of failed syncs
- Conflict resolution
- Batch sync operations
- Sync status reporting

**Interface**:
```typescript
interface SyncCoordinator {
  // Sync operations
  syncAll(userId: string): Promise<SyncReport>;
  syncEntity(entityType: string, userId: string): Promise<SyncReport>;
  
  // Status
  getSyncStatus(): SyncStatus;
  hasPendingSync(): boolean;
  
  // Configuration
  setAutoSync(enabled: boolean): void;
  setSyncInterval(ms: number): void;
}

interface SyncReport {
  totalOperations: number;
  successful: number;
  failed: number;
  errors: Array<{ operation: SyncOperation; error: Error }>;
}

interface SyncStatus {
  lastSyncTime: string | null;
  pendingOperations: number;
  isSyncing: boolean;
}
```

### 5. Error Handler

**Purpose**: Consistent error handling and reporting

**Location**: `src/lib/errorHandler.ts`

**Key Features**:
- Error classification
- Context preservation
- User-friendly messages
- Error logging

**Interface**:
```typescript
interface ErrorHandler {
  handleError(error: unknown, context: ErrorContext): AppError;
  isNetworkError(error: unknown): boolean;
  isValidationError(error: unknown): boolean;
  getUserMessage(error: AppError): string;
}

interface ErrorContext {
  operation: string;
  entityType: string;
  entityId?: string;
  userId?: string;
}

interface AppError extends Error {
  type: 'network' | 'validation' | 'auth' | 'storage' | 'unknown';
  context: ErrorContext;
  originalError?: Error;
  userMessage: string;
}
```

## Data Models

### Enhanced Entity Models

All entities will include sync metadata:

```typescript
interface SyncableEntity {
  id: string;
  synced: boolean;
  lastModified: string;
  syncAttempts?: number;
  lastSyncError?: string;
}

// Example: Enhanced Product
interface Product extends SyncableEntity {
  name: string;
  quantity: number;
  unitPrice: number;
  category?: string;
  description?: string;
}
```

### Sync Queue Schema

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
  lastError?: string;
  status: 'pending' | 'processing' | 'failed' | 'completed';
}
```

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

### Error Handling Strategy

1. **Service Layer**:
   - Catch all errors from API/storage
   - Wrap with context (operation, entity type, etc.)
   - Throw typed AppError
   - Never show UI notifications

2. **Hook Layer**:
   - Catch AppError from services
   - Update error state
   - Show user-friendly toast notifications
   - Log to console for debugging
   - Return success/failure boolean

3. **Component Layer**:
   - Display error state from hooks
   - Provide retry mechanisms
   - Show loading states

### Specific Error Scenarios

**Network Failure**:
- Service: Queue operation for later sync
- Service: Return success=true, synced=false
- Hook: Show "Saved locally, will sync later" message

**Validation Failure**:
- Service: Throw validation error immediately
- Hook: Show specific validation message
- Component: Highlight invalid fields

**Authentication Failure**:
- Service: Throw auth error
- Hook: Redirect to login
- Clear local state

## Testing Strategy

### Unit Tests

**Service Layer Tests**:
- Mock Supabase client
- Mock localStorage
- Test each CRUD operation
- Test error scenarios
- Test sync queue operations
- Verify error context

**Hook Layer Tests**:
- Mock service functions
- Test state updates
- Test error handling
- Test loading states
- Verify toast notifications

**Storage Manager Tests**:
- Test CRUD operations
- Test data validation
- Test sync queue
- Test error recovery

### Integration Tests

**End-to-End Flows**:
- Create entity → verify in storage → verify in API
- Update entity → verify sync
- Delete entity → verify cascade
- Offline operation → reconnect → verify sync
- Concurrent operations → verify consistency

**Sync Coordinator Tests**:
- Queue multiple operations
- Simulate network failure
- Verify retry logic
- Test conflict resolution
- Verify batch sync

### Test Data

- Use factories for test entities
- Mock Supabase responses
- Mock localStorage
- Simulate network conditions

## Implementation Phases

### Phase 1: Foundation (Core Infrastructure)

1. Create enhanced storage manager
2. Create error handler
3. Create sync coordinator base
4. Update type definitions

### Phase 2: Service Layer Refactoring

1. Refactor product service
2. Refactor category service
3. Refactor customer service
4. Refactor invoice service
5. Create transaction service
6. Remove categoryUtils (consolidate into category service)

### Phase 3: Hook Layer Refactoring

1. Refactor useProducts
2. Refactor useCategories
3. Refactor useCustomers
4. Refactor useInvoices
5. Refactor useTransactions
6. Update useInventory (remove direct service calls)

### Phase 4: Sync Integration

1. Integrate sync queue in all services
2. Add sync coordinator to app initialization
3. Create sync status UI component
4. Add manual sync trigger
5. Implement automatic background sync

### Phase 5: Sale/Inventory Integration

1. Update useSale to use product service
2. Ensure inventory updates sync properly
3. Add transaction persistence via transaction service
4. Validate stock before sale completion
5. Handle concurrent inventory updates

### Phase 6: Testing & Validation

1. Add unit tests for all services
2. Add unit tests for all hooks
3. Add integration tests for critical flows
4. Manual testing of offline scenarios
5. Performance testing

## Migration Strategy

### Backward Compatibility

- Maintain existing localStorage keys during transition
- Migrate data format gradually
- Support both old and new patterns temporarily
- Provide data migration utility

### Rollout Plan

1. Deploy foundation changes (non-breaking)
2. Deploy service layer changes (one entity at a time)
3. Deploy hook layer changes (one entity at a time)
4. Enable sync coordinator
5. Monitor for issues
6. Clean up old code

### Data Migration

```typescript
// Migration utility to update existing localStorage data
interface DataMigration {
  migrateProducts(): void;
  migrateCategories(): void;
  migrateCustomers(): void;
  migrateInvoices(): void;
  migrateTransactions(): void;
  addSyncMetadata<T>(items: T[]): (T & SyncableEntity)[];
}
```

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Load entities only when needed
2. **Memoization**: Cache expensive computations in hooks
3. **Batch Operations**: Group multiple sync operations
4. **Debouncing**: Delay sync operations to reduce API calls
5. **Pagination**: Load large datasets in chunks

### Storage Limits

- Monitor localStorage usage
- Implement cleanup for old data
- Warn users when approaching limits
- Provide export functionality

### Network Efficiency

- Batch sync operations
- Use delta sync (only changed data)
- Implement request deduplication
- Add request caching

## Security Considerations

### Data Protection

- Validate all user inputs
- Sanitize data before storage
- Encrypt sensitive data in localStorage
- Implement row-level security in Supabase

### Authentication

- Verify user authentication before all operations
- Handle token expiration gracefully
- Clear sensitive data on logout
- Implement session timeout

### Authorization

- Check permissions before operations
- Validate user ownership of data
- Implement role-based access control
- Audit sensitive operations

## Monitoring and Debugging

### Logging Strategy

- Log all sync operations
- Log all errors with context
- Log performance metrics
- Provide debug mode for development

### Debugging Tools

- Sync status dashboard
- Error log viewer
- Storage inspector
- Network request monitor

### Metrics to Track

- Sync success rate
- Average sync time
- Error frequency by type
- Storage usage
- API response times
