/**
 * Quist Recent Queries Service
 * 
 * Manages recent queries in localStorage for quick re-run functionality.
 * Stores queries per organization to maintain multi-tenant isolation.
 * 
 * @module quistRecentQueries
 */

import type { QuistRecentQuery, QuistIntent } from '@/types/quist';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY_PREFIX = 'quist_recent_queries_';
const MAX_RECENT_QUERIES = 10;

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Gets the storage key for an organization
 */
function getStorageKey(organizationId: string): string {
  return `${STORAGE_KEY_PREFIX}${organizationId}`;
}

/**
 * Retrieves recent queries for an organization from localStorage
 */
export function getRecentQueries(organizationId: string): QuistRecentQuery[] {
  try {
    const key = getStorageKey(organizationId);
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    const queries = JSON.parse(stored) as QuistRecentQuery[];
    // Sort by most recent first
    return queries.sort((a, b) => 
      new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    );
  } catch (error) {
    console.error('Error reading recent queries:', error);
    return [];
  }
}

/**
 * Saves a query to recent queries list
 * If the query already exists, updates its timestamp and increments run count
 */
export function saveRecentQuery(
  organizationId: string,
  query: string,
  intent: QuistIntent
): void {
  try {
    const key = getStorageKey(organizationId);
    const existing = getRecentQueries(organizationId);
    
    // Normalize query for comparison (trim and lowercase)
    const normalizedQuery = query.trim().toLowerCase();
    
    // Check if query already exists
    const existingIndex = existing.findIndex(
      q => q.query.trim().toLowerCase() === normalizedQuery
    );
    
    const now = new Date().toISOString();
    
    if (existingIndex >= 0) {
      // Update existing query
      existing[existingIndex] = {
        ...existing[existingIndex],
        executedAt: now,
        runCount: existing[existingIndex].runCount + 1,
        intent, // Update intent in case it changed
      };
    } else {
      // Add new query at the beginning
      existing.unshift({
        query: query.trim(),
        executedAt: now,
        intent,
        runCount: 1,
      });
    }
    
    // Keep only the most recent queries
    const trimmed = existing.slice(0, MAX_RECENT_QUERIES);
    
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving recent query:', error);
  }
}

/**
 * Removes a specific query from recent queries
 */
export function removeRecentQuery(organizationId: string, query: string): void {
  try {
    const key = getStorageKey(organizationId);
    const existing = getRecentQueries(organizationId);
    
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = existing.filter(
      q => q.query.trim().toLowerCase() !== normalizedQuery
    );
    
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing recent query:', error);
  }
}

/**
 * Clears all recent queries for an organization
 */
export function clearRecentQueries(organizationId: string): void {
  try {
    const key = getStorageKey(organizationId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing recent queries:', error);
  }
}

/**
 * Gets the most frequently run queries
 */
export function getFrequentQueries(
  organizationId: string,
  limit: number = 5
): QuistRecentQuery[] {
  const queries = getRecentQueries(organizationId);
  return queries
    .sort((a, b) => b.runCount - a.runCount)
    .slice(0, limit);
}

// ============================================================================
// Export Service Object
// ============================================================================

export const recentQueriesService = {
  getRecentQueries,
  saveRecentQuery,
  removeRecentQuery,
  clearRecentQueries,
  getFrequentQueries,
};

export default recentQueriesService;
