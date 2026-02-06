import { openDB } from 'idb';

const DB_NAME = 'voxxera-pos';
const DB_VERSION = 1;

// Database stores
const STORES = {
  ORDERS: 'orders',
  MENU_ITEMS: 'menuItems',
  CATEGORIES: 'categories',
  TABLES: 'tables',
  RESERVATIONS: 'reservations',
  SETTINGS: 'settings',
  PENDING_SYNC: 'pendingSync', // Queue for syncing when back online
};

// Initialize IndexedDB
export const initDB = async () => {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create object stores
        if (!db.objectStoreNames.contains(STORES.ORDERS)) {
          db.createObjectStore(STORES.ORDERS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.MENU_ITEMS)) {
          db.createObjectStore(STORES.MENU_ITEMS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.TABLES)) {
          db.createObjectStore(STORES.TABLES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.RESERVATIONS)) {
          db.createObjectStore(STORES.RESERVATIONS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
          const syncStore = db.createObjectStore(STORES.PENDING_SYNC, {
            keyPath: 'id',
            autoIncrement: true,
          });
          syncStore.createIndex('type', 'type');
          syncStore.createIndex('timestamp', 'timestamp');
        }
      },
    });
    console.log('[IndexedDB] Database initialized');
    return db;
  } catch (error) {
    console.error('[IndexedDB] Initialization error:', error);
    throw error;
  }
};

// Generic CRUD operations
export const offlineStorage = {
  // Save data to IndexedDB
  async save(storeName, data) {
    try {
      const db = await initDB();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      if (Array.isArray(data)) {
        await Promise.all(data.map(item => {
          // Safety: settings store requires an 'id'
          if (storeName === STORES.SETTINGS && !item.id) {
            item.id = 'default';
          }
          return store.put(item);
        }));
      } else {
        // Safety: settings store requires an 'id'
        if (storeName === STORES.SETTINGS && !data.id) {
          data.id = 'default';
        }
        await store.put(data);
      }

      await tx.done;
      console.log(`[IndexedDB] Saved to ${storeName}:`, data);
      return true;
    } catch (error) {
      console.error(`[IndexedDB] Save error (${storeName}):`, error);
      return false;
    }
  },

  // Get data from IndexedDB
  async get(storeName, key) {
    try {
      const db = await initDB();
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const data = await store.get(key);
      await tx.done;
      return data;
    } catch (error) {
      console.error(`[IndexedDB] Get error (${storeName}):`, error);
      return null;
    }
  },

  // Get all data from IndexedDB
  async getAll(storeName) {
    try {
      const db = await initDB();
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const data = await store.getAll();
      await tx.done;
      return data;
    } catch (error) {
      console.error(`[IndexedDB] GetAll error (${storeName}):`, error);
      return [];
    }
  },

  // Delete data from IndexedDB
  async delete(storeName, key) {
    try {
      const db = await initDB();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.delete(key);
      await tx.done;
      return true;
    } catch (error) {
      console.error(`[IndexedDB] Delete error (${storeName}):`, error);
      return false;
    }
  },

  // Clear all data from a store
  async clear(storeName) {
    try {
      const db = await initDB();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.clear();
      await tx.done;
      return true;
    } catch (error) {
      console.error(`[IndexedDB] Clear error (${storeName}):`, error);
      return false;
    }
  },
};

// Queue operations for sync when back online
export const syncQueue = {
  // Add operation to sync queue
  async add(type, endpoint, method, data) {
    try {
      const db = await initDB();
      const tx = db.transaction(STORES.PENDING_SYNC, 'readwrite');
      const store = tx.objectStore(STORES.PENDING_SYNC);

      const syncItem = {
        type,
        endpoint,
        method,
        data,
        timestamp: Date.now(),
        retries: 0,
      };

      await store.add(syncItem);
      await tx.done;
      console.log('[SyncQueue] Added to queue:', syncItem);
      return true;
    } catch (error) {
      console.error('[SyncQueue] Add error:', error);
      return false;
    }
  },

  // Get all pending sync operations
  async getAll() {
    try {
      const db = await initDB();
      const tx = db.transaction(STORES.PENDING_SYNC, 'readonly');
      const store = tx.objectStore(STORES.PENDING_SYNC);
      const data = await store.getAll();
      await tx.done;
      return data.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('[SyncQueue] GetAll error:', error);
      return [];
    }
  },

  // Remove synced operation from queue
  async remove(id) {
    try {
      const db = await initDB();
      const tx = db.transaction(STORES.PENDING_SYNC, 'readwrite');
      const store = tx.objectStore(STORES.PENDING_SYNC);
      await store.delete(id);
      await tx.done;
      return true;
    } catch (error) {
      console.error('[SyncQueue] Remove error:', error);
      return false;
    }
  },

  // Clear all sync queue
  async clear() {
    return await offlineStorage.clear(STORES.PENDING_SYNC);
  },
};

// Export store names for use in other modules
export { STORES };
