import React, { useState, useEffect } from 'react';
import { X, Printer, MessageCircle, Share2, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';

const ReceiptModal = ({ isOpen, onClose, order, settings }) => {
    // Editable state for the modal view (won't save back to DB for now, just for print)
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerGstin, setCustomerGstin] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (order) {
            setCustomerName(order.customer?.name || '');
            setCustomerPhone(order.customer?.phone || '');
            setCustomerGstin(order.customer?.gstin || '');
        }
    }, [order]);

    if (!isOpen || !order) return null;

    const restaurant = settings?.restaurant || {};
    const receipt = settings?.receipt || {};
    const billData = order.billingDetails || {
        itemTotal: order.subtotal,
        discountAmount: order.discount,
        taxDetails: [], // Ideally this should be stored, but fallback if missing
        taxableAmount: order.subtotal - order.discount,
        totalTax: order.tax,
        roundOff: 0,
        grandTotal: order.total
    };


    const handlePrint = () => {
        window.print();
    };

    const handleSharePDF = async () => {
        try {
            setIsGenerating(true);

            // Create PDF manually (POS format)
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 250] });
            let y = 10;
            const mid = 40;

            // Restaurant Info
            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            pdf.text((restaurant.name || 'Restaurant').toUpperCase(), mid, y, { align: 'center' });
            y += 8;

            pdf.setFontSize(8);
            pdf.setFont("helvetica", "normal");
            pdf.text(`Order: ${order.orderNumber}`, 5, y);
            pdf.text(new Date().toLocaleDateString(), 75, y, { align: 'right' });
            y += 10;

            // Items (Basic)
            pdf.setFont("helvetica", "bold");
            pdf.text("Items", 5, y);
            y += 2;
            pdf.line(5, y, 75, y);
            y += 5;
            pdf.setFont("helvetica", "normal");

            order.items?.forEach(item => {
                pdf.text(`${item.quantity}x ${item.menuItem?.name || item.name}`, 5, y);
                pdf.text((item.price * item.quantity).toFixed(2), 75, y, { align: 'right' });
                y += 5;
            });

            y += 5;
            pdf.setFont("helvetica", "bold");
            pdf.text("Grand Total", 5, y);
            pdf.text(`Rs. ${billData.grandTotal.toFixed(2)}`, 75, y, { align: 'right' });
            y += 10;

            pdf.setFontSize(8);
            pdf.setFont("helvetica", "italic");
            pdf.text("Thank you for your visit!", mid, y, { align: 'center' });

            const fileName = `Receipt-${order.orderNumber}.pdf`;
            const pdfBlob = pdf.output('blob');
            const shareFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

            // Direct Sharing if supported
            if (navigator.canShare && navigator.canShare({ files: [shareFile] })) {
                try {
                    await navigator.share({
                        files: [shareFile],
                        title: `Receipt - ${order.orderNumber}`,
                        text: `Your bill from ${restaurant.name || 'Restaurant'}`
                    });
                    setIsGenerating(false);
                    return;
                } catch (err) {
                    console.log('Share cancelled:', err);
                }
            }

            // Fallback: Download and WhatsApp Link
            pdf.save(fileName);
            handleWhatsAppText();

        } catch (err) {
            console.error('PDF sharing error:', err);
            alert('Could not generate PDF');
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

        const restaurantName = restaurant.name || 'Our Restaurant';
        const formattedPhone = phone.startsWith('91') ? phone : `91${phone.slice(-10)}`;
        const pdfLink = `${window.location.origin}/api/billing/receipt/${order._id}/pdf`;

        const message = `Hi! 👋\n\n` +
            `*${restaurantName}*\n\n` +
            `Thank you for your order!\n` +
            `*Order:* ${order.orderNumber}\n` +
            `*Total:* ₹${billData.grandTotal.toFixed(2)}\n\n` +
            `📄 *View/Download Bill:* \n${pdfLink}\n\n` +
            `${receipt.footer || 'Thank you!'}`;

        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white text-black w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header Controls */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 print:hidden">
                    <h2 className="font-bold text-lg">Transaction Receipt</h2>
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
                            <p>Order No: {order.orderNumber}</p>
                            <p>Date: {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}</p>
                        </div>
                        <div className="text-right">
                            <p>Type: {order.orderType.toUpperCase()}</p>
                            {order.tableNumber && <p>Table: {order.tableNumber}</p>}
                        </div>
                    </div>

                    {/* Customer Info (Read Only or Editable if needed, prioritizing Read Only for history) */}
                    <div className="mb-4">
                        <p><strong>Customer:</strong> {customerName || 'Guest'}</p>
                        {customerPhone && <p><strong>Phone:</strong> {customerPhone}</p>}
                        {customerGstin && <p><strong>GSTIN:</strong> {customerGstin}</p>}
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
                            {order.items.map((item, idx) => (
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
                            <span>{billData.itemTotal?.toFixed(2)}</span>
                        </div>
                        {billData.discountAmount > 0 && (
                            <div className="flex justify-between">
                                <span>Discount</span>
                                <span>-{billData.discountAmount?.toFixed(2)}</span>
                            </div>
                        )}
                        {/* If detailed tax breakdown is saved, use it. Else fall back to simple tax */}
                        {billData.taxDetails && billData.taxDetails.length > 0 ? (
                            billData.taxDetails.map((tax, i) => (
                                <div key={i} className="flex justify-between text-xs">
                                    <span>{tax.name} ({tax.rate}%)</span>
                                    <span>{tax.amount.toFixed(2)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex justify-between text-xs">
                                <span>Tax</span>
                                <span>{billData.totalTax?.toFixed(2)}</span>
                            </div>
                        )}

                        {billData.roundOff !== 0 && (
                            <div className="flex justify-between text-xs italic">
                                <span>Round Off</span>
                                <span>{billData.roundOff}</span>
                            </div>
                        )}
                        <div className="border-t border-black pt-2 mt-2 flex justify-between font-bold text-lg">
                            <span>Grand Total</span>
                            <span>{billData.grandTotal?.toFixed(2)}</span>
                        </div>
                        {/* Payment Method Display */}
                        <div className="text-right text-xs mt-1 uppercase">
                            Paid via: {order.paymentMethod || 'Cash'}
                        </div>
                    </div>

                    <div className="text-center mt-8 text-xs">
                        <p>{receipt.footer || 'Thank you for dining with us!'}</p>
                        <p className="mt-2 text-gray-400">Powered by Voxxera POS</p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3 sm:p-4 border-t bg-gray-50 flex flex-col gap-2 print:hidden shrink-0">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex flex-col gap-2 flex-1">
                            <button
                                onClick={handleSharePDF}
                                disabled={isGenerating}
                                className="w-full bg-blue-600 text-white py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg disabled:opacity-50 text-sm"
                            >
                                {isGenerating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Share2 size={18} />}
                                Share PDF File
                            </button>
                            <button
                                onClick={handleWhatsAppText}
                                className="w-full bg-green-600 text-white py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-lg text-sm"
                            >
                                <MessageCircle size={18} />
                                WhatsApp (Direct)
                            </button>
                        </div>
                        <div className="flex gap-2 flex-1 items-center">
                            <button
                                onClick={handlePrint}
                                className="flex-1 bg-slate-900 text-white py-3.5 px-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-lg text-sm"
                            >
                                <Printer size={18} />
                                Print
                            </button>
                            <button
                                onClick={onClose}
                                className="px-5 bg-gray-200 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-300 transition text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
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
                        color: black;
                        background: white;
                    }
                    /* Ensure exact margins/padding for clean PDF */
                    @page {
                        margin: 0;
                        size: auto;
                    }
                }
            `}</style>
        </div>
    );
};

export default ReceiptModal;
