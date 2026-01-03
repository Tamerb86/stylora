/**
 * Test utilities for i18n tests
 */

/**
 * Creates a mock localStorage for testing
 * @returns A mock localStorage implementation
 */
export function createLocalStorageMock(): Storage {
  const storage: Record<string, string> = {};
  
  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach(key => delete storage[key]);
    },
    get length() {
      return Object.keys(storage).length;
    },
    key: (index: number) => Object.keys(storage)[index] || null,
  };
}

/**
 * Sets up localStorage mock for tests
 * Call this in beforeEach to ensure clean state
 */
export function setupLocalStorageMock(): void {
  Object.defineProperty(global, "localStorage", {
    value: createLocalStorageMock(),
    writable: true,
  });
}

/**
 * Cleans up localStorage mock after tests
 * Call this in afterEach
 */
export function cleanupLocalStorageMock(): void {
  if (global.localStorage) {
    global.localStorage.clear();
  }
}
