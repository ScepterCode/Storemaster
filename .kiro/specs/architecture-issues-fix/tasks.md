# Implementation Plan

- [x] 1. Create core infrastructure components





  - [x] 1.1 Create enhanced storage manager with sync queue


    - Implement `src/lib/storageManager.ts` with CRUD operations, sync queue management, and data validation
    - Add TypeScript interfaces for `StorageManager`, `SyncOperation`, and `SyncQueueItem`
    - Include methods: `getItems`, `addItem`, `updateItem`, `deleteItem`, `queueSync`, `getSyncQueue`, `clearSyncQueue`
    - _Requirements: 1.1, 1.2, 1.3, 2.5, 7.3_


  - [x] 1.2 Create error handler utility

    - Implement `src/lib/errorHandler.ts` with error classification and context preservation
    - Add TypeScript interfaces for `ErrorHandler`, `ErrorContext`, and `AppError`
    - Include methods: `handleError`, `isNetworkError`, `isValidationError`, `getUserMessage`
    - Implement error type detection for network, validation, auth, and storage errors
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 1.3 Create sync coordinator service


    - Implement `src/services/syncCoordinator.ts` with background sync capabilities
    - Add TypeScript interfaces for `SyncCoordinator`, `SyncReport`, and `SyncStatus`
    - Include methods: `syncAll`, `syncEntity`, `getSyncStatus`, `hasPendingSync`, `setAutoSync`
    - Implement retry logic with exponential backoff
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

  - [x] 1.4 Update type definitions with sync metadata


    - Update `src/types/index.ts` to add `SyncableEntity` interface
    - Extend `Product`, `Category`, `Customer`, `Invoice` types with sync metadata
    - Add `lastModified`, `syncAttempts`, `lastSyncError` fields
    - _Requirements: 7.2, 8.3_

- [x] 2. Refactor product service and hook


  - [x] 2.1 Refactor product service to use new patterns


    - Update `src/services/productService.ts` to use enhanced storage manager
    - Implement standardized `syncEntity` method for products
    - Remove direct localStorage calls, use storage manager instead
    - Add proper error wrapping with context using error handler
    - Return `SyncResult` from all API operations
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 4.1_

  - [x] 2.2 Refactor useProducts hook


    - Update `src/hooks/useProducts.ts` to use refactored service
    - Remove storage logic from hook, delegate to service
    - Implement proper error handling with toast notifications
    - Update return types to use boolean success indicators
    - Add sync status to product state
    - _Requirements: 2.2, 2.3, 2.4, 4.2, 10.1_

  - [x] 2.3 Add unit tests for product service


    - Create test file for product service with mocked Supabase and storage
    - Test CRUD operations, error scenarios, and sync queue integration
    - _Requirements: 1.1, 1.2, 4.1_

- [x] 3. Refactor category service and hook




  - [x] 3.1 Remove categoryUtils and consolidate into category service


    - Delete `src/lib/categoryUtils.ts`
    - Update `src/services/categoryService.ts` to use enhanced storage manager
    - Implement standardized `syncEntity` method for categories
    - Add proper error wrapping with context
    - _Requirements: 6.1, 6.2, 6.3, 2.1_

  - [x] 3.2 Refactor useCategories hook


    - Update `src/hooks/useCategories.ts` to use refactored service
    - Remove storage logic from hook
    - Implement proper error handling with toast notifications
    - Add category validation when used by products
    - _Requirements: 2.2, 2.3, 6.4, 6.5_

  - [x] 3.3 Add unit tests for category service


    - Create test file for category service
    - Test CRUD operations and product reference validation
    - _Requirements: 6.1, 6.3, 6.5_

- [x] 4. Refactor customer service and hook


  - [x] 4.1 Refactor customer service to use new patterns
    - Update `src/services/customerService.ts` to use enhanced storage manager
    - Implement standardized `syncEntity` method for customers
    - Add proper error wrapping with context
    - _Requirements: 1.1, 1.2, 2.1, 4.1_
  - [x] 4.2 Refactor useCustomers hook
    - Update `src/hooks/useCustomers.ts` to use refactored service
    - Remove storage logic from hook
    - Implement proper error handling
    - _Requirements: 2.2, 2.3, 4.2_

  - [x] 4.3 Add unit tests for customer service

    - Create test file for customer service

    - Test CRUD operations and sync scenarios
    - _Requirements: 1.1, 4.1_

- [x] 5. Refactor invoice service and hook


  - [x] 5.1 Refactor invoice service to use new patterns


    - Update `src/services/invoiceService.ts` to use enhanced storage manager
    - Implement standardized `syncEntity` method for invoices
    - Improve invoice items handling with proper transaction support
    - Add proper error wrapping with context
    - _Requirements: 1.1, 1.2, 2.1, 4.1_

  - [x] 5.2 Refactor useInvoices hook


    - Update `src/hooks/useInvoices.ts` to use refactored service
    - Remove storage logic from hook
    - Implement proper error handling
    - Simplify invoice state management
    - _Requirements: 2.2, 2.3, 4.2_

  - [x] 5.3 Add unit tests for invoice service


    - Create test file for invoice service
    - Test invoice and invoice items operations
    - _Requirements: 1.1, 4.1_

- [x] 6. Create and integrate transaction service


  - [x] 6.1 Create standardized transaction service


    - Create `src/services/transactionService.ts` following new patterns
    - Implement methods: `fetchFromAPI`, `createInAPI`, `updateInAPI`, `deleteFromAPI`
    - Implement storage methods using enhanced storage manager
    - Add proper validation for transaction data
    - Remove validation functions from old transaction service, move to new service
    - _Requirements: 5.1, 5.2, 5.3, 7.1_

  - [x] 6.2 Create useTransactions hook
    - Update `src/hooks/useTransactions.ts` to use new transaction service
    - Implement state management for transactions
    - Add loading and error states
    - Implement CRUD operations
    - _Requirements: 2.2, 5.1, 5.5_

  - [x] 6.3 Update transaction loading in manager components


    - Update components that use `loadAllTransactions` to use new hook
    - Replace direct localStorage access with hook usage
    - _Requirements: 5.3, 5.5_

  - [x] 6.4 Add unit tests for transaction service


    - Create test file for transaction service
    - Test data validation and storage operations
    - _Requirements: 5.2, 7.1_

- [x] 7. Update inventory hook to remove direct service calls

  - [x] 7.1 Refactor useInventory hook

    - Update `src/hooks/useInventory.ts` to remove any direct storage operations
    - Ensure it only composes useProducts and useCategories
    - Remove any duplicate logic
    - _Requirements: 2.3, 9.1, 9.2_

- [-] 8. Integrate sync coordinator into application


  - [x] 8.1 Add sync coordinator to app initialization

    - Update `src/App.tsx` to initialize sync coordinator
    - Create sync context provider for app-wide access
    - Implement automatic sync on app startup
    - _Requirements: 8.1, 8.2_

  - [x] 8.2 Create sync status UI component


    - Create `src/components/sync/SyncStatus.tsx` component
    - Display pending sync operations count
    - Show last sync time
    - Indicate sync in progress
    - _Requirements: 8.3, 8.5_

  - [x] 8.3 Add manual sync trigger


    - Add sync button to settings page or header
    - Implement manual sync trigger using sync coordinator
    - Show sync progress and results
    - _Requirements: 8.5_

  - [x] 8.4 Implement automatic background sync
    - Configure sync coordinator to run periodically
    - Implement network status detection
    - Trigger sync when network is restored
    - _Requirements: 8.1, 8.2_

- [x] 9. Fix sale and inventory integration





  - [x] 9.1 Update useSale to use product service properly


    - Update `src/hooks/useSale.ts` to use product service's update method
    - Remove direct product state manipulation
    - Ensure inventory updates are synced to both storage and API
    - Add stock validation before sale completion
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 9.2 Add transaction persistence to useSale


    - Update `processSale` method to use transaction service
    - Remove direct localStorage transaction saving
    - Ensure transactions are properly synced
    - _Requirements: 3.1, 3.5, 5.1_

  - [x] 9.3 Add concurrent inventory update handling


    - Implement optimistic locking or version checking for inventory
    - Handle conflicts when multiple users update same product
    - _Requirements: 3.5, 8.4_

  - [x] 9.4 Add integration tests for sale flow


    - Test complete sale flow from item selection to inventory update
    - Test stock validation
    - Test transaction persistence
    - _Requirements: 3.1, 3.2, 3.4_

- [x] 10. Improve authentication state handling


  - [x] 10.1 Add authentication guards to all service functions
    - Update all service functions to validate userId before API calls
    - Return appropriate errors when user is not authenticated
    - Add type guards for user ID validation
    - _Requirements: 10.1, 10.2, 10.4_

  - [x] 10.2 Update hooks to handle authentication state changes


    - Add effect to detect authentication state changes
    - Clear local state on logout
    - Refresh data on login
    - _Requirements: 10.3, 10.5_

  - [x] 10.3 Add authentication error handling
    - Implement specific handling for auth errors in error handler
    - Redirect to login on auth failure
    - Show appropriate user messages
    - _Requirements: 10.2, 10.3_

- [x] 11. Create data migration utility




  - [x] 11.1 Implement data migration functions


    - Create `src/lib/dataMigration.ts` with migration utilities
    - Implement functions to add sync metadata to existing data
    - Add version checking to prevent duplicate migrations
    - Create migration for each entity type
    - _Requirements: 7.3, 8.1_


  - [x] 11.2 Run migration on app initialization

    - Add migration check to app startup
    - Run migrations if needed
    - Log migration results
    - _Requirements: 7.3_

- [x] 12. Add comprehensive testing


  - [x] 12.1 Add integration tests for critical flows

    - Test offline operation → reconnect → sync flow
    - Test concurrent operations across multiple entities
    - Test error recovery scenarios
    - _Requirements: 1.1, 4.1, 8.2, 8.4_


  - [x] 12.2 Add performance tests

    - Test large dataset handling
    - Test sync performance with many queued operations
    - Measure localStorage usage
    - _Requirements: 8.1_

  - [x] 12.3 Manual testing of offline scenarios


    - Test app functionality with network disabled
    - Test sync when network is restored
    - Test conflict resolution
    - _Requirements: 8.1, 8.2, 8.4_
-

- [x] 13. Documentation and cleanup


  - [x] 13.1 Update service documentation
    - Add JSDoc comments to all service functions
    - Document error handling patterns
    - Document sync behavior
    - _Requirements: 1.4, 4.2_


  - [x] 13.2 Update hook documentation
    - Add JSDoc comments to all hooks
    - Document state management patterns
    - Document error handling
    - _Requirements: 2.2, 4.2_

  - [x] 13.3 Remove deprecated code
    - Remove old categoryUtils file
    - Remove any unused utility functions
    - Clean up commented code
    - _Requirements: 6.2_


  - [x] 13.4 Create developer guide

    - Document the new architecture patterns
    - Provide examples of adding new entities
    - Document sync coordinator usage
    - Document error handling best practices
    - _Requirements: 1.4, 2.1, 4.2_
