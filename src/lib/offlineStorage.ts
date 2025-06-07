
/**
 * Retrieves items from localStorage
 */
export function getStoredItems<T>(key: string): T[] {
  try {
    const items = localStorage.getItem(key);
    return items ? JSON.parse(items) : [];
  } catch (error) {
    console.error(`Error retrieving ${key} from local storage:`, error);
    return [];
  }
}

/**
 * Stores items in localStorage
 */
export function storeItems<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error(`Error storing ${key} in local storage:`, error);
  }
}

/**
 * Stores a single item or array in localStorage
 */
export function storeItem<T>(key: string, item: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error(`Error storing ${key} in local storage:`, error);
  }
}

/**
 * Adds an item to localStorage
 */
export function addItem<T>(key: string, item: T): void {
  const items = getStoredItems<T>(key);
  items.push(item);
  storeItems(key, items);
}

/**
 * Updates an item in localStorage
 */
export const updateItem = <T extends { id: string }>(key: string, item: T): void => {
  const items = getStoredItems<T>(key);
  const index = items.findIndex(i => i.id === item.id);
  
  if (index !== -1) {
    items[index] = item;
    localStorage.setItem(key, JSON.stringify(items));
  }
};

/**
 * Removes an item from localStorage
 */
export const deleteItem = <T extends { id: string }>(key: string, itemId: string): void => {
  const items = getStoredItems<T>(key).filter(item => item.id !== itemId);
  localStorage.setItem(key, JSON.stringify(items));
};

// Storage keys
export const STORAGE_KEYS = {
  TRANSACTIONS: 'offline_transactions',
  INVENTORY: 'offline_inventory',
  CUSTOMERS: 'offline_customers',
  INVOICES: 'offline_invoices',
  CATEGORIES: 'offline_categories',
  USER_PREFERENCES: 'user_preferences',
  USERS: 'offline_users',
};
