/**
 * Performance Optimizations
 * 
 * Implements caching and query optimization strategies for the multi-tenant application
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class PerformanceCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance
export const performanceCache = new PerformanceCache();

/**
 * Cache key generators for consistent cache keys
 */
export const cacheKeys = {
  organization: (id: string) => `org:${id}`,
  organizationMembers: (orgId: string) => `org:${orgId}:members`,
  organizationSubscription: (orgId: string) => `org:${orgId}:subscription`,
  organizationStats: (orgId: string) => `org:${orgId}:stats`,
  platformStats: () => 'platform:stats',
  products: (orgId: string) => `org:${orgId}:products`,
  categories: (orgId: string) => `org:${orgId}:categories`,
  customers: (orgId: string) => `org:${orgId}:customers`,
  invoices: (orgId: string) => `org:${orgId}:invoices`,
  transactions: (orgId: string) => `org:${orgId}:transactions`,
};

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  /**
   * Invalidate all organization-related caches
   */
  invalidateOrganization(orgId: string): void {
    performanceCache.invalidatePattern(`^org:${orgId}:`);
    performanceCache.invalidate(cacheKeys.organization(orgId));
  },

  /**
   * Invalidate platform-wide caches
   */
  invalidatePlatform(): void {
    performanceCache.invalidate(cacheKeys.platformStats());
  },

  /**
   * Invalidate specific entity caches
   */
  invalidateProducts(orgId: string): void {
    performanceCache.invalidate(cacheKeys.products(orgId));
  },

  invalidateCategories(orgId: string): void {
    performanceCache.invalidate(cacheKeys.categories(orgId));
  },

  invalidateCustomers(orgId: string): void {
    performanceCache.invalidate(cacheKeys.customers(orgId));
  },

  invalidateInvoices(orgId: string): void {
    performanceCache.invalidate(cacheKeys.invoices(orgId));
  },

  invalidateTransactions(orgId: string): void {
    performanceCache.invalidate(cacheKeys.transactions(orgId));
  },
};

/**
 * Cached query wrapper
 * Wraps a query function with caching logic
 */
export async function cachedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache
  const cached = performanceCache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Execute query
  const result = await queryFn();

  // Store in cache
  performanceCache.set(cacheKey, result, ttl);

  return result;
}

/**
 * Batch query optimizer
 * Batches multiple queries to reduce database round trips
 */
export class BatchQueryOptimizer {
  private pendingQueries: Map<string, Promise<any>> = new Map();

  /**
   * Deduplicate identical queries that are in flight
   */
  async deduplicate<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
    // Check if query is already in flight
    if (this.pendingQueries.has(key)) {
      return this.pendingQueries.get(key) as Promise<T>;
    }

    // Execute query and store promise
    const promise = queryFn().finally(() => {
      // Remove from pending once complete
      this.pendingQueries.delete(key);
    });

    this.pendingQueries.set(key, promise);
    return promise;
  }

  /**
   * Clear all pending queries
   */
  clear(): void {
    this.pendingQueries.clear();
  }
}

export const batchOptimizer = new BatchQueryOptimizer();

/**
 * Query optimization helpers
 */
export const queryOptimizations = {
  /**
   * Optimize SELECT queries by only fetching needed columns
   */
  selectColumns(columns: string[]): string {
    return columns.join(', ');
  },

  /**
   * Add pagination to queries
   */
  paginate(page: number, pageSize: number): { from: number; to: number } {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    return { from, to };
  },

  /**
   * Build efficient filter conditions
   */
  buildFilters(filters: Record<string, any>): Record<string, any> {
    // Remove null/undefined values
    return Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
  },
};

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  /**
   * Record query execution time
   */
  recordQueryTime(queryName: string, duration: number): void {
    if (!this.metrics.has(queryName)) {
      this.metrics.set(queryName, []);
    }
    this.metrics.get(queryName)!.push(duration);
  }

  /**
   * Get average query time
   */
  getAverageQueryTime(queryName: string): number {
    const times = this.metrics.get(queryName);
    if (!times || times.length === 0) return 0;
    
    const sum = times.reduce((a, b) => a + b, 0);
    return sum / times.length;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, { avg: number; count: number; max: number; min: number }> {
    const result: Record<string, any> = {};
    
    for (const [queryName, times] of this.metrics.entries()) {
      if (times.length === 0) continue;
      
      result[queryName] = {
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        count: times.length,
        max: Math.max(...times),
        min: Math.min(...times),
      };
    }
    
    return result;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure query execution time
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await queryFn();
    const duration = performance.now() - start;
    performanceMonitor.recordQueryTime(queryName, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordQueryTime(`${queryName}:error`, duration);
    throw error;
  }
}

/**
 * Database index recommendations
 * These should be added to the database for optimal performance
 */
export const indexRecommendations = [
  // Organizations
  'CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status)',
  'CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active)',
  'CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at DESC)',
  
  // Organization Members
  'CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id)',
  'CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_org_members_is_active ON organization_members(is_active)',
  
  // Subscriptions
  'CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(organization_id)',
  'CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)',
  'CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end)',
  
  // Products
  'CREATE INDEX IF NOT EXISTS idx_products_org_id ON products(organization_id)',
  'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)',
  
  // Categories
  'CREATE INDEX IF NOT EXISTS idx_categories_org_id ON categories(organization_id)',
  
  // Customers
  'CREATE INDEX IF NOT EXISTS idx_customers_org_id ON customers(organization_id)',
  
  // Invoices
  'CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(organization_id)',
  'CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)',
  'CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC)',
  
  // Transactions
  'CREATE INDEX IF NOT EXISTS idx_transactions_org_id ON transactions(organization_id)',
  'CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC)',
  
  // Audit Logs
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id)',
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)',
  'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)',
  
  // Usage Metrics
  'CREATE INDEX IF NOT EXISTS idx_usage_metrics_org_id ON usage_metrics(organization_id)',
  'CREATE INDEX IF NOT EXISTS idx_usage_metrics_type ON usage_metrics(metric_type)',
  'CREATE INDEX IF NOT EXISTS idx_usage_metrics_recorded_at ON usage_metrics(recorded_at DESC)',
];

/**
 * Export performance utilities
 */
export const performanceUtils = {
  cache: performanceCache,
  cacheKeys,
  cacheInvalidation,
  cachedQuery,
  batchOptimizer,
  queryOptimizations,
  performanceMonitor,
  measureQuery,
  indexRecommendations,
};
