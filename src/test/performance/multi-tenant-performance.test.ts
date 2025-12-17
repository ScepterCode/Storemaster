/**
 * Multi-Tenant Performance Tests
 * 
 * Tests performance of multi-tenant operations with caching and optimization
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  performanceCache,
  cacheKeys,
  cachedQuery,
  batchOptimizer,
  performanceMonitor,
  measureQuery,
} from '@/lib/performanceOptimizations';

describe('Multi-Tenant Performance Tests', () => {
  beforeEach(() => {
    performanceCache.clear();
    batchOptimizer.clear();
    performanceMonitor.clear();
  });

  afterEach(() => {
    performanceCache.clear();
  });

  describe('Caching Performance', () => {
    it('should cache organization data and retrieve quickly', async () => {
      const orgId = 'org-123';
      const mockOrg = {
        id: orgId,
        name: 'Test Org',
        subscription_tier: 'pro',
      };

      // Simulate slow query
      const slowQuery = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockOrg;
      };

      // First call - should be slow
      const start1 = performance.now();
      const result1 = await cachedQuery(cacheKeys.organization(orgId), slowQuery);
      const duration1 = performance.now() - start1;

      expect(result1).toEqual(mockOrg);
      expect(duration1).toBeGreaterThan(90); // Should take at least 100ms

      // Second call - should be fast (cached)
      const start2 = performance.now();
      const result2 = await cachedQuery(cacheKeys.organization(orgId), slowQuery);
      const duration2 = performance.now() - start2;

      expect(result2).toEqual(mockOrg);
      expect(duration2).toBeLessThan(10); // Should be nearly instant
    });

    it('should handle cache expiration', async () => {
      const key = 'test-key';
      const data = { value: 'test' };
      const shortTTL = 50; // 50ms

      // Set with short TTL
      performanceCache.set(key, data, shortTTL);

      // Should be available immediately
      const cached1 = performanceCache.get(key);
      expect(cached1).toEqual(data);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 60));

      // Should be expired
      const cached2 = performanceCache.get(key);
      expect(cached2).toBeNull();
    });

    it('should invalidate cache by pattern', () => {
      const orgId = 'org-456';

      // Set multiple cache entries
      performanceCache.set(cacheKeys.organization(orgId), { id: orgId });
      performanceCache.set(cacheKeys.organizationMembers(orgId), []);
      performanceCache.set(cacheKeys.organizationStats(orgId), {});
      performanceCache.set(cacheKeys.organization('other-org'), { id: 'other' });

      // Invalidate all entries for orgId
      performanceCache.invalidatePattern(`^org:${orgId}:`);

      // Organization-specific caches should be cleared
      expect(performanceCache.get(cacheKeys.organizationMembers(orgId))).toBeNull();
      expect(performanceCache.get(cacheKeys.organizationStats(orgId))).toBeNull();

      // Other organization cache should remain
      expect(performanceCache.get(cacheKeys.organization('other-org'))).not.toBeNull();
    });

    it('should provide cache statistics', () => {
      performanceCache.set('key1', 'value1');
      performanceCache.set('key2', 'value2');
      performanceCache.set('key3', 'value3');

      const stats = performanceCache.getStats();
      expect(stats.size).toBe(3);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
      expect(stats.keys).toContain('key3');
    });
  });

  describe('Query Deduplication', () => {
    it('should deduplicate identical concurrent queries', async () => {
      let queryCount = 0;
      const slowQuery = async () => {
        queryCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return { data: 'result' };
      };

      // Fire multiple identical queries concurrently
      const promises = [
        batchOptimizer.deduplicate('query-1', slowQuery),
        batchOptimizer.deduplicate('query-1', slowQuery),
        batchOptimizer.deduplicate('query-1', slowQuery),
      ];

      const results = await Promise.all(promises);

      // All should return same result
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);

      // Query should only execute once
      expect(queryCount).toBe(1);
    });

    it('should not deduplicate different queries', async () => {
      let queryCount = 0;
      const slowQuery = async () => {
        queryCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return { data: 'result' };
      };

      // Fire different queries concurrently
      const promises = [
        batchOptimizer.deduplicate('query-1', slowQuery),
        batchOptimizer.deduplicate('query-2', slowQuery),
        batchOptimizer.deduplicate('query-3', slowQuery),
      ];

      await Promise.all(promises);

      // Each query should execute
      expect(queryCount).toBe(3);
    });
  });

  describe('Performance Monitoring', () => {
    it('should record query execution times', async () => {
      const queryName = 'test-query';

      // Execute query with measurement
      await measureQuery(queryName, async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'result';
      });

      await measureQuery(queryName, async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        return 'result';
      });

      const avgTime = performanceMonitor.getAverageQueryTime(queryName);
      expect(avgTime).toBeGreaterThan(30);
      expect(avgTime).toBeLessThan(60);
    });

    it('should track multiple query types', async () => {
      await measureQuery('query-1', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      await measureQuery('query-2', async () => {
        await new Promise(resolve => setTimeout(resolve, 40));
      });

      const metrics = performanceMonitor.getAllMetrics();
      expect(metrics['query-1']).toBeDefined();
      expect(metrics['query-2']).toBeDefined();
      expect(metrics['query-1'].count).toBe(1);
      expect(metrics['query-2'].count).toBe(1);
    });

    it('should calculate min, max, and average', async () => {
      const queryName = 'variable-query';

      await measureQuery(queryName, async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      await measureQuery(queryName, async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await measureQuery(queryName, async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
      });

      const metrics = performanceMonitor.getAllMetrics();
      const queryMetrics = metrics[queryName];

      expect(queryMetrics.count).toBe(3);
      expect(queryMetrics.min).toBeGreaterThan(5);
      expect(queryMetrics.max).toBeGreaterThan(45);
      expect(queryMetrics.avg).toBeGreaterThan(20);
      expect(queryMetrics.avg).toBeLessThan(40);
    });
  });

  describe('Large Dataset Performance', () => {
    it('should handle caching of large datasets efficiently', () => {
      const orgId = 'org-large';
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        organization_id: orgId,
      }));

      const start = performance.now();
      performanceCache.set(cacheKeys.products(orgId), largeDataset);
      const setDuration = performance.now() - start;

      expect(setDuration).toBeLessThan(50); // Should be fast

      const retrieveStart = performance.now();
      const cached = performanceCache.get(cacheKeys.products(orgId));
      const retrieveDuration = performance.now() - retrieveStart;

      expect(cached).toHaveLength(1000);
      expect(retrieveDuration).toBeLessThan(10); // Should be very fast
    });

    it('should handle multiple organizations efficiently', () => {
      const orgCount = 100;
      const itemsPerOrg = 50;

      const start = performance.now();

      // Cache data for multiple organizations
      for (let i = 0; i < orgCount; i++) {
        const orgId = `org-${i}`;
        const products = Array.from({ length: itemsPerOrg }, (_, j) => ({
          id: `prod-${i}-${j}`,
          organization_id: orgId,
        }));
        performanceCache.set(cacheKeys.products(orgId), products);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500); // Should complete in reasonable time

      // Verify cache size
      const stats = performanceCache.getStats();
      expect(stats.size).toBe(orgCount);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const orgId = 'org-123';

      const key1 = cacheKeys.organization(orgId);
      const key2 = cacheKeys.organization(orgId);

      expect(key1).toBe(key2);
      expect(key1).toBe('org:org-123');
    });

    it('should generate unique keys for different entities', () => {
      const orgId = 'org-123';

      const orgKey = cacheKeys.organization(orgId);
      const membersKey = cacheKeys.organizationMembers(orgId);
      const statsKey = cacheKeys.organizationStats(orgId);

      expect(orgKey).not.toBe(membersKey);
      expect(membersKey).not.toBe(statsKey);
      expect(orgKey).not.toBe(statsKey);
    });
  });

  describe('Memory Management', () => {
    it('should clear cache to free memory', () => {
      // Fill cache
      for (let i = 0; i < 100; i++) {
        performanceCache.set(`key-${i}`, { data: `value-${i}` });
      }

      expect(performanceCache.getStats().size).toBe(100);

      // Clear cache
      performanceCache.clear();

      expect(performanceCache.getStats().size).toBe(0);
    });

    it('should automatically remove expired entries', async () => {
      const shortTTL = 50;

      // Add entries with short TTL
      performanceCache.set('key-1', 'value-1', shortTTL);
      performanceCache.set('key-2', 'value-2', shortTTL);
      performanceCache.set('key-3', 'value-3', 10000); // Long TTL

      expect(performanceCache.getStats().size).toBe(3);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 60));

      // Try to access expired entries (should remove them)
      performanceCache.get('key-1');
      performanceCache.get('key-2');

      // Only long TTL entry should remain
      const remaining = performanceCache.get('key-3');
      expect(remaining).toBe('value-3');
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle concurrent cache operations efficiently', async () => {
      const operations = 1000;
      const start = performance.now();

      const promises = Array.from({ length: operations }, (_, i) => {
        return Promise.resolve().then(() => {
          performanceCache.set(`key-${i}`, `value-${i}`);
          return performanceCache.get(`key-${i}`);
        });
      });

      await Promise.all(promises);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete in reasonable time
      expect(performanceCache.getStats().size).toBe(operations);
    });

    it('should handle concurrent query deduplication', async () => {
      let executionCount = 0;
      const concurrentRequests = 50;

      const slowQuery = async () => {
        executionCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: 'result' };
      };

      const start = performance.now();

      // Fire many concurrent identical queries
      const promises = Array.from({ length: concurrentRequests }, () =>
        batchOptimizer.deduplicate('shared-query', slowQuery)
      );

      await Promise.all(promises);
      const duration = performance.now() - start;

      // Should only execute once despite many concurrent requests
      expect(executionCount).toBe(1);
      // Should complete in roughly the time of one query
      expect(duration).toBeLessThan(200);
    });
  });
});
