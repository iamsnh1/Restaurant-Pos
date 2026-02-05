import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const TableManagement = () => {
    const navigate = useNavigate();
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const response = await api.get('/tables');
            if (response.data.length === 0) {
                // Seed tables if none exist
                await api.post('/tables/seed');
                const seeded = await api.get('/tables');
                setTables(seeded.data);
            } else {
                setTables(response.data);
            }
        } catch (error) {
            console.error('Error fetching tables:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateTableStatus = async (tableId, status) => {
        try {
            await api.updateTableStatus(tableId, { status });
            fetchTables();
        } catch (error) {
            console.error('Error updating table:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            available: 'from-green-500/20 to-green-600/20 border-green-500',
            occupied: 'from-red-500/20 to-red-600/20 border-red-500',
            reserved: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500',
            cleaning: 'from-blue-500/20 to-blue-600/20 border-blue-500',
        };
        return colors[status] || 'from-gray-500/20 to-gray-600/20 border-gray-500';
    };

    const getStatusIcon = (status) => {
        const icons = {
            available: '🟢',
            occupied: '🔴',
            reserved: '🟡',
            cleaning: '🔵',
        };
        return icons[status] || '⚪';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
            {/* Header */}
            <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-400 hover:text-white transition-colors shrink-0 p-1"
                        >
                            ← <span className="hidden sm:inline">Dashboard</span>
                        </button>
                        <h1 className="text-lg sm:text-2xl font-bold text-white truncate text-nowrap">Tables</h1>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {['available', 'occupied', 'reserved', 'cleaning'].map((status) => (
                            <div key={status} className="flex items-center gap-1 text-xs sm:text-sm text-gray-300">
                                {getStatusIcon(status)}
                                <span className="capitalize hidden md:inline">{status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            <main className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {tables.map((table) => (
                            <div
                                key={table._id}
                                className={`bg-gradient-to-br ${getStatusColor(
                                    table.status
                                )} backdrop-blur-sm rounded-2xl p-6 border-2 cursor-pointer hover:scale-105 transition-transform`}
                            >
                                <div className="text-center">
                                    <div className="text-3xl mb-2">
                                        {table.shape === 'round' ? '⭕' : '⬜'}
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Table {table.number}</h3>
                                    <p className="text-gray-400 text-sm">{table.capacity} seats</p>
                                    <p className="text-gray-300 text-sm capitalize mt-2">{table.status}</p>
                                </div>

                                {/* Quick Actions */}
                                <div className="mt-4 grid grid-cols-2 gap-1">
                                    {table.status !== 'available' && (
                                        <button
                                            onClick={() => updateTableStatus(table._id, 'available')}
                                            className="px-2 py-1 bg-green-600/50 hover:bg-green-600 rounded text-xs text-white transition-colors"
                                        >
                                            Free
                                        </button>
                                    )}
                                    {table.status !== 'occupied' && (
                                        <button
                                            onClick={() => updateTableStatus(table._id, 'occupied')}
                                            className="px-2 py-1 bg-red-600/50 hover:bg-red-600 rounded text-xs text-white transition-colors"
                                        >
                                            Occupy
                                        </button>
                                    )}
                                    {table.status !== 'reserved' && (
                                        <button
                                            onClick={() => updateTableStatus(table._id, 'reserved')}
                                            className="px-2 py-1 bg-yellow-600/50 hover:bg-yellow-600 rounded text-xs text-white transition-colors"
                                        >
                                            Reserve
                                        </button>
                                    )}
                                    {table.status !== 'cleaning' && (
                                        <button
                                            onClick={() => updateTableStatus(table._id, 'cleaning')}
                                            className="px-2 py-1 bg-blue-600/50 hover:bg-blue-600 rounded text-xs text-white transition-colors"
                                        >
                                            Clean
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { status: 'available', label: 'Available', color: 'bg-green-600' },
                        { status: 'occupied', label: 'Occupied', color: 'bg-red-600' },
                        { status: 'reserved', label: 'Reserved', color: 'bg-yellow-600' },
                        { status: 'cleaning', label: 'Cleaning', color: 'bg-blue-600' },
                    ].map((item) => (
                        <div
                            key={item.status}
                            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                                <span className="text-gray-300">{item.label}</span>
                                <span className="ml-auto text-2xl font-bold text-white">
                                    {tables.filter((t) => t.status === item.status).length}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default TableManagement;
