import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { API_BASE } from '../services/api';

const KitchenDisplay = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('all');
    const [audioEnabled, setAudioEnabled] = useState(true);
    const audioRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        // Fetch initial orders
        fetchOrders();

        // Setup Socket.io connection
        socketRef.current = io(API_BASE, {
            transports: ['websocket', 'polling'],
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to kitchen socket');
            socketRef.current.emit('joinKitchen');
        });

        socketRef.current.on('newOrder', (order) => {
            setOrders((prev) => [...prev, order]);
            playAlert(order);
        });

        socketRef.current.on('orderStatusUpdate', (updatedOrder) => {
            setOrders((prev) =>
                prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
            );
        });

        socketRef.current.on('orderCompleted', (completedOrder) => {
            setOrders((prev) => prev.filter((o) => o._id !== completedOrder._id));
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders/kitchen');
            setOrders(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const playAlert = (order) => {
        if (audioEnabled && audioRef.current) {
            audioRef.current.play().catch(() => { });
        }

        // Trigger Desktop Notification
        if ('Notification' in window && Notification.permission === 'granted') {
            const orderNum = order?._id?.slice(-4).toUpperCase() || 'New';
            new Notification(`New Order #${orderNum}`, {
                body: `${order?.orderType === 'dine-in' ? `Table ${order.tableNumber}` : order?.orderType || 'Pickup'}: ${order?.items?.length || 0} items`,
                icon: '/icon.png',
                vibrate: [200, 100, 200]
            });
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
        ? orders
        : orders.filter((o) => o.status === filter);

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
                        <span className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-xs sm:text-sm whitespace-nowrap">
                            {orders?.length || 0} Active
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
                        <button
                            onClick={fetchOrders}
                            className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap text-sm"
                        >
                            🔄 Refresh
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
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredOrders.map((order) => (
                            <div
                                key={order._id}
                                className={`bg-gray-800/50 backdrop-blur-sm rounded-xl border-l-4 ${getStatusBorder(
                                    order.status
                                )} overflow-hidden`}
                            >
                                {/* Order Header */}
                                <div className="bg-gray-700/50 px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <span className="text-lg font-bold">
                                            #{order._id.slice(-4).toUpperCase()}
                                        </span>
                                        <span className="ml-2 text-gray-400 text-sm">
                                            {order.orderType === 'dine-in' ? `Table ${order.tableNumber}` : order.orderType}
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
                                    {order.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex justify-between items-center py-1 border-b border-gray-700"
                                        >
                                            <span className="font-medium">
                                                {item.quantity}x {item.name}
                                            </span>
                                            {item.notes && (
                                                <span className="text-xs text-red-400 ml-2">
                                                    📝 {item.notes}
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
                                                onClick={() => updateStatus(order._id, 'preparing')}
                                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                                            >
                                                Start Preparing
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                onClick={() => updateStatus(order._id, 'ready')}
                                                className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
                                            >
                                                Mark Ready
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button
                                                onClick={() => updateStatus(order._id, 'served')}
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
