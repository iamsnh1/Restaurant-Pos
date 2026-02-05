import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Edit,
    Trash2,
    X,
    Save,
    Package,
    FolderOpen,
    DollarSign,
    Clock,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user && user.role !== 'admin' && user.role !== 'manager') {
            navigate('/');
        }
    }, [user, navigate]);

    const [activeTab, setActiveTab] = useState('menu');
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const cats = await api.getCategories();
        setCategories(cats);
        const items = await api.getMenuItems();
        setMenuItems(items);
    };

    const openModal = (type, item = null) => {
        setModalType(type);
        setEditItem(item);
        if (type === 'category') {
            setFormData(item || { name: '', description: '' });
        } else {
            setFormData(
                item || {
                    name: '',
                    description: '',
                    price: '',
                    category: categories[0]?._id || '',
                    preparationTime: 15,
                    isAvailable: true,
                }
            );
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (modalType === 'category') {
                if (editItem) {
                    // Update not implemented yet
                } else {
                    await api.createCategory(formData);
                }
            } else {
                if (editItem) {
                    await api.updateMenuItem(editItem._id, formData);
                } else {
                    await api.createMenuItem(formData);
                }
            }
            loadData();
            setShowModal(false);
        } catch (error) {
            console.error('Error saving:', error);
        }
    };

    const handleDelete = async (id, type) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            if (type === 'menu') {
                await api.deleteMenuItem(id);
            }
            loadData();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const tabs = [
        { id: 'menu', label: 'Menu Items', icon: Package },
        { id: 'categories', label: 'Categories', icon: FolderOpen },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                        <Link to="/" className="p-2 hover:bg-white/10 rounded-lg transition shrink-0">
                            <ArrowLeft className="text-white" size={24} />
                        </Link>
                        <h1 className="text-lg sm:text-xl font-bold text-white truncate text-nowrap">Admin Panel</h1>
                    </div>
                </div>
                {/* Tabs */}
                <div className="px-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${activeTab === tab.id
                                ? 'border-purple-500 text-white'
                                : 'border-transparent text-purple-300 hover:text-white'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <main className="p-4">
                {/* Menu Items Tab */}
                {activeTab === 'menu' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Menu Items</h2>
                            <button
                                onClick={() => openModal('menu')}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                            >
                                <Plus size={18} />
                                Add Item
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {menuItems.map((item) => (
                                <div
                                    key={item._id}
                                    className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                                            <p className="text-sm text-purple-300">{item.category?.name}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openModal('menu', item)}
                                                className="p-2 hover:bg-white/10 rounded-lg transition"
                                            >
                                                <Edit className="text-purple-400" size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item._id, 'menu')}
                                                className="p-2 hover:bg-red-500/20 rounded-lg transition"
                                            >
                                                <Trash2 className="text-red-400" size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1 text-green-400">
                                            <DollarSign size={14} />
                                            ₹{item.price}
                                        </div>
                                        <div className="flex items-center gap-1 text-purple-300">
                                            <Clock size={14} />
                                            {item.preparationTime} min
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs ${item.isAvailable
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                                }`}
                                        >
                                            {item.isAvailable ? 'Available' : 'Unavailable'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Categories Tab */}
                {activeTab === 'categories' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Categories</h2>
                            <button
                                onClick={() => openModal('category')}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                            >
                                <Plus size={18} />
                                Add Category
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.map((cat) => (
                                <div
                                    key={cat._id}
                                    className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{cat.name}</h3>
                                            {cat.description && (
                                                <p className="text-sm text-purple-300 mt-1">{cat.description}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openModal('category', cat)}
                                                className="p-2 hover:bg-white/10 rounded-lg transition"
                                            >
                                                <Edit className="text-purple-400" size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editItem ? 'Edit' : 'Add'} {modalType === 'category' ? 'Category' : 'Menu Item'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition"
                            >
                                <X className="text-white" size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-purple-200 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-purple-200 mb-1">Description</label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    rows={2}
                                />
                            </div>

                            {modalType === 'menu' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-purple-200 mb-1">Price (₹)</label>
                                            <input
                                                type="number"
                                                value={formData.price || ''}
                                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-purple-200 mb-1">Prep Time (min)</label>
                                            <input
                                                type="number"
                                                value={formData.preparationTime || ''}
                                                onChange={(e) => setFormData({ ...formData, preparationTime: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-purple-200 mb-1">Category</label>
                                        <select
                                            value={formData.category || ''}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat._id} value={cat._id} className="bg-slate-800">
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
