import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Reservations = () => {
    const navigate = useNavigate();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        partySize: 2,
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        specialRequests: '',
    });

    useEffect(() => {
        fetchReservations();
    }, [selectedDate]);

    const fetchReservations = async () => {
        try {
            const response = await api.get(`/reservations?date=${selectedDate}`);
            setReservations(response.data);
        } catch (error) {
            console.error('Error fetching reservations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/reservations', formData);
            setShowForm(false);
            setFormData({
                customerName: '',
                customerPhone: '',
                customerEmail: '',
                partySize: 2,
                date: selectedDate,
                time: '19:00',
                specialRequests: '',
            });
            fetchReservations();
        } catch (error) {
            console.error('Error creating reservation:', error);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.updateReservation(id, { status });
            fetchReservations();
        } catch (error) {
            console.error('Error updating reservation:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
            confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500',
            seated: 'bg-green-500/20 text-green-400 border-green-500',
            completed: 'bg-gray-500/20 text-gray-400 border-gray-500',
            cancelled: 'bg-red-500/20 text-red-400 border-red-500',
            'no-show': 'bg-red-500/20 text-red-400 border-red-500',
        };
        return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500';
    };

    const timeSlots = [];
    for (let h = 11; h <= 22; h++) {
        timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
            {/* Header */}
            <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                        >
                            ← <span className="hidden sm:inline">Dashboard</span>
                        </button>
                        <h1 className="text-xl sm:text-2xl font-bold text-white truncate">Reservations</h1>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                        />
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium text-white transition-colors text-sm whitespace-nowrap"
                        >
                            <span className="sm:hidden">+ New</span>
                            <span className="hidden sm:inline">+ New Reservation</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-6">
                {/* New Reservation Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
                            <h2 className="text-xl font-bold text-white mb-4">New Reservation</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Customer Name *"
                                    value={formData.customerName}
                                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    required
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone Number *"
                                    value={formData.customerPhone}
                                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Email (optional)"
                                    value={formData.customerEmail}
                                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-gray-400 text-sm">Party Size</label>
                                        <select
                                            value={formData.partySize}
                                            onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
                                                <option key={n} value={n}>{n} guests</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-sm">Time</label>
                                        <select
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        >
                                            {timeSlots.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                />
                                <textarea
                                    placeholder="Special Requests"
                                    value={formData.specialRequests}
                                    onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    rows={2}
                                />
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium text-white transition-colors"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                ) : reservations.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <div className="text-6xl mb-4">📅</div>
                        <p className="text-xl">No reservations for this date</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reservations.map((res) => (
                            <div
                                key={res._id}
                                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                                <div className="flex flex-row items-center gap-4 sm:gap-6">
                                    <div className="text-center shrink-0">
                                        <div className="text-xl sm:text-2xl font-bold text-white">{res.time}</div>
                                        <div className="text-gray-400 text-xs sm:text-sm">{res.partySize} guests</div>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-white truncate">{res.customerName}</h3>
                                        <p className="text-gray-400 text-sm">{res.customerPhone}</p>
                                        {res.specialRequests && (
                                            <p className="text-yellow-400 text-xs sm:text-sm mt-1 truncate">📝 {res.specialRequests}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-white/5 pt-3 sm:border-t-0 sm:pt-0">
                                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border ${getStatusColor(res.status)}`}>
                                        {res.status}
                                    </span>
                                    <div className="flex gap-2">
                                        {res.status === 'pending' && (
                                            <button
                                                onClick={() => updateStatus(res._id, 'confirmed')}
                                                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs sm:text-sm transition-colors"
                                            >
                                                Confirm
                                            </button>
                                        )}
                                        {res.status === 'confirmed' && (
                                            <button
                                                onClick={() => updateStatus(res._id, 'seated')}
                                                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-xs sm:text-sm transition-colors"
                                            >
                                                Seat
                                            </button>
                                        )}
                                        {res.status === 'seated' && (
                                            <button
                                                onClick={() => updateStatus(res._id, 'completed')}
                                                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-xs sm:text-sm transition-colors"
                                            >
                                                Done
                                            </button>
                                        )}
                                        {['pending', 'confirmed'].includes(res.status) && (
                                            <button
                                                onClick={() => updateStatus(res._id, 'cancelled')}
                                                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600/50 hover:bg-red-600 rounded-lg text-white text-xs sm:text-sm transition-colors"
                                            >
                                                X
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary Stats */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { status: 'pending', label: 'Pending', color: 'bg-yellow-600' },
                        { status: 'confirmed', label: 'Confirmed', color: 'bg-blue-600' },
                        { status: 'seated', label: 'Seated', color: 'bg-green-600' },
                        { status: 'completed', label: 'Completed', color: 'bg-gray-600' },
                    ].map((item) => (
                        <div
                            key={item.status}
                            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                                <span className="text-gray-300">{item.label}</span>
                                <span className="ml-auto text-2xl font-bold text-white">
                                    {reservations.filter((r) => r.status === item.status).length}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Reservations;
