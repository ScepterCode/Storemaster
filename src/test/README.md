# Test Suite Documentation

This directory contains comprehensive tests for the Store Master application, including unit tests, integration tests, and performance tests.

## Setup

### Install Testing Dependencies

First, install vitest and testing utilities:

```bash
npm install -D vitest @testing-library/react @testing-library/react-hooks @testing-library/jest-dom jsdom
```

### Add Test Script to package.json

Add the following script to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest --run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Test Structure

```
src/test/
├── setup.ts                          # Test environment setup
├── integration/                      # Integration tests
│   ├── offline-sync.integration.test.ts
│   ├── concurrent-operations.integration.test.ts
│   └── error-recovery.integration.test.ts
└── performance/                      # Performance tests
    ├── large-dataset.performance.test.ts
    └── sync-performance.performance.test.ts
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- src/test/integration/offline-sync.integration.test.ts
```

### Run Tests in Watch Mode

```bash
npm test
```

### Run Tests Once (CI Mode)

```bash
npm test:run
```

### Run with Coverage

```bash
npm test:coverage
```

### Run Performance Tests Only

```bash
npm test -- src/test/performance
```

### Run Integration Tests Only

```bash
npm test -- src/test/integration
```

## Test Categories

### Integration Tests

Integration tests verify that multiple components work together correctly:

#### 1. Offline Sync Integration Tests
**File**: `integration/offline-sync.integration.test.ts`

Tests the complete offline-first workflow:
- Saving entities locally when offline
- Queuing operations for sync
- Syncing when network is restored
- Handling partial sync failures
- Maintaining sync status

**Run**: `npm test -- offline-sync.integration.test.ts`

#### 2. Concurrent Operations Integration Tests
**File**: `integration/concurrent-operations.integration.test.ts`

Tests handling of simultaneous operations:
- Concurrent creates across different entity types
- Concurrent updates with optimistic locking
- Mixed success and failure scenarios
- Data consistency across operations
- Rapid sequential updates

**Run**: `npm test -- concurrent-operations.integration.test.ts`

#### 3. Error Recovery Integration Tests
**File**: `integration/error-recovery.integration.test.ts`

Tests system resilience and error handling:
- Retry logic with exponential backoff
- Authentication error handling
- Validation error handling
- Max retry attempts
- Corrupted data recovery
- Network timeout handling
- Database constraint violations
- Operation order preservation

**Run**: `npm test -- error-recovery.integration.test.ts`

### Performance Tests

Performance tests measure system performance under load:

#### 1. Large Dataset Performance Tests
**File**: `performance/large-dataset.performance.test.ts`

Tests performance with large amounts of data:
- Reading 1000+ products
- Writing 1000+ products
- Adding items to large datasets
- Updating items in large datasets
- Deleting items from large datasets
- Searching in large datasets
- Sorting large datasets
- Multiple entity types
- localStorage usage measurement
- Capacity estimation

**Run**: `npm test -- large-dataset.performance.test.ts`

**Expected Performance**:
- Read 1000 products: < 100ms
- Write 1000 products: < 200ms
- Add 100 products to 500: < 500ms
- Update 100 in 1000: < 500ms
- Delete 100 from 1000: < 500ms
- Search 5000 products: < 150ms
- Sort 2000 products: < 200ms

#### 2. Sync Performance Tests
**File**: `performance/sync-performance.performance.test.ts`

Tests sync coordinator performance:
- Syncing 50 operations: < 5 seconds
- Syncing 100 operations: < 10 seconds
- Mixed entity types
- Mixed operations (create/update/delete)
- Sync queue read/write performance
- getSyncStatus performance
- Network latency simulation
- Memory usage measurement
- Throughput benchmarking

**Run**: `npm test -- sync-performance.performance.test.ts`

**Expected Performance**:
- Sync 50 operations: < 5 seconds
- Sync 100 operations: < 10 seconds
- Queue read (200 ops): < 100ms
- Queue write (200 ops): < 1 second
- getSyncStatus (500 ops): < 100ms

## Manual Testing

For manual testing scenarios, see the comprehensive guide:

**File**: `docs/MANUAL_TESTING_GUIDE.md`

This guide includes:
- 10 detailed test scenarios
- Step-by-step instructions
- Expected results
- Verification checklists
- Common issues and solutions
- Performance benchmarks
- Issue reporting guidelines

## Test Coverage

To generate a coverage report:

```bash
npm test:coverage
```

This will create a coverage report in the `coverage/` directory.

### Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Key Areas to Cover

- [ ] All service layer functions
- [ ] All hook layer functions
- [ ] Storage manager operations
- [ ] Sync coordinator operations
- [ ] Error handler functions
- [ ] Critical user flows (sale processing, inventory updates)

## Writing New Tests

### Test File Naming Convention

- Unit tests: `*.test.ts`
- Integration tests: `*.integration.test.ts`
- Performance tests: `*.performance.test.ts`

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    localStorage.clear();
  });

  describe('Specific Functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Mocking Supabase

```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      update: vi.fn().mockResolvedValue({ data: {}, error: null }),
      delete: vi.fn().mockResolvedValue({ data: {}, error: null }),
      eq: vi.fn().mockReturnThis(),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  },
}));
```

### Testing Async Operations

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Error Scenarios

```typescript
it('should handle errors gracefully', async () => {
  vi.mocked(someFunction).mockRejectedValue(new Error('Test error'));
  
  try {
    await functionUnderTest();
    expect(true).toBe(false); // Should not reach here
  } catch (error) {
    expect(error).toBeDefined();
    expect((error as Error).message).toContain('Test error');
  }
});
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test:run
      
      - name: Generate coverage
        run: npm test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Troubleshooting

### Tests Not Running

1. Ensure vitest is installed: `npm install -D vitest`
2. Check vitest.config.ts exists and is properly configured
3. Verify test files match the pattern in vitest.config.ts

### Mocks Not Working

1. Ensure mocks are defined before imports
2. Use `vi.clearAllMocks()` in beforeEach
3. Check mock paths match actual import paths

### Performance Tests Failing

1. Run on a consistent environment (not during heavy system load)
2. Adjust thresholds if necessary for your hardware
3. Run multiple times to get average performance

### localStorage Issues

1. Ensure `localStorage.clear()` is called in beforeEach
2. Check that setup.ts properly mocks localStorage
3. Verify jsdom environment is configured in vitest.config.ts

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up after tests (localStorage, mocks)
3. **Descriptive Names**: Use clear, descriptive test names
4. **Arrange-Act-Assert**: Follow the AAA pattern
5. **Mock External Dependencies**: Mock Supabase, network calls, etc.
6. **Test Edge Cases**: Include error scenarios and edge cases
7. **Performance Awareness**: Keep tests fast (< 1s per test)
8. **Avoid Flaky Tests**: Don't rely on timing or random data
9. **Document Complex Tests**: Add comments for complex test logic
10. **Keep Tests Simple**: One assertion per test when possible

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Manual Testing Guide](../../docs/MANUAL_TESTING_GUIDE.md)
- [Requirements Document](../.kiro/specs/architecture-issues-fix/requirements.md)
- [Design Document](../.kiro/specs/architecture-issues-fix/design.md)
