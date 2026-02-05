import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, CreditCard, Banknote, Smartphone, SplitSquareVertical, Printer, CheckCircle, MessageCircle, Share2 } from 'lucide-react';
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
    const [isGenerating, setIsGenerating] = useState(false);

    const handlePrintAndClose = () => {
        window.print(); // Simple browser print for now, ideally calls receipt printer API
        onPaymentComplete();
        onClose();
    };

    const handleSharePDF = async () => {
        try {
            setIsGenerating(true);
            const element = document.getElementById('printable-receipt');
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
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
            const file = new File([pdfBlob], `Bill-${order.orderNumber}.pdf`, { type: 'application/pdf' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Bill - ${order.orderNumber}`,
                    text: `Bill from ${settings?.restaurant?.name || 'Our Restaurant'}`
                });
            } else {
                pdf.save(`Bill-${order.orderNumber}.pdf`);
                alert('Sharing is not supported on this browser. PDF has been downloaded.');
            }
        } catch (error) {
            console.error('PDF Generation failed', error);
            alert('Failed to generate PDF.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleWhatsAppText = () => {
        const phone = customerPhone.replace(/\D/g, '');
        if (!phone || phone.length < 10) {
            alert('Please enter a valid 10-digit customer phone number.');
            return;
        }

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
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white text-black w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                    {/* Header Controls */}
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50 print:hidden">
                        <h2 className="font-bold text-lg">Final Receipt</h2>
                        <button onClick={onClose}><X size={20} /></button>
                    </div>

                    {/* Scrollable Receipt Area */}
                    <div className="flex-1 overflow-y-auto p-8 font-mono text-sm print:p-0" id="printable-receipt">
                        {/* Restaurant Header */}
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold uppercase mb-2">{restaurant.name || 'Restaurant Name'}</h1>
                            {restaurant.address && <p className="whitespace-pre-line">{restaurant.address}</p>}
                            {restaurant.phone && <p>Phone: {restaurant.phone}</p>}
                            {restaurant.email && <p>Email: {restaurant.email}</p>}
                            {restaurant.gstin && <p className="font-bold mt-1">GSTIN: {restaurant.gstin}</p>}
                            <div className="border-b-2 border-dashed border-black my-4"></div>
                        </div>

                        {/* Order Info */}
                        <div className="mb-4 flex justify-between">
                            <div>
                                <p>Order No: {order?.orderNumber}</p>
                                <p>Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                            </div>
                            <div className="text-right">
                                <p>Type: {order?.orderType.toUpperCase()}</p>
                                {order?.tableNumber && <p>Table: {order?.tableNumber}</p>}
                            </div>
                        </div>

                        {/* Editable Customer Info (Print Only shows values) */}
                        <div className="mb-4 p-2 bg-gray-50 rounded border border-dashed border-gray-300 print:border-none print:bg-transparent print:p-0">
                            <p className="font-bold text-xs text-gray-500 uppercase mb-1 print:hidden">Customer Details (Editable)</p>
                            <div className="flex flex-col gap-1">
                                <div className="flex gap-2 items-center">
                                    <span className="w-12">Name:</span>
                                    <input
                                        className="border-b border-gray-300 bg-transparent focus:outline-none w-full print:border-none"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Guest"
                                    />
                                </div>
                                <div className="flex gap-2 items-center">
                                    <span className="w-12">Phone:</span>
                                    <input
                                        className="border-b border-gray-300 bg-transparent focus:outline-none w-full print:border-none"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="-"
                                    />
                                </div>
                                <div className="flex gap-2 items-center">
                                    <span className="w-12">GSTIN:</span>
                                    <input
                                        className="border-b border-gray-300 bg-transparent focus:outline-none w-full print:border-none uppercase"
                                        value={customerGstin}
                                        onChange={(e) => setCustomerGstin(e.target.value)}
                                        placeholder="-"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full mb-4">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="text-left py-1">Item</th>
                                    <th className="text-center w-12">Qty</th>
                                    <th className="text-right w-16">Price</th>
                                    <th className="text-right w-16">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order?.items?.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-1">{item.menuItem?.name || item.name}</td>
                                        <td className="text-center">{item.quantity}</td>
                                        <td className="text-right">{item.price}</td>
                                        <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="border-b-2 border-dashed border-black mb-4"></div>

                        {/* Totals */}
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{billData?.itemTotal?.toFixed(2)}</span>
                            </div>
                            {billData?.discountAmount > 0 && (
                                <div className="flex justify-between">
                                    <span>Discount</span>
                                    <span>-{billData?.discountAmount?.toFixed(2)}</span>
                                </div>
                            )}
                            {billData?.taxDetails?.map((tax, i) => (
                                <div key={i} className="flex justify-between text-xs">
                                    <span>{tax.name} ({tax.rate}%)</span>
                                    <span>{tax.amount.toFixed(2)}</span>
                                </div>
                            ))}
                            {billData?.roundOff !== 0 && (
                                <div className="flex justify-between text-xs italic">
                                    <span>Round Off</span>
                                    <span>{billData?.roundOff}</span>
                                </div>
                            )}
                            <div className="border-t border-black pt-2 mt-2 flex justify-between font-bold text-lg">
                                <span>Grand Total</span>
                                <span>{billData?.grandTotal?.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="text-center mt-8 text-xs">
                            <p>{receipt.footer || 'Thank you for dining with us!'}</p>
                            <p className="mt-2 text-gray-400">Powered by POS System</p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t bg-gray-50 flex gap-2 print:hidden overflow-x-auto">
                        <button
                            onClick={handleSharePDF}
                            disabled={isGenerating}
                            className="flex-1 bg-blue-600 text-white py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg disabled:opacity-50 min-w-fit text-sm"
                        >
                            {isGenerating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Share2 size={18} />}
                            Share PDF
                        </button>
                        <button
                            onClick={handleWhatsAppText}
                            className="flex-1 bg-green-600 text-white py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-lg min-w-fit text-sm"
                        >
                            <MessageCircle size={18} />
                            WhatsApp
                        </button>
                        <button
                            onClick={handlePrintAndClose}
                            className="flex-1 bg-slate-900 text-white py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-lg min-w-fit text-sm"
                        >
                            <Printer size={18} />
                            Print & Close
                        </button>
                    </div>
                </div>

                {/* Print CSS */}
                <style>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #printable-receipt, #printable-receipt * {
                            visibility: visible;
                        }
                        #printable-receipt {
                            position: fixed;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: auto;
                            padding: 0;
                            margin: 0;
                        }
                    }
                 `}</style>
            </div>
        );
    }

    // --- CHECKOUT VIEW ---
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/10">
                {/* Left: Bill Details */}
                <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto max-h-[80vh]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Checkout</h2>
                        <span className="text-gray-400 bg-gray-700 px-2 py-1 rounded text-sm">Order #{order?.orderNumber}</span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-4 mb-6">
                        {order?.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-gray-300 text-sm">
                                <span>{item.quantity}x {item.menuItem?.name || item.name}</span>
                                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-white/10 pt-4 space-y-4">
                        {/* Customer Details Input (Checkout) */}
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-3">
                            <h3 className="text-gray-400 text-xs font-bold uppercase">Customer Details</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full bg-gray-900 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-purple-500 outline-none"
                                        placeholder="Guest Name"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="w-full bg-gray-900 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-purple-500 outline-none"
                                        placeholder="Phone Number"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-500 block mb-1">GSTIN (Optional)</label>
                                    <input
                                        type="text"
                                        value={customerGstin}
                                        onChange={(e) => setCustomerGstin(e.target.value)}
                                        className="w-full bg-gray-900 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-purple-500 outline-none uppercase"
                                        placeholder="GST Number"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Discount Input */}
                        <div className="flex gap-2">
                            <select
                                value={discountType}
                                onChange={(e) => setDiscountType(e.target.value)}
                                className="bg-gray-700 text-white rounded px-2 py-1 text-sm border-none focus:ring-1 focus:ring-purple-500"
                            >
                                <option value="flat">Flat (₹)</option>
                                <option value="percent">%</option>
                            </select>
                            <input
                                type="number"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                className="bg-gray-700 text-white rounded px-2 py-1 w-full text-sm border-none focus:ring-1 focus:ring-purple-500"
                                placeholder="Discount"
                            />
                        </div>

                        {loading ? (
                            <div className="text-center py-4 text-gray-400">Calculating...</div>
                        ) : (
                            <>
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span>₹{billData?.itemTotal?.toFixed(2)}</span>
                                </div>
                                {billData?.discountAmount > 0 && (
                                    <div className="flex justify-between text-green-400">
                                        <span>Discount</span>
                                        <span>-₹{billData?.discountAmount?.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-400">
                                    <span>Taxable Amount</span>
                                    <span>₹{billData?.taxableAmount?.toFixed(2)}</span>
                                </div>
                                {billData?.taxDetails?.map((tax, i) => (
                                    <div key={i} className="flex justify-between text-gray-500 text-sm pl-2">
                                        <span>{tax.name} ({tax.rate}%)</span>
                                        <span>₹{tax.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                                {billData?.roundOff !== 0 && (
                                    <div className="flex justify-between text-gray-500 text-xs italic">
                                        <span>Round Off</span>
                                        <span>{billData?.roundOff > 0 ? '+' : ''}{billData?.roundOff?.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-white text-xl font-bold pt-4 border-t border-white/10">
                                    <span>Grand Total</span>
                                    <span>₹{billData?.grandTotal?.toFixed(2)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: Payment Methods */}
                <div className="w-full md:w-80 bg-slate-900 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">Payment Method</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[40vh] md:max-h-none">
                        {[
                            { id: 'cash', label: 'Cash', icon: Banknote },
                            { id: 'card', label: 'Card', icon: CreditCard },
                            { id: 'upi', label: 'UPI / Wallet', icon: Smartphone },
                            { id: 'split', label: 'Split Bill', icon: SplitSquareVertical },
                        ].map(method => (
                            <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${paymentMethod === method.id
                                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/50'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <method.icon size={20} />
                                <span className="font-medium">{method.label}</span>
                                {paymentMethod === method.id && <CheckCircle className="ml-auto" size={18} />}
                            </button>
                        ))}

                        {/* Split Bill UI */}
                        {paymentMethod === 'split' && (
                            <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm text-gray-300">Split into</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleSplitChange(Math.max(2, splitParts - 1))} className="p-1 bg-white/10 rounded hover:bg-white/20">-</button>
                                        <span className="text-white font-bold w-4 text-center">{splitParts}</span>
                                        <button onClick={() => handleSplitChange(Math.min(10, splitParts + 1))} className="p-1 bg-white/10 rounded hover:bg-white/20">+</button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {splitPayments.map((part, idx) => (
                                        <div key={part.id} className="flex gap-2 items-center text-sm">
                                            <span className="text-gray-400 w-4">#{part.id}</span>
                                            <input
                                                type="number"
                                                value={part.amount}
                                                onChange={(e) => updateSplitPayment(part.id, 'amount', parseFloat(e.target.value))}
                                                className="bg-white/10 border-none rounded px-2 py-1 flex-1 text-white text-right"
                                            />
                                            <select
                                                value={part.method}
                                                onChange={(e) => updateSplitPayment(part.id, 'method', e.target.value)}
                                                className="bg-white/10 border-none rounded px-2 py-1 text-white w-20"
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="card">Card</option>
                                                <option value="upi">UPI</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 md:mt-auto space-y-3 pt-6 border-t border-white/10">
                        {paymentMethod !== 'split' && (
                            <div className="flex justify-between text-gray-400 text-sm mb-2">
                                <span>Amount to Pay</span>
                                <span className="text-white font-bold">₹{billData?.grandTotal?.toFixed(2)}</span>
                            </div>
                        )}

                        <button
                            onClick={handleProcessPayment}
                            disabled={processing || loading}
                            className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {processing ? (
                                <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{paymentMethod === 'split' ? 'Process Split Payment' : `Pay ₹${billData?.grandTotal?.toFixed(2)}`}</span>
                                    <Printer size={18} opacity={0.7} />
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
