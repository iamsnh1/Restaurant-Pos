import api from './api';
import { offlineStorage, syncQueue, STORES } from './offlineStorage';
import { isOnline } from './offlineSync';

// Enhanced API wrapper that works offline
export const offlineApi = {
  // Get menu items (with offline fallback)
  async getMenuItems(categoryId) {
    if (isOnline()) {
      try {
        const items = await api.getMenuItems(categoryId);
        await offlineStorage.save(STORES.MENU_ITEMS, items);
        return items;
      } catch (error) {
        console.warn('[OfflineAPI] Online fetch failed, using cache:', error);
      }
    }

    // Offline: return cached data
    const cached = await offlineStorage.getAll(STORES.MENU_ITEMS);
    if (categoryId) {
      return cached.filter(item => item.categoryId === categoryId);
    }
    return cached;
  },

  // Get categories (with offline fallback)
  async getCategories() {
    if (isOnline()) {
      try {
        const categories = await api.getCategories();
        await offlineStorage.save(STORES.CATEGORIES, categories);
        return categories;
      } catch (error) {
        console.warn('[OfflineAPI] Online fetch failed, using cache:', error);
      }
    }

    // Offline: return cached data
    return await offlineStorage.getAll(STORES.CATEGORIES);
  },

  // Create order (queue if offline)
  async createOrder(orderData) {
    if (isOnline()) {
      try {
        const order = await api.createOrder(orderData);
        // Cache the order locally
        await offlineStorage.save(STORES.ORDERS, order);
        return order;
      } catch (error) {
        console.error('[OfflineAPI] Create order failed:', error);
        throw error;
      }
    }

    // Offline: save locally and queue for sync
    const tempOrder = {
      ...orderData,
      id: `temp-${Date.now()}`,
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString(),
      isOffline: true,
    };

    await offlineStorage.save(STORES.ORDERS, tempOrder);
    await syncQueue.add('order', '/orders', 'POST', orderData);

    return tempOrder;
  },

  // Get tables (with offline fallback)
  async getTables() {
    if (isOnline()) {
      try {
        const tables = await api.getTables();
        await offlineStorage.save(STORES.TABLES, tables);
        return tables;
      } catch (error) {
        console.warn('[OfflineAPI] Online fetch failed, using cache:', error);
      }
    }

    // Offline: return cached data
    return await offlineStorage.getAll(STORES.TABLES);
  },

  // Get orders (with offline fallback)
  async getOrders(filters = {}) {
    if (isOnline()) {
      try {
        const orders = await api.getOrders(filters);
        // Cache orders locally
        if (Array.isArray(orders)) {
          await offlineStorage.save(STORES.ORDERS, orders);
        }
        return orders;
      } catch (error) {
        console.warn('[OfflineAPI] Online fetch failed, using cache:', error);
      }
    }

    // Offline: return cached data
    const cached = await offlineStorage.getAll(STORES.ORDERS);
    // Apply basic filtering
    if (filters.status) {
      return cached.filter(order => order.status === filters.status);
    }
    return cached;
  },

  // Get settings (with offline fallback)
  async getSettings() {
    if (isOnline()) {
      try {
        const settings = await api.getSettings();
        await offlineStorage.save(STORES.SETTINGS, { ...settings, id: 'default' });
        return settings;
      } catch (error) {
        console.warn('[OfflineAPI] Online fetch failed, using cache:', error);
      }
    }

    // Offline: return cached data
    const cached = await offlineStorage.getAll(STORES.SETTINGS);
    return cached[0] || null;
  },

  // Update order status (queue if offline)
  async updateOrderStatus(orderId, status) {
    if (isOnline()) {
      try {
        return await api.updateOrderStatus(orderId, status);
      } catch (error) {
        console.error('[OfflineAPI] Update order status failed:', error);
        throw error;
      }
    }

    // Offline: update local cache and queue
    const order = await offlineStorage.get(STORES.ORDERS, orderId);
    if (order) {
      order.status = status;
      await offlineStorage.save(STORES.ORDERS, order);
    }

    await syncQueue.add('order', `/orders/${orderId}/status`, 'PUT', { status });
    return { success: true, offline: true };
  },

  // Process payment (queue if offline)
  async processPayment(paymentData) {
    if (isOnline()) {
      try {
        return await api.processPayment(paymentData);
      } catch (error) {
        console.error('[OfflineAPI] Process payment failed:', error);
        throw error;
      }
    }

    // Offline: update local cache and queue
    const orderId = paymentData.orderId;
    const order = await offlineStorage.get(STORES.ORDERS, orderId);
    if (order) {
      order.paymentStatus = paymentData.paymentStatus || 'paid';
      order.paymentMethod = paymentData.paymentMethod;
      await offlineStorage.save(STORES.ORDERS, order);
    }

    await syncQueue.add('payment', '/billing/pay', 'POST', paymentData);
    return { success: true, offline: true };
  },
};

export default offlineApi;
