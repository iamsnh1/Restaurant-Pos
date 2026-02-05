import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user && user.role !== 'admin' && user.role !== 'manager') {
            navigate('/');
        }
    }, [user, navigate]);

    const [activeTab, setActiveTab] = useState('overview');
    const [dashboardData, setDashboardData] = useState(null);
    const [salesData, setSalesData] = useState(null);
    const [ordersData, setOrdersData] = useState(null);
    const [popularItems, setPopularItems] = useState([]);
    const [period, setPeriod] = useState('daily');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dashboard, sales, orders, popular] = await Promise.all([
                api.get('/reports/dashboard'),
                api.get(`/reports/sales?period=${period}`),
                api.get('/reports/orders'),
                api.get('/reports/popular-items'),
            ]);
            setDashboardData(dashboard.data);
            setSalesData(sales.data);
            setOrdersData(orders.data);
            setPopularItems(popular.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, color, subtitle }) => (
        <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-white/70 text-sm">{title}</p>
                    <p className="text-3xl font-bold mt-2">{value}</p>
                    {subtitle && <p className="text-white/60 text-sm mt-1">{subtitle}</p>}
                </div>
                <div className="text-4xl opacity-80">{icon}</div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
            {/* Header */}
            <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-400 hover:text-white transition-colors shrink-0 p-1"
                        >
                            ← <span className="hidden sm:inline">Dashboard</span>
                        </button>
                        <h1 className="text-lg sm:text-2xl font-bold text-white truncate text-nowrap">Admin Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {['daily', 'weekly', 'monthly'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg capitalize transition-colors text-xs sm:text-sm ${period === p
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-4 overflow-x-auto scrollbar-hide">
                    {['overview', 'orders', 'menu', 'tables'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 sm:px-6 py-2 rounded-t-lg capitalize transition-colors whitespace-nowrap text-sm ${activeTab === tab
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-800/50 text-gray-400 hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            <main className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                ) : (
                    <>
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard
                                        title="Today Sales"
                                        value={`₹${dashboardData?.todayRevenue?.toFixed(0) || '0'}`}
                                        icon="💰"
                                        color="from-green-600 to-green-800"
                                    />
                                    <StatCard
                                        title="Today Orders"
                                        value={dashboardData?.todayOrders || 0}
                                        icon="📝"
                                        color="from-blue-600 to-blue-800"
                                    />
                                    <StatCard
                                        title="Pending"
                                        value={dashboardData?.pendingOrders || 0}
                                        icon="⏳"
                                        color="from-yellow-600 to-yellow-800"
                                    />
                                    <StatCard
                                        title="Live Tables"
                                        value={dashboardData?.tablesServed || 0}
                                        icon="🍽️"
                                        color="from-purple-600 to-purple-800"
                                    />
                                </div>

                                {/* Charts Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Sales Chart */}
                                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                                        <h3 className="text-lg font-semibold text-white mb-4">Sales Trend</h3>
                                        <div className="space-y-3">
                                            {salesData?.salesByDate?.slice(-7).map((day, idx) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <span className="text-gray-400 text-sm w-24">{day.date.slice(5)}</span>
                                                    <div className="flex-1 bg-gray-700 rounded-full h-4">
                                                        <div
                                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full"
                                                            style={{
                                                                width: `${Math.min(
                                                                    (day.revenue / Math.max(...salesData.salesByDate.map((d) => d.revenue))) * 100,
                                                                    100
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-white text-sm w-20 text-right">
                                                        ₹{day.revenue.toFixed(0)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Order Types */}
                                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                                        <h3 className="text-lg font-semibold text-white mb-4">Order Distribution</h3>
                                        <div className="space-y-4">
                                            {[
                                                { label: 'Dine-In', value: ordersData?.orderTypes?.dineIn || 0, color: 'bg-blue-500' },
                                                { label: 'Takeaway', value: ordersData?.orderTypes?.takeaway || 0, color: 'bg-green-500' },
                                                { label: 'Delivery', value: ordersData?.orderTypes?.delivery || 0, color: 'bg-yellow-500' },
                                            ].map((type, idx) => (
                                                <div key={idx}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-300">{type.label}</span>
                                                        <span className="text-white">{type.value}</span>
                                                    </div>
                                                    <div className="bg-gray-700 rounded-full h-3">
                                                        <div
                                                            className={`${type.color} h-3 rounded-full`}
                                                            style={{
                                                                width: `${ordersData?.totalOrders
                                                                    ? (type.value / ordersData.totalOrders) * 100
                                                                    : 0
                                                                    }%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Popular Items */}
                                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                                    <h3 className="text-lg font-semibold text-white mb-4">🔥 Best Selling Items</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                        {popularItems.slice(0, 5).map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-gray-700/50 rounded-xl p-4 text-center"
                                            >
                                                <div className="text-2xl mb-2">
                                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🍽️'}
                                                </div>
                                                <p className="text-white font-medium">{item.name}</p>
                                                <p className="text-gray-400 text-sm">{item.count} sold</p>
                                                <p className="text-green-400 text-sm">₹{item.revenue.toFixed(0)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Orders Tab */}
                        {activeTab === 'orders' && (
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                                <h3 className="text-lg font-semibold text-white mb-4">Order Statistics</h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {[
                                        { label: 'Total', value: ordersData?.totalOrders, color: 'text-white' },
                                        { label: 'Pending', value: ordersData?.pendingOrders, color: 'text-yellow-400' },
                                        { label: 'Preparing', value: ordersData?.preparingOrders, color: 'text-blue-400' },
                                        { label: 'Completed', value: ordersData?.completedOrders, color: 'text-green-400' },
                                        { label: 'Cancelled', value: ordersData?.cancelledOrders, color: 'text-red-400' },
                                    ].map((stat, idx) => (
                                        <div key={idx} className="text-center p-4 bg-gray-700/50 rounded-xl">
                                            <p className="text-gray-400 text-sm">{stat.label}</p>
                                            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value || 0}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Menu Tab - Link to Full Menu Management */}
                        {activeTab === 'menu' && (
                            <div className="text-center py-10">
                                <p className="text-gray-400 mb-4">Manage your menu items, categories, and pricing</p>
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium text-white transition-colors"
                                >
                                    Open Menu Manager
                                </button>
                            </div>
                        )}

                        {/* Tables Tab */}
                        {activeTab === 'tables' && (
                            <div className="text-center py-10">
                                <p className="text-gray-400 mb-4">Table management and floor plan</p>
                                <button
                                    onClick={() => navigate('/tables')}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium text-white transition-colors"
                                >
                                    Open Table Manager
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
