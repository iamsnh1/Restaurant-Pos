import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { ArrowLeft, TrendingUp, DollarSign, Clock, Users, Calendar, ArrowUpRight, ArrowDownRight, FileText, Search, MessageCircle } from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f'];

const Analytics = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user && user.role !== 'admin' && user.role !== 'manager') {
            navigate('/');
        }
    }, [user, navigate]);

    const [period, setPeriod] = useState('daily');
    const [activeTab, setActiveTab] = useState('sales');
    const [loading, setLoading] = useState(true);

    // Data States
    const [salesData, setSalesData] = useState(null);
    const [categoryData, setCategoryData] = useState([]);
    const [hourlyData, setHourlyData] = useState([]);
    const [financials, setFinancials] = useState(null);
    const [kitchenStats, setKitchenStats] = useState(null);
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [salesRes, catRes, hourlyRes, finRes, kitRes, custRes] = await Promise.all([
                api.get(`/reports/sales?period=${period}`),
                api.get(`/reports/sales/category?period=${period}`),
                api.get('/reports/sales/hourly'), // Hourly is usually purely temporal (today)
                api.get(`/reports/financials?period=${period}`),
                api.get('/reports/kitchen-performance'),
                api.get('/reports/customers'),
            ]);

            setSalesData(salesRes);
            setCategoryData(catRes);
            setHourlyData(hourlyRes);
            setFinancials(finRes);
            setKitchenStats(kitRes);
            setCustomers(custRes);

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    // --- Sub-Components for Tabs ---

    const SalesTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6">Revenue Trend</h3>
                    <div className="h-80">
                        {salesData?.salesByDate ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesData.salesByDate}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                    <XAxis dataKey="date" stroke="#ccc" tickFormatter={(str) => str.slice(5)} />
                                    <YAxis stroke="#ccc" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRev)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
                        )}
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-6">Sales by Category</h3>
                    <div className="h-80 flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Hourly Analysis */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Hourly Activity (Today)</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="hour" stroke="#ccc" />
                            <YAxis yAxisId="left" stroke="#8884d8" orientation="left" />
                            <YAxis yAxisId="right" stroke="#82ca9d" orientation="right" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="sales" name="Sales (₹)" fill="#8884d8" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    const FinancialTab = () => {
        // Transform paymentMethods object to array for chart
        const paymentData = financials?.paymentMethods
            ? Object.entries(financials.paymentMethods).map(([name, value]) => ({ name, value }))
            : [];

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-600/20 p-6 rounded-2xl border border-green-500/30">
                        <p className="text-green-300 mb-1">Total Revenue</p>
                        <h3 className="text-3xl font-bold text-white">₹{financials?.revenue.toFixed(2)}</h3>
                    </div>
                    <div className="bg-red-600/20 p-6 rounded-2xl border border-red-500/30">
                        <p className="text-red-300 mb-1">Expenses (COGS)</p>
                        <h3 className="text-3xl font-bold text-white">₹{financials?.cogs.toFixed(2)}</h3>
                        <p className="text-xs text-red-200 mt-2">Cost of Goods Sold</p>
                    </div>
                    <div className="bg-blue-600/20 p-6 rounded-2xl border border-blue-500/30">
                        <p className="text-blue-300 mb-1">Net Profit</p>
                        <h3 className="text-3xl font-bold text-white">₹{financials?.netProfit.toFixed(2)}</h3>
                        <p className="text-sm text-blue-200 mt-2">Margin: {financials?.margin}%</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Payment Methods Chart */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-6">Payment Modes</h3>
                        <div className="h-64 flex flex-col md:flex-row items-center justify-center gap-8">
                            <div className="flex-1 w-full h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={paymentData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {paymentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3 min-w-[150px]">
                                {paymentData.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="capitalize text-gray-300">{entry.name}</span>
                                        <span className="font-bold ml-auto">₹{entry.value.toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Tax Report */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h3 className="text-xl font-bold text-white mb-4">Tax Collection</h3>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <span className="text-lg text-gray-300">GST (5%)</span>
                                <span className="text-2xl font-bold text-white">₹{financials?.tax.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Tips Report */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h3 className="text-xl font-bold text-white mb-4">Staff Tips Collected</h3>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <span className="text-lg text-gray-300">Total Tips</span>
                                <span className="text-2xl font-bold text-yellow-400">₹{financials?.tips.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const CustomerTab = () => (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <h3 className="text-xl font-bold text-white p-6 border-b border-white/10">🏆 Top Customers</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400">
                        <tr>
                            <th className="p-4">Customer Name</th>
                            <th className="p-4">Phone</th>
                            <th className="p-4 text-center">Visits</th>
                            <th className="p-4 text-right">Total Spend</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {customers.map((cust, idx) => (
                            <tr key={cust._id} className="text-white hover:bg-white/5 transition">
                                <td className="p-4 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm">
                                        {idx + 1}
                                    </span>
                                    {cust.name}
                                </td>
                                <td className="p-4 text-gray-400 font-mono text-sm">{cust._id}</td>
                                <td className="p-4 text-center">{cust.totalOrders}</td>
                                <td className="p-4 text-right font-bold text-green-400">₹{cust.totalSpent.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const HistoryTab = () => {
        const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
        const [historyOrders, setHistoryOrders] = useState([]);
        const [loadingHistory, setLoadingHistory] = useState(false);

        useEffect(() => {
            fetchHistory();
        }, [historyDate]);

        const fetchHistory = async () => {
            setLoadingHistory(true);
            try {
                const res = await api.getOrders({ date: historyDate });
                // Filter for completed/paid orders for the receipt log
                setHistoryOrders(res.filter(o => ['completed', 'served', 'paid'].includes(o.status) || o.paymentStatus === 'paid'));
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingHistory(false);
            }
        };

        const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);
        const [settings, setSettings] = useState(null);

        useEffect(() => {
            // Fetch settings once for the receipt
            api.getSettings().then(setSettings).catch(console.error);
        }, []);

        const handleDownloadPdf = (order) => {
            setSelectedOrderForReceipt(order);
        };

        const [searchTerm, setSearchTerm] = useState('');

        const filteredHistory = historyOrders.filter(o =>
            o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.customer?.phone || '').includes(searchTerm)
        );

        const handleWhatsAppQuick = (order) => {
            const phone = order.customer?.phone?.replace(/\D/g, '');
            if (!phone || phone.length < 10) {
                alert('No valid phone number found for this customer.');
                return;
            }

            const businessName = settings?.restaurant?.name || 'Our Restaurant';
            const itemsList = order.items.map(i => `• ${i.quantity}x ${i.menuItem?.name || i.name} - ₹${(i.price * i.quantity).toFixed(2)}`).join('%0A');

            const message = `*Bill from ${businessName}*%0A%0A` +
                `*Order No:* ${order.orderNumber}%0A` +
                `*Date:* ${new Date(order.createdAt).toLocaleDateString()}%0A%0A` +
                `*Items:*%0A${itemsList}%0A%0A` +
                `*Total Amount: ₹${order.total.toFixed(2)}*%0A%0A` +
                `Thank you for dining with us!`;

            window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
        };

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                    <h3 className="text-xl font-bold text-white">Daily Transaction Log</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-gray-800 p-2 rounded-lg border border-gray-700">
                            <Search size={18} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search Order #, Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent text-white border-none outline-none text-sm w-48"
                            />
                        </div>
                        <div className="flex items-center gap-3 bg-gray-800 p-2 rounded-lg border border-gray-700">
                            <Calendar size={18} className="text-gray-400" />
                            <input
                                type="date"
                                value={historyDate}
                                onChange={(e) => setHistoryDate(e.target.value)}
                                className="bg-transparent text-white border-none outline-none text-sm font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* Daily Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <p className="text-gray-400 text-xs uppercase mb-1">Total Orders</p>
                        <h4 className="text-2xl font-bold">{historyOrders.length}</h4>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <p className="text-gray-400 text-xs uppercase mb-1">Total Sales</p>
                        <h4 className="text-2xl font-bold text-green-400">
                            ₹{historyOrders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}
                        </h4>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <p className="text-gray-400 text-xs uppercase mb-1">Cash / Card</p>
                        <div className="flex items-baseline gap-2">
                            <h4 className="text-xl font-bold">
                                ₹{historyOrders.filter(o => (o.paymentMethod || o.transactions?.[0]?.paymentMethod) === 'cash').reduce((sum, o) => sum + (o.total || 0), 0).toFixed(0)}
                            </h4>
                            <span className="text-gray-500 text-xs">/</span>
                            <h4 className="text-xl font-bold">
                                ₹{historyOrders.filter(o => (o.paymentMethod || o.transactions?.[0]?.paymentMethod) === 'card').reduce((sum, o) => sum + (o.total || 0), 0).toFixed(0)}
                            </h4>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <p className="text-gray-400 text-xs uppercase mb-1">Other (UPI/Split)</p>
                        <h4 className="text-2xl font-bold">
                            ₹{historyOrders.filter(o => !['cash', 'card'].includes(o.paymentMethod || o.transactions?.[0]?.paymentMethod)).reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}
                        </h4>
                    </div>
                </div>

                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left min-w-[700px] lg:min-w-0">
                            <thead className="bg-white/5 text-gray-400 border-b border-white/10">
                                <tr>
                                    <th className="p-4 text-xs sm:text-sm uppercase font-bold">Time</th>
                                    <th className="p-4 text-xs sm:text-sm uppercase font-bold">Order #</th>
                                    <th className="p-4 text-xs sm:text-sm uppercase font-bold">Customer</th>
                                    <th className="p-4 text-xs sm:text-sm uppercase font-bold hidden md:table-cell">Items</th>
                                    <th className="p-4 text-xs sm:text-sm uppercase font-bold">Method</th>
                                    <th className="p-4 text-xs sm:text-sm uppercase font-bold text-right">Amount</th>
                                    <th className="p-4 text-xs sm:text-sm uppercase font-bold text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 text-sm">
                                {loadingHistory ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-gray-500">Loading history...</td></tr>
                                ) : filteredHistory.length === 0 ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-gray-500">No transactions found matching your criteria.</td></tr>
                                ) : (
                                    filteredHistory.map(order => (
                                        <tr key={order._id} className="text-white hover:bg-white/5 transition">
                                            <td className="p-4 font-mono text-gray-400">
                                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-4 font-mono text-blue-300">{order.orderNumber}</td>
                                            <td className="p-4">
                                                <div className="font-medium">{order.customer?.name || 'Guest'}</div>
                                                <div className="text-xs text-gray-500">{order.customer?.phone || '-'}</div>
                                                {order.customer?.gstin && <div className="text-xs text-yellow-500/80">GST: {order.customer.gstin}</div>}
                                            </td>
                                            <td className="p-4 text-gray-300 max-w-xs truncate hidden md:table-cell">
                                                {order.items.map(i => `${i.quantity}x ${i.menuItem?.name || i.name}`).join(', ')}
                                            </td>
                                            <td className="p-4 capitalize">
                                                {/* Helper to get payment info */}
                                                {(() => {
                                                    const method = order.paymentMethod || order.transactions?.[0]?.paymentMethod || 'Unknown';
                                                    return (
                                                        <span className={`px-2 py-1 rounded text-xs border ${method === 'cash' ? 'border-green-500/50 text-green-400 bg-green-500/10' :
                                                            method === 'card' ? 'border-blue-500/50 text-blue-400 bg-blue-500/10' :
                                                                method === 'split' ? 'border-orange-500/50 text-orange-400 bg-orange-500/10' :
                                                                    'border-purple-500/50 text-purple-400 bg-purple-500/10'
                                                            }`}>
                                                            {method}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-4 text-right font-bold">₹{order.total.toFixed(2)}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleWhatsAppQuick(order)}
                                                        className="p-2 bg-white/5 hover:bg-green-500/20 rounded-lg text-green-400 hover:text-green-300 transition"
                                                        title="Send via WhatsApp"
                                                    >
                                                        <MessageCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadPdf(order)}
                                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition"
                                                        title="View / Print PDF"
                                                    >
                                                        <FileText size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <ReceiptModal
                    isOpen={!!selectedOrderForReceipt}
                    onClose={() => setSelectedOrderForReceipt(null)}
                    order={selectedOrderForReceipt}
                    settings={settings}
                />
            </div>
        );
    };

    const KitchenTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-orange-500/20 rounded-full mb-4">
                    <Clock size={48} className="text-orange-500" />
                </div>
                <h3 className="text-gray-400 text-lg mb-2">Average Preparation Time</h3>
                <p className="text-5xl font-bold text-white">{kitchenStats?.avgPrepTime} <span className="text-xl text-gray-500">min</span></p>
                <p className="text-sm text-gray-500 mt-4">For last {kitchenStats?.ordersAnalyzed} orders</p>
            </div>

            <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Kitchen Efficiency Tips</h3>
                <ul className="space-y-4 text-gray-300">
                    <li className="flex gap-3">
                        <span className="text-green-500">✅</span>
                        <span>Monitor "Preparing" to "Ready" times closely.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-green-500">✅</span>
                        <span>Ensure KDS is updated immediately when food is done.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-green-500">✅</span>
                        <span>Analyze peak hours from Sales tab to staff kitchen appropriately.</span>
                    </li>
                </ul>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            {/* Header */}
            <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
                <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button onClick={() => navigate('/')} className="hover:bg-white/10 p-2 rounded-lg transition">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-2xl font-bold">Analytics & Reports</h1>
                    </div>

                    <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
                        {['daily', 'weekly', 'monthly'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-md capitalize text-sm font-medium transition ${period === p ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="px-6 flex gap-6 overflow-x-auto border-t border-white/5 mt-2">
                    {[
                        { id: 'sales', label: 'Sales Overview', icon: TrendingUp },
                        { id: 'financials', label: 'Financials', icon: DollarSign },
                        { id: 'history', label: 'Transactions', icon: FileText },
                        { id: 'kitchen', label: 'Kitchen Perf.', icon: Clock },
                        { id: 'customers', label: 'Customers', icon: Users },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-4 border-b-2 transition whitespace-nowrap ${activeTab === tab.id ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-white'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {activeTab === 'sales' && <SalesTab />}
                {activeTab === 'financials' && <FinancialTab />}
                {activeTab === 'history' && <HistoryTab />}
                {activeTab === 'kitchen' && <KitchenTab />}
                {activeTab === 'customers' && <CustomerTab />}
            </main>
        </div>
    );
};

export default Analytics;
