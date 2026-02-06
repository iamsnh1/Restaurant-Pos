import { syncQueue, offlineStorage, STORES } from './offlineStorage';
import api from './api';
import { API_URL } from './api';

// Check if online
export const isOnline = () => {
  return navigator.onLine;
};

// Sync pending operations when back online
export const syncPendingOperations = async () => {
  if (!isOnline()) {
    console.log('[OfflineSync] Still offline, skipping sync');
    return;
  }

  console.log('[OfflineSync] Starting sync...');
  const pendingOps = await syncQueue.getAll();

  if (pendingOps.length === 0) {
    console.log('[OfflineSync] No pending operations');
    return;
  }

  console.log(`[OfflineSync] Found ${pendingOps.length} pending operations`);

  for (const op of pendingOps) {
    try {
      console.log(`[OfflineSync] Syncing: ${op.method} ${op.endpoint}`);

      const headers = {
        'Content-Type': 'application/json',
      };

      // Get auth token from localStorage
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const { token } = JSON.parse(userInfo);
          headers['Authorization'] = `Bearer ${token}`;
        } catch (e) {
          // Ignore parse errors
        }
      }

      let response;
      switch (op.method) {
        case 'POST':
          response = await fetch(`${API_URL}${op.endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(op.data),
          });
          break;
        case 'PUT':
          response = await fetch(`${API_URL}${op.endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(op.data),
          });
          break;
        case 'DELETE':
          response = await fetch(`${API_URL}${op.endpoint}`, {
            method: 'DELETE',
            headers,
          });
          break;
        default:
          console.warn(`[OfflineSync] Unknown method: ${op.method}`);
          continue;
      }

      if (response.ok) {
        console.log(`[OfflineSync] Successfully synced: ${op.method} ${op.endpoint}`);
        await syncQueue.remove(op.id);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[OfflineSync] Sync failed: ${op.method} ${op.endpoint}`, errorData);

        // Increment retries
        op.retries = (op.retries || 0) + 1;

        // Remove if too many retries
        if (op.retries >= 3) {
          console.warn(`[OfflineSync] Max retries reached, removing: ${op.id}`);
          await syncQueue.remove(op.id);
        }
      }
    } catch (error) {
      console.error(`[OfflineSync] Error syncing operation ${op.id}:`, error);
      // Keep in queue for next sync attempt
    }
  }

  console.log('[OfflineSync] Sync completed');
};

// Sync cached data with server
export const syncCachedData = async () => {
  if (!isOnline()) {
    return;
  }

  try {
    // Sync menu items
    const cachedMenu = await offlineStorage.getAll(STORES.MENU_ITEMS);
    if (cachedMenu.length > 0) {
      try {
        const serverMenu = await api.getMenuItems();
        await offlineStorage.save(STORES.MENU_ITEMS, serverMenu);
      } catch (error) {
        console.error('[OfflineSync] Error syncing menu:', error);
      }
    }

    // Sync categories
    const cachedCategories = await offlineStorage.getAll(STORES.CATEGORIES);
    if (cachedCategories.length > 0) {
      try {
        const serverCategories = await api.getCategories();
        await offlineStorage.save(STORES.CATEGORIES, serverCategories);
      } catch (error) {
        console.error('[OfflineSync] Error syncing categories:', error);
      }
    }

    // Sync tables
    const cachedTables = await offlineStorage.getAll(STORES.TABLES);
    if (cachedTables.length > 0) {
      try {
        const serverTables = await api.getTables();
        await offlineStorage.save(STORES.TABLES, serverTables);
      } catch (error) {
        console.error('[OfflineSync] Error syncing tables:', error);
      }
    }

    // Sync settings
    try {
      const serverSettings = await api.getSettings();
      await offlineStorage.save(STORES.SETTINGS, { ...serverSettings, id: 'default' });
    } catch (error) {
      console.error('[OfflineSync] Error syncing settings:', error);
    }
  } catch (error) {
    console.error('[OfflineSync] Error syncing cached data:', error);
  }
};

// Initialize offline sync listeners
export const initOfflineSync = () => {
  // Sync when coming back online
  window.addEventListener('online', async () => {
    console.log('[OfflineSync] Back online, starting sync...');
    await syncPendingOperations();
    await syncCachedData();

    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('online-sync-complete'));
  });

  // Log when going offline
  window.addEventListener('offline', () => {
    console.log('[OfflineSync] Gone offline');
    window.dispatchEvent(new CustomEvent('app-offline'));
  });

  // Initial sync check
  if (isOnline()) {
    syncCachedData();
  }
};
