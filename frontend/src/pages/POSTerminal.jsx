import React, { useState, useEffect, useRef } from 'react';
import api, { API_BASE } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    ArrowLeft,
    CreditCard,
    Banknote,
    Smartphone,
    Check,
    X,
    UtensilsCrossed,
    ShoppingBag,
    Truck,
} from 'lucide-react';
import CheckoutModal from '../components/CheckoutModal';
import { io } from 'socket.io-client';

const POSTerminal = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [cart, setCart] = useState([]);
    const [orderType, setOrderType] = useState('dine-in');
    const [tableNumber, setTableNumber] = useState('');
    const [showCheckout, setShowCheckout] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentOrder, setCurrentOrder] = useState(null);
    const selectedCategoryRef = useRef(selectedCategory);
    selectedCategoryRef.current = selectedCategory;

    // Socket for notifications and menu sync
    useEffect(() => {
        const socket = io(API_BASE);

        socket.emit('joinPOS');

        socket.on('orderStatusUpdate', (updatedOrder) => {
            if (updatedOrder.status === 'ready') {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`Order Ready: #${updatedOrder._id.slice(-4).toUpperCase()}`, {
                        body: `Order for Table ${updatedOrder.tableNumber || 'Takeaway'} is ready!`,
                        icon: '/icon.png'
                    });
                }
            }
        });

        socket.on('menuSync', () => {
            loadData(selectedCategoryRef.current);
        });

        return () => socket.disconnect();
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            loadMenuItems(selectedCategory);
        }
    }, [selectedCategory]);

    const loadData = async (preserveCategoryId) => {
        try {
            const cats = await api.getCategories();
            setCategories(cats);
            if (cats.length > 0) {
                const currentId = preserveCategoryId ?? (cats[0]._id ?? cats[0].id);
                const exists = cats.some((c) => (c._id ?? c.id) === currentId);
                const categoryId = exists ? currentId : (cats[0]._id ?? cats[0].id);
                setSelectedCategory(categoryId);
                const items = await api.getMenuItems(categoryId);
                setMenuItems(items);
            } else {
                setMenuItems([]);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            setLoading(false);
        }
    };

    const loadMenuItems = async (categoryId) => {
        try {
            const items = await api.getMenuItems(categoryId);
            setMenuItems(items);
        } catch (error) {
            console.error('Error loading menu items:', error);
        }
    };

    const addToCart = (item) => {
        const existing = cart.find((c) => c.menuItem === item._id);
        if (existing) {
            setCart(
                cart.map((c) =>
                    c.menuItem === item._id ? { ...c, quantity: c.quantity + 1 } : c
                )
            );
        } else {
            setCart([
                ...cart,
                {
                    menuItem: item._id,
                    name: item.name,
                    price: item.price,
                    quantity: 1,
                },
            ]);
        }
    };

    const updateQuantity = (menuItemId, delta) => {
        setCart(
            cart
                .map((c) =>
                    c.menuItem === menuItemId
                        ? { ...c, quantity: Math.max(0, c.quantity + delta) }
                        : c
                )
                .filter((c) => c.quantity > 0)
        );
    };

    const removeFromCart = (menuItemId) => {
        setCart(cart.filter((c) => c.menuItem !== menuItemId));
    };

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    const handleCheckout = async () => {
        try {
            // Create Order first to get ID
            const orderData = {
                orderType,
                tableNumber: orderType === 'dine-in' ? parseInt(tableNumber) : undefined,
                items: cart,
            };
            const order = await api.createOrder(orderData);
            setCurrentOrder(order);
            setShowCheckout(true); // Open modal
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Failed to init checkout');
        }
    };

    const handlePaymentComplete = () => {
        alert('Payment Success! Order Completed.');
        setCart([]);
        setShowCheckout(false);
        setCurrentOrder(null);
        setTableNumber('');
    };

    const orderTypes = [
        { id: 'dine-in', label: 'Dine In', icon: UtensilsCrossed },
        { id: 'takeaway', label: 'Takeaway', icon: ShoppingBag },
        { id: 'delivery', label: 'Delivery', icon: Truck },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="p-2 hover:bg-white/10 rounded-lg transition"
                        >
                            <ArrowLeft className="text-white" size={24} />
                        </Link>
                        <h1 className="text-xl font-bold text-white">POS Terminal</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {orderTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setOrderType(type.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${orderType === type.id
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/10 text-purple-200 hover:bg-white/20'
                                    }`}
                            >
                                <type.icon size={18} />
                                <span className="hidden sm:inline">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden relative">
                {/* Menu Section */}
                <div className="flex-1 flex flex-col overflow-hidden h-full">
                    {/* Categories */}
                    <div className="p-4 flex gap-2 overflow-x-auto border-b border-white/10 shrink-0 scrollbar-hide">
                        {categories.map((cat) => {
                            const catId = cat._id ?? cat.id;
                            return (
                                <button
                                    key={catId}
                                    onClick={() => setSelectedCategory(catId)}
                                    className={`px-4 py-2 rounded-full whitespace-nowrap transition text-sm sm:text-base ${selectedCategory === catId
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/10 text-purple-200 hover:bg-white/20'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* Menu Items Grid */}
                    <div className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {menuItems.map((item) => (
                                <button
                                    key={item._id}
                                    onClick={() => addToCart(item)}
                                    className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 text-left hover:border-purple-500/50 hover:bg-white/10 transition group flex items-center lg:block gap-4 lg:gap-0"
                                >
                                    <div className="aspect-square w-16 lg:w-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg lg:mb-3 flex items-center justify-center shrink-0">
                                        <UtensilsCrossed className="text-purple-400 group-hover:scale-110 transition" size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-white truncate">{item.name}</h3>
                                        <p className="text-purple-400 font-bold">₹{item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="ml-auto lg:hidden bg-purple-600/20 p-2 rounded-full text-purple-400">
                                        <Plus size={20} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Cart Toggle Button (Floating) */}
                <div className="lg:hidden absolute bottom-4 left-4 right-4 z-20">
                    <button
                        onClick={() => setShowCheckout(true)}
                        className="w-full bg-purple-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                                {cart.length}
                            </div>
                            <span className="font-medium">View Cart</span>
                        </div>
                        <span className="font-bold text-lg">₹{total.toFixed(2)}</span>
                    </button>
                </div>

                {/* Cart Section - Desktop: Sidebar, Mobile: Modal/Drawer */}
                <div className={`
                    fixed inset-0 z-30 bg-slate-900/95 lg:bg-white/5 lg:backdrop-blur-lg 
                    lg:static lg:inset-auto lg:z-auto lg:w-96 lg:border-l lg:border-white/10 lg:flex lg:flex-col
                    transition-transform duration-300 ease-in-out
                    ${showCheckout ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
                `}>
                    {/* Mobile Header for Cart Drawer */}
                    <div className="lg:hidden p-4 border-b border-white/10 flex items-center justify-between bg-slate-900">
                        <h2 className="text-xl font-bold text-white">Current Order</h2>
                        <button
                            onClick={() => setShowCheckout(false)}
                            className="p-2 hover:bg-white/10 rounded-lg text-white"
                        >
                            <span className="text-sm">Close</span>
                        </button>
                    </div>

                    <div className="p-4 border-b border-white/10 hidden lg:block">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="text-purple-400" size={24} />
                            <h2 className="text-xl font-bold text-white">Cart</h2>
                            <span className="ml-auto bg-purple-600 text-white text-sm px-2 py-1 rounded-full">
                                {cart.length}
                            </span>
                        </div>
                        {orderType === 'dine-in' && (
                            <input
                                type="number"
                                placeholder="Table Number"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="mt-3 w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        )}
                    </div>

                    {/* Cart Items with specific height for mobile drawer */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[calc(100vh-280px)] lg:h-auto">
                        {cart.length === 0 ? (
                            <p className="text-center text-purple-300/50 py-8">Cart is empty</p>
                        ) : (
                            cart.map((item) => (
                                <div
                                    key={item.menuItem}
                                    className="bg-white/5 rounded-lg p-3 flex items-center gap-3"
                                >
                                    <div className="flex-1">
                                        <h4 className="text-white font-medium">{item.name}</h4>
                                        <p className="text-purple-400">₹{item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateQuantity(item.menuItem, -1)}
                                            className="p-1 bg-white/10 rounded hover:bg-white/20 transition"
                                        >
                                            <Minus className="text-white" size={16} />
                                        </button>
                                        <span className="text-white w-8 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.menuItem, 1)}
                                            className="p-1 bg-white/10 rounded hover:bg-white/20 transition"
                                        >
                                            <Plus className="text-white" size={16} />
                                        </button>
                                        <button
                                            onClick={() => removeFromCart(item.menuItem)}
                                            className="p-1 text-red-400 hover:bg-red-500/20 rounded transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Cart Summary */}
                    <div className="p-4 border-t border-white/10 space-y-3 bg-slate-900 lg:bg-transparent">
                        <div className="flex justify-between text-purple-200">
                            <span>Item Total</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {/* Tax is now calculated in Modal based on settings, not strictly 5% here */}
                        <div className="flex justify-between text-white font-bold text-lg">
                            <span>Est. Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Checkout & Pay
                        </button>
                    </div>
                </div>
            </div>

            {currentOrder && (
                <CheckoutModal
                    order={currentOrder}
                    isOpen={showCheckout}
                    onClose={() => setShowCheckout(false)}
                    onPaymentComplete={handlePaymentComplete}
                />
            )}
        </div>
    );
};

export default POSTerminal;
