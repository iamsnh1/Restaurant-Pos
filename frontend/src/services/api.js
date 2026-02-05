export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const API_BASE = API_URL.replace(/\/api\/?$/, '') || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001');
export { API_BASE };

const getAuthHeader = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        const { token } = JSON.parse(userInfo);
        return { Authorization: `Bearer ${token}` };
    }
    return {};
};

function safeFetch(url, options) {
    return fetch(url, options).catch((e) => {
        const isNetworkError =
            e?.message === 'Failed to fetch' ||
            (e?.name === 'TypeError' && typeof e?.message === 'string' && e.message.includes('fetch'));
        if (isNetworkError) {
            throw new Error(`Cannot reach server. Is the backend running at ${API_BASE}?`);
        }
        throw e;
    });
}

const api = {
    // Generic request methods
    get: async (endpoint) => {
        const res = await safeFetch(`${API_URL}${endpoint}`, {
            headers: getAuthHeader(),
        });
        return res.json();
    },

    // Staff
    getStaff: async () => {
        const res = await safeFetch(`${API_URL}/staff`, { headers: getAuthHeader() });
        return res.json();
    },

    createStaff: async (data) => {
        const res = await safeFetch(`${API_URL}/staff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    updateStaff: async (id, data) => {
        const res = await safeFetch(`${API_URL}/staff/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    deleteStaff: async (id) => {
        const res = await safeFetch(`${API_URL}/staff/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader(),
        });
        return res.json();
    },

    // Attendance
    clockIn: async () => {
        const res = await safeFetch(`${API_URL}/staff/attendance/clock-in`, {
            method: 'POST',
            headers: getAuthHeader(),
        });
        return res.json();
    },

    clockOut: async () => {
        const res = await safeFetch(`${API_URL}/staff/attendance/clock-out`, {
            method: 'POST',
            headers: getAuthHeader(),
        });
        return res.json();
    },

    getAttendance: async () => {
        const res = await safeFetch(`${API_URL}/staff/attendance`, { headers: getAuthHeader() });
        return res.json();
    },

    // Shifts
    getShifts: async () => {
        const res = await safeFetch(`${API_URL}/staff/shifts`, { headers: getAuthHeader() });
        return res.json();
    },

    createShift: async (data) => {
        const res = await safeFetch(`${API_URL}/staff/shifts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    // Categories
    getCategories: async () => {
        const res = await safeFetch(`${API_URL}/categories`);
        return res.json();
    },

    // Menu Items
    getMenuItems: async (categoryId) => {
        const url = categoryId
            ? `${API_URL}/menu?category=${categoryId}`
            : `${API_URL}/menu`;
        const res = await safeFetch(url);
        return res.json();
    },

    createMenuItem: async (data) => {
        const res = await safeFetch(`${API_URL}/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    updateMenuItem: async (id, data) => {
        const res = await safeFetch(`${API_URL}/menu/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    deleteMenuItem: async (id) => {
        const res = await safeFetch(`${API_URL}/menu/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader(),
        });
        return res.json();
    },

    // Categories CRUD
    createCategory: async (data) => {
        const res = await safeFetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    // Orders
    getOrders: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const res = await safeFetch(`${API_URL}/orders?${params}`, {
            headers: getAuthHeader(),
        });
        return res.json();
    },

    createOrder: async (data) => {
        const res = await safeFetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    updateOrderStatus: async (id, status) => {
        const res = await safeFetch(`${API_URL}/orders/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ status }),
        });
        return res.json();
    },

    updatePayment: async (id, paymentData) => {
        const res = await safeFetch(`${API_URL}/orders/${id}/payment`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(paymentData),
        });
        return res.json();
    },

    getKitchenOrders: async () => {
        const res = await safeFetch(`${API_URL}/orders/kitchen`, {
            headers: getAuthHeader(),
        });
        return res.json();
    },

    // Tables
    getTables: async () => {
        const res = await safeFetch(`${API_URL}/tables`, { headers: getAuthHeader() });
        return res.json();
    },

    updateTableStatus: async (id, data) => {
        const res = await safeFetch(`${API_URL}/tables/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    seedTables: async () => {
        const res = await safeFetch(`${API_URL}/tables/seed`, {
            method: 'POST',
            headers: getAuthHeader(),
        });
        return res.json();
    },

    // Reservations
    getReservations: async (params) => {
        const queryString = new URLSearchParams(params).toString();
        const res = await safeFetch(`${API_URL}/reservations?${queryString}`, { headers: getAuthHeader() });
        return res.json();
    },

    createReservation: async (data) => {
        const res = await safeFetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    updateReservation: async (id, data) => {
        const res = await safeFetch(`${API_URL}/reservations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    // Settings
    getSettings: async () => {
        const res = await safeFetch(`${API_URL}/settings`, { headers: getAuthHeader() });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load settings');
        return data;
    },

    updateSettings: async (data) => {
        const res = await safeFetch(`${API_URL}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        const out = await res.json();
        if (!res.ok) throw new Error(out?.message || 'Failed to save settings');
        return out;
    },

    backupSystem: async () => {
        const res = await safeFetch(`${API_URL}/settings/backup`, {
            method: 'POST',
            headers: getAuthHeader(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Backup failed');
        return data;
    },

    // Billing
    calculateBill: async (data) => {
        const res = await safeFetch(`${API_URL}/billing/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    processPayment: async (data) => {
        const res = await safeFetch(`${API_URL}/billing/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        return res.json();
    },
};

export default api;
// Force refresh
