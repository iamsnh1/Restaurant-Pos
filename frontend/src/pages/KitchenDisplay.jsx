import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { API_BASE } from '../services/api';

const KITCHEN_POLL_INTERVAL_MS = 6000;

const KitchenDisplay = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('all');
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [socketConnected, setSocketConnected] = useState(false);
    const audioRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        fetchOrders();

        // For Cloudflare Pages, use backend URL directly (not proxied)
        const base = import.meta.env.VITE_API_URL?.replace('/api', '') || API_BASE || window.location.origin;
        console.log('[KITCHEN] Connecting to socket at:', base);
        const socket = io(base, {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
        });
        socketRef.current = socket;
        console.log('[KITCHEN] Socket instance created');

        socket.on('connect', () => {
            console.log('[KITCHEN] Socket connected:', socket.id);
            setSocketConnected(true);
            socket.emit('joinKitchen');
            console.log('[KITCHEN] Emitted joinKitchen');
        });
        socket.on('disconnect', () => {
            console.log('[KITCHEN] Socket disconnected');
            setSocketConnected(false);
        });
        socket.on('connect_error', (err) => {
            console.error('[KITCHEN] Socket connection error:', err);
            setSocketConnected(false);
        });

        socket.on('newOrder', (order) => {
            console.log('[KITCHEN] Received newOrder event:', order);
            console.log('[KITCHEN] Order status:', order?.status);
            console.log('[KITCHEN] Order items:', order?.items?.length);
            try {
                if (!order) {
                    console.warn('[KITCHEN] Order is null/undefined');
                    return;
                }
                const payload = {
                    ...order,
                    _id: order._id || order.id,
                    id: order.id || order._id,
                    status: order.status || 'pending',
                    items: (order.items || []).map(i => ({
                        ...i,
                        _id: i._id || i.id,
                        id: i.id || i._id,
                        name: i.name || i.menuItem?.name,
                    })),
                };
                if (!payload._id && !payload.id) {
                    console.warn('[KITCHEN] Order has no ID:', order);
                    return;
                }
                console.log('[KITCHEN] Processing order:', payload._id || payload.id, 'Status:', payload.status);
                setOrders((prev) => {
                    const id = payload._id || payload.id;
                    const exists = prev.some((o) => (o._id || o.id) === id);
                    if (exists) {
                        console.log('[KITCHEN] Order already exists, updating:', id);
                        return prev.map((o) => ((o._id || o.id) === id ? payload : o));
                    }
                    console.log('[KITCHEN] Adding NEW order. Previous count:', prev.length, 'New count:', prev.length + 1);
                    return [...prev, payload];
                });
                playAlert(payload);
            } catch (e) {
                console.error('[KITCHEN] Error in newOrder handler:', e);
                console.error('[KITCHEN] Order that caused error:', order);
            }
        });

        socket.on('orderStatusUpdate', (updatedOrder) => {
            const id = updatedOrder._id || updatedOrder.id;
            if (!id) return;
            setOrders((prev) =>
                prev.map((o) => ((o._id || o.id) === id ? { ...updatedOrder, _id: id } : o))
            );
        });

        socket.on('orderCompleted', (completedOrder) => {
            const id = completedOrder._id || completedOrder.id;
            if (!id) return;
            setOrders((prev) => prev.filter((o) => (o._id || o.id) !== id));
        });

        const pollInterval = setInterval(fetchOrders, KITCHEN_POLL_INTERVAL_MS);

        return () => {
            clearInterval(pollInterval);
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const fetchOrders = async () => {
        try {
            console.log('[KITCHEN] Fetching orders from API...');
            const response = await api.getKitchenOrders();
            console.log('[KITCHEN] API response:', response);
            console.log('[KITCHEN] Is array?', Array.isArray(response));
            if (Array.isArray(response)) {
                console.log('[KITCHEN] Orders count:', response.length);
                console.log('[KITCHEN] First order:', response[0]);
                setOrders(response);
            } else {
                console.warn('[KITCHEN] Response is not an array:', typeof response, response);
                setOrders([]);
            }
        } catch (error) {
            console.error('[KITCHEN] Error fetching orders:', error);
            console.error('[KITCHEN] Error details:', error.message, error.stack);
            setOrders([]);
        }
    };

    const playAlert = (order) => {
        if (audioEnabled) {
            playBeep();
        }

        if ('Notification' in window && Notification.permission === 'granted') {
            const orderNum = (order?._id || order?.id)?.slice(-4).toUpperCase() || 'New';
            const orderType = order?.orderType || '';
            const label = orderType === 'dine-in' ? `Table ${order?.tableNumber}` : (orderType || 'Order');
            new Notification(`New Order #${orderNum}`, {
                body: `${label}: ${order?.items?.length || 0} items`,
                icon: '/icon.png',
                vibrate: [200, 100, 200]
            });
        }
    };

    const playBeep = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gain.gain.setValueAtTime(0.3, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch {
            if (audioRef.current) {
                audioRef.current.play().catch(() => {});
            }
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            await api.updateOrderStatus(orderId, newStatus);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-500',
            preparing: 'bg-blue-500',
            ready: 'bg-green-500',
        };
        return colors[status] || 'bg-gray-500';
    };

    const getStatusBorder = (status) => {
        const colors = {
            pending: 'border-yellow-500',
            preparing: 'border-blue-500',
            ready: 'border-green-500',
        };
        return colors[status] || 'border-gray-500';
    };

    const getTimeElapsed = (createdAt) => {
        const diff = Math.floor((new Date() - new Date(createdAt)) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const filteredOrders = filter === 'all'
        ? orders.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status))
        : orders.filter((o) => o.status === filter);

    console.log('[KITCHEN] Current orders state:', orders.length, 'Filtered:', filteredOrders.length, 'Filter:', filter);
    console.log('[KITCHEN] All orders:', orders.map(o => ({ id: o._id || o.id, status: o.status, items: o.items?.length })));
    console.log('[KITCHEN] Filtered orders:', filteredOrders.map(o => ({ id: o._id || o.id, status: o.status })));

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Hidden audio for alerts */}
            <audio ref={audioRef} preload="auto">
                <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQ==" type="audio/wav" />
            </audio>

            {/* Header */}
            <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 px-4 sm:px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto">
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <span>←</span> <span className="md:hidden">Back</span>
                        </button>
                        <h1 className="text-xl sm:text-2xl font-bold truncate">Kitchen Display</h1>
                        <span title={socketConnected ? 'Live updates on' : 'Reconnecting… orders refresh every 6s'} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${socketConnected ? 'bg-green-600/30 text-green-300' : 'bg-amber-600/30 text-amber-300'}`}>
                            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
                            {socketConnected ? 'Live' : 'Polling'}
                        </span>
                        <button type="button" onClick={fetchOrders} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
                            Refresh
                        </button>
                        <span className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-xs sm:text-sm whitespace-nowrap">
                            {orders?.length || 0} Total / {filteredOrders?.length || 0} Shown
                        </span>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <button
                            onClick={() => setAudioEnabled(!audioEnabled)}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${audioEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                                }`}
                        >
                            🔔 {audioEnabled ? 'Sound On' : 'Off'}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                    {['all', 'pending', 'preparing', 'ready'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg capitalize transition-colors whitespace-nowrap text-sm ${filter === status
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </header>

            {/* Orders Grid */}
            <main className="p-6">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <div className="text-6xl mb-4">🍽️</div>
                        <p className="text-xl">No orders in kitchen</p>
                        <div className="mt-4 space-y-2">
                            <p className="text-sm text-gray-600">
                                Total orders: {orders.length} | Filter: {filter} | Showing: {filteredOrders.length}
                            </p>
                            {orders.length > 0 && (
                                <div className="text-xs text-gray-500 space-y-1">
                                    {orders.map((o, i) => (
                                        <div key={i}>
                                            Order #{o._id || o.id}: {o.status} | Items: {o.items?.length || 0}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button
                                onClick={fetchOrders}
                                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                            >
                                🔄 Refresh Orders
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredOrders.map((order) => (
                            <div
                                key={order._id || order.id}
                                className={`bg-gray-800/50 backdrop-blur-sm rounded-xl border-l-4 ${getStatusBorder(
                                    order.status
                                )} overflow-hidden`}
                            >
                                {/* Order Header */}
                                <div className="bg-gray-700/50 px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <span className="text-lg font-bold">
                                            #{(order._id || order.id).toString().slice(-4).toUpperCase()}
                                        </span>
                                        <span className="ml-2 text-gray-400 text-sm">
                                            {(order.orderType === 'dine-in' || order.orderType === 'dine_in') ? `Table ${order.tableNumber}` : (order.orderType || 'Order')}
                                        </span>
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-semibold uppercase ${getStatusColor(
                                            order.status
                                        )}`}
                                    >
                                        {order.status}
                                    </span>
                                </div>

                                {/* Order Items */}
                                <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                                    {(order.items || []).map((item, idx) => (
                                        <div
                                            key={item._id || item.id || idx}
                                            className="flex justify-between items-center py-1 border-b border-gray-700"
                                        >
                                            <span className="font-medium">
                                                {item.quantity}x {item.name || item.menuItem?.name}
                                            </span>
                                            {(item.notes || item.specialInstructions) && (
                                                <span className="text-xs text-red-400 ml-2">
                                                    📝 {item.notes || item.specialInstructions}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Order Footer */}
                                <div className="border-t border-gray-700 px-4 py-3">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-gray-400 text-sm">⏱️ {getTimeElapsed(order.createdAt)}</span>
                                        <span className="text-gray-400 text-sm">₹{order.total?.toFixed(2)}</span>
                                    </div>

                                    {/* Status Actions */}
                                    <div className="flex gap-2">
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => updateStatus(order._id || order.id, 'preparing')}
                                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                                            >
                                                Start Preparing
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                onClick={() => updateStatus(order._id || order.id, 'ready')}
                                                className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
                                            >
                                                Mark Ready
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button
                                                onClick={() => updateStatus(order._id || order.id, 'served')}
                                                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                                            >
                                                Mark Served
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default KitchenDisplay;
