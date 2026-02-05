import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, CreditCard, Banknote, Smartphone, SplitSquareVertical, Printer, CheckCircle, MessageCircle, Share2, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CheckoutModal = ({ order, isOpen, onClose, onPaymentComplete }) => {
    const [loading, setLoading] = useState(true);
    const [billData, setBillData] = useState(null);
    const [settings, setSettings] = useState(null); // Store settings for receipt
    const [discountType, setDiscountType] = useState('flat');
    const [discountValue, setDiscountValue] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [processing, setProcessing] = useState(false);

    // Receipt & Split View States
    const [view, setView] = useState('checkout'); // 'checkout' | 'receipt'
    const [splitParts, setSplitParts] = useState(2);
    const [splitPayments, setSplitPayments] = useState([]); // [{id: 1, amount: 0, status: 'pending', method: 'cash'}]

    // Editable Receipt Fields
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerGstin, setCustomerGstin] = useState('');

    useEffect(() => {
        if (isOpen && order) {
            setView('checkout'); // Reset view on open
            fetchSettings();
            calculateBill();
            setSplitPayments([]);
            // Pre-fill customer data if available
            setCustomerName(order.customer?.name || '');
            setCustomerPhone(order.customer?.phone || '');
            setCustomerGstin('');
        }
    }, [isOpen, order]);

    const fetchSettings = async () => {
        try {
            const res = await api.getSettings();
            setSettings(res);
        } catch (error) {
            console.error('Failed to load settings', error);
        }
    }

    // Recalculate when discount changes
    useEffect(() => {
        if (isOpen && billData) {
            const timer = setTimeout(calculateBill, 500); // Debounce
            return () => clearTimeout(timer);
        }
    }, [discountType, discountValue]);

    // Initialize split logic when method changes to split
    useEffect(() => {
        if (paymentMethod === 'split' && billData) {
            const partAmount = billData.grandTotal / splitParts;
            const initialSplits = Array(splitParts).fill().map((_, i) => ({
                id: i + 1,
                amount: parseFloat(partAmount.toFixed(2)),
                status: 'pending',
                method: 'cash'
            }));
            // Adjust last split for rounding
            const currentSum = initialSplits.reduce((acc, curr) => acc + curr.amount, 0);
            const diff = billData.grandTotal - currentSum;
            if (diff !== 0) {
                initialSplits[initialSplits.length - 1].amount += parseFloat(diff.toFixed(2));
            }
            setSplitPayments(initialSplits);
        }
    }, [paymentMethod, splitParts, billData]);

    const calculateBill = async () => {
        try {
            setLoading(true);
            const res = await api.calculateBill({
                orderId: order._id,
                discountType,
                discountValue: parseFloat(discountValue) || 0
            });
            setBillData(res);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleSplitChange = (numberOfSplits) => {
        setSplitParts(numberOfSplits);
    };

    const updateSplitPayment = (id, field, value) => {
        setSplitPayments(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleProcessPayment = async () => {
        setProcessing(true);
        try {
            if (paymentMethod === 'split') {
                // Process each split sequentially for simulation
                for (const part of splitPayments) {
                    if (part.status === 'pending') {
                        await api.processPayment({
                            orderId: order._id,
                            paymentMethod: part.method,
                            amount: part.amount,
                            isFullPayment: false,
                            billingDetails: billData // Send latest bill data
                        });
                        // Update local state to show paid
                        setSplitPayments(prev => prev.map(p => p.id === part.id ? { ...p, status: 'paid' } : p));
                    }
                }
            } else {
                // Single Payment
                await api.processPayment({
                    orderId: order._id,
                    paymentMethod,
                    amount: billData.grandTotal,
                    isFullPayment: true,
                    billingDetails: billData,
                    customer: {
                        name: customerName,
                        phone: customerPhone,
                        gstin: customerGstin
                    }
                });
            }

            // Show Receipt View
            setView('receipt');

        } catch (error) {
            alert('Payment Failed: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };
    const handleShareReceipt = async () => {
        try {
            setIsGenerating(true);
            const element = document.getElementById('printable-receipt');

            // Temporary style fix for oklch colors in html2canvas
            const originalStyle = element.style.cssText;
            element.style.color = '#000000';
            element.style.backgroundColor = '#ffffff';

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            element.style.cssText = originalStyle;

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [80, canvas.height * 80 / canvas.width]
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            const pdfBlob = pdf.output('blob');
            const file = new File([pdfBlob], `Receipt-${order.orderNumber}.pdf`, { type: 'application/pdf' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Receipt - ${order.orderNumber}`,
                    text: `Bill from ${settings?.restaurant?.name || 'Our Restaurant'}. Support: ${settings?.restaurant?.phone || ''}`
                });
            } else {
                pdf.save(`Bill-${order.orderNumber}.pdf`);
                // Fallback to WhatsApp text if file share fails
                const phone = customerPhone.replace(/\D/g, '');
                if (phone && phone.length >= 10) {
                    handleWhatsAppText();
                } else {
                    alert('PDF downloaded. System sharing not supported on this browser.');
                }
            }
        } catch (error) {
            console.error('Receipt Generation failed', error);
            alert('Failed to generate sharing receipt. Downloading PDF instead.');
            handleWhatsAppText(); // At least share text
        } finally {
            setIsGenerating(false);
        }
    };

    const handleWhatsAppText = () => {
        const phone = customerPhone.replace(/\D/g, '');
        if (!phone || phone.length < 10) return;

        const restaurantName = settings?.restaurant?.name || 'Our Restaurant';
        const itemsList = order.items.map(i => `• ${i.quantity}x ${i.menuItem?.name || i.name} - ₹${(i.price * i.quantity).toFixed(2)}`).join('%0A');

        const message = `*Bill from ${restaurantName}*%0A%0A` +
            `*Order No:* ${order.orderNumber}%0A` +
            `*Date:* ${new Date().toLocaleDateString()}%0A%0A` +
            `*Items:*%0A${itemsList}%0A%0A` +
            `*Total Amount: ₹${billData.grandTotal.toFixed(2)}*%0A%0A` +
            `Thank you for dining with us!`;

        const whatsappUrl = `https://wa.me/91${phone}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    if (!isOpen) return null;

    // --- RECEIPT VIEW (Printable) ---
    if (view === 'receipt') {
        const restaurant = settings?.restaurant || {};
        const receipt = settings?.receipt || {};

        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4">
                <div className="bg-white text-black w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

                    {/* Header Controls */}
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50 print:hidden shrink-0">
                        <h2 className="font-bold text-lg">Final Receipt</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
                    </div>

                    {/* Scrollable Receipt Area */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-8 font-mono text-sm print:p-0" id="printable-receipt" style={{ color: '#000', backgroundColor: '#fff' }}>
                        {/* Restaurant Header */}
                        <div className="text-center mb-6">
                            <h1 className="text-xl sm:text-2xl font-bold uppercase mb-2">{restaurant.name || 'Restaurant Name'}</h1>
                            {restaurant.address && <p className="whitespace-pre-line text-xs">{restaurant.address}</p>}
                            {restaurant.phone && <p className="text-xs">Phone: {restaurant.phone}</p>}
                            {restaurant.gstin && <p className="font-bold mt-1 text-xs">GSTIN: {restaurant.gstin}</p>}
                            <div className="border-b-2 border-dashed border-black my-4"></div>
                        </div>

                        {/* Order Info */}
                        <div className="mb-4 flex justify-between text-xs sm:text-sm">
                            <div>
                                <p>Order No: {order?.orderNumber}</p>
                                <p>Date: {new Date().toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <p>Type: {order?.orderType.toUpperCase()}</p>
                                {order?.tableNumber && <p>Table: {order?.tableNumber}</p>}
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full mb-4 text-xs sm:text-sm">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="text-left py-1">Item</th>
                                    <th className="text-center w-10">Qty</th>
                                    <th className="text-right w-16">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order?.items?.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                                        <td className="py-1.5 leading-tight">{item.menuItem?.name || item.name}</td>
                                        <td className="text-center">{item.quantity}</td>
                                        <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="border-b-2 border-dashed border-black mb-4"></div>

                        {/* Totals */}
                        <div className="space-y-1 text-xs sm:text-sm">
                            <div className="flex justify-between font-medium">
                                <span>Subtotal</span>
                                <span>{billData?.itemTotal?.toFixed(2)}</span>
                            </div>
                            {billData?.discountAmount > 0 && (
                                <div className="flex justify-between text-green-700">
                                    <span>Discount</span>
                                    <span>-{billData?.discountAmount?.toFixed(2)}</span>
                                </div>
                            )}
                            {billData?.taxDetails?.map((tax, i) => (
                                <div key={i} className="flex justify-between text-gray-600">
                                    <span>{tax.name} ({tax.rate}%)</span>
                                    <span>{tax.amount.toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="border-t border-black pt-2 mt-2 flex justify-between font-bold text-base sm:text-lg">
                                <span>Grand Total</span>
                                <span>₹{billData?.grandTotal?.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="text-center mt-8 text-xs border-t-2 border-dashed border-black pt-4">
                            <p className="font-bold">{receipt.footer || 'Thank you for dining with us!'}</p>
                            <p className="mt-2 text-gray-500 italic">Bill generated via RestoPOS</p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-3 sm:p-4 border-t bg-gray-50 flex flex-col sm:flex-row gap-2 print:hidden shrink-0">
                        <button
                            onClick={handleShareReceipt}
                            disabled={isGenerating}
                            className="flex-1 bg-green-600 text-white py-3.5 px-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-lg disabled:opacity-50 text-sm"
                        >
                            {isGenerating ? (
                                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                            ) : (
                                <MessageCircle size={18} />
                            )}
                            {isGenerating ? 'Generating...' : 'Share on WhatsApp'}
                        </button>
                        <div className="flex gap-2 flex-1">
                            <button
                                onClick={handlePrintAndClose}
                                className="flex-1 bg-slate-900 text-white py-3.5 px-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-lg text-sm"
                            >
                                <Printer size={18} />
                                Print
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 bg-gray-200 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-300 transition text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>

                {/* Print CSS - Enhanced for POS printers */}
                <style>{`
                    @media print {
                        @page { size: 80mm auto; margin: 0; }
                        body * { visibility: hidden; }
                        #printable-receipt, #printable-receipt * { visibility: visible; }
                        #printable-receipt {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 80mm;
                            margin: 0;
                            padding: 5mm;
                            background: white !important;
                            color: black !important;
                        }
                    }
                 `}</style>
            </div>
        );
    }

    // --- CHECKOUT VIEW ---
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/10 max-h-[95vh] sm:max-h-[85vh]">
                {/* Left: Bill Details */}
                <div className="flex-1 p-4 sm:p-6 border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">Checkout</h2>
                        <span className="text-gray-400 bg-gray-700/50 px-2 py-1 rounded text-xs">Order #{order?.orderNumber}</span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-3 mb-6 bg-white/5 rounded-xl p-3 border border-white/5">
                        {order?.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-gray-300 text-xs sm:text-sm">
                                <span className="truncate mr-4">{item.quantity}x {item.menuItem?.name || item.name}</span>
                                <span className="shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-white/10 pt-4 space-y-4">
                        {/* Customer Details Input (Checkout) */}
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-3">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Customer Info</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-1">
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:border-purple-500 outline-none transition"
                                        placeholder="Name"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <input
                                        type="text"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:border-purple-500 outline-none transition"
                                        placeholder="Phone"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Discount Input */}
                        <div className="flex gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                            <select
                                value={discountType}
                                onChange={(e) => setDiscountType(e.target.value)}
                                className="bg-gray-900 text-white rounded-lg px-2 py-2 text-xs border-none focus:ring-1 focus:ring-purple-500 !outline-none"
                            >
                                <option value="flat">₹ Flat</option>
                                <option value="percent">% Off</option>
                            </select>
                            <input
                                type="number"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                className="bg-gray-900 text-white rounded-lg px-3 py-2 w-full text-xs sm:text-sm border-none focus:ring-1 focus:ring-purple-500 outline-none"
                                placeholder="Discount amount..."
                            />
                        </div>

                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between text-gray-400 text-xs">
                                <span>Subtotal</span>
                                <span>₹{billData?.itemTotal?.toFixed(2)}</span>
                            </div>
                            {billData?.discountAmount > 0 && (
                                <div className="flex justify-between text-green-400 text-xs">
                                    <span>Discount</span>
                                    <span>-₹{billData?.discountAmount?.toFixed(2)}</span>
                                </div>
                            )}
                            {billData?.taxDetails?.map((tax, i) => (
                                <div key={i} className="flex justify-between text-gray-500 text-xs">
                                    <span>{tax.name} ({tax.rate}%)</span>
                                    <span>₹{tax.amount.toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-white text-lg sm:text-xl font-bold pt-3 mt-2 border-t border-white/10">
                                <span>Total</span>
                                <span className="text-purple-400">₹{billData?.grandTotal?.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Payment Methods */}
                <div className="w-full md:w-80 bg-slate-900/50 p-4 sm:p-6 flex flex-col shrink-0">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">Payment</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white lg:hidden"><X size={24} /></button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-1 gap-2 flex-1 overflow-y-auto max-h-[30vh] md:max-h-none mb-6">
                        {[
                            { id: 'cash', label: 'Cash', icon: Banknote },
                            { id: 'card', label: 'Card', icon: CreditCard },
                            { id: 'upi', label: 'UPI', icon: Smartphone },
                            { id: 'split', label: 'Split', icon: SplitSquareVertical },
                        ].map(method => (
                            <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${paymentMethod === method.id
                                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <method.icon size={18} />
                                <span className="font-semibold text-sm">{method.label}</span>
                                {paymentMethod === method.id && <CheckCircle className="ml-auto shrink-0" size={16} />}
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/10">
                        <button
                            onClick={handleProcessPayment}
                            disabled={processing || loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-green-900/20 flex items-center justify-center gap-3 disabled:opacity-50 transition-transform active:scale-95"
                        >
                            {processing ? (
                                <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Pay {paymentMethod === 'split' ? 'Total' : `₹${billData?.grandTotal?.toFixed(0)}`}</span>
                                    <Check size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;
