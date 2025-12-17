/**
 * Vitest setup file
 * Configures test environment and global mocks
 */

import { beforeAll, afterEach, afterAll } from 'vitest';

// Setup localStorage mock
const storage: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => {
    return storage[key] || null;
  },
  setItem: (key: string, value: string) => {
    storage[key] = value;
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    for (const key in storage) {
      delete storage[key];
    }
  },
};

global.localStorage = localStorageMock as any;

beforeAll(() => {
  // Setup code before all tests
});

afterEach(() => {
  // Cleanup after each test
  localStorage.clear();
});

afterAll(() => {
  // Cleanup after all tests
});
