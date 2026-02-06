// Auto-detect API URL based on environment
// Production: Use relative path /api (works with same origin)
// Development: Use localhost or detect from window.location
const getApiUrl = () => {
    const isLocal = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.startsWith('192.168.') ||
            window.location.hostname.endsWith('.local'));

    // 1. Strongly prioritize the VITE_API_URL provided by the host (Railway/Render)
    if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('/undefined')) {
        return import.meta.env.VITE_API_URL;
    }

    // 2. Detection Logic
    if (typeof window !== 'undefined') {
        const origin = window.location.origin;

        // ONLY use localhost URLs if we are actually ON a local address
        if (isLocal) {
            return 'http://localhost:5001/api';
        }

        // Domain Change Safety Reset
        const lastOrigin = localStorage.getItem('last_pos_origin');
        if (lastOrigin && lastOrigin !== origin) {
            localStorage.clear(); // Complete clear to prevent cross-domain session issues
            localStorage.setItem('last_pos_origin', origin);
            window.location.reload();
        } else {
            localStorage.setItem('last_pos_origin', origin);
        }

        // 3. Fallback for Cloud (e.g. Vercel)
        // We use relative path /api. The Browser will never trigger "Local Network" prompt for relative paths.
        return `${origin}/api`;
    }

    return '/api'; // Safe default for SSR/Build time
};

export const API_URL = getApiUrl();
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
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/staff`, { headers });
        return res.json();
    },

    createStaff: async (data) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/staff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    updateStaff: async (id, data) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/staff/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    deleteStaff: async (id) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/staff/${id}`, {
            method: 'DELETE',
            headers,
        });
        return res.json();
    },

    // Attendance
    clockIn: async () => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/staff/attendance/clock-in`, {
            method: 'POST',
            headers,
        });
        return res.json();
    },

    clockOut: async () => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/staff/attendance/clock-out`, {
            method: 'POST',
            headers,
        });
        return res.json();
    },

    getAttendance: async () => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/staff/attendance`, { headers });
        return res.json();
    },

    // Shifts
    getShifts: async () => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/staff/shifts`, { headers });
        return res.json();
    },

    createShift: async (data) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/staff/shifts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
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
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    updateMenuItem: async (id, data) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/menu/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    deleteMenuItem: async (id) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/menu/${id}`, {
            method: 'DELETE',
            headers,
        });
        return res.json();
    },

    // Categories CRUD
    createCategory: async (data) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    // Orders
    getOrders: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/orders?${params}`, {
            headers,
        });
        return res.json();
    },

    createOrder: async (data) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    updateOrderStatus: async (id, status) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/orders/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({ status }),
        });
        return res.json();
    },

    updatePayment: async (id, paymentData) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/orders/${id}/payment`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(paymentData),
        });
        return res.json();
    },

    getKitchenOrders: async () => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/orders/kitchen`, {
            headers,
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data?.message || 'Failed to fetch kitchen orders');
        }
        return data;
    },

    // Tables
    getTables: async () => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/tables`, { headers });
        return res.json();
    },

    updateTableStatus: async (id, data) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/tables/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    seedTables: async () => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/tables/seed`, {
            method: 'POST',
            headers,
        });
        return res.json();
    },

    // Reservations
    getReservations: async (params) => {
        const queryString = new URLSearchParams(params).toString();
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/reservations?${queryString}`, { headers });
        return res.json();
    },

    createReservation: async (data) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    updateReservation: async (id, data) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/reservations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    // Settings
    getSettings: async () => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/settings`, { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load settings');
        return data;
    },

    updateSettings: async (data) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data),
        });
        const out = await res.json();
        if (!res.ok) throw new Error(out?.message || 'Failed to save settings');
        return out;
    },

    backupSystem: async () => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/settings/backup`, {
            method: 'POST',
            headers,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Backup failed');
        return data;
    },

    // Billing
    calculateBill: async (data) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/billing/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data),
        });
        const out = await res.json();
        if (!res.ok) throw new Error(out?.message || 'Failed to calculate bill');
        return out;
    },

    processPayment: async (data) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/billing/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data),
        });
        const out = await res.json();
        if (!res.ok) throw new Error(out?.message || 'Payment failed');
        return out;
    },

    uploadReceiptPDF: async (data) => {
        const headers = getAuthHeader();
        const res = await safeFetch(`${API_URL}/billing/receipt-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(data),
        });
        const out = await res.json();
        if (!res.ok) throw new Error(out?.message || 'Failed to upload PDF');
        return out;
    },
};

export default api;
// Force refresh
