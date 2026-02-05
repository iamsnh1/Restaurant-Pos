import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Users, Clock, Calendar, Plus, Edit, Save, X, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StaffManagement = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('employees');
    const [staff, setStaff] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Shift Form
    const [showShiftForm, setShowShiftForm] = useState(false);
    const [shiftData, setShiftData] = useState({ userId: '', startTime: '', endTime: '', notes: '' });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'employees') {
                const res = await api.getStaff();
                if (Array.isArray(res)) {
                    setStaff(res);
                } else {
                    console.error("Expected array for staff, got:", res);
                    throw new Error(res.message || "Failed to load staff");
                }
            } else if (activeTab === 'attendance') {
                const res = await api.getAttendance();
                if (Array.isArray(res)) {
                    setAttendance(res);
                } else {
                    console.error("Expected array for attendance, got:", res);
                    // If it's 404 or empty, maybe just empty array? 
                    // Assuming API returns array.
                    if (res.message) throw new Error(res.message);
                    setAttendance([]);
                }
            } else if (activeTab === 'shifts') {
                const res = await api.getShifts();
                if (Array.isArray(res)) setShifts(res);

                if (staff.length === 0) {
                    const staffRes = await api.getStaff();
                    if (Array.isArray(staffRes)) setStaff(staffRes);
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (employee) => {
        setEditingId(employee._id);
        setEditForm({ ...employee });
    };

    const handleSave = async () => {
        try {
            await api.updateStaff(editingId, editForm);
            setEditingId(null);
            fetchData();
        } catch (error) {
            console.error('Error updating staff:', error);
            alert("Failed to update: " + error.message);
        }
    };

    const handleCreateShift = async (e) => {
        e.preventDefault();
        try {
            await api.createShift(shiftData);
            setShowShiftForm(false);
            fetchData();
            setShiftData({ userId: '', startTime: '', endTime: '', notes: '' });
        } catch (error) {
            alert('Failed to create shift: ' + error.message);
        }
    };

    const [showAddModal, setShowAddModal] = useState(false);
    const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'waiter', phone: '', hourlyRate: 0, pin: '' });

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        try {
            await api.createStaff(newStaff);
            setShowAddModal(false);
            setNewStaff({ name: '', email: '', password: '', role: 'waiter', phone: '', hourlyRate: 0, pin: '' });
            fetchData();
        } catch (error) {
            alert('Error creating staff: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm('Are you sure you want to remove this staff member?')) return;
        try {
            await api.deleteStaff(id);
            fetchData();
        } catch (error) {
            alert('Error deleting staff: ' + error.message);
        }
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            present: 'bg-green-500/20 text-green-400 border-green-500',
            finished: 'bg-gray-500/20 text-gray-400 border-gray-500',
        };
        return (
            <span className={`px-2 py-1 rounded text-xs border ${colors[status] || 'border-gray-500'}`}>
                {status}
            </span>
        );
    };

    const EmployeeTab = () => (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left min-w-[800px] lg:min-w-0">
                    <thead className="bg-white/5 text-gray-400">
                        <tr>
                            <th className="p-3 sm:p-4 text-xs sm:text-sm uppercase font-bold">Name</th>
                            <th className="p-3 sm:p-4 text-xs sm:text-sm uppercase font-bold">Role</th>
                            <th className="p-3 sm:p-4 text-xs sm:text-sm uppercase font-bold hidden md:table-cell">Email</th>
                            <th className="p-3 sm:p-4 text-xs sm:text-sm uppercase font-bold">Phone</th>
                            <th className="p-3 sm:p-4 text-xs sm:text-sm uppercase font-bold hidden sm:table-cell">Rate</th>
                            <th className="p-3 sm:p-4 text-xs sm:text-sm uppercase font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {staff?.map((employee) => (
                            <tr key={employee._id} className="text-white hover:bg-white/5 transition">
                                <td className="p-4">
                                    {editingId === employee._id ? (
                                        <input
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="bg-gray-700 rounded px-2 py-1 w-full"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs">
                                                {employee.name?.charAt(0) || '?'}
                                            </div>
                                            {employee.name}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    {editingId === employee._id ? (
                                        <select
                                            value={editForm.role}
                                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                            className="bg-gray-700 rounded px-2 py-1"
                                        >
                                            <option value="waiter">Waiter</option>
                                            <option value="chef">Chef</option>
                                            <option value="cashier">Cashier</option>
                                            <option value="manager">Manager</option>
                                        </select>
                                    ) : (
                                        <span className="capitalize px-2 py-1 bg-gray-700 rounded text-xs">{employee.role}</span>
                                    )}
                                </td>
                                <td className="p-4 text-sm text-gray-400 hidden md:table-cell">{employee.email}</td>
                                <td className="p-4">
                                    {editingId === employee._id ? (
                                        <input
                                            value={editForm.phone || ''}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="bg-gray-700 rounded px-2 py-1 w-32 font-mono"
                                            placeholder="Phone"
                                        />
                                    ) : (
                                        <span className="font-mono text-sm">{employee.phone || '-'}</span>
                                    )}
                                </td>
                                <td className="p-4 hidden sm:table-cell">
                                    {editingId === employee._id ? (
                                        <input
                                            type="number"
                                            value={editForm.hourlyRate || 0}
                                            onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })}
                                            className="bg-gray-700 rounded px-2 py-1 w-20"
                                        />
                                    ) : (
                                        `₹${employee.hourlyRate || 0}`
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {editingId === employee._id ? (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={handleSave} className="text-green-400 hover:text-green-300"><Check size={18} /></button>
                                            <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300"><X size={18} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => handleEdit(employee)} className="text-blue-400 hover:text-blue-300">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleDeleteStaff(employee._id)} className="text-red-400 hover:text-red-300">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const AttendanceTab = () => (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400">
                        <tr>
                            <th className="p-4">Employee</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Clock In</th>
                            <th className="p-4">Clock Out</th>
                            <th className="p-4">Total Hours</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {attendance?.map((record) => (
                            <tr key={record._id} className="text-white hover:bg-white/5 transition">
                                <td className="p-4 font-medium">{record.user?.name || 'Unknown'}</td>
                                <td className="p-4 text-gray-400">{record.date ? new Date(record.date).toLocaleDateString() : '-'}</td>
                                <td className="p-4 text-green-400">{record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : '-'}</td>
                                <td className="p-4 text-red-400">{record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : '-'}</td>
                                <td className="p-4 font-bold">{record.totalHours || '-'}</td>
                                <td className="p-4"><StatusBadge status={record.status} /></td>
                            </tr>
                        ))}
                        {attendance?.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500">No attendance records found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const ShiftsTab = () => (
        <div>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setShowShiftForm(true)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white transition"
                >
                    <Plus size={18} /> Add Shift
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shifts?.map((shift) => (
                    <div key={shift._id} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-purple-500/50 transition">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-white text-lg">{shift.user?.name || 'Unknown'}</h3>
                            <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                                {shift.startTime ? new Date(shift.startTime).toLocaleDateString() : ''}
                            </span>
                        </div>
                        <div className="text-gray-300 text-sm space-y-1">
                            <div className="flex justify-between">
                                <span>Start:</span>
                                <span className="text-white">{shift.startTime ? new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>End:</span>
                                <span className="text-white">{shift.endTime ? new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                            </div>
                        </div>
                        {shift.notes && (
                            <div className="mt-3 p-2 bg-black/20 rounded text-xs text-gray-400 italic">
                                "{shift.notes}"
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Shift Modal */}
            {showShiftForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Schedule New Shift</h3>
                        <form onSubmit={handleCreateShift} className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">Employee</label>
                                <select
                                    className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                                    required
                                    value={shiftData.userId}
                                    onChange={e => setShiftData({ ...shiftData, userId: e.target.value })}
                                >
                                    <option value="">Select Employee</option>
                                    {staff?.map(s => <option key={s._id} value={s._id}>{s.name} ({s.role})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-gray-700 rounded px-3 py-2 text-white text-sm"
                                        required
                                        onChange={e => setShiftData({ ...shiftData, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">End Time</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-gray-700 rounded px-3 py-2 text-white text-sm"
                                        required
                                        onChange={e => setShiftData({ ...shiftData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">Notes</label>
                                <textarea
                                    className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                                    rows="2"
                                    onChange={e => setShiftData({ ...shiftData, notes: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowShiftForm(false)} className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded text-white">Cancel</button>
                                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 py-2 rounded text-white">Save Shift</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
                <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button onClick={() => navigate('/')} className="hover:bg-white/10 p-2 rounded-lg transition">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-2xl font-bold">Staff Management</h1>
                    </div>
                    {user?.role === 'admin' && activeTab === 'employees' && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white transition flex items-center gap-2"
                        >
                            <Plus size={18} /> Add New Staff
                        </button>
                    )}
                </div>

                <div className="px-6 flex gap-6 overflow-x-auto border-t border-white/5 mt-2">
                    {[
                        { id: 'employees', label: 'Employee Records', icon: Users },
                        { id: 'attendance', label: 'Attendance Log', icon: Clock },
                        { id: 'shifts', label: 'Shift Schedule', icon: Calendar },
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

            <main className="max-w-7xl mx-auto px-6 py-8">
                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'employees' && <EmployeeTab />}
                        {activeTab === 'attendance' && <AttendanceTab />}
                        {activeTab === 'shifts' && <ShiftsTab />}
                    </>
                )}

                {/* Add Staff Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-6">Create New Staff Member</h3>
                            <form onSubmit={handleCreateStaff} className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Full Name</label>
                                    <input
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                        value={newStaff.name}
                                        onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Email</label>
                                        <input
                                            required
                                            type="email"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                            value={newStaff.email}
                                            onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Password</label>
                                        <input
                                            required
                                            type="password"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                            value={newStaff.password}
                                            onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Role</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                            value={newStaff.role}
                                            onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                                        >
                                            <option value="waiter">Waiter</option>
                                            <option value="chef">Chef / Kitchen</option>
                                            <option value="cashier">Cashier</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">PIN (4-digit)</label>
                                        <input
                                            maxLength="4"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 font-mono"
                                            value={newStaff.pin}
                                            onChange={e => setNewStaff({ ...newStaff, pin: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Phone</label>
                                        <input
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                            value={newStaff.phone}
                                            onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Hourly Rate</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                            value={newStaff.hourlyRate}
                                            onChange={e => setNewStaff({ ...newStaff, hourlyRate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-purple-500/20"
                                    >
                                        Create User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StaffManagement;
