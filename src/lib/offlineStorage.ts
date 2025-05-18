
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
export function updateItem<T extends { id: string }>(key: string, item: T): void {
  const items = getStoredItems<T>(key);
  const index = items.findIndex(i => i.id === item.id);
  if (index !== -1) {
    items[index] = item;
    storeItems(key, items);
  }
}

/**
 * Removes an item from localStorage
 */
export function removeItem<T extends { id: string }>(key: string, itemId: string): void {
  const items = getStoredItems<T>(key);
  const filteredItems = items.filter(item => item.id !== itemId);
  storeItems(key, filteredItems);
}

// Storage keys
export const STORAGE_KEYS = {
  TRANSACTIONS: 'aba_cash_ledger_transactions',
  INVENTORY: 'aba_cash_ledger_inventory',
  CUSTOMERS: 'aba_cash_ledger_customers',
  INVOICES: 'aba_cash_ledger_invoices',
};
