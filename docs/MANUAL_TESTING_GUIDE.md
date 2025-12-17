# Manual Testing Guide: Offline Scenarios

This guide provides step-by-step instructions for manually testing offline functionality, sync recovery, and conflict resolution in the Store Master application.

## Prerequisites

- Application running locally (npm run dev)
- Browser DevTools open (F12)
- Test user account created and logged in

## Test Scenarios

### Scenario 1: Basic Offline Operation

**Objective**: Verify that the application works when network is disabled

**Steps**:

1. **Setup**
   - Open the application in your browser
   - Log in with your test account
   - Navigate to the Inventory page

2. **Go Offline**
   - Open DevTools (F12)
   - Go to Network tab
   - Check "Offline" checkbox (or set throttling to "Offline")
   - Verify offline indicator appears in the UI

3. **Create Product Offline**
   - Click "Add Product" button
   - Fill in product details:
     - Name: "Offline Product 1"
     - Quantity: 10
     - Unit Price: 99.99
     - Category: Select any category
   - Click "Save"
   - **Expected**: Product appears in the list with a sync indicator showing it's not synced

4. **Update Product Offline**
   - Click edit on the newly created product
   - Change quantity to 15
   - Click "Save"
   - **Expected**: Product updates locally, sync indicator shows pending sync

5. **Verify Local Storage**
   - Open DevTools → Application tab → Local Storage
   - Check `inventory` key - should contain the new product
   - Check `sync_queue` key - should contain pending sync operations
   - **Expected**: Both operations (create and update) are queued

6. **Navigate Between Pages**
   - Navigate to Dashboard
   - Navigate back to Inventory
   - **Expected**: Product is still visible with correct data

### Scenario 2: Sync When Network Restored

**Objective**: Verify that queued operations sync when coming back online

**Steps**:

1. **Continue from Scenario 1** (with offline operations queued)

2. **Check Sync Status**
   - Look for sync status indicator in the UI
   - **Expected**: Shows "X pending operations" or similar

3. **Go Back Online**
   - In DevTools Network tab, uncheck "Offline"
   - **Expected**: Application detects network restoration

4. **Automatic Sync**
   - Wait a few seconds
   - **Expected**: Sync should trigger automatically
   - **Expected**: Sync status updates to show sync in progress

5. **Verify Sync Completion**
   - Check sync status indicator
   - **Expected**: Shows "Last synced: [timestamp]"
   - **Expected**: Product sync indicator changes to "synced"

6. **Verify in Database**
   - Open Supabase dashboard
   - Check products table
   - **Expected**: Product exists with correct data

7. **Verify Sync Queue Cleared**
   - Open DevTools → Application → Local Storage
   - Check `sync_queue` key
   - **Expected**: Queue is empty or only contains failed operations

### Scenario 3: Manual Sync Trigger

**Objective**: Verify manual sync functionality

**Steps**:

1. **Create Operations Offline**
   - Go offline (DevTools Network → Offline)
   - Create 2-3 products
   - Update 1-2 existing products
   - **Expected**: All operations saved locally

2. **Go Back Online**
   - Uncheck "Offline" in DevTools
   - **Do NOT wait for automatic sync**

3. **Trigger Manual Sync**
   - Look for sync button in the UI (usually in header or settings)
   - Click the sync button
   - **Expected**: Sync starts immediately

4. **Monitor Sync Progress**
   - Watch for sync progress indicator
   - **Expected**: Shows number of operations being synced
   - **Expected**: Shows completion message when done

5. **Verify Results**
   - Check that all products are marked as synced
   - Verify in Supabase that all changes are present

### Scenario 4: Conflict Resolution

**Objective**: Test handling of concurrent modifications

**Steps**:

1. **Setup Two Browser Windows**
   - Open application in two different browser windows
   - Log in with the same account in both
   - Navigate to Inventory in both

2. **Create Product in Window 1**
   - In Window 1, create a product:
     - Name: "Conflict Test Product"
     - Quantity: 10
     - Unit Price: 100.00
   - **Expected**: Product syncs successfully

3. **Go Offline in Window 2**
   - In Window 2, go offline (DevTools → Network → Offline)
   - Refresh the page to load the product

4. **Modify in Both Windows**
   - In Window 1 (online): Edit the product, set quantity to 20, save
   - In Window 2 (offline): Edit the same product, set quantity to 30, save
   - **Expected**: Window 1 syncs immediately
   - **Expected**: Window 2 saves locally

5. **Bring Window 2 Online**
   - In Window 2, go back online
   - Wait for automatic sync or trigger manual sync

6. **Check Conflict Handling**
   - **Expected**: System detects concurrent modification
   - **Expected**: Error message appears: "Product was modified by another user"
   - **Expected**: User is prompted to refresh and try again

7. **Resolve Conflict**
   - Refresh Window 2
   - Edit the product again with new quantity
   - Save
   - **Expected**: Update succeeds with latest data

### Scenario 5: Partial Sync Failure

**Objective**: Test handling when some operations fail during sync

**Steps**:

1. **Create Multiple Operations Offline**
   - Go offline
   - Create 3 products
   - Create 2 categories
   - Create 1 customer

2. **Simulate Partial Failure**
   - This requires modifying one of the entities to cause a validation error
   - For example, create a product with a category that doesn't exist
   - Or create a product with invalid data

3. **Go Online and Sync**
   - Go back online
   - Trigger sync (automatic or manual)

4. **Verify Partial Success**
   - **Expected**: Valid operations sync successfully
   - **Expected**: Invalid operations remain in queue
   - **Expected**: Error message shows which operations failed

5. **Check Sync Queue**
   - Open DevTools → Application → Local Storage → sync_queue
   - **Expected**: Failed operations still present with error details
   - **Expected**: Successful operations removed from queue

6. **Fix and Retry**
   - Fix the invalid data (e.g., select valid category)
   - Trigger sync again
   - **Expected**: Previously failed operation now succeeds

### Scenario 6: Sale Processing Offline

**Objective**: Test complete sale flow while offline

**Steps**:

1. **Setup**
   - Ensure you have products with sufficient stock
   - Navigate to Cashdesk/POS page

2. **Go Offline**
   - Open DevTools → Network → Offline

3. **Process Sale**
   - Add products to cart
   - Complete the sale
   - **Expected**: Sale completes successfully
   - **Expected**: Inventory quantities update locally
   - **Expected**: Transaction is saved locally

4. **Verify Local Changes**
   - Navigate to Inventory
   - **Expected**: Product quantities are reduced
   - Navigate to Transactions
   - **Expected**: Transaction appears in list

5. **Go Online and Sync**
   - Go back online
   - Wait for or trigger sync

6. **Verify Sync**
   - **Expected**: Inventory updates sync to database
   - **Expected**: Transaction syncs to database
   - Check Supabase to confirm both updates

### Scenario 7: Long-Term Offline Usage

**Objective**: Test application stability with extended offline use

**Steps**:

1. **Go Offline**
   - Set browser to offline mode

2. **Perform Multiple Operations**
   - Create 10+ products
   - Update 5+ products
   - Delete 2+ products
   - Create 5+ categories
   - Create 3+ customers
   - Process 2+ sales

3. **Verify Local Functionality**
   - Navigate between all pages
   - Search and filter products
   - View reports/dashboard
   - **Expected**: All features work normally

4. **Check Storage Usage**
   - DevTools → Application → Storage
   - **Expected**: localStorage usage is reasonable (< 5MB)

5. **Go Online After Extended Period**
   - Wait 5-10 minutes (simulate extended offline period)
   - Go back online
   - Trigger sync

6. **Verify Bulk Sync**
   - **Expected**: All operations sync in correct order
   - **Expected**: No data loss
   - **Expected**: Sync completes within reasonable time

7. **Verify Data Integrity**
   - Check all entities in Supabase
   - **Expected**: All data matches local state
   - **Expected**: No duplicate entries
   - **Expected**: All relationships intact

### Scenario 8: Network Interruption During Sync

**Objective**: Test resilience when network fails during sync

**Steps**:

1. **Queue Multiple Operations**
   - Go offline
   - Create 10 products
   - Go back online

2. **Start Sync**
   - Trigger manual sync
   - Watch sync progress

3. **Interrupt Network Mid-Sync**
   - After 2-3 seconds, go offline again
   - **Expected**: Sync stops gracefully

4. **Check Sync State**
   - Open sync queue in localStorage
   - **Expected**: Some operations completed
   - **Expected**: Remaining operations still queued
   - **Expected**: No corrupted data

5. **Resume Sync**
   - Go back online
   - Trigger sync again
   - **Expected**: Sync resumes from where it left off
   - **Expected**: No duplicate operations

### Scenario 9: Browser Refresh During Offline Operation

**Objective**: Test data persistence across page reloads

**Steps**:

1. **Create Data Offline**
   - Go offline
   - Create 3 products
   - Update 2 products
   - **Expected**: Changes saved locally

2. **Refresh Browser**
   - Press F5 or Ctrl+R
   - **Expected**: Page reloads

3. **Verify Data Persists**
   - Navigate to Inventory
   - **Expected**: All 3 new products are visible
   - **Expected**: Updated products show new values
   - **Expected**: Sync queue still contains operations

4. **Go Online and Sync**
   - Go back online
   - **Expected**: Sync works normally
   - **Expected**: All data syncs successfully

### Scenario 10: Multiple Tabs Offline

**Objective**: Test behavior with multiple tabs open

**Steps**:

1. **Open Two Tabs**
   - Open application in Tab 1
   - Open application in Tab 2
   - Both tabs logged in with same account

2. **Go Offline in Both**
   - Set offline mode in both tabs

3. **Create Data in Tab 1**
   - In Tab 1, create a product
   - **Expected**: Product appears in Tab 1

4. **Switch to Tab 2**
   - Refresh Tab 2
   - **Expected**: Product from Tab 1 appears (from localStorage)

5. **Create Data in Tab 2**
   - In Tab 2, create a different product
   - **Expected**: Product appears in Tab 2

6. **Check Sync Queue**
   - Both operations should be in sync queue
   - **Expected**: No conflicts or duplicates

7. **Go Online and Sync**
   - Go online in Tab 1
   - Trigger sync
   - **Expected**: Both products sync successfully

## Verification Checklist

After completing all scenarios, verify:

- [ ] All offline operations save locally
- [ ] Sync queue properly tracks operations
- [ ] Automatic sync triggers when coming online
- [ ] Manual sync works on demand
- [ ] Concurrent modifications are detected
- [ ] Partial sync failures are handled gracefully
- [ ] Failed operations can be retried
- [ ] Sale processing works offline
- [ ] Inventory updates sync correctly
- [ ] Data persists across page reloads
- [ ] Multiple tabs don't cause conflicts
- [ ] Network interruptions are handled gracefully
- [ ] No data loss in any scenario
- [ ] UI provides clear sync status feedback
- [ ] Error messages are user-friendly

## Common Issues and Solutions

### Issue: Sync Queue Not Clearing

**Symptoms**: Operations remain in queue after sync

**Check**:
- DevTools Console for errors
- Network tab for failed requests
- Supabase logs for database errors

**Solution**: Check error messages in sync queue items, fix data issues, retry sync

### Issue: Duplicate Entries After Sync

**Symptoms**: Same product appears twice after sync

**Check**:
- Sync queue for duplicate operations
- Product IDs in localStorage vs database

**Solution**: Clear sync queue, refresh data from API

### Issue: Sync Status Not Updating

**Symptoms**: UI shows "syncing" indefinitely

**Check**:
- Browser console for JavaScript errors
- Network tab for stuck requests

**Solution**: Refresh page, check network connectivity

### Issue: Conflict Not Detected

**Symptoms**: Concurrent modifications overwrite each other

**Check**:
- Product lastModified timestamps
- Optimistic locking implementation

**Solution**: Verify updateInAPI includes timestamp check

## Performance Benchmarks

Expected performance metrics:

- **Sync 50 operations**: < 5 seconds
- **Sync 100 operations**: < 10 seconds
- **Read 1000 products from storage**: < 100ms
- **Write 1000 products to storage**: < 200ms
- **getSyncStatus with 500 queued ops**: < 100ms

If performance is significantly worse, investigate:
- localStorage size (should be < 5MB)
- Number of queued operations (consider batching)
- Network latency (check DevTools Network tab)

## Reporting Issues

When reporting issues found during manual testing, include:

1. **Scenario**: Which test scenario
2. **Steps**: Exact steps to reproduce
3. **Expected**: What should happen
4. **Actual**: What actually happened
5. **Screenshots**: UI state, console errors
6. **DevTools Data**: localStorage contents, network requests
7. **Environment**: Browser, OS, network conditions

## Notes

- Always test with realistic data volumes (100+ products)
- Test with slow network conditions (DevTools → Network → Slow 3G)
- Test with intermittent connectivity (toggle offline/online repeatedly)
- Test with different user roles if applicable
- Test on different browsers (Chrome, Firefox, Safari, Edge)
- Test on mobile devices if applicable
