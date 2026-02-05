import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Store, DollarSign, Printer, Server, Save, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.getSettings();
            setSettings(res);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load settings:', error);
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.updateSettings(settings); // Send full object or specifically modified parts
            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Failed to save:', error);
            setMessage('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleBackup = async () => {
        try {
            const res = await api.backupSystem();
            alert(`Backup created! Timestamp: ${res.timestamp}`);
        } catch (error) {
            alert('Backup failed: ' + error.message);
        }
    };

    const updateField = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>;

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all w-full md:w-auto justify-start ${activeTab === id ? 'bg-purple-600 text-white' : 'hover:bg-white/10 text-gray-400'
                }`}
        >
            <Icon size={18} />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
                <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                        <button onClick={() => navigate('/')} className="hover:bg-white/10 p-2 rounded-lg transition shrink-0">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-lg sm:text-2xl font-bold truncate">Settings</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {message && <span className="text-green-400 font-medium text-xs sm:text-sm animate-pulse hidden sm:inline">{message}</span>}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 sm:px-6 py-2 rounded-lg font-bold transition disabled:opacity-50"
                        >
                            <Save size={20} />
                            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Changes'}</span>
                            <span className="sm:hidden">{saving ? '...' : 'Save'}</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 flex flex-col md:flex-row gap-4 sm:gap-8">
                {/* Sidebar Navigation - Horizontal on Mobile */}
                <aside className="w-full md:w-64 flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide shrink-0">
                    <TabButton id="general" label="Profile" icon={Store} />
                    <TabButton id="financials" label="Tax" icon={DollarSign} />
                    <TabButton id="printers" label="Printers" icon={Printer} />
                    <TabButton id="system" label="System" icon={Server} />
                </aside>

                {/* Content Area */}
                <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-6">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">Restaurant Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-400 mb-2 text-sm">Restaurant Name</label>
                                    <input
                                        type="text"
                                        value={settings.restaurant?.name || ''}
                                        onChange={(e) => updateField('restaurant', 'name', e.target.value)}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2 text-sm">Email Address</label>
                                    <input
                                        type="email"
                                        value={settings.restaurant?.email || ''}
                                        onChange={(e) => updateField('restaurant', 'email', e.target.value)}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2 text-sm">Phone Number</label>
                                    <input
                                        type="text"
                                        value={settings.restaurant?.phone || ''}
                                        onChange={(e) => updateField('restaurant', 'phone', e.target.value)}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2 text-sm">GSTIN / Tax ID</label>
                                    <input
                                        type="text"
                                        value={settings.restaurant?.gstin || ''}
                                        onChange={(e) => updateField('restaurant', 'gstin', e.target.value)}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-gray-400 mb-2 text-sm">Theme Preference</label>
                                    <select
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2"
                                        value={settings.restaurant?.theme || 'dark'}
                                        onChange={(e) => updateField('restaurant', 'theme', e.target.value)}
                                    >
                                        <option value="dark">Dark Mode (Default)</option>
                                        <option value="light">Light Mode</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-gray-400 mb-2 text-sm">Address</label>
                                    <textarea
                                        value={settings.restaurant?.address || ''}
                                        onChange={(e) => updateField('restaurant', 'address', e.target.value)}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 h-24"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'financials' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">Financial Configuration</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-400 mb-2 text-sm">Currency Code (e.g., USD, INR)</label>
                                    <input
                                        type="text"
                                        value={settings.financials?.currency || ''}
                                        onChange={(e) => updateField('financials', 'currency', e.target.value)}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2 text-sm">Currency Symbol (e.g., $, ₹)</label>
                                    <input
                                        type="text"
                                        value={settings.financials?.currencySymbol || ''}
                                        onChange={(e) => updateField('financials', 'currencySymbol', e.target.value)}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2"
                                    />
                                </div>
                            </div>

                            <div className="mt-8">
                                <h3 className="text-lg font-semibold mb-4">Tax Rates</h3>
                                {settings.financials?.taxRates?.map((tax, index) => (
                                    <div key={index} className="flex gap-4 mb-4 items-center">
                                        <input
                                            placeholder="Tax Name (e.g. VAT)"
                                            value={tax.name || ''}
                                            onChange={(e) => {
                                                const newRates = [...settings.financials.taxRates];
                                                newRates[index].name = e.target.value;
                                                updateField('financials', 'taxRates', newRates);
                                            }}
                                            className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2"
                                        />
                                        <input
                                            placeholder="Rate %"
                                            type="number"
                                            value={tax.rate || ''}
                                            onChange={(e) => {
                                                const newRates = [...settings.financials.taxRates];
                                                newRates[index].rate = parseFloat(e.target.value);
                                                updateField('financials', 'taxRates', newRates);
                                            }}
                                            className="w-24 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2"
                                        />
                                        <button
                                            onClick={() => {
                                                const newRates = settings.financials.taxRates.filter((_, i) => i !== index);
                                                updateField('financials', 'taxRates', newRates);
                                            }}
                                            className="text-red-400 hover:text-red-300"
                                        >Remove</button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const newRates = [...(settings.financials.taxRates || []), { name: '', rate: 0, isDefault: false }];
                                        updateField('financials', 'taxRates', newRates);
                                    }}
                                    className="bg-purple-600/50 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm transition"
                                >
                                    + Add Tax Rate
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'printers' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">Printers & Receipts</h2>
                            <div>
                                <label className="block text-gray-400 mb-2 text-sm">Receipt Customer Footer</label>
                                <textarea
                                    value={settings.receipt?.footer || ''}
                                    onChange={(e) => updateField('receipt', 'footer', e.target.value)}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 h-24"
                                ></textarea>
                            </div>

                            <div className="mt-8">
                                <h3 className="text-lg font-semibold mb-4">Configured Printers</h3>
                                {settings.printSettings?.printers?.length === 0 && <p className="text-gray-500 italic">No printers configured.</p>}
                                {settings.printSettings?.printers?.map((printer, index) => (
                                    <div key={index} className="bg-white/5 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <input
                                            placeholder="Printer Name"
                                            value={printer.name}
                                            onChange={(e) => {
                                                const newPrinters = [...settings.printSettings.printers];
                                                newPrinters[index].name = e.target.value;
                                                updateField('printSettings', 'printers', newPrinters);
                                            }}
                                            className="bg-gray-700/50 rounded px-3 py-2"
                                        />
                                        <select
                                            value={printer.type}
                                            onChange={(e) => {
                                                const newPrinters = [...settings.printSettings.printers];
                                                newPrinters[index].type = e.target.value;
                                                updateField('printSettings', 'printers', newPrinters);
                                            }}
                                            className="bg-gray-700/50 rounded px-3 py-2"
                                        >
                                            <option value="receipt">Receipt Printer</option>
                                            <option value="kot">KOT Printer</option>
                                            <option value="label">Label Printer</option>
                                        </select>
                                        <div className="flex gap-2">
                                            <input
                                                placeholder="IP Address"
                                                value={printer.ip}
                                                onChange={(e) => {
                                                    const newPrinters = [...settings.printSettings.printers];
                                                    newPrinters[index].ip = e.target.value;
                                                    updateField('printSettings', 'printers', newPrinters);
                                                }}
                                                className="bg-gray-700/50 rounded px-3 py-2 flex-1"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newPrinters = settings.printSettings.printers.filter((_, i) => i !== index);
                                                    updateField('printSettings', 'printers', newPrinters);
                                                }}
                                                className="text-red-400"
                                            >X</button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const newPrinters = [...(settings.printSettings.printers || []), { name: 'New Printer', type: 'receipt', ip: '192.168.1.100' }];
                                        updateField('printSettings', 'printers', newPrinters);
                                    }}
                                    className="bg-purple-600/50 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm transition"
                                >
                                    + Add Printer
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">System Maintenance</h2>
                            <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">Data Backup</h3>
                                    <p className="text-gray-400 text-sm">Create a full backup of your restaurant database (Sales, Menu, Users, Settings).</p>
                                </div>
                                <button
                                    onClick={handleBackup}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition"
                                >
                                    <RotateCcw size={20} />
                                    Create Backup
                                </button>
                            </div>
                            <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/20">
                                <h3 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h3>
                                <p className="text-gray-400 text-sm mb-4">Reset all settings to factory default. This action cannot be undone.</p>
                                <button className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded transition">
                                    Factory Reset
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Settings;
