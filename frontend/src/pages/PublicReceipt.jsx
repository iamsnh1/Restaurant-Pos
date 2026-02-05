import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Printer, Download, CheckCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';

const PublicReceipt = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Use environment variable or relative logic
                const apiBase = import.meta.env.VITE_API_URL
                    ? import.meta.env.VITE_API_URL.replace('/api', '')
                    : window.location.origin.replace('5173', '5001').replace('5174', '5001');

                const [orderRes, settingsRes] = await Promise.all([
                    axios.get(`${apiBase}/api/orders/public/${id}`),
                    axios.get(`${apiBase}/api/settings/public`)
                ]);
                setOrder(orderRes.data);
                setSettings(settingsRes.data);
            } catch (err) {
                console.error('Error fetching receipt:', err);
                setError('Receipt not found or expired.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handlePrint = () => window.print();

    const handleDownload = () => {
        if (!order) return;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 250]
        });

        const restaurant = settings?.restaurant || {};
        const billData = order.billingDetails || {
            itemTotal: order.subtotal,
            grandTotal: order.total,
            totalTax: order.tax,
            discountAmount: order.discount
        };

        let y = 10;
        const mid = 40;
        const leftMargin = 5;
        const rightMargin = 75;

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text((restaurant.name || 'Restaurant').toUpperCase(), mid, y, { align: 'center' });
        y += 6;

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        if (restaurant.address) {
            const addrLines = pdf.splitTextToSize(restaurant.address, 65);
            addrLines.forEach(l => { pdf.text(l, mid, y, { align: 'center' }); y += 4; });
        }

        y += 2;
        pdf.line(leftMargin, y, rightMargin, y);
        y += 6;

        pdf.setFontSize(9);
        pdf.text(`Order: ${order.orderNumber}`, leftMargin, y);
        pdf.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, rightMargin, y, { align: 'right' });
        y += 10;

        pdf.setFont("helvetica", "bold");
        pdf.text("Item", leftMargin, y);
        pdf.text("Qty", 55, y, { align: 'center' });
        pdf.text("Total", rightMargin, y, { align: 'right' });
        y += 6;
        pdf.line(leftMargin, y - 4, rightMargin, y - 4);

        pdf.setFont("helvetica", "normal");
        order.items.forEach(item => {
            const name = item.menuItem?.name || item.name;
            pdf.text(name, leftMargin, y);
            pdf.text(item.quantity.toString(), 55, y, { align: 'center' });
            pdf.text((item.price * item.quantity).toFixed(2), rightMargin, y, { align: 'right' });
            y += 5;
        });

        y += 5;
        pdf.line(leftMargin, y, rightMargin, y);
        y += 6;

        pdf.setFont("helvetica", "bold");
        pdf.text("Grand Total", leftMargin, y);
        pdf.text(`Rs. ${billData.grandTotal.toFixed(2)}`, rightMargin, y, { align: 'right' });

        pdf.save(`Receipt-${order.orderNumber}.pdf`);
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
        </div>
    );

    if (error || !order) return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Oops!</h1>
            <p className="text-gray-400">{error}</p>
        </div>
    );

    const restaurant = settings?.restaurant || {};
    const billData = order.billingDetails || {
        itemTotal: order.subtotal,
        grandTotal: order.total,
        totalTax: order.tax,
        discountAmount: order.discount
    };

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md mx-auto bg-white shadow-xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none">

                {/* Status Banner */}
                <div className="bg-green-600 p-4 text-white text-center print:hidden">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <CheckCircle size={20} />
                        <span className="font-bold">Payment Successful</span>
                    </div>
                    <p className="text-xs opacity-90">Thank you for your order!</p>
                </div>

                {/* Receipt Content */}
                <div className="p-8" id="printable-receipt">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black uppercase text-slate-800 mb-1">{restaurant.name || 'Restaurant'}</h1>
                        <p className="text-xs text-slate-500 whitespace-pre-line">{restaurant.address}</p>
                        {restaurant.phone && <p className="text-xs text-slate-500">Phone: {restaurant.phone}</p>}
                    </div>

                    <div className="flex justify-between text-xs font-mono text-slate-600 mb-6 border-y border-dashed py-3 border-slate-200">
                        <div>
                            <p>ORDER: {order.orderNumber}</p>
                            <p>DATE: {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <p>TYPE: {order.orderType?.toUpperCase()}</p>
                            {order.tableNumber && <p>TABLE: {order.tableNumber}</p>}
                        </div>
                    </div>

                    <table className="w-full text-sm mb-6">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                                <th className="text-left py-2">Item</th>
                                <th className="text-center py-2">Qty</th>
                                <th className="text-right py-2">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-700">
                            {order.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-2">{item.menuItem?.name || item.name}</td>
                                    <td className="text-center py-2">{item.quantity}</td>
                                    <td className="text-right py-2">₹{(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="space-y-2 border-t border-slate-100 pt-4 mb-8">
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Subtotal</span>
                            <span>₹{billData.itemTotal.toFixed(2)}</span>
                        </div>
                        {billData.discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-red-500">
                                <span>Discount</span>
                                <span>-₹{billData.discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-black text-xl text-slate-800 pt-2 border-t border-dashed border-slate-200">
                            <span>GRID TOTAL</span>
                            <span>₹{billData.grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="text-center text-xs text-slate-400 italic">
                        <p>{settings?.receipt?.footer || 'Thank you for dining with us!'}</p>
                        <p className="mt-2 text-[10px]">Generated via RestoPOS</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-slate-50 p-6 border-t border-slate-100 flex gap-3 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition"
                    >
                        <Printer size={18} />
                        Print
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-900 transition shadow-lg"
                    >
                        <Download size={18} />
                        Save PDF
                    </button>
                </div>
            </div>

            <style>{`
                @media print {
                    body { background: white; margin: 0; padding: 0; }
                    .print\\:hidden { display: none !important; }
                    #printable-receipt { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
                }
            `}</style>
        </div>
    );
};

export default PublicReceipt;
