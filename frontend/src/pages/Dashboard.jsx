import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, UtensilsCrossed, ClipboardList, LayoutDashboard, BarChart3, Users, Settings, Download, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = React.useState(null);

    React.useEffect(() => {
        // Handle PWA Install Prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });

        // Request Notification Permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Notifications Enabled', {
                        body: 'You will now receive alerts for new orders.',
                        icon: '/icon.png'
                    });
                }
            });
        }
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuCards = [
        {
            title: 'POS Terminal',
            description: 'Take orders and process payments',
            icon: UtensilsCrossed,
            link: '/pos',
            color: 'from-green-500 to-emerald-600',
        },
        {
            title: 'Kitchen Display',
            description: 'Real-time order management for kitchen',
            icon: ClipboardList,
            link: '/kitchen',
            color: 'from-orange-500 to-red-600',
        },
        {
            title: 'Menu Management',
            description: 'Manage menu items and categories',
            icon: LayoutDashboard,
            link: '/admin',
            color: 'from-purple-500 to-pink-600',
        },
        {
            title: 'Analytics',
            description: 'Sales reports and business insights',
            icon: BarChart3,
            link: '/analytics',
            color: 'from-blue-500 to-cyan-600',
        },
        {
            title: 'Staff Management',
            description: 'Employees, shifts, and attendance',
            icon: Users,
            link: '/staff',
            color: 'from-violet-500 to-purple-600',
        },
        {
            title: 'Settings',
            description: 'System config & Backup',
            icon: Settings,
            link: '/settings',
            color: 'from-gray-600 to-slate-700',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="bg-white/5 backdrop-blur-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-2xl font-bold text-white">Restaurant POS</h1>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-2">
                            {deferredPrompt && (
                                <button
                                    onClick={handleInstallClick}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-xs font-bold shadow-lg animate-bounce"
                                >
                                    <Download size={14} />
                                    Install App
                                </button>
                            )}
                            <span className="text-purple-200 text-sm sm:text-base">
                                Welcome, <span className="font-semibold text-white">{user?.name}</span>
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h2 className="text-3xl font-bold text-white mb-8">Dashboard</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuCards
                        .filter(card => {
                            if (user?.role === 'admin' || user?.role === 'manager') return true;
                            if (user?.role === 'chef' && card.title === 'Kitchen Display') return true;
                            if (user?.role === 'waiter' && card.title === 'POS Terminal') return true;
                            if (user?.role === 'cashier' && (card.title === 'POS Terminal' || card.title === 'Analytics')) return true;
                            return false;
                        })
                        .map((card) => (
                            <Link
                                key={card.title}
                                to={card.link}
                                className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-6 hover:border-white/30 transition-all duration-300 hover:scale-105"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${card.color} mb-4`}>
                                    <card.icon size={28} className="text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{card.title}</h3>
                                <p className="text-purple-200/70">{card.description}</p>
                            </Link>
                        ))}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
